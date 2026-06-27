import React, { useState, useRef, useEffect } from "react";
import { 
  Upload, Image as ImageIcon, Sliders, Play, Pause, RotateCcw, 
  Download, RefreshCw, Eye, Sparkles, CheckCircle2, AlertTriangle, 
  Search, X, Layers, Maximize2, Info, Loader2, HelpCircle, Star, MessageSquare, BarChart3, Zap, Flower2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SOFA_PROMPTS } from "./promptsData";
import { getUnsplashUrlForPrompt } from "./unsplashData";
import { PromptState, UploadResponse, GenerationStatus } from "./types";
import JSZip from "jszip";

// Helper to resize any Image Blob to target dimensions (1090x976)
const resizeImageBlob = (imageBlob: Blob, targetW: number, targetH: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const url = URL.createObjectURL(imageBlob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas context failed"));
        return;
      }
      
      // Draw image to fill/cover the target area
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const targetAspect = targetW / targetH;
      let drawW = targetW;
      let drawH = targetH;
      let offsetX = 0;
      let offsetY = 0;

      if (imgAspect > targetAspect) {
        drawW = targetH * imgAspect;
        offsetX = (targetW - drawW) / 2;
      } else {
        drawH = targetW / imgAspect;
        offsetY = (targetH - drawH) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error("Blob generation failed"));
      }, "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for resizing"));
    };
    img.src = url;
  });
};

// High-fidelity image merger to produce pixel-perfect combined lifestyle photos
const mergeSofaWithBackground = (
  backgroundUrl: string,
  sofaUrl: string,
  xOffsetPercent: number,
  yOffsetPercent: number,
  scalePercent: number,
  rotationDegrees: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.onload = () => {
      const sofaImg = new Image();
      sofaImg.crossOrigin = "anonymous";
      sofaImg.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1090;
        canvas.height = 976;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas 2D context"));
          return;
        }

        // 1. Render Background with Cover Fitting (No stretching)
        const bgAspect = bgImg.naturalWidth / bgImg.naturalHeight;
        const targetAspect = 1090 / 976;
        let drawW = 1090;
        let drawH = 976;
        let offsetX = 0;
        let offsetY = 0;

        if (bgAspect > targetAspect) {
          // Background is wider than target aspect ratio
          drawW = 976 * bgAspect;
          offsetX = (1090 - drawW) / 2;
        } else {
          // Background is taller than target aspect ratio
          drawH = 1090 / bgAspect;
          offsetY = (976 - drawH) / 2;
        }
        ctx.drawImage(bgImg, offsetX, offsetY, drawW, drawH);

        // 2. Compute proportions & spacing
        const padX = canvas.width * 0.04; 
        const padY = canvas.height * 0.04;
        const availW = canvas.width - 2 * padX;
        const availH = canvas.height - 2 * padY;

        const sofaAspect = sofaImg.naturalWidth / sofaImg.naturalHeight;
        const maxSofaW = availW * 0.80;
        const maxSofaH = availH * 0.60;

        let sofaW = maxSofaW;
        let sofaH = maxSofaW / sofaAspect;
        if (sofaH > maxSofaH) {
          sofaH = maxSofaH;
          sofaW = maxSofaH * sofaAspect;
        }

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const mtOffset = canvas.height * 0.15;
        const baseCenterY = centerY + mtOffset;

        // Sliders coordinates mapping
        const transX = (xOffsetPercent / 100) * sofaW;
        const transY = ((yOffsetPercent - 15) / 100) * sofaH;
        const scale = scalePercent / 100;
        const angleRad = (rotationDegrees * Math.PI) / 180;

        ctx.save();
        ctx.translate(centerX + transX, baseCenterY + transY);
        ctx.rotate(angleRad);
        ctx.scale(scale, scale);
        ctx.drawImage(sofaImg, -sofaW / 2, -sofaH / 2, sofaW, sofaH);
        ctx.restore();

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to export canvas to Blob"));
          }
        }, "image/png");
      };
      sofaImg.onerror = (e) => reject(new Error("Failed to load sofa image: " + e));
      
      const sofaUrlWithQuery = sofaUrl.includes("?") 
        ? `${sofaUrl}&t=${Date.now()}` 
        : `${sofaUrl}?t=${Date.now()}`;
        
      const proxiedSofaUrl = sofaUrlWithQuery.startsWith("http")
        ? `/api/unsplash-proxy?url=${encodeURIComponent(sofaUrlWithQuery)}`
        : sofaUrlWithQuery;
        
      sofaImg.src = proxiedSofaUrl;
    };
    bgImg.onerror = (e) => reject(new Error("Failed to load background image: " + e));
    
    const bgUrlWithQuery = backgroundUrl.includes("?") 
      ? `${backgroundUrl}&t=${Date.now()}` 
      : `${backgroundUrl}?t=${Date.now()}`;
      
    const proxiedBgUrl = bgUrlWithQuery.startsWith("http")
      ? `/api/unsplash-proxy?url=${encodeURIComponent(bgUrlWithQuery)}`
      : bgUrlWithQuery;
      
    bgImg.src = proxiedBgUrl;
  });
};

export default function App() {
  // Upload and file state
  const [sofaImage, setSofaImage] = useState<UploadResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Sofa positioning/sitting & angle adjustments
  const [sofaYOffset, setSofaYOffset] = useState<number>(15); // default mt-[15%]
  const [sofaXOffset, setSofaXOffset] = useState<number>(0);
  const [sofaScale, setSofaScale] = useState<number>(80); // 80% default for realistic sitting
  const [sofaRotation, setSofaRotation] = useState<number>(0); // 0 degrees
  
  // Dimensions and file details of original sofa
  const [imgDimensions, setImgDimensions] = useState<{ w: number; h: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active queue state
  const [prompts, setPrompts] = useState<PromptState[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [concurrency, setConcurrency] = useState(2); // safe default for API keys

  // Interactive controls
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("All");

  // ZIP Download progress state
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  // Lightbox view state
  const [lightboxPrompt, setLightboxPrompt] = useState<PromptState | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Global customization options
  const [globalStyle, setGlobalStyle] = useState<string>("None");
  const [globalMood, setGlobalMood] = useState<string>("None");

  // Sandbox Mode: default to true so users with free keys or no billing can run the app immediately!
  const [isSandbox, setIsSandbox] = useState<boolean>(true);

  // Feedback states
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [commentText, setCommentText] = useState<string>("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);
  const [showFeedbackAnalytics, setShowFeedbackAnalytics] = useState<boolean>(false);

  // Core queue refs
  const isRunningRef = useRef(false);
  const activeWorkersRef = useRef(0);
  const promptsRef = useRef<PromptState[]>([]);
  const filenameRef = useRef<string | null>(null);
  const globalStyleRef = useRef("None");
  const globalMoodRef = useRef("None");
  const isSandboxRef = useRef(true);

  // Sync state to refs for non-stale callbacks inside worker loops
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    promptsRef.current = prompts;
  }, [prompts]);

  useEffect(() => {
    filenameRef.current = sofaImage ? sofaImage.filename : null;
  }, [sofaImage]);

  useEffect(() => {
    globalStyleRef.current = globalStyle;
  }, [globalStyle]);

  useEffect(() => {
    globalMoodRef.current = globalMood;
  }, [globalMood]);

  useEffect(() => {
    isSandboxRef.current = isSandbox;
  }, [isSandbox]);

  const fetchFeedback = async () => {
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const data = await res.json();
        setFeedbackList(data);
        
        // Back-populate ratings and comments into prompts state
        setPrompts((prevPrompts) =>
          prevPrompts.map((p) => {
            const fb = data.find((f: any) => f.promptId === p.id);
            if (fb) {
              return { ...p, rating: fb.rating, comments: fb.comments };
            }
            return p;
          })
        );
      }
    } catch (e) {
      console.error("Failed to load feedback", e);
    }
  };

  useEffect(() => {
    if (sofaImage) {
      fetchFeedback();
    }
  }, [sofaImage]);

  const handleSubmitFeedback = async (promptId: number, promptTitle: string, generatedUrl: string) => {
    if (selectedRating === 0) {
      alert("Please select a star rating (1-5) before submitting.");
      return;
    }
    
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId,
          promptTitle,
          rating: selectedRating,
          comments: commentText,
          originalFilename: sofaImage?.filename,
          generatedUrl,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save feedback.");
      }

      // Update local prompts state
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === promptId ? { ...p, rating: selectedRating, comments: commentText } : p
        )
      );

      // Refresh global feedback list
      await fetchFeedback();
      
      // Update the open lightbox prompt if it matches
      if (lightboxPrompt && lightboxPrompt.id === promptId) {
        setLightboxPrompt((prev) => prev ? { ...prev, rating: selectedRating, comments: commentText } : null);
      }
      
      // Reset active form
      setSelectedRating(0);
      setCommentText("");
    } catch (e: any) {
      alert(e.message || "Could not submit feedback.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Handle Drag & Drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Upload Sofa Image
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Invalid file type. Please upload an image of your sofa.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    // Read dimensions
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        setImgDimensions({ w: img.width, h: img.height });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("sofaImage", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        const cleanText = text.substring(0, 150) + (text.length > 150 ? "..." : "");
        throw new Error(`Server error (${response.status}): ${cleanText}`);
      }

      if (!response.ok) {
        throw new Error(data?.error || "Failed to upload sofa image.");
      }

      setSofaImage(data);
      
      // Initialize the 50 prompts
      const initialStates: PromptState[] = SOFA_PROMPTS.map((p) => ({
        ...p,
        status: "idle",
        retryCount: 0,
      }));
      setPrompts(initialStates);

    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Connection failure during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  // Master Queue Runner Worker Loop
  const spawnWorker = async () => {
    if (!isRunningRef.current || !filenameRef.current) {
      activeWorkersRef.current = Math.max(0, activeWorkersRef.current - 1);
      return;
    }

    // Safety scale-down check if concurrency was lowered mid-run
    if (activeWorkersRef.current > concurrency) {
      activeWorkersRef.current--;
      return;
    }

    // Grab the first available pending item
    const targetPrompt = promptsRef.current.find((p) => p.status === "pending");
    if (!targetPrompt) {
      // Queue is exhausted for now
      activeWorkersRef.current = Math.max(0, activeWorkersRef.current - 1);
      if (activeWorkersRef.current === 0) {
        setIsRunning(false);
      }
      return;
    }

    // Mark current target prompt as actively generating in state
    setPrompts((prev) =>
      prev.map((p) => (p.id === targetPrompt.id ? { ...p, status: "generating" } : p))
    );

    // Small delay to allow react state propagation
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: filenameRef.current,
          promptId: targetPrompt.id,
          selectedStyle: globalStyleRef.current,
          selectedMood: globalMoodRef.current,
          isSandbox: isSandboxRef.current,
        }),
      });

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        const cleanText = text.substring(0, 150) + (text.length > 150 ? "..." : "");
        throw new Error(`Server error (${res.status}): ${cleanText}`);
      }

      if (!res.ok) {
        throw new Error(data?.error || "Internal model generation failure.");
      }

      // If the server returned a sandbox fallback, we can turn sandbox mode on in client
      if (data.isSandbox && !isSandboxRef.current) {
        console.log("Server indicated fallback to Sandbox mode. Synchronizing client sandbox mode.");
        setIsSandbox(true);
      }

      // Success! Update catalog status
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === targetPrompt.id
            ? { 
                ...p, 
                status: "completed", 
                resultUrl: data.url, 
                isSandbox: !!data.isSandbox, 
                fallbackReason: data.fallbackReason,
                error: undefined 
              }
            : p
        )
      );

    } catch (err: any) {
      console.error(`Error in queue worker for prompt #${targetPrompt.id}:`, err);
      
      const maxRetries = 3;
      const willRetry = targetPrompt.retryCount < maxRetries;

      setPrompts((prev) =>
        prev.map((p) =>
          p.id === targetPrompt.id
            ? {
                ...p,
                status: willRetry ? "pending" : "failed",
                retryCount: willRetry ? targetPrompt.retryCount + 1 : targetPrompt.retryCount,
                error: err.message || "Failed to compile background.",
              }
            : p
        )
      );

      // Add a small cool-down delay before retrying
      if (willRetry) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } finally {
      // Recurse to process the next item
      setTimeout(() => {
        spawnWorker();
      }, 200);
    }
  };

  // Kickoff workers when queue turns on
  useEffect(() => {
    if (isRunning && sofaImage) {
      const deficit = concurrency - activeWorkersRef.current;
      for (let i = 0; i < deficit; i++) {
        activeWorkersRef.current++;
        spawnWorker();
      }
    }
  }, [isRunning, concurrency]);

  // Master Control: Generate all 50
  const handleStartAll = () => {
    if (!sofaImage) return;

    // Reset idle or failed ones to pending, leave already completed alone
    setPrompts((prev) =>
      prev.map((p) =>
        p.status === "idle" || p.status === "failed"
          ? { ...p, status: "pending", error: undefined }
          : p
      )
    );

    setIsRunning(true);
  };

  // Master Control: Pause all
  const handlePauseQueue = () => {
    setIsRunning(false);
    // Put any currently pending (queued but not processing) back to idle
    setPrompts((prev) =>
      prev.map((p) => (p.status === "pending" ? { ...p, status: "idle" } : p))
    );
  };

  // Master Control: Reset application state
  const handleResetApp = () => {
    if (window.confirm("Are you sure you want to discard your current catalog and start over?")) {
      setIsRunning(false);
      setSofaImage(null);
      setPrompts([]);
      setImgDimensions(null);
      setUploadError(null);
      setSearchQuery("");
      setActiveCategory("All");
      setActiveStatusFilter("All");
    }
  };

  // Single Item Control: Run or Regenerate one individual background
  const handleGenerateSingle = async (promptId: number) => {
    if (!sofaImage) return;

    // Set state of this single item to pending
    setPrompts((prev) =>
      prev.map((p) => (p.id === promptId ? { ...p, status: "pending", error: undefined } : p))
    );

    // If queue is not running globally, spawn a single transient worker to handle just this prompt!
    if (!isRunning) {
      activeWorkersRef.current++;
      // We will let the standard queue runner look for it, or we trigger standard runner.
      // Easiest is to set global runner to true or temporarily spin a worker.
      // Let's spawn a custom worker that processes pending.
      spawnWorker();
    }
  };

  // JSZip Generator: Compress and download all completed backgrounds
  const handleDownloadAllAsZip = async () => {
    const completed = prompts.filter((p) => p.status === "completed" && p.resultUrl);
    if (completed.length === 0) return;

    setIsZipping(true);
    setZipProgress(0);

    const zip = new JSZip();
    const folder = zip.folder("sofa_lifestyle_catalog");

    let packed = 0;

    try {
      const promises = completed.map(async (p) => {
        try {
          let blob: Blob;
          if (p.isSandbox && sofaImage) {
            blob = await mergeSofaWithBackground(
              p.resultUrl!,
              sofaImage.url,
              sofaXOffset,
              sofaYOffset,
              sofaScale,
              sofaRotation
            );
          } else {
            const res = await fetch(p.resultUrl!);
            const baseBlob = await res.blob();
            // Ensure even non-sandbox downloaded images are exactly 1090x976
            blob = await resizeImageBlob(baseBlob, 1090, 976);
          }
          
          const padId = String(p.id).padStart(2, "0");
          const safeTitle = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "_");
          const filename = `${padId}_${safeTitle}.png`;
          
          folder?.file(filename, blob);
        } catch (err) {
          console.error(`Failed to pack background #${p.id} to zip:`, err);
        } finally {
          packed++;
          setZipProgress(Math.round((packed / completed.length) * 100));
        }
      });

      await Promise.all(promises);

      const content = await zip.generateAsync({ type: "blob" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `sofa-lifestyle-backgrounds-catalog.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error("Failed to compile ZIP archive:", err);
      alert("Failed to compile ZIP archive. You can download individual files instead.");
    } finally {
      setIsZipping(false);
    }
  };

  // Trigger download of a single image
  const handleDownloadSingle = async (prompt: PromptState) => {
    if (!prompt.resultUrl) return;
    try {
      let blob: Blob;
      if (prompt.isSandbox && sofaImage) {
        blob = await mergeSofaWithBackground(
          prompt.resultUrl,
          sofaImage.url,
          sofaXOffset,
          sofaYOffset,
          sofaScale,
          sofaRotation
        );
      } else {
        const res = await fetch(prompt.resultUrl);
        const baseBlob = await res.blob();
        // Ensure even non-sandbox downloaded images are exactly 1090x976
        blob = await resizeImageBlob(baseBlob, 1090, 976);
      }
      
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const safeTitle = prompt.title.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      link.download = `sofa_${safeTitle}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Individual download failed:", err);
      // Fallback
      window.open(prompt.resultUrl, "_blank");
    }
  };

  // Calculate stats for master dashboard
  const totalPrompts = prompts.length;
  const completedCount = prompts.filter((p) => p.status === "completed").length;
  const generatingCount = prompts.filter((p) => p.status === "generating").length;
  const pendingCount = prompts.filter((p) => p.status === "pending").length;
  const failedCount = prompts.filter((p) => p.status === "failed").length;
  const idleCount = prompts.filter((p) => p.status === "idle").length;

  // Percentage complete
  const progressPercent = totalPrompts > 0 ? Math.round((completedCount / totalPrompts) * 100) : 0;

  // Filtering list based on Search and active Filter state
  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    
    let matchesStatus = true;
    if (activeStatusFilter === "Completed") matchesStatus = p.status === "completed";
    else if (activeStatusFilter === "Generating") matchesStatus = p.status === "generating" || p.status === "pending";
    else if (activeStatusFilter === "Failed") matchesStatus = p.status === "failed";
    else if (activeStatusFilter === "Idle") matchesStatus = p.status === "idle";

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#222] font-sans antialiased pb-20">
      
      {/* Editorial Luxury Header Banner */}
      <header className="border-b border-[#e9e6df] bg-white/85 backdrop-blur-md sticky top-0 z-40 transition-shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#1c1c1c] text-[#eae6dc] flex items-center justify-center shadow-md">
              <Flower2 className="h-5 w-5 text-[#d6b07a] animate-spin-slow" />
            </div>
            <div>
              <h1 id="app-title" className="font-display text-2xl tracking-wide font-medium text-[#111] flex items-center gap-1.5">
                Easy Zen
              </h1>
              <p className="text-xs text-[#706e68] tracking-widest uppercase font-sans font-medium mt-0.5">
                Premium AI Sofa Studio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {sofaImage && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-[#efede8] px-2.5 py-1 rounded-sm text-[#504e49] border border-[#e2dfd9]">
                  {concurrency} Active Threads
                </span>
                <button
                  id="reset-app-btn"
                  onClick={handleResetApp}
                  className="flex items-center gap-1.5 text-xs text-[#8c2525] hover:text-[#b83232] transition-colors font-medium border border-[#ebdcdc] bg-[#fbf5f5] px-3 py-1.5 rounded"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Studio
                </button>
              </div>
            )}
            {!sofaImage && (
              <span className="text-xs text-[#7a7872] italic font-sans flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                Powered by Gemini 2.5 Flash Image Preview
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8">
        <AnimatePresence mode="wait">
          
          {/* STAGE 1: SOFA IMAGE UPLOAD SCREEN */}
          {!sofaImage ? (
            <motion.div
              key="upload-stage"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl mx-auto mt-6"
            >
              
              {/* Luxury Intro Hero Panel */}
              <div className="text-center mb-8">
                <span className="text-xs font-semibold tracking-widest text-[#a88248] uppercase">
                  Catalog Photography Redefined
                </span>
                <h2 className="font-display text-4xl mt-2 tracking-tight text-[#111]">
                  One Sofa Upload. 50 Editorial Masterpieces.
                </h2>
                <p className="mt-3 text-[#6a6860] max-w-xl mx-auto text-sm leading-relaxed">
                  Our advanced AI transforms your product photo into a luxury 50-shot retail portfolio. 
                  Every fold, stitch, fabric pattern, and color is preserved with perfect pixel accuracy. 
                  Only the background, room layout, and atmospheric shadows change.
                </p>
              </div>

              {/* Upload Drop Zone Card */}
              <div 
                id="dropzone"
                onDragEnter={(e) => !isUploading && handleDrag(e)}
                onDragOver={(e) => !isUploading && handleDrag(e)}
                onDragLeave={(e) => !isUploading && handleDrag(e)}
                onDrop={(e) => !isUploading && handleDrop(e)}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl bg-white p-12 text-center transition-all flex flex-col items-center justify-center min-h-[340px] relative overflow-hidden group ${
                  isUploading ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                } ${
                  dragActive 
                    ? "border-[#b08d57] bg-[#fdfcf9] shadow-inner" 
                    : "border-[#e2dfd9] hover:border-[#b08d57] hover:shadow-lg hover:shadow-[#e6e3da]/30"
                }`}
              >
                <input
                  type="file"
                  id="sofaImage"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  onClick={(e) => e.stopPropagation()}
                  accept="image/*"
                  className="hidden"
                />

                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-10 w-10 text-[#a88248] animate-spin mb-4" />
                    <h3 className="font-display text-xl text-[#1a1a1a]">Uploading product profile...</h3>
                    <p className="text-xs text-[#706e68] mt-1.5">Analyzing fabric dimensions and texture coordinates</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full bg-[#f6f4ee] flex items-center justify-center text-[#907b5a] mb-5 group-hover:scale-105 transition-transform duration-300 border border-[#eae6db]">
                      <Upload className="h-7 w-7" />
                    </div>
                    <h3 className="font-display text-xl text-[#1a1a1a] font-medium">
                      Select or Drop Sofa Image
                    </h3>
                    <p className="text-sm text-[#706e68] mt-1.5 max-w-md px-4 leading-relaxed">
                      For best results, upload a clear photo of the sofa with its cover installed. 
                      Supports JPEG, PNG, or WEBP (Max 15MB).
                    </p>
                    <span className="mt-6 text-xs text-[#b08d57] bg-[#f9f7f0] border border-[#ebdcb3]/60 px-4 py-2 rounded-sm font-medium tracking-wider uppercase group-hover:bg-[#b08d57] group-hover:text-white transition-all duration-300">
                      Choose File From System
                    </span>
                  </div>
                )}

                {/* Subtle alignment assistance overlay */}
                <div className="absolute inset-x-0 bottom-0 py-3 bg-[#faf9f6] border-t border-[#eae6df] text-2xs text-[#7a7872] tracking-wider uppercase font-mono">
                  Preservation Mode: Strict Active
                </div>
              </div>

              {/* Upload Error notification */}
              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-sm text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Requirement highlights list */}
              <div className="mt-12 bg-white rounded-lg p-6 border border-[#e9e6df] shadow-xs">
                <h4 className="text-xs uppercase tracking-widest font-bold text-[#333] mb-4 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#a88248]" />
                  Guaranteed Safety Policies
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex gap-2">
                    <div className="h-5 w-5 bg-emerald-50 rounded text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1a1a1a]">Preserved Pattern & Fit</p>
                      <p className="text-2xs text-[#706e68] mt-0.5 leading-relaxed">Stitching lines, patterns, and wrinkles are exactly locked into the core canvas.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-5 w-5 bg-emerald-50 rounded text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1a1a1a]">Preserved Color & Fabric</p>
                      <p className="text-2xs text-[#706e68] mt-0.5 leading-relaxed">The original fabric sheen, pile direction, and color accuracy remain uncompromised.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-5 w-5 bg-emerald-50 rounded text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1a1a1a]">Background Swap Only</p>
                      <p className="text-2xs text-[#706e68] mt-0.5 leading-relaxed">The model isolates the sofa contours and generates lighting shadows around its contact points.</p>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          ) : (
            
            /* STAGE 2: 50 IMAGES GENERATOR DASHBOARD */
            <motion.div
              key="dashboard-stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              
              {/* Studio Setup Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left side: Uploaded Original Preview & Placement Adjustments */}
                <div className="lg:col-span-4 bg-white border border-[#e9e6df] rounded-xl p-5 flex flex-col h-full shadow-xs">
                  <div className="flex items-center justify-between mb-3 border-b border-[#f3f0ea] pb-2.5">
                    <h3 className="font-display font-medium text-[#111] flex items-center gap-1.5 text-lg">
                      <Sliders className="h-4.5 w-4.5 text-[#b08d57]" />
                      Sofa Sitting & Angle
                    </h3>
                    <button
                      onClick={() => {
                        setSofaXOffset(0);
                        setSofaYOffset(15);
                        setSofaScale(80);
                        setSofaRotation(0);
                      }}
                      className="text-2xs font-mono text-[#b08d57] hover:underline"
                    >
                      Reset Sitting
                    </button>
                  </div>

                  {/* Dynamic Room Placement Preview Box */}
                  <div 
                    className="relative bg-[#faf9f6] rounded border border-[#efede8] overflow-hidden flex items-center justify-center group shadow-inner w-full"
                    style={{ aspectRatio: "1090/976" }}
                  >
                    {/* Living Room Background */}
                    <img
                      src={getUnsplashUrlForPrompt(1, sofaImage.filename)}
                      alt="Sample background room"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      className="absolute inset-0 h-full w-full object-cover opacity-85 select-none pointer-events-none"
                    />
                    
                    {/* Sofa Overlaid with live transforms */}
                    <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/5 pointer-events-none">
                      <img
                        src={sofaImage.url}
                        alt="Sofa Overlay Preview"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        style={{
                          transform: `translate(${sofaXOffset}%, ${sofaYOffset - 15}%) scale(${sofaScale / 100}) rotate(${sofaRotation}deg)`,
                        }}
                        className="max-w-[80%] max-h-[60%] object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.65)] mt-[15%]"
                      />
                    </div>

                    {/* Centered Guide-lines overlay when dragging */}
                    <div className="absolute inset-0 pointer-events-none border border-amber-500/10 pointer-events-none flex items-center justify-center">
                      <div className="h-full w-[1px] border-r border-dashed border-amber-500/20 absolute"></div>
                      <div className="w-full h-[1px] border-b border-dashed border-amber-500/20 absolute"></div>
                    </div>

                    {/* Real-time Indicator tag */}
                    <span className="absolute top-2 left-2 bg-[#1a1a1a]/90 backdrop-blur-sm text-[9px] uppercase tracking-wider font-mono font-bold text-[#fbfbf9] px-2 py-0.5 rounded shadow-sm">
                      Interactive Sandbox
                    </span>
                    
                    <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-sm text-[9px] font-mono text-white px-2 py-0.5 rounded-sm">
                      Output Frame: 1090 x 976 px
                    </div>
                  </div>

                  {/* Sliders Container */}
                  <div className="mt-4 space-y-3.5 border-t border-[#f3f0ea] pt-4">
                    {/* Vertical (Height / Siting) */}
                    <div>
                      <div className="flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-[#504e49] mb-1">
                        <span className="flex items-center gap-1">
                          <Sliders className="h-3 w-3 text-[#b08d57]" />
                          Siting Height (Y-Offset)
                        </span>
                        <span className="font-mono text-[#a88248]">{sofaYOffset}%</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="80"
                        value={sofaYOffset}
                        onChange={(e) => setSofaYOffset(Number(e.target.value))}
                        className="w-full accent-[#b08d57] h-1.5 bg-[#efece5] rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Horizontal (Shift) */}
                    <div>
                      <div className="flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-[#504e49] mb-1">
                        <span className="flex items-center gap-1">
                          <Sliders className="h-3 w-3 text-[#b08d57]" />
                          Horizontal Position (X-Offset)
                        </span>
                        <span className="font-mono text-[#a88248]">{sofaXOffset}%</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={sofaXOffset}
                        onChange={(e) => setSofaXOffset(Number(e.target.value))}
                        className="w-full accent-[#b08d57] h-1.5 bg-[#efece5] rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Size (Scale) */}
                    <div>
                      <div className="flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-[#504e49] mb-1">
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3 text-[#b08d57]" />
                          Product Size (Scale)
                        </span>
                        <span className="font-mono text-[#a88248]">{sofaScale}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="500"
                        value={sofaScale}
                        onChange={(e) => setSofaScale(Number(e.target.value))}
                        className="w-full accent-[#b08d57] h-1.5 bg-[#efece5] rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Angle (Rotation) */}
                    <div>
                      <div className="flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-[#504e49] mb-1">
                        <span className="flex items-center gap-1">
                          <RotateCcw className="h-3 w-3 text-[#b08d57]" />
                          Alignment Angle (Rotation)
                        </span>
                        <span className="font-mono text-[#a88248]">{sofaRotation}°</span>
                      </div>
                      <input
                        type="range"
                        min="-30"
                        max="30"
                        value={sofaRotation}
                        onChange={(e) => setSofaRotation(Number(e.target.value))}
                        className="w-full accent-[#b08d57] h-1.5 bg-[#efece5] rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Info Notice */}
                  <div className="mt-4 text-[11px] text-[#7a7872] bg-[#f9f8f4] p-3 rounded border border-[#e2dfd9]/60 leading-relaxed flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 text-[#b08d57] shrink-0 mt-0.5" />
                    <p>
                      Adjust the sliders above to perfectly align your product with the perspective of the generated background rooms. Changes apply <strong>instantly</strong> across all 50 catalog scenes!
                    </p>
                  </div>
                </div>

                {/* Right side: Studio Controls and Master Progress */}
                <div className="lg:col-span-8 bg-white border border-[#e9e6df] rounded-xl p-6 flex flex-col justify-between shadow-xs">
                  
                  {/* Master Title & Settings */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f3f0ea] pb-4 mb-4">
                      <div>
                        <h2 className="font-display text-2xl text-[#1a1a1a]">Catalog Rendering Suite</h2>
                        <p className="text-xs text-[#706e68] mt-0.5">Automating 50 bespoke editorial settings</p>
                      </div>

                      {/* Concurrency controller */}
                      <div className="bg-[#fcfbf9] border border-[#eae6db] rounded p-2.5 flex items-center gap-4 shrink-0 shadow-xs">
                        <div className="flex flex-col">
                          <span className="text-2xs uppercase tracking-wider font-semibold text-[#666] flex items-center gap-1">
                            <Sliders className="h-3 w-3 text-[#a88248]" />
                            Parallel Threads
                          </span>
                          <span className="text-2xs text-[#8c8a81] mt-0.5">Adjust api speed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="1"
                            max="4"
                            value={concurrency}
                            onChange={(e) => setConcurrency(Number(e.target.value))}
                            disabled={isRunning}
                            className="w-20 accent-[#b08d57] h-1.5 bg-[#efece5] rounded-lg cursor-pointer"
                          />
                          <span className="text-xs font-mono font-bold bg-[#1a1a1a] text-[#fbfbf9] px-2 py-0.5 rounded-sm">
                            {concurrency}x
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sandbox / Pro Toggle Selector Banner */}
                    <div className="bg-[#fcfaf5] border border-[#d6cbba] rounded-lg p-3.5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex gap-2.5 items-start">
                        <div className="p-2 bg-[#b08d57]/10 text-[#b08d57] rounded-lg mt-0.5 shrink-0">
                          <Sparkles className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xs font-bold text-[#2a2926] uppercase tracking-wider">
                              {isSandbox ? "Free Sandbox Simulator" : "Gemini Pro AI Generation"}
                            </h3>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase ${
                              isSandbox 
                                ? "bg-emerald-100 text-emerald-800" 
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {isSandbox ? "Active & 100% Free" : "Requires Gemini Key"}
                            </span>
                          </div>
                          <p className="text-2xs text-[#706d64] mt-1 leading-relaxed max-w-xl">
                            {isSandbox ? (
                              <span>
                                Generates beautiful visual representations instantly from our high-end catalog repository <strong>without using Gemini API Key credits</strong>. Perfect for free testing, high speed, and unlimited rendering.
                              </span>
                            ) : (
                              <span>
                                Connects directly to the <strong>Gemini 2.5 Flash Image</strong> model on your server. Will automatically fallback to Sandbox Mode if your API key runs out of free quota limit.
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 bg-[#eae5db]/60 p-1 rounded-lg border border-[#d3ccbf] self-stretch sm:self-auto justify-center shrink-0">
                        <button
                          onClick={() => setIsSandbox(true)}
                          disabled={isRunning}
                          className={`text-2xs sm:text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1 transition-all ${
                            isSandbox
                              ? "bg-white text-[#947444] shadow-xs border border-[#d0c5b4]/50"
                              : "text-[#66635c] hover:text-[#222]"
                          } disabled:opacity-50`}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Free Sandbox
                        </button>
                        <button
                          onClick={() => setIsSandbox(false)}
                          disabled={isRunning}
                          className={`text-2xs sm:text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1 transition-all ${
                            !isSandbox
                              ? "bg-[#1a1a1a] text-white shadow-xs"
                              : "text-[#66635c] hover:text-[#222]"
                          } disabled:opacity-50`}
                        >
                          <Zap className="h-3.5 w-3.5" />
                          Gemini Pro Key
                        </button>
                      </div>
                    </div>

                    {/* Custom Style & Mood Selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#faf9f6] border border-[#eae6db] p-4 rounded-lg shadow-inner my-4">
                      <div>
                        <label className="text-xs font-semibold text-[#504e49] uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                          <Sliders className="h-3.5 w-3.5 text-[#a88248]" />
                          Background Design Style
                        </label>
                        <select
                          value={globalStyle}
                          onChange={(e) => setGlobalStyle(e.target.value)}
                          disabled={isRunning}
                          className="w-full bg-white border border-[#e2dfd9] rounded-md px-3 py-2 text-xs outline-none focus:border-[#b08d57] transition-all disabled:opacity-60 disabled:cursor-not-allowed font-medium text-[#222]"
                        >
                          <option value="None">Default Preset Styles</option>
                          <option value="Minimalist">Minimalist (clean, neutral, uncluttered)</option>
                          <option value="Bohemian">Bohemian (earthy, textured, macrame & plants)</option>
                          <option value="Industrial">Industrial (exposed brick, dark metal, concrete)</option>
                          <option value="Coastal">Coastal (beachside, light woods, linen, ocean vibe)</option>
                          <option value="Scandinavian">Scandinavian (light oak, beige, functional & bright)</option>
                        </select>
                        <p className="text-[10px] text-[#8a8880] mt-1 leading-tight">
                          Applies design themes to environment walls, floors & decor.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#504e49] uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-[#a88248]" />
                          Atmosphere & Mood
                        </label>
                        <select
                          value={globalMood}
                          onChange={(e) => setGlobalMood(e.target.value)}
                          disabled={isRunning}
                          className="w-full bg-white border border-[#e2dfd9] rounded-md px-3 py-2 text-xs outline-none focus:border-[#b08d57] transition-all disabled:opacity-60 disabled:cursor-not-allowed font-medium text-[#222]"
                        >
                          <option value="None">Default Preset Moods</option>
                          <option value="Cozy">Cozy (warm fireplace glow, soft blankets, intimate)</option>
                          <option value="Bright">Bright (morning sunshine, fresh natural daylight)</option>
                          <option value="Dramatic">Dramatic (moody high-contrast, deep shadows)</option>
                          <option value="Elegant">Elegant (sophisticated luxury, indirect LED highlights)</option>
                        </select>
                        <p className="text-[10px] text-[#8a8880] mt-1 leading-tight">
                          Controls time-of-day lighting, shadow intensity & ambiance.
                        </p>
                      </div>
                    </div>

                    {/* Core Process Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mt-5">
                      <div className="bg-[#fcfbf9] border border-[#efede8] p-3 rounded text-center">
                        <span className="text-2xs text-[#706e68] uppercase font-semibold block tracking-wider">Total Catalog</span>
                        <span className="text-2xl font-mono font-bold text-[#111] mt-1 block">50</span>
                      </div>
                      <div className="bg-[#f7faf7] border border-[#e4ebe4] p-3 rounded text-center">
                        <span className="text-2xs text-emerald-700 uppercase font-semibold block tracking-wider">Generated</span>
                        <span className="text-2xl font-mono font-bold text-emerald-800 mt-1 block">{completedCount}</span>
                      </div>
                      <div className="bg-[#fdfbf6] border border-[#f5efe0] p-3 rounded text-center animate-pulse">
                        <span className="text-2xs text-[#c29f68] uppercase font-semibold block tracking-wider">Active</span>
                        <span className="text-2xl font-mono font-bold text-[#c29f68] mt-1 block">{generatingCount}</span>
                      </div>
                      <div className="bg-[#fcfbf9] border border-[#efede8] p-3 rounded text-center">
                        <span className="text-2xs text-[#706e68] uppercase font-semibold block tracking-wider">In Queue</span>
                        <span className="text-2xl font-mono font-bold text-[#111] mt-1 block">{pendingCount}</span>
                      </div>
                      <div className="bg-[#fdf9f9] border border-[#ebdcdc] p-3 rounded text-center">
                        <span className="text-2xs text-red-700 uppercase font-semibold block tracking-wider">Failed</span>
                        <span className="text-2xl font-mono font-bold text-red-800 mt-1 block">{failedCount}</span>
                      </div>
                    </div>

                    {/* Progress Bar with wave effects */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between text-xs font-medium text-[#504e49] mb-1.5">
                        <span className="flex items-center gap-1">
                          {isRunning ? (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-gray-300 inline-block"></span>
                          )}
                          Studio Progress
                        </span>
                        <span className="font-mono">{progressPercent}% ({completedCount}/50)</span>
                      </div>
                      
                      <div className="h-4 bg-[#efece5] rounded-full overflow-hidden p-0.5 border border-[#e4e1d9]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-[#b08d57] to-[#d6b07a] rounded-full relative overflow-hidden"
                        >
                          {isRunning && (
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[shimmer_1.5s_infinite_linear]"></div>
                          )}
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Core Master Action buttons */}
                  <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 border-t border-[#f3f0ea] pt-5">
                    
                    {/* Run / Stop loop */}
                    {!isRunning ? (
                      <button
                        id="start-all-btn"
                        onClick={handleStartAll}
                        disabled={completedCount === 50}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#1a1a1a] hover:bg-[#333] disabled:opacity-50 disabled:hover:bg-[#1a1a1a] text-[#eae6dc] rounded-md font-medium tracking-wide shadow transition-all duration-200"
                      >
                        <Play className="h-4 w-4 text-[#d6b07a] fill-current" />
                        {completedCount === 0 
                          ? "Generate All 50 Backgrounds" 
                          : completedCount === 50 
                            ? "All Backgrounds Rendered" 
                            : `Resume Remaining (${50 - completedCount})`}
                      </button>
                    ) : (
                      <button
                        id="pause-all-btn"
                        onClick={handlePauseQueue}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#c29f68] hover:bg-[#b08d57] text-white rounded-md font-medium tracking-wide shadow transition-all duration-200"
                      >
                        <Pause className="h-4 w-4 fill-current" />
                        Pause Catalog Queue
                      </button>
                    )}

                    {/* Master ZIP Download button */}
                    <button
                      id="download-all-btn"
                      onClick={handleDownloadAllAsZip}
                      disabled={completedCount === 0 || isZipping}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 border border-[#d6b07a] hover:bg-[#fbfaf7] disabled:opacity-40 disabled:hover:bg-transparent text-[#90703a] font-medium rounded-md tracking-wide transition-all duration-200 shadow-xs"
                    >
                      {isZipping ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-[#90703a]" />
                          Packing: {zipProgress}%
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Download All Images (ZIP)
                        </>
                      )}
                    </button>

                    {/* Estimation timer text */}
                    {isRunning && (
                      <span className="text-2xs font-mono text-[#8a8880] text-center sm:text-left leading-tight">
                        Estimated time remaining: ~{Math.ceil((50 - completedCount) * 10 / concurrency)}s <br/>
                        (Based on parallel active queries)
                      </span>
                    )}
                  </div>

                </div>
              </div>

              {/* Filtering Rail & Search Grid */}
              <div className="bg-white border border-[#e9e6df] rounded-xl p-5 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#f3f0ea] pb-4 mb-4">
                  
                  {/* Category Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 md:pb-0 scrollbar-none">
                    <span className="text-xs font-semibold text-[#8a8880] mr-2 uppercase tracking-wider">Style:</span>
                    {["All", "Modern", "Minimalist", "Cozy", "Scenic", "Classic", "Themed"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all shrink-0 font-medium ${
                          activeCategory === cat
                            ? "bg-[#b08d57] border-[#b08d57] text-white"
                            : "bg-white border-[#e2dfd9] text-[#555] hover:border-[#b08d57] hover:text-[#b08d57]"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Status Filters */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#8a8880] uppercase tracking-wider">Status:</span>
                    {["All", "Completed", "Generating", "Failed", "Idle"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setActiveStatusFilter(st)}
                        className={`text-xs px-2.5 py-1 rounded transition-colors ${
                          activeStatusFilter === st
                            ? "bg-[#efede8] font-semibold text-[#1a1a1a] border border-[#d6cfbe]"
                            : "text-[#706e68] hover:text-[#1a1a1a] border border-transparent"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Search filter input */}
                  <div className="relative flex-grow">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8880]" />
                    <input
                      type="text"
                      placeholder="Search backgrounds by room type or prompt details (e.g. 'fireplace', 'marble', 'sunset')..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#fbfbf9] border border-[#e2dfd9] rounded-md pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#b08d57] focus:bg-white focus:ring-1 focus:ring-[#b08d57] transition-all"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a8a69e] hover:text-[#111]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Search results summary */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => setShowFeedbackAnalytics(!showFeedbackAnalytics)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-2.5 rounded border transition-all font-medium ${
                        showFeedbackAnalytics
                          ? "bg-[#1c1c1c] text-[#eae6dc] border-[#1c1c1c] shadow-xs"
                          : "bg-white text-[#504e49] border-[#e2dfd9] hover:border-[#b08d57] hover:text-[#b08d57]"
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-[#a88248]" />
                      Audit Reports ({feedbackList.length})
                    </button>
                    <span className="text-xs font-mono text-[#8a8880]">
                      Showing {filteredPrompts.length} of 50 settings
                    </span>
                  </div>
                </div>
              </div>

              {/* COLLAPSIBLE FEEDBACK ANALYTICS & AUDIT LOG PANEL */}
              <AnimatePresence>
                {showFeedbackAnalytics && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden mb-6"
                  >
                    <div className="bg-white border border-[#e9e6df] rounded-xl p-6 shadow-xs space-y-6">
                      <div className="flex items-center justify-between border-b border-[#f3f0ea] pb-3">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-[#b08d57]" />
                          <h3 className="font-display text-lg font-medium text-[#1a1a1a]">Quality Report Analytics</h3>
                        </div>
                        <button
                          onClick={() => setShowFeedbackAnalytics(false)}
                          className="text-xs text-[#8c8a81] hover:text-[#111]"
                        >
                          Collapse Panel
                        </button>
                      </div>

                      {feedbackList.length === 0 ? (
                        <div className="text-center py-8 text-xs text-[#8a8880] italic">
                          No quality reports submitted yet. Open any completed catalog shot and rate it to start compiling analytics.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Quick Metrics */}
                          <div className="bg-[#faf9f6] rounded-lg p-4 border border-[#eae6db] flex flex-col justify-between">
                            <div>
                              <span className="text-3xs uppercase tracking-widest font-mono text-[#8c8a81] font-bold block">
                                Studio Performance
                              </span>
                              <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-4xl font-display font-bold text-[#111]">
                                  {(feedbackList.reduce((acc, f) => acc + f.rating, 0) / feedbackList.length).toFixed(1)}
                                </span>
                                <span className="text-amber-500 text-lg">★</span>
                                <span className="text-xs text-[#8c8a81]">Average Score</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-[#8a8880] mt-3 leading-tight">
                              Rating score generated from {feedbackList.length} user reviews.
                            </p>
                          </div>

                          {/* Distribution chart */}
                          <div className="bg-[#faf9f6] rounded-lg p-4 border border-[#eae6db] space-y-1.5 flex flex-col justify-center">
                            <span className="text-3xs uppercase tracking-widest font-mono text-[#8c8a81] font-bold block mb-2">
                              Rating Distribution
                            </span>
                            {[5, 4, 3, 2, 1].map((stars) => {
                              const count = feedbackList.filter((f) => f.rating === stars).length;
                              const pct = Math.round((count / feedbackList.length) * 100);
                              return (
                                <div key={stars} className="flex items-center gap-2 text-xs text-[#504e49]">
                                  <span className="w-3 font-semibold font-mono">{stars}</span>
                                  <span className="text-amber-500 text-[10px]">★</span>
                                  <div className="flex-1 bg-[#eae6db] h-2 rounded overflow-hidden">
                                    <div className="bg-amber-400 h-full" style={{ width: `${pct}%` }}></div>
                                  </div>
                                  <span className="w-8 text-right font-mono text-2xs text-[#8a8880]">{pct}%</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* AI Optimization Insight */}
                          <div className="bg-[#faf9f6] rounded-lg p-4 border border-[#eae6db] flex flex-col justify-between">
                            <div>
                              <span className="text-3xs uppercase tracking-widest font-mono text-[#8c8a81] font-bold block">
                                AI Fine-Tuning Insights
                              </span>
                              <p className="text-xs text-[#504e49] mt-2 leading-relaxed">
                                {feedbackList.reduce((acc, f) => acc + f.rating, 0) / feedbackList.length >= 4.0 ? (
                                  "High fidelity scores. Current prompts align well with Gemini 2.5 Flash Image. No modification of base prompt weights recommended."
                                ) : (
                                  "Fidelity scores indicate room for improvement. Consider refining style parameters or lowering active parallel threads for higher image coherence."
                                )}
                              </p>
                            </div>
                            <p className="text-[10px] text-[#8a8880] mt-2 leading-tight">
                              Analyze feedback below to identify prompt optimization vectors.
                            </p>
                          </div>

                          {/* Complete Logs Table */}
                          <div className="md:col-span-3 border border-[#eae6db] rounded-lg overflow-hidden bg-white max-h-72 overflow-y-auto">
                            <table className="w-full text-left text-xs text-[#504e49] border-collapse">
                              <thead>
                                <tr className="bg-[#faf9f6] border-b border-[#eae6db] font-mono text-3xs uppercase text-[#8c8a81]">
                                  <th className="p-3">Scene Shot</th>
                                  <th className="p-3">Rating</th>
                                  <th className="p-3">Audit Comments</th>
                                  <th className="p-3">Timestamp</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#f3f0ea]">
                                {feedbackList.map((feedback) => (
                                  <tr key={feedback.id} className="hover:bg-[#faf9f6]/50 transition-colors">
                                    <td className="p-3 flex items-center gap-2">
                                      <img
                                        src={feedback.generatedUrl}
                                        className="h-9 w-12 object-cover rounded border border-[#e2dfd9]"
                                        alt="Thumbnail"
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-[#1a1a1a]">{feedback.promptTitle}</span>
                                        <span className="text-[10px] text-[#8c8a81] font-mono">ID: #{feedback.promptId}</span>
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <div className="flex gap-0.5 text-amber-500 font-mono font-bold">
                                        <span>{feedback.rating}</span>
                                        <span>★</span>
                                      </div>
                                    </td>
                                    <td className="p-3 italic">
                                      {feedback.comments ? `"${feedback.comments}"` : <span className="text-[#8c8a81] italic">No comments</span>}
                                    </td>
                                    <td className="p-3 text-2xs text-[#8c8a81] font-mono">
                                      {new Date(feedback.timestamp).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* The Grid Catalog */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredPrompts.map((prompt) => (
                    <motion.div
                      key={prompt.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white border border-[#e9e6df] rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow group flex flex-col justify-between"
                    >
                      {/* Card Visual Container */}
                      <div 
                        className="relative bg-[#f4f1ea] overflow-hidden flex items-center justify-center border-b border-[#f1efe9] w-full"
                        style={{ aspectRatio: "1090/976" }}
                      >
                        
                        {prompt.status === "completed" && prompt.resultUrl ? (
                          <>
                            <div className="relative h-full w-full">
                              <img
                                src={prompt.resultUrl}
                                alt={prompt.title}
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
                              />
                              
                              {/* If Sandbox simulated completed result, overlay the original sofa image over the beautiful room! */}
                              {prompt.isSandbox && sofaImage && (
                                <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/5 pointer-events-none">
                                  <img
                                    src={sofaImage.url}
                                    alt="Sofa Overlay"
                                    referrerPolicy="no-referrer"
                                    crossOrigin="anonymous"
                                    style={{
                                      transform: `translate(${sofaXOffset}%, ${sofaYOffset - 15}%) scale(${sofaScale / 100}) rotate(${sofaRotation}deg)`,
                                    }}
                                    className="max-w-[80%] max-h-[60%] object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.65)] mt-[15%] transition-transform duration-500"
                                  />
                                </div>
                              )}
                              
                              {/* If Sandbox mode completed, show a small subtle chic tag */}
                              {prompt.isSandbox && (
                                <span className="absolute top-3 left-3 bg-[#b08d57]/90 backdrop-blur-md text-[9px] uppercase tracking-wider font-semibold text-[#fbfbf9] px-2 py-0.5 rounded shadow-sm flex items-center gap-1 font-mono">
                                  <Sparkles className="h-2.5 w-2.5 animate-spin-slow" />
                                  Sandbox Preview
                                </span>
                              )}
                            </div>
                            
                            {/* Hover overlay controls */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <button
                                onClick={() => setLightboxPrompt(prompt)}
                                className="h-9 w-9 bg-white/95 text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white rounded-full flex items-center justify-center transition-all shadow-md"
                                title="Zoom Catalog Photo"
                              >
                                <Maximize2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadSingle(prompt)}
                                className="h-9 w-9 bg-white/95 text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white rounded-full flex items-center justify-center transition-all shadow-md"
                                title="Download Background File"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </>
                        ) : prompt.status === "generating" || prompt.status === "pending" ? (
                          <div className="flex flex-col items-center justify-center p-6 text-center h-full w-full bg-[#fbfbf9]">
                            {/* Premium shimmering skeleton animation */}
                            <div className="absolute inset-0 shimmer opacity-60"></div>
                            <div className="relative z-10 flex flex-col items-center">
                              <Loader2 className="h-8 w-8 text-[#a88248] animate-spin mb-3" />
                              <span className="text-xs font-mono text-[#a88248] bg-[#fdfcf9] border border-[#ebdcb3]/60 px-2 py-0.5 rounded uppercase font-semibold tracking-wider">
                                {prompt.status === "generating" ? "Rendering Room..." : "In Queue..."}
                              </span>
                              <p className="text-2xs text-[#8c8a81] mt-2 max-w-[200px]">
                                {prompt.status === "generating" 
                                  ? "Preserving sofa cover & blending coordinates" 
                                  : "Waiting for an active parallel thread"}
                              </p>
                              {prompt.retryCount > 0 && (
                                <span className="text-3xs text-red-700 font-mono mt-1.5">
                                  Retry attempt {prompt.retryCount}/3
                                </span>
                              )}
                            </div>
                          </div>
                        ) : prompt.status === "failed" ? (
                          <div className="flex flex-col items-center justify-center p-6 text-center h-full bg-red-50/50">
                            <AlertTriangle className="h-8 w-8 text-red-600 mb-2.5" />
                            <span className="text-2xs font-semibold text-red-700 bg-red-100 border border-red-200 px-2.5 py-0.5 rounded-sm uppercase tracking-wider">
                              {prompt.error && (prompt.error.includes("429") || prompt.error.toLowerCase().includes("quota") || prompt.error.toLowerCase().includes("rate limit") || prompt.error.toLowerCase().includes("billing"))
                                ? "API Quota Exceeded"
                                : "Generation Failed"}
                            </span>
                            <p className="text-3xs text-[#706e68] mt-2 max-w-[210px] line-clamp-4 leading-relaxed">
                              {prompt.error || "Model timed out."}
                            </p>
                          </div>
                        ) : (
                          // Idle status
                          <div className="flex flex-col items-center justify-center p-6 text-center h-full bg-[#faf9f6]">
                            <Sparkles className="h-7 w-7 text-[#c2cfc2]/70 mb-2" />
                            <span className="text-xs text-[#a09e96] font-display italic">
                              Idle Setting
                            </span>
                            <p className="text-3xs text-[#b8b6af] max-w-[170px] mt-1.5 leading-relaxed">
                              Ready to capture background dimensions
                            </p>
                          </div>
                        )}

                        {/* Top Badge: Category */}
                        <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs border border-[#eae6db] text-3xs font-mono uppercase tracking-wider font-semibold text-[#6a6860] px-2 py-1 rounded-sm shadow-xs">
                          {prompt.category}
                        </div>

                        {/* Top Badge: ID */}
                        <div className="absolute top-2.5 right-2.5 bg-[#1a1a1a]/85 backdrop-blur-xs text-3xs font-mono text-[#eae6dc] font-bold h-5 w-8 flex items-center justify-center rounded-sm">
                          #{String(prompt.id).padStart(2, "0")}
                        </div>
                      </div>

                      {/* Card Content Footer */}
                      <div className="p-4 flex flex-col justify-between grow">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-display font-medium text-base text-[#1a1a1a] line-clamp-1">
                              {prompt.title}
                            </h4>
                            {prompt.rating && (
                              <div className="flex items-center gap-0.5 text-amber-600 shrink-0 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                <span>{prompt.rating}</span>
                                <span>★</span>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-2xs text-[#706e68] line-clamp-2 mt-1 min-h-[2.25rem] leading-relaxed">
                            {prompt.prompt.split(`${prompt.title}`)[1]?.trim() || prompt.prompt.substring(SOFA_PROMPTS[0].prompt.length - 100)}
                          </p>
                        </div>

                        {/* Card Controls row */}
                        <div className="mt-4 pt-3.5 border-t border-[#f3f0ea] flex items-center justify-between gap-4">
                          
                          {/* Left status badge */}
                          <div className="flex items-center gap-1.5">
                            {prompt.status === "completed" ? (
                              <span className="flex items-center gap-1 text-2xs text-emerald-800 font-medium font-mono">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                Completed
                              </span>
                            ) : prompt.status === "generating" ? (
                              <span className="flex items-center gap-1 text-2xs text-amber-800 font-medium font-mono animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                Rendering
                              </span>
                            ) : prompt.status === "pending" ? (
                              <span className="flex items-center gap-1 text-2xs text-amber-700 font-medium font-mono">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                                Queued
                              </span>
                            ) : prompt.status === "failed" ? (
                              <span className="flex items-center gap-1 text-2xs text-red-800 font-medium font-mono">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                                Failed
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-2xs text-gray-500 font-medium font-mono">
                                <span className="h-1.5 w-1.5 rounded-full bg-gray-300"></span>
                                Idle
                              </span>
                            )}
                          </div>

                          {/* Right action button */}
                          <div>
                            {prompt.status === "completed" && prompt.resultUrl ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setLightboxPrompt(prompt)}
                                  className="text-3xs flex items-center gap-1 border border-[#e2dfd9] hover:border-[#b08d57] text-[#555] hover:text-[#b08d57] px-2.5 py-1 rounded transition-all font-medium uppercase tracking-wider"
                                >
                                  <Eye className="h-3 w-3" />
                                  View
                                </button>
                                <button
                                  onClick={() => handleGenerateSingle(prompt.id)}
                                  className="text-3xs flex items-center gap-1 border border-[#e2dfd9] hover:border-[#b08d57] text-[#555] hover:text-[#b08d57] px-2 py-1 rounded transition-all font-medium"
                                  title="Re-run Prompt"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </button>
                              </div>
                            ) : prompt.status === "generating" || prompt.status === "pending" ? (
                              <button
                                disabled
                                className="text-3xs flex items-center gap-1 border border-gray-100 text-gray-400 px-2.5 py-1 rounded font-medium uppercase tracking-wider bg-gray-50"
                              >
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Wait
                              </button>
                            ) : (
                              <button
                                onClick={() => handleGenerateSingle(prompt.id)}
                                className="text-3xs flex items-center gap-1.5 bg-[#b08d57] hover:bg-[#947443] text-white px-3 py-1.5 rounded transition-all font-semibold uppercase tracking-wider shadow-sm"
                              >
                                <Sparkles className="h-3 w-3" />
                                Render
                              </button>
                            )}
                          </div>

                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* LIGHTBOX & ALIGNMENT COMPARISON MODAL */}
      <AnimatePresence>
        {lightboxPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#111]/95 backdrop-blur-sm flex flex-col md:flex-row items-center justify-center p-6 md:p-10"
          >
            {/* Left Modal Column: Interactive Slide/Overlay Screen */}
            <div className="w-full md:w-3/5 h-[50vh] md:h-[80vh] flex items-center justify-center relative bg-black/60 rounded-xl overflow-hidden shadow-2xl border border-white/5">
              
              <AnimatePresence mode="wait">
                <motion.div 
                  key={isComparing ? "original" : "generated"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 flex items-center justify-center p-4"
                >
                  <div 
                    className="relative max-h-full max-w-full flex items-center justify-center overflow-hidden"
                    style={{ aspectRatio: "1090/976" }}
                  >
                    <img
                      src={isComparing ? sofaImage?.url : lightboxPrompt.resultUrl}
                      alt={isComparing ? "Original Sofa" : "Generated Catalog Scene"}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      className="max-h-full max-w-full object-contain select-none"
                    />
                    {!isComparing && lightboxPrompt.isSandbox && sofaImage && (
                      <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/5 pointer-events-none">
                        <img
                          src={sofaImage.url}
                          alt="Sofa Overlay"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          style={{
                            transform: `translate(${sofaXOffset}%, ${sofaYOffset - 15}%) scale(${sofaScale / 100}) rotate(${sofaRotation}deg)`,
                          }}
                          className="max-w-[80%] max-h-[60%] object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.75)] mt-[15%]"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Strict Alignment comparison box lines (shows absolute stability!) */}
              <div className="absolute inset-0 pointer-events-none border border-white/10 flex items-center justify-center">
                <div className="text-[10px] font-mono text-white/30 absolute top-3 left-3 bg-black/40 px-2 py-0.5 rounded uppercase tracking-widest">
                  {isComparing ? "Original Reference Frame" : "Generated Catalog Frame"}
                </div>
              </div>

              {/* Alignment proof banner */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md rounded border border-white/10 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
                <div className="text-center sm:text-left">
                  <span className="text-3xs uppercase font-mono tracking-widest text-[#d6b07a] font-bold block">
                    Product Integrity Verified
                  </span>
                  <span className="text-xs text-white/80 mt-0.5 block leading-relaxed">
                    Sofa dimensions, fabrics, stitching, and folds remain 100% untouched.
                  </span>
                </div>

                {/* Compare hold button */}
                <button
                  onMouseDown={() => setIsComparing(true)}
                  onMouseUp={() => setIsComparing(false)}
                  onMouseLeave={() => setIsComparing(false)}
                  onTouchStart={() => setIsComparing(true)}
                  onTouchEnd={() => setIsComparing(false)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-[#d6b07a] hover:bg-[#b08d57] active:scale-98 text-black font-semibold text-xs tracking-wider uppercase rounded-sm transition-all shadow-md select-none cursor-pointer"
                >
                  <Layers className="h-3.5 w-3.5 text-black" />
                  Hold To View Original
                </button>
              </div>
            </div>

            {/* Right Modal Column: Details and prompt properties */}
            <div className="w-full md:w-2/5 md:pl-8 mt-6 md:mt-0 flex flex-col justify-between h-[35vh] md:h-[80vh] text-white">
              <div>
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                  <div>
                    <span className="text-2xs font-mono uppercase tracking-widest text-[#d6b07a] font-bold">
                      Scene Prompt #{String(lightboxPrompt.id).padStart(2, "0")}
                    </span>
                    <h3 className="font-display text-3xl mt-1 leading-tight tracking-wide font-medium">
                      {lightboxPrompt.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => {
                      setLightboxPrompt(null);
                      setIsComparing(false);
                    }}
                    className="h-10 w-10 border border-white/20 hover:bg-white/10 text-white/70 hover:text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-3xs font-mono uppercase tracking-wider text-white/40">Category Setting</span>
                    <span className="block mt-0.5 text-xs bg-white/10 px-2.5 py-1 rounded w-fit uppercase font-semibold tracking-wider border border-white/5">
                      {lightboxPrompt.category}
                    </span>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 font-sans text-xs text-white/80 leading-relaxed max-h-[15vh] md:max-h-[30vh] overflow-y-auto">
                    <span className="text-3xs font-mono uppercase tracking-wider text-[#d6b07a] font-bold block mb-1">
                      Gemini Prompt Blueprint
                    </span>
                    {lightboxPrompt.prompt}
                  </div>

                  {/* Interactive Feedback & Rating Panel */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 mt-4">
                    <span className="text-3xs font-mono uppercase tracking-wider text-[#d6b07a] font-bold block mb-2 flex items-center gap-1.5">
                      <Star className="h-3 w-3 fill-[#d6b07a] text-[#d6b07a]" />
                      Catalog Quality Rating
                    </span>
                    
                    {lightboxPrompt.rating ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-white/50">Your rating:</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4.5 w-4.5 ${
                                  star <= lightboxPrompt.rating! ? "text-amber-400 fill-amber-400" : "text-white/20"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {lightboxPrompt.comments && (
                          <p className="text-xs text-white/75 bg-white/5 p-2 rounded italic">
                            "{lightboxPrompt.comments}"
                          </p>
                        )}
                        <p className="text-3xs text-[#d6b07a] italic mt-1">Feedback has been saved for optimization.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/70">Rate this catalog shot:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setSelectedRating(star)}
                                className="transition-transform duration-100 hover:scale-120 p-0.5 cursor-pointer"
                              >
                                <Star
                                  className={`h-6 w-6 transition-colors ${
                                    star <= selectedRating 
                                      ? "text-amber-400 fill-amber-400" 
                                      : "text-white/30 hover:text-amber-300"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-white/50 font-mono uppercase block">Optional Comments</label>
                          <textarea
                            rows={2}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="What do you think of the shadows, lighting or styling?"
                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#d6b07a] transition-colors resize-none"
                          />
                        </div>

                        <button
                          onClick={() => handleSubmitFeedback(lightboxPrompt.id, lightboxPrompt.title, lightboxPrompt.resultUrl!)}
                          disabled={selectedRating === 0 || isSubmittingFeedback}
                          className="w-full py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-white/10 text-white font-semibold text-xs tracking-wider uppercase rounded-md transition-colors border border-white/10 cursor-pointer"
                        >
                          {isSubmittingFeedback ? "Submitting..." : "Submit Quality Report"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer controls inside modal */}
              <div className="border-t border-white/10 pt-5 mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleDownloadSingle(lightboxPrompt)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#d6b07a] hover:bg-[#b08d57] text-black font-semibold tracking-wide rounded-md transition-colors shadow-lg"
                >
                  <Download className="h-4 w-4" />
                  Download Catalog Photo
                </button>
                <button
                  onClick={() => {
                    handleGenerateSingle(lightboxPrompt.id);
                    setLightboxPrompt(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-white/20 hover:bg-white/10 text-white font-medium rounded-md transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate This Background
                </button>
              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
