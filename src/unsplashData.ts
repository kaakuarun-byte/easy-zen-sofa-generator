export function getUnsplashUrlForPrompt(id: number, filename?: string): string {
  const emptyRooms = [
    "photo-1600607687939-ce8a6c25118c", // Modern Empty Living Room, large windows, wooden floor
    "photo-1600585154340-be6161a56a0c", // Scandinavian clean minimalist floor & wall area
    "photo-1618219908412-a29a1bb7b86e", // Premium Minimal empty white space with wood floor
    "photo-1585412727339-54e4bae3bbf9", // Cozy Family empty wooden floor area, soft natural light
    "photo-1613977257363-707ba9348227", // Scenic Luxury penthouse floor area with glass windows
    "photo-1540518614846-7eded433c457", // Elegant classic empty villa mansion room with marble floor
    "photo-1544644181-1484b3fdfc62", // Japandi minimalist empty room with warm neutral tones
    "photo-1513694203232-719a280e022f", // Cozy Boho sunlit empty corner with natural textures
    "photo-1505691938895-1758d7feb511", // Farmhouse cozy warm wooden-floor space
    "photo-1582582621959-a0a27fec21f8", // Five-star classic empty lounge hall
    "photo-1613490493576-7fde63acd811", // Contemporary luxury apartment empty living zone
    "photo-1600607687920-4e2a09cf159d", // Garden view high-ceiling empty room
    "photo-1600210492486-724fe5c67fb0", // Modern concrete luxury empty architectural space
    "photo-1586023492125-27b2c045efd7", // Beige luxury theme empty wall space with clean flooring
    "photo-1600585154526-990dced4db0d", // Dark luxury spacious empty room
    "photo-1600566752355-35792bedcfea", // Modern loft empty lounge
    "photo-1600607687644-c7171b42498f", // Modern empty lounge space with glass walls
    "photo-1600210491892-6f205c01acb3", // Sunny minimalist apartment empty room
    "photo-1600210491369-e753b8024178", // Clean studio space with wood paneling
    "photo-1583847268964-b28dc8f51f92", // Minimalist concrete room with shadow casting
    "photo-1598928506311-c55ded91a20c", // Contemporary spacious empty room
    "photo-1616486338812-3dadae4b4ace", // Cozy brick-wall empty room
    "photo-1617806118233-18e1db207fc6", // Warm wooden walls empty interior
    "photo-1615529182904-14819c35db37", // Elegant white empty salon wall
    "photo-1616046229478-9901c5536a45", // Cozy beige empty space
    "photo-1616486029423-aaa4789e8c9a", // Elegant wooden panel room
    "photo-1615876234886-fd9a39fda97f", // Japandi styled empty space
    "photo-1616047006789-b7af5afb8c20", // Modern premium white room
    "photo-1618221195710-dd6b41faaea6", // Soft warm luxury suite corner
    "photo-1618221381711-42ca8ab6e908", // Dark slate-colored premium gallery wall
    "photo-1618219944342-824e40a13285", // Elegant empty boutique floor
    "photo-1618220179428-22790b461013", // White marble floor empty salon
    "photo-1618221469555-7f3af97540c6", // High ceiling empty sunroom
    "photo-1631049307264-da0ec9d70304", // Luxury modern villa empty lounge
    "photo-1600121848594-d8644e57abab", // Premium living room wood floor
    "photo-1600566753190-17f0baa2a6c3", // Modern minimalist bright space
    "photo-1512917774080-9991f1c4c750", // Spacious premium sunlit interior
    "photo-1600573472591-ee6b68d14c68", // Clean contemporary open room
    "photo-1600047509807-ba8f99d2cdde", // High-end architectural concrete space
    "photo-1600585154363-67eb9e2e2099", // Elegant kitchen-adjacent lounge area
    "photo-1600566753376-12c8ab7fb75b", // White empty designer loft
    "photo-1615529162924-f8605388461d", // Elegant soft peach/beige room wall
    "photo-1617104551722-3b2d51366400", // Modern warm neutral salon space
    "photo-1556912172-45b7abe8b7e1", // Modern luxury empty wooden kitchen/living space
    "photo-1532372320572-cda25653a26d", // Rustic empty sunlit wooden room
    "photo-1560448204-e02f11c3d0e2", // Bright luxury minimalist room
    "photo-1560185127-6a2806647f81", // Spacious premium penthouse interior
    "photo-1484154218962-a197022b5858", // Modern clean empty Scandinavian kitchen/dining lounge
    "photo-1502672260266-1c1ef2d93688", // Warm contemporary apartment space
    "photo-1600566753086-00f18fb6b3ea", // Stunning luxury master empty salon space
    "photo-1595428774223-ef52624120d2", // Clean empty contemporary high-contrast showroom
    "photo-1513519245088-0e12902e5a38", // Modern luxury empty loft
    "photo-1582268611958-ebfd161ef9cf", // Cozy high-ceiling living space
    "photo-1507089947368-19c1da9775ae", // Minimalist premium empty apartment
    "photo-1600210491892-6f205c01acb3", // Sunny minimalist apartment empty room
    "photo-1600585154526-990dced4db0d"  // Dark modern luxury lounge space
  ];

  const list = [...emptyRooms];

  // If a filename is provided, stably shuffle the list based on a hash of the filename
  if (filename) {
    let hash = 0;
    for (let i = 0; i < filename.length; i++) {
      hash = (hash << 5) - hash + filename.charCodeAt(i);
      hash |= 0;
    }
    hash = Math.abs(hash);

    // Seeded Fisher-Yates shuffle
    for (let i = list.length - 1; i > 0; i--) {
      hash = (hash * 1664525 + 1013904223) % 4294967296;
      const j = hash % (i + 1);
      const temp = list[i];
      list[i] = list[j];
      list[j] = temp;
    }
  }

  // Reconstruct stylistic indices from the prompt's ID (which is 1-indexed)
  const zeroBasedId = (id - 1);
  const lIdx = zeroBasedId % 10;
  const pIdx = Math.floor(zeroBasedId / 10) % 10;
  const rIdx = Math.floor(zeroBasedId / 100) % 10;
  const sIdx = Math.floor(zeroBasedId / 1000) % 10;

  // Select base room index using reconstructed indices for stable non-repeating pairs
  const baseRoomIndex = (rIdx * 7 + sIdx * 3 + pIdx) % list.length;
  const idStr = list[baseRoomIndex];

  // Apply subtle visual adjustments based on styling & lighting characteristics to create 1000+ distinct rooms
  let imgixParams = "";

  // 1. Flip horizontally every other index for spatial variance
  if ((rIdx + pIdx + lIdx) % 2 === 1) {
    imgixParams += "&flip=h";
  }

  let bri = 0;      // brightness (-100 to 100)
  let con = 0;      // contrast (-100 to 100)
  let sat = 0;      // saturation (-100 to 100)
  let hue = 0;      // hue rotation (0 to 360)
  let exp = 0;      // exposure (-100 to 100)

  // Style characteristics mapping
  if (sIdx === 0) { // Luxury Modern
    bri = 8; con = 10; sat = 2;
  } else if (sIdx === 1) { // Scandinavian Minimalist
    bri = 14; con = -4; sat = -10;
  } else if (sIdx === 2) { // Warm Cozy Boho
    bri = 4; con = 6; sat = 12; hue = 10;
  } else if (sIdx === 3) { // Elegant Japandi
    bri = 6; con = -2; sat = -4; hue = 4;
  } else if (sIdx === 4) { // Rustic Farmhouse
    bri = 5; con = 8; sat = 8; hue = 6;
  } else if (sIdx === 5) { // Sleek Mid-Century
    bri = 4; con = 12; sat = 10; hue = 352;
  } else if (sIdx === 6) { // Sophisticated Industrial
    bri = -4; con = 18; sat = -6;
  } else if (sIdx === 7) { // Sunny Coastal
    bri = 18; con = 6; sat = 4; hue = 196; exp = 8;
  } else if (sIdx === 8) { // Opulent Classic
    bri = 6; con = 12; sat = 8; hue = 12;
  } else if (sIdx === 9) { // Moody Cinematic
    bri = -18; con = 22; sat = 6; hue = 225; exp = -12;
  }

  // Lighting characteristics mapping
  if (lIdx === 0) { // Golden Hour Sunset
    bri += 4; sat += 12; hue = (hue + 12) % 360; exp += 4;
  } else if (lIdx === 1) { // Soft Morning Sunlight
    bri += 6; con += 4; hue = (hue + 4) % 360;
  } else if (lIdx === 2) { // Moody Twilight Ambient
    bri -= 10; con += 12; sat -= 8; hue = (hue + 215) % 360; exp -= 8;
  } else if (lIdx === 3) { // Warm Indirect LED Glow
    bri += 2; con += 6; hue = (hue + 8) % 360;
  } else if (lIdx === 4) { // Bright Sun-drenched
    bri += 12; con -= 2; sat += 2; exp += 12;
  } else if (lIdx === 5) { // Muted Foggy Overcast
    bri += 2; con -= 8; sat -= 12; hue = (hue + 195) % 360;
  } else if (lIdx === 6) { // Dramatic Chandelier Light
    bri += 4; con += 12; sat += 4;
  } else if (lIdx === 7) { // Diffused Window Daylight
    bri += 8; con += 2;
  } else if (lIdx === 8) { // Cozy Fireplace Warmth
    bri -= 4; con += 10; sat += 12; hue = (hue + 10) % 360;
  } else if (lIdx === 9) { // Evening Candlelight Lanterns
    bri -= 12; con += 15; sat += 18; hue = (hue + 14) % 360; exp -= 6;
  }

  // Add parameters only if they have non-default values to keep URL clean
  if (bri !== 0) imgixParams += `&bri=${bri}`;
  if (con !== 0) imgixParams += `&con=${con}`;
  if (sat !== 0) imgixParams += `&sat=${sat}`;
  if (hue !== 0) imgixParams += `&hue=${hue}`;
  if (exp !== 0) imgixParams += `&exp=${exp}`;

  return `https://images.unsplash.com/` + idStr + `?auto=format&fit=crop&w=1090&h=976&q=85` + imgixParams;
}
