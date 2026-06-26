import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import { SOFA_PROMPTS } from "./src/promptsData";
import { getUnsplashUrlForPrompt } from "./src/unsplashData";
import { createServer as createViteServer } from "vite";

// Ensure upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const app = express();
const PORT = 3000;

// Debug logging helper
const DEBUG_LOG_FILE = path.join(UPLOAD_DIR, "server_debug.log");
function logDebug(message: string) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  console.log(logLine.trim());
  try {
    fs.appendFileSync(DEBUG_LOG_FILE, logLine, "utf-8");
  } catch (e) {
    // Ignore log writing errors
  }
}

// Clear old debug log on start
try {
  if (fs.existsSync(DEBUG_LOG_FILE)) {
    fs.unlinkSync(DEBUG_LOG_FILE);
  }
} catch (e) {}

logDebug("=== SERVER INSTANCE INITIATED ===");

// Global logging middleware
app.use((req, res, next) => {
  logDebug(`Incoming Request: ${req.method} ${req.url} - Content-Type: ${req.headers["content-type"] || "none"}`);
  next();
});

// Increase payload limits for base64 transfers
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `sofa-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    if (file && file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

// Serve uploaded and generated files with CORS headers to support canvas operations
app.use("/uploads", express.static(UPLOAD_DIR, {
  setHeaders: (res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
  }
}));

// 1. Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    currentTime: new Date().toISOString(),
  });
});

// Google Search Console verification
app.get("/googled799012346ecf62f.html", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send("google-site-verification: googled799012346ecf62f.html");
});

// 2. Sofa Image Upload endpoint
app.post("/api/upload", (req, res, next) => {
  logDebug("Hit /api/upload endpoint");
  upload.single("sofaImage")(req, res, (err) => {
    if (err) {
      logDebug(`[Upload Error] Multer error: ${err.message}`);
      console.error("[Upload Error] Multer error:", err);
      return res.status(400).json({ error: err.message || "Failed to process image file." });
    }
    
    try {
      if (!req.file) {
        logDebug("[Upload Error] No file in req.file");
        return res.status(400).json({ error: "No image file uploaded." });
      }

      logDebug(`[Upload Success] Saved file: ${req.file.filename}, Size: ${req.file.size} bytes`);
      res.json({
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`,
        size: req.file.size,
      });
    } catch (catchErr: any) {
      logDebug(`[Upload Error] Unexpected exception: ${catchErr.message}`);
      console.error("[Upload Error] Unexpected error:", catchErr);
      res.status(500).json({ error: catchErr.message || "Failed to upload image." });
    }
  });
});

// Helper to format Gemini errors into clean messages for the client
function formatGeminiError(err: any): string {
  let message = err?.message || String(err);
  
  // Try to parse as JSON if it looks like JSON
  const trimmed = message.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed?.error?.message) {
        message = parsed.error.message;
      } else if (parsed?.message) {
        message = parsed.message;
      }
    } catch (e) {
      // Ignore parsing failure
    }
  }

  // Handle common rate limit / quota keywords
  const lowerMessage = message.toLowerCase();
  if (
    message.includes("429") ||
    lowerMessage.includes("quota") ||
    lowerMessage.includes("exceeded") ||
    lowerMessage.includes("rate limit") ||
    lowerMessage.includes("resource_exhausted") ||
    lowerMessage.includes("billing")
  ) {
    return "API Quota Exceeded (429): Your Gemini API Key has exceeded its free-tier rate limit or has billing disabled. Please upgrade your API key to a Paid Key in Settings > Secrets or try again later.";
  }

  return message;
}

// 3. Background Generation endpoint
app.post("/api/generate", async (req, res) => {
  try {
    const { filename, promptId, selectedStyle, selectedMood, isSandbox } = req.body;

    if (!filename) {
      return res.status(400).json({ error: "Missing filename." });
    }
    if (!promptId) {
      return res.status(400).json({ error: "Missing promptId." });
    }

    const promptObj = SOFA_PROMPTS.find((p) => p.id === Number(promptId));
    if (!promptObj) {
      return res.status(404).json({ error: `Prompt with ID ${promptId} not found.` });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // Check if sandbox is explicitly enabled, or if the API key is completely missing
    if (isSandbox || !apiKey) {
      const sandboxUrl = getUnsplashUrlForPrompt(Number(promptId));
      console.log(`[Sandbox Mode] Generating simulation for prompt #${promptId}: "${promptObj.title}"`);
      return res.json({
        promptId: Number(promptId),
        url: sandboxUrl,
        success: true,
        isSandbox: true,
        fallbackReason: !apiKey ? "Missing API Key" : "Sandbox Mode"
      });
    }

    const filePath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Original sofa cover image not found on server." });
    }

    // Prepare customized prompt if style/mood are supplied
    let basePrompt = promptObj.prompt;
    const styleDescriptions: Record<string, string> = {
      "Minimalist": "clean lines, uncluttered premium spaces, monochrome or neutral palette, elegant minimal decor",
      "Bohemian": "bohemian aesthetic, textured woven rugs, potted pampas grass, warm earthy tones, hanging macrame",
      "Industrial": "industrial loft style, exposed brick walls, dark metal beams, weathered concrete flooring",
      "Coastal": "coastal beachside cottage feel, light wood finishes, breezy linen fabrics, white and soft blue tones, seaside atmosphere",
      "Scandinavian": "Scandinavian style, clean light oak surfaces, neutral beige textiles, bright natural atmosphere"
    };

    const moodDescriptions: Record<string, string> = {
      "Cozy": "warm cozy fireplace glow, soft inviting ambient lighting, comfortable luxurious throws and blankets, intimate mood",
      "Bright": "flooded with bright natural morning sunlight, clean high-exposure lighting, fresh vibrant daylight",
      "Dramatic": "moody cinematic high-contrast shadows, dramatic architectural accent lighting, deep rich shadows",
      "Elegant": "sophisticated premium elegance, refined high-end luxury finishing, majestic indirect warm LED lighting"
    };

    let customizations: string[] = [];
    if (selectedStyle && selectedStyle !== "None" && styleDescriptions[selectedStyle]) {
      customizations.push(`Style: Design the background strictly in ${selectedStyle} style (${styleDescriptions[selectedStyle]}).`);
    }
    if (selectedMood && selectedMood !== "None" && moodDescriptions[selectedMood]) {
      customizations.push(`Mood/Lighting: Infuse a ${selectedMood} mood and lighting (${moodDescriptions[selectedMood]}).`);
    }

    if (customizations.length > 0) {
      basePrompt = basePrompt + `\n\n[STYLE & MOOD CUSTOMIZATION REQUEST]:\nOverride the general style and lighting specified in the default description with the following custom preferences:\n${customizations.join("\n")}\nEnsure the room structure, background furniture, walls, flooring, lighting, and decorative accessories conform beautifully to this custom style and mood, while keeping the sofa preservation instructions 100% active and maintaining original sofa position, fabric, folds, and details completely untouched.`;
    }

    // Read file and convert to base64
    const imageBuffer = fs.readFileSync(filePath);
    const base64ImageData = imageBuffer.toString("base64");
    const ext = path.extname(filename).toLowerCase();
    const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

    // Initialize GoogleGenAI client (with required user-agent header for AI Studio telemetry)
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    console.log(`[Gemini] Starting background edit for prompt #${promptId}: "${promptObj.title}" (Style: ${selectedStyle || "Default"}, Mood: ${selectedMood || "Default"})`);

    // Call generateContent with image editing model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: basePrompt,
          },
        ],
      },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("Gemini model response candidates or parts are missing.");
    }

    let generatedBase64 = "";
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        generatedBase64 = part.inlineData.data;
        break;
      }
    }

    if (!generatedBase64) {
      // Extract any explanatory text returned instead of the image
      let explanation = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          explanation += part.text;
        }
      }
      throw new Error(explanation || "The model completed the request but did not return any image data.");
    }

    // Save generated image to disk
    const generatedBuffer = Buffer.from(generatedBase64, "base64");
    const outputFilename = `generated-${path.parse(filename).name}-p${promptId}.png`;
    const outputPath = path.join(UPLOAD_DIR, outputFilename);

    fs.writeFileSync(outputPath, generatedBuffer);
    console.log(`[Gemini] Generated image saved successfully: ${outputFilename}`);

    res.json({
      promptId: Number(promptId),
      url: `/uploads/${outputFilename}`,
      success: true,
      customPromptUsed: customizations.length > 0 ? basePrompt : undefined,
    });
  } catch (err: any) {
    console.error(`[Gemini Error] Prompt processing failed:`, err);
    const cleanErrorMessage = formatGeminiError(err);
    
    // Check if it's a rate limit / quota / billing / API key issue
    const lowerMessage = cleanErrorMessage.toLowerCase();
    const isQuotaOrLimitError = 
      cleanErrorMessage.includes("429") ||
      lowerMessage.includes("quota") ||
      lowerMessage.includes("exceeded") ||
      lowerMessage.includes("rate limit") ||
      lowerMessage.includes("resource_exhausted") ||
      lowerMessage.includes("billing") ||
      lowerMessage.includes("not found") ||
      lowerMessage.includes("api key") ||
      lowerMessage.includes("invalid");

    if (isQuotaOrLimitError) {
      console.log(`[Server Fallback] Gemini call failed with quota/limit error. Falling back to Sandbox Mode for prompt #${req.body.promptId}`);
      const sandboxUrl = getUnsplashUrlForPrompt(Number(req.body.promptId));
      return res.json({
        promptId: Number(req.body.promptId),
        url: sandboxUrl,
        success: true,
        isSandbox: true,
        fallbackReason: cleanErrorMessage
      });
    }

    res.status(500).json({
      error: cleanErrorMessage,
    });
  }
});

// 3.5. Unsplash Proxy endpoint to bypass client-side CORS issues during canvas drawing
app.get("/api/unsplash-proxy", async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: "Missing url parameter." });
    }

    logDebug(`[Proxy] Fetching external image: ${targetUrl}`);
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`External server returned status ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.set("Content-Type", contentType);
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Cache-Control", "public, max-age=86400"); // cache for 1 day
    res.send(buffer);
  } catch (err: any) {
    logDebug(`[Proxy Error] Failed to proxy ${req.query.url}: ${err.message}`);
    res.status(500).json({ error: err.message || "Failed to proxy image." });
  }
});

// 4. Save Feedback endpoint
const FEEDBACK_FILE = path.join(UPLOAD_DIR, "feedback.json");

app.post("/api/feedback", (req, res) => {
  try {
    const { promptId, promptTitle, rating, comments, originalFilename, generatedUrl } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be an integer between 1 and 5." });
    }

    let feedbackList = [];
    if (fs.existsSync(FEEDBACK_FILE)) {
      try {
        const fileContent = fs.readFileSync(FEEDBACK_FILE, "utf-8");
        feedbackList = JSON.parse(fileContent);
      } catch (e) {
        console.error("Failed to parse feedback.json, resetting...", e);
      }
    }

    const newFeedback = {
      id: Date.now() + "-" + Math.round(Math.random() * 1e5),
      promptId: Number(promptId),
      promptTitle: promptTitle || `Prompt #${promptId}`,
      rating: Number(rating),
      comments: comments || "",
      originalFilename,
      generatedUrl,
      timestamp: new Date().toISOString(),
    };

    feedbackList.push(newFeedback);
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbackList, null, 2));

    res.json({ success: true, feedback: newFeedback });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save feedback." });
  }
});

// 5. Retrieve Feedback endpoint (to analyze)
app.get("/api/feedback", (req, res) => {
  try {
    let feedbackList = [];
    if (fs.existsSync(FEEDBACK_FILE)) {
      try {
        const fileContent = fs.readFileSync(FEEDBACK_FILE, "utf-8");
        feedbackList = JSON.parse(fileContent);
      } catch (e) {
        console.error("Failed to read/parse feedback.json", e);
      }
    }
    res.json(feedbackList);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retrieve feedback." });
  }
});

// Global error handling middleware to ensure we ALWAYS return JSON for errors
app.use((err: any, req: any, res: any, next: any) => {
  logDebug(`[Global Error] ${err.message || err}`);
  console.error("[Global Error]", err);
  res.status(err.status || 500).json({
    error: err.message || "An unexpected server error occurred.",
  });
});

// Setup dev server or production hosting
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Integrating Vite Dev Server middleware...");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving built static distribution in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Sofa Background Generator server is listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical: Failed to start the server", err);
});
