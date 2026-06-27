export interface SofaPrompt {
  id: number;
  title: string;
  category: "Modern" | "Minimalist" | "Cozy" | "Scenic" | "Classic" | "Themed";
  prompt: string;
}

const SOFA_INSTRUCTION_PREFIX = `Keep the sofa cover exactly the same as the original image. Do not change the sofa cover in any way. Maintain exactly the same pattern, fabric, texture, weave, stitching, quilting, piping, seams, color, print, design, fit, shape, dimensions, wrinkles, folds, drape, cushion placement, proportions, and overall appearance. Do not regenerate, redesign, recolor, enhance, smooth, sharpen, soften, upscale, replace, or modify the sofa cover. Preserve the product exactly as it appears in the original image. Only replace the background and room environment. Never crop the sofa. Keep the entire sofa fully visible. Ensure the sofa remains the main subject of the image.`;

const rooms = [
  "Living Room",
  "Guest Room",
  "Lounge",
  "Sitting Room",
  "Drawing Room",
  "Reception Room",
  "Family Room",
  "Parlor",
  "Salon",
  "Morning Room"
];

const styles = [
  "Luxury Modern",
  "Scandinavian Minimalist",
  "Warm Cozy Boho",
  "Elegant Japandi",
  "Rustic Farmhouse",
  "Sleek Mid-Century",
  "Sophisticated Industrial",
  "Sunny Coastal",
  "Opulent Classic",
  "Moody Cinematic"
];

const palettes = [
  "Warm Beige & Gold",
  "Cool Slate & Ash",
  "Olive Green & Walnut",
  "Charcoal & Ivory",
  "Cream & Terracotta",
  "Sand & Oak",
  "Sage & Brass",
  "Navy & Pearl",
  "Pewter & Linen",
  "Vanilla & Caramel"
];

const lightings = [
  "Golden Hour Sunset",
  "Soft Morning Sunlight",
  "Moody Twilight Ambient",
  "Warm Indirect LED Glow",
  "Bright Sun-drenched",
  "Muted Foggy Overcast",
  "Dramatic Chandelier Light",
  "Diffused Window Daylight",
  "Cozy Fireplace Warmth",
  "Evening Candlelight Lanterns"
];

const categoriesMap: Record<string, "Modern" | "Minimalist" | "Cozy" | "Scenic" | "Classic" | "Themed"> = {
  "Luxury Modern": "Modern",
  "Scandinavian Minimalist": "Minimalist",
  "Warm Cozy Boho": "Cozy",
  "Elegant Japandi": "Minimalist",
  "Rustic Farmhouse": "Cozy",
  "Sleek Mid-Century": "Modern",
  "Sophisticated Industrial": "Modern",
  "Sunny Coastal": "Scenic",
  "Opulent Classic": "Classic",
  "Moody Cinematic": "Themed"
};

export const SOFA_PROMPTS: SofaPrompt[] = [];

// Seeded generator to build exactly 50 unique combinations
let currentId = 1;

for (let sIdx = 0; sIdx < styles.length; sIdx++) {
  const style = styles[sIdx];
  const category = categoriesMap[style];

  for (let rIdx = 0; rIdx < rooms.length; rIdx++) {
    const room = rooms[rIdx];

    for (let pIdx = 0; pIdx < palettes.length; pIdx++) {
      const palette = palettes[pIdx];

      for (let lIdx = 0; lIdx < lightings.length; lIdx++) {
        const lighting = lightings[lIdx];

        if (currentId <= 50) {
          const title = `${style} ${palette.split(" & ")[0]} ${room}`;
          const promptText = `${SOFA_INSTRUCTION_PREFIX} Create a highly premium and elegant empty ${room.toLowerCase()} in a ${style.toLowerCase()} design style. The room features a sophisticated color scheme of ${palette.toLowerCase()}. It is illuminated by ${lighting.toLowerCase()}, casting realistic soft shadows and warm highlights across the scene. The space boasts pristine flooring, architectural details, and is perfectly clean with no people, pets, or clutter. Render with ultra photorealistic commercial furniture photography quality, HDR, 8K resolution, and magazine-ready composition.`;

          SOFA_PROMPTS.push({
            id: currentId,
            title,
            category,
            prompt: promptText
          });

          currentId++;
        }
      }
    }
  }
}
