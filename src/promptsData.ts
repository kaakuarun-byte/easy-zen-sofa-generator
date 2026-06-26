export interface SofaPrompt {
  id: number;
  title: string;
  category: "Modern" | "Minimalist" | "Cozy" | "Scenic" | "Classic" | "Themed";
  prompt: string;
}

const SOFA_INSTRUCTION_PREFIX = `Keep the sofa cover exactly the same as the original image. Do not change the sofa cover in any way. Maintain exactly the same pattern, fabric, texture, weave, stitching, quilting, piping, seams, color, print, design, fit, shape, dimensions, wrinkles, folds, drape, cushion placement, proportions, and overall appearance. Do not regenerate, redesign, recolor, enhance, smooth, sharpen, soften, upscale, replace, or modify the sofa cover. Preserve the product exactly as it appears in the original image. Only replace the background and room environment. Never crop the sofa. Keep the entire sofa fully visible. Ensure the sofa remains the main subject of the image.`;

export const SOFA_PROMPTS: SofaPrompt[] = [
  {
    id: 1,
    title: "Luxury Modern Living Room",
    category: "Modern",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a luxurious modern living room with elegant marble flooring, white and beige textured walls, premium wooden wall panels, floor-to-ceiling glass windows, beautiful sheer curtains, modern designer ceiling, indirect warm LED lighting, luxury chandelier, indoor green plants, minimal premium furniture, stylish coffee table, elegant decorative accessories, soft natural daylight entering through large windows, realistic shadows, balanced exposure, ultra photorealistic commercial furniture photography, HDR, 8K resolution, magazine-quality interior, premium ecommerce product presentation, clean composition, no people, no pets, no clutter, no watermark, no logo, no text.`
  },
  {
    id: 2,
    title: "Scandinavian Luxury Interior",
    category: "Minimalist",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a bright Scandinavian-style luxury living room featuring white painted walls, natural oak wooden flooring, elegant neutral furniture, beige decorative cushions, soft cream curtains, indoor plants, wooden shelves, minimal wall decor, warm natural sunlight, cozy premium atmosphere, balanced lighting, realistic shadows, ultra realistic furniture photography, HDR, 8K resolution, luxury home styling, ecommerce-ready product presentation, clean elegant composition, no people, no pets, no text, no logo, no watermark.`
  },
  {
    id: 3,
    title: "Premium Minimal Interior",
    category: "Minimalist",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a premium minimalist luxury apartment with white walls, textured feature wall, cream marble flooring, simple luxury decor, elegant coffee table, soft indirect lighting, warm daylight entering from large windows, beautiful curtains, subtle indoor plants, modern architecture, perfectly clean luxury atmosphere, photorealistic commercial furniture photography, HDR, ultra detailed, 8K resolution, premium ecommerce background, realistic shadows, no people, no pets, no text, no watermark.`
  },
  {
    id: 4,
    title: "Cozy Family Living Room",
    category: "Cozy",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a warm cozy family living room with elegant wooden flooring, modern fireplace, decorative bookshelves, premium wall panels, indoor plants, warm ambient lamps, large windows with sunlight, luxury coffee table, comfortable premium interior styling, realistic shadows, ultra photorealistic furniture photography, HDR lighting, 8K resolution, commercial interior photography, ecommerce-ready background, no people, no children, no pets, no clutter, no text, no logo, no watermark.`
  },
  {
    id: 5,
    title: "Luxury Penthouse",
    category: "Scenic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a luxury penthouse living room with panoramic city skyline visible through floor-to-ceiling glass windows, marble flooring, designer ceiling lights, elegant wall textures, premium wooden furniture, soft golden daylight, realistic reflections, luxury home atmosphere, professional interior photography, ultra realistic HDR, 8K resolution, premium ecommerce product scene, clean composition, realistic lighting, no people, no pets, no logo, no watermark, no text.`
  },
  {
    id: 6,
    title: "Elegant Villa Interior",
    category: "Classic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a spacious luxury villa living room featuring cream marble flooring, elegant wall mouldings, decorative ceiling, premium chandelier, beautiful curtains, luxury wooden furniture, stylish coffee table, indoor plants, natural sunlight, realistic HDR lighting, professional furniture photography, ultra photorealistic, commercial quality, 8K resolution, ecommerce-ready interior, clean premium styling, no people, no pets, no clutter, no watermark, no logo.`
  },
  {
    id: 7,
    title: "Japandi Luxury Style",
    category: "Minimalist",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a premium Japandi-inspired luxury living room with warm wooden flooring, neutral beige walls, elegant wooden furniture, indoor bonsai plant, linen curtains, minimal decorations, soft natural daylight, warm ambient atmosphere, luxury architecture, ultra realistic furniture photography, HDR lighting, 8K quality, commercial product photography, realistic shadows, premium ecommerce presentation, no people, no pets, no logo, no text, no watermark.`
  },
  {
    id: 8,
    title: "Luxury Boho Interior",
    category: "Cozy",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a luxury bohemian living room with woven decor, natural wood furniture, pampas grass, hanging lights, indoor tropical plants, elegant neutral color palette, textured walls, soft daylight, warm atmosphere, luxury interior styling, photorealistic commercial furniture photography, HDR, 8K resolution, ecommerce-ready background, premium composition, realistic shadows, no people, no pets, no watermark, no logo, no text.`
  },
  {
    id: 9,
    title: "Farmhouse Luxury Living Room",
    category: "Cozy",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create an elegant luxury farmhouse living room featuring exposed wooden ceiling beams, stone fireplace, wooden flooring, rustic luxury furniture, premium wall decor, indoor plants, soft natural morning sunlight, cozy atmosphere, photorealistic commercial furniture photography, HDR, 8K resolution, luxury home styling, realistic shadows, ecommerce-ready product photography, no people, no pets, no text, no logo, no watermark.`
  },
  {
    id: 10,
    title: "Five-Star Hotel Lounge",
    category: "Classic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a luxurious five-star hotel lounge with premium marble flooring, elegant wall panels, designer ceiling, modern chandeliers, luxury coffee tables, indoor plants, sophisticated decor, soft warm lighting, beautiful large windows, professional architectural styling, ultra photorealistic furniture photography, HDR, 8K resolution, commercial ecommerce product presentation, realistic reflections, balanced exposure, premium luxury atmosphere, no people, no pets, no text, no watermark, no logo.`
  },
  {
    id: 11,
    title: "Contemporary Luxury Apartment",
    category: "Modern",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a contemporary luxury apartment living room with floor-to-ceiling glass windows, panoramic skyline view, polished marble flooring, beige textured walls, elegant wooden panels, premium designer coffee table, luxury rug, modern ceiling design, indirect warm LED lighting, soft natural daylight, indoor plants, balanced composition, professional commercial furniture photography, ultra photorealistic, HDR, 8K resolution, ecommerce-ready product presentation, realistic shadows, no people, no pets, no text, no logo, no watermark.`
  },
  {
    id: 12,
    title: "Garden View Living Room",
    category: "Scenic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a premium living room overlooking a lush landscaped garden through large glass windows, natural stone flooring, elegant cream walls, luxury curtains, designer lighting, indoor plants, wooden furniture, soft morning sunlight, peaceful atmosphere, magazine-quality interior styling, commercial furniture photography, ultra realistic, HDR, 8K resolution, premium ecommerce background, realistic lighting, no people, no pets, no logo, no watermark, no text.`
  },
  {
    id: 13,
    title: "Modern Concrete Luxury",
    category: "Modern",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a modern luxury interior with exposed concrete walls, polished concrete flooring, elegant wood accents, premium lighting, minimalist furniture, abstract wall art, indoor greenery, soft daylight, architectural luxury atmosphere, commercial furniture photography, ultra photorealistic, HDR lighting, 8K quality, premium ecommerce presentation, realistic reflections and shadows, no people, no pets, no watermark, no logo, no text.`
  },
  {
    id: 14,
    title: "Beige Luxury Theme",
    category: "Classic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create an elegant beige luxury living room with cream marble flooring, textured walls, designer ceiling, premium wall panels, luxury curtains, stylish coffee table, decorative vases, indoor plants, warm natural lighting, high-end residential styling, ultra realistic furniture photography, HDR, 8K resolution, commercial ecommerce quality, balanced composition, no people, no pets, no clutter, no logo, no watermark, no text.`
  },
  {
    id: 15,
    title: "Dark Luxury Interior",
    category: "Themed",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a premium dark luxury living room with charcoal textured walls, walnut wooden panels, black marble flooring, sophisticated ceiling lighting, warm ambient lamps, elegant artwork, premium decor, realistic cinematic lighting, architectural interior photography, photorealistic HDR, 8K resolution, luxury ecommerce furniture presentation, clean composition, no people, no pets, no watermark, no logo, no text.`
  },
  {
    id: 16,
    title: "Coastal Luxury Home",
    category: "Scenic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a luxurious coastal living room with panoramic ocean view, white walls, oak wooden flooring, light linen curtains, elegant furniture, indoor tropical plants, bright natural daylight, clean fresh atmosphere, premium architectural styling, ultra realistic commercial furniture photography, HDR, 8K quality, realistic reflections, ecommerce-ready presentation, no people, no pets, no text, no logo, no watermark.`
  },
  {
    id: 17,
    title: "Bright Morning Sunlight",
    category: "Themed",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a bright luxury living room illuminated with fresh morning sunlight entering through large floor-to-ceiling windows, white walls, cream marble flooring, elegant decor, premium furniture, indoor plants, warm and inviting atmosphere, professional furniture photography, photorealistic HDR, ultra detailed 8K resolution, ecommerce-ready composition, realistic lighting and shadows, no people, no pets, no watermark, no logo, no text.`
  },
  {
    id: 18,
    title: "Golden Hour Luxury",
    category: "Themed",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a luxury living room during golden hour with warm sunlight streaming through large windows, beige walls, premium wooden flooring, luxury decor, elegant coffee table, beautiful indoor plants, sophisticated architectural design, cinematic natural lighting, commercial furniture photography, ultra photorealistic HDR, 8K resolution, premium ecommerce styling, no people, no pets, no text, no logo, no watermark.`
  },
  {
    id: 19,
    title: "Evening Luxury Ambience",
    category: "Themed",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create an elegant luxury living room at evening with warm ambient lighting, designer floor lamps, modern chandelier, textured wall panels, marble flooring, luxury furniture, decorative accessories, soft cinematic atmosphere, realistic indoor lighting, premium commercial furniture photography, HDR, 8K quality, ecommerce-ready composition, no people, no pets, no clutter, no watermark, no logo, no text.`
  },
  {
    id: 20,
    title: "Premium Showroom Interior",
    category: "Classic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a world-class premium furniture showroom with polished marble flooring, elegant architectural walls, luxury ceiling design, perfectly balanced professional lighting, stylish coffee table, decorative indoor plants, sophisticated neutral color palette, spacious luxury interior, ultra photorealistic commercial furniture photography, HDR, 8K resolution, magazine-quality ecommerce presentation, realistic shadows, perfectly clean composition, no people, no pets, no text, no logo, no watermark.`
  },
  {
    id: 21,
    title: "Luxury Glass House Living Room",
    category: "Scenic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create an ultra-luxury glass house living room with floor-to-ceiling panoramic windows overlooking a lush green forest, elegant white marble flooring, premium oak wood wall panels, luxury designer ceiling with indirect LED lighting, sophisticated coffee table, indoor decorative plants, warm natural sunlight, realistic reflections on glass, architectural masterpiece, magazine-quality interior styling, commercial furniture photography, HDR, ultra photorealistic, 8K resolution, premium ecommerce presentation, realistic shadows, perfectly balanced composition, no people, no pets, no text, no logo, no watermark.`
  },
  {
    id: 22,
    title: "Luxury Mountain View Interior",
    category: "Scenic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a luxurious mountain-view living room with huge glass windows overlooking beautiful snow-covered mountains, premium wooden flooring, textured stone accent wall, modern fireplace, elegant curtains, designer lighting, luxury home decor, warm golden daylight, professional architectural photography, HDR, ultra realistic, 8K quality, ecommerce-ready furniture presentation, no people, no pets, no watermark, no logo, no text.`
  },
  {
    id: 23,
    title: "Luxury White Marble Interior",
    category: "Classic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a luxurious all-white marble living room with polished Italian marble flooring, elegant marble walls, premium ceiling design, designer chandelier, luxury furniture accessories, soft natural daylight entering through large windows, indoor greenery, minimal architectural styling, ultra realistic commercial furniture photography, HDR lighting, 8K resolution, premium ecommerce background, clean composition, realistic shadows, no people, no pets, no logo, no watermark, no text.`
  },
  {
    id: 24,
    title: "Luxury Botanical Living Room",
    category: "Scenic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a premium botanical luxury living room filled with elegant indoor plants, modern planters, natural oak flooring, textured beige walls, linen curtains, designer lighting, warm sunlight, clean minimalist decor, fresh luxury atmosphere, commercial furniture photography, HDR, ultra photorealistic, 8K quality, ecommerce-ready product scene, realistic shadows, no people, no pets, no text, no logo, no watermark.`
  },
  {
    id: 25,
    title: "Executive Luxury Lounge",
    category: "Classic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a luxury executive lounge featuring dark walnut wall panels, premium marble flooring, elegant lighting, sophisticated artwork, modern coffee table, luxury decor accessories, balanced warm lighting, high-end corporate luxury atmosphere, architectural photography, commercial furniture photography, HDR, 8K resolution, premium ecommerce presentation, ultra realistic quality, no people, no pets, no logo, no watermark, no text.`
  },
  {
    id: 26,
    title: "Luxury Smart Home Interior",
    category: "Modern",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a futuristic luxury smart home living room with hidden LED lighting, premium wooden flooring, elegant feature wall, panoramic glass windows, minimal furniture, sophisticated interior design, clean luxury environment, natural daylight, photorealistic architectural visualization, commercial furniture photography, HDR, 8K ultra detailed, ecommerce-ready composition, no people, no pets, no watermark, no logo, no text.`
  },
  {
    id: 27,
    title: "Luxury Double Height Living Room",
    category: "Scenic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create an ultra-luxury double-height living room with grand ceiling, enormous glass windows, elegant chandelier, marble flooring, premium designer staircase, indoor plants, luxury decor, soft daylight, balanced HDR lighting, architectural masterpiece, magazine-quality commercial furniture photography, ultra realistic 8K quality, premium ecommerce presentation, no people, no pets, no text, no logo, no watermark.`
  },
  {
    id: 28,
    title: "Luxury Neutral Theme Interior",
    category: "Classic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a premium neutral-toned luxury living room with cream walls, beige curtains, oak wooden flooring, elegant lighting, textured wall art, minimal decor, stylish coffee table, indoor plants, soft daylight, architectural luxury styling, commercial furniture photography, ultra realistic HDR, 8K resolution, ecommerce-ready product photography, clean composition, realistic shadows, no people, no pets, no logo, no watermark, no text.`
  },
  {
    id: 29,
    title: "Luxury Modern Fireplace Room",
    category: "Cozy",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a luxurious modern living room centered around a sleek designer fireplace, polished marble flooring, elegant wall panels, warm wooden accents, indirect LED lighting, premium artwork, stylish coffee table, indoor greenery, cinematic warm ambiance, commercial furniture photography, HDR, ultra photorealistic, 8K resolution, premium ecommerce presentation, realistic shadows, no people, no pets, no logo, no watermark, no text.`
  },
  {
    id: 30,
    title: "International Furniture Catalog Style",
    category: "Classic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create an international premium furniture catalog-style luxury living room with elegant architecture, marble flooring, premium wooden wall panels, luxury designer decor, balanced natural lighting, sophisticated coffee table, indoor plants, clean minimal styling, world-class commercial furniture photography, ultra photorealistic HDR, 8K resolution, magazine-quality ecommerce presentation, realistic reflections, perfectly clean composition, no people, no pets, no text, no logo, no watermark.`
  },
  {
    id: 31,
    title: "Luxury Parisian Apartment",
    category: "Classic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a luxurious Parisian apartment living room with elegant wall moldings, tall French windows, flowing white curtains, premium herringbone wooden flooring, crystal chandelier, marble fireplace, sophisticated neutral décor, designer coffee table, fresh indoor plants, abundant soft natural daylight, realistic shadows and reflections, world-class architectural styling, magazine-quality commercial furniture photography, ultra photorealistic, HDR, 8K resolution, premium ecommerce presentation, no people, no pets, no clutter, no logo, no watermark, no text.`
  },
  {
    id: 32,
    title: "Luxury Dubai Penthouse",
    category: "Scenic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a world-class Dubai penthouse living room with floor-to-ceiling panoramic windows overlooking a luxury skyline, polished white marble flooring, elegant gold accents, premium wooden wall panels, sophisticated lighting, designer furniture, indoor plants, warm evening sunlight, architectural luxury styling, commercial furniture photography, HDR, ultra photorealistic, 8K resolution, premium ecommerce presentation, realistic reflections, balanced composition, no people, no pets, no logo, no watermark, no text.`
  },
  {
    id: 33,
    title: "Luxury Reading Lounge",
    category: "Cozy",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create an elegant luxury reading lounge with floor-to-ceiling bookshelves, oak wooden flooring, premium designer lighting, marble accent wall, indoor plants, artistic décor, warm ambient lighting mixed with soft daylight, sophisticated architecture, commercial furniture photography, ultra photorealistic HDR, 8K resolution, premium ecommerce styling, realistic shadows, no people, no pets, no logo, no watermark, no text.`
  },
  {
    id: 34,
    title: "Luxury Indoor Garden Living Room",
    category: "Scenic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a luxurious indoor garden living room with large tropical plants, stone planters, elegant glass walls, natural wooden flooring, cream textured walls, premium coffee table, warm sunlight filtering through greenery, luxury resort atmosphere, commercial furniture photography, HDR, ultra realistic, 8K resolution, premium ecommerce presentation, clean composition, no people, no pets, no watermark, no logo, no text.`
  },
  {
    id: 35,
    title: "Scandinavian White Luxury Home",
    category: "Minimalist",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a premium Scandinavian luxury home with bright white walls, oak wooden flooring, elegant neutral furniture, oversized windows, soft linen curtains, minimal artwork, indoor greenery, natural daylight, cozy atmosphere, architectural photography, commercial furniture photography, ultra photorealistic HDR, 8K resolution, premium ecommerce styling, realistic lighting, no people, no pets, no text, no logo, no watermark.`
  },
  {
    id: 36,
    title: "Luxury Marble Mansion",
    category: "Classic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a luxurious mansion living room featuring polished Italian marble flooring, designer ceiling, elegant crystal chandelier, decorative wall moldings, premium luxury décor, indoor plants, floor-to-ceiling windows, soft natural daylight, balanced HDR lighting, world-class interior styling, commercial furniture photography, ultra realistic 8K resolution, premium ecommerce presentation, no people, no pets, no logo, no watermark, no text.`
  },
  {
    id: 37,
    title: "Luxury Japanese Zen Interior",
    category: "Minimalist",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a luxury Japanese Zen-inspired living room with natural wood architecture, textured stone wall, indoor bonsai trees, soft paper-style lighting, elegant wooden flooring, large glass windows opening to a peaceful garden, warm daylight, calm atmosphere, architectural photography, commercial furniture photography, HDR, ultra photorealistic, 8K quality, premium ecommerce presentation, realistic shadows, no people, no pets, no text, no logo, no watermark.`
  },
  {
    id: 38,
    title: "Luxury High-Rise Apartment",
    category: "Scenic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a premium high-rise apartment living room with panoramic skyline view, elegant marble flooring, sophisticated wall textures, premium designer lighting, indoor plants, luxury décor, modern coffee table, soft natural daylight, architectural photography, commercial furniture photography, ultra photorealistic HDR, 8K resolution, premium ecommerce presentation, clean luxury styling, no people, no pets, no logo, no watermark, no text.`
  },
  {
    id: 39,
    title: "Luxury Sunset Living Room",
    category: "Themed",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a luxurious sunset-themed living room with warm golden sunlight entering through oversized windows, premium wooden flooring, textured beige walls, elegant decorative accessories, sophisticated coffee table, soft ambient lighting, cinematic atmosphere, architectural interior styling, commercial furniture photography, HDR, ultra realistic 8K resolution, premium ecommerce presentation, realistic reflections, no people, no pets, no text, no logo, no watermark.`
  },
  {
    id: 40,
    title: "International Luxury Furniture Catalog",
    category: "Classic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create an international premium furniture catalog scene with world-class luxury interior architecture, polished marble flooring, elegant wooden wall panels, oversized windows, beautiful neutral décor, luxury coffee table, indoor plants, balanced natural daylight, perfectly clean luxury styling, commercial furniture photography, ultra photorealistic HDR, 8K resolution, magazine-quality ecommerce presentation, perfectly realistic shadows and reflections, no people, no pets, no clutter, no logo, no watermark, no text.`
  },
  {
    id: 41,
    title: "Luxury Mediterranean Villa",
    category: "Scenic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a luxurious Mediterranean villa living room with elegant limestone flooring, arched windows, white textured walls, exposed wooden ceiling beams, linen curtains, premium wooden furniture, indoor olive trees, handcrafted ceramic décor, warm golden natural sunlight, soft realistic shadows, magazine-quality architectural styling, commercial furniture photography, ultra photorealistic, HDR, 8K resolution, premium ecommerce presentation, perfectly clean composition, no people, no pets, no clutter, no logo, no watermark, no text.`
  },
  {
    id: 42,
    title: "Luxury New York Loft",
    category: "Modern",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a premium New York loft-style living room with exposed brick walls, polished concrete flooring, black steel-framed windows, industrial pendant lighting, elegant walnut furniture, minimal décor, indoor plants, soft daylight, sophisticated urban luxury atmosphere, commercial furniture photography, ultra realistic HDR, 8K resolution, ecommerce-ready presentation, realistic reflections, no people, no pets, no text, no logo, no watermark.`
  },
  {
    id: 43,
    title: "Luxury Resort Lounge",
    category: "Scenic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a five-star luxury resort lounge with floor-to-ceiling glass walls overlooking a tropical garden, elegant stone flooring, premium wooden ceiling, designer lighting, sophisticated coffee table, lush indoor plants, natural daylight, relaxing luxury atmosphere, commercial furniture photography, HDR, ultra realistic, 8K resolution, premium ecommerce presentation, clean composition, no people, no pets, no watermark, no logo, no text.`
  },
  {
    id: 44,
    title: "Luxury Art Deco Living Room",
    category: "Classic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a luxury Art Deco inspired living room featuring gold geometric wall patterns, glossy black lacquered furniture, velvet emerald green accents, grand crystal lighting, polished marble floors with inlaid gold brass lines, realistic lighting, commercial furniture photography, HDR, 8K resolution, premium ecommerce background, no people, no watermark, no text.`
  },
  {
    id: 45,
    title: "Mid-Century Modern Luxury",
    category: "Modern",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a spacious mid-century modern luxury living room, featuring iconic tapered wooden furniture, mustard and olive accents, white brick fireplace, terrazzo tile floors, large starburst clock on the wall, soft ambient lighting, natural daylight through glass walls, ultra detailed, HDR, 8K quality, commercial ecommerce-ready presentation, no people, no pets, no logo.`
  },
  {
    id: 46,
    title: "Cozy Cabin Winter Lounge",
    category: "Cozy",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a warm, cozy log cabin winter living room. Large stone fireplace with crackling fire, wood-beamed ceilings, rich heavy-knit throws, warm lighting, windows showing a beautiful snow-covered forest during sunset, rustic luxury furniture, realistic shadows, ultra photorealistic, HDR, 8K, commercial catalog quality, no people.`
  },
  {
    id: 47,
    title: "Premium Velvet Charcoal Lounge",
    category: "Themed",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a sophisticated velvet-accented dark charcoal lounge with dark wood paneling, brass metal fixtures, abstract golden paintings on dark walls, warm luxury table lamps, plush rugs, professional moody interior styling, realistic shadows, commercial furniture photography, ultra-realistic HDR, 8K resolution, premium ecommerce backdrop, no people.`
  },
  {
    id: 48,
    title: "High-End Sunroom Conservatory",
    category: "Scenic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create a premium glass-enclosed sunroom conservatory. Abundant natural sunlight flooding the space, white wrought-iron detailing, limestone tile floors, many elegant hanging ferns and tropical plants, wicker accessories, comfortable garden seating nearby, bright refreshing atmosphere, photorealistic, HDR, 8K, catalog-ready product scene, no people.`
  },
  {
    id: 49,
    title: "Coastal Sunset Villa Terrace",
    category: "Scenic",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create an ultra-premium open-air coastal villa terrace living room. Beautiful sunset orange skies over the Mediterranean sea, white plaster walls, terracotta tile floors, natural linen curtains flowing in the breeze, warm candlelight lanterns, coastal luxury resort atmosphere, commercial photography, ultra detailed, 8K resolution, no people.`
  },
  {
    id: 50,
    title: "Elegant Industrial Brick Living Room",
    category: "Modern",
    prompt: `${SOFA_INSTRUCTION_PREFIX} Create an elegant high-end industrial living room. Weathered red brick walls, high metal-framed warehouse windows, dark hardwood flooring, elegant black iron pipes, luxury designer accessories, cozy warm rugs, professional interior architecture, cinematic daylight, commercial furniture photography, HDR, 8K resolution, premium ecommerce scenery, no people.`
  }
];
