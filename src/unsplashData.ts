export function getUnsplashUrlForPrompt(id: number): string {
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
  ];

  // Map 1-50 IDs to the emptyRooms list stably using modulo
  const index = (id - 1) % emptyRooms.length;
  const idStr = emptyRooms[index];
  return `https://images.unsplash.com/` + idStr + `?auto=format&fit=crop&w=1000&q=80`;
}
