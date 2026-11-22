import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const services = [
  { slug: "vinyl", name: "Vinyl printing", shortName: "Vinyl", description: "Vivid, durable vinyl graphics for storefronts, walls, vehicles and campaigns.", ratePerSqft: 85, sortOrder: 1 },
  { slug: "one-way-vision", name: "One-way vision printing", shortName: "One-way vision", description: "Perforated window graphics that carry a clear campaign outside while preserving visibility from within.", ratePerSqft: 125, sortOrder: 2 },
  { slug: "uv", name: "UV printing", shortName: "UV print", description: "Direct-to-surface UV prints with crisp detail and a premium finish on rigid substrates.", ratePerSqft: 240, sortOrder: 3 },
  { slug: "light-board", name: "Light board printing", shortName: "Light board", description: "Backlit films and display graphics designed for even illumination and strong retail visibility.", ratePerSqft: 165, sortOrder: 4 },
  { slug: "lamination", name: "Lamination", shortName: "Lamination", description: "Protective gloss, matte and textured overlamination to extend print life and refine its finish.", ratePerSqft: 35, sortOrder: 5 },
  { slug: "3d-printing", name: "3D printing", shortName: "3D print", description: "Custom printed dimensional letters, display forms and branded objects, quoted by projected area.", ratePerSqft: 520, sortOrder: 6 },
  { slug: "cutter", name: "Cutter services", shortName: "Cutter", description: "Precision contour cutting for decals, lettering, stencils and custom-shaped graphics.", ratePerSqft: 70, sortOrder: 7 },
  { slug: "exhibition-stall", name: "Exhibition stall design & build", shortName: "Exhibition stall", description: "Branded exhibition spaces planned, fabricated and installed for a confident show-floor presence.", ratePerSqft: 950, sortOrder: 8 },
];

const portfolio = [
  { brand: "Essilor", title: "A clearer kind of retail presence", category: "Retail graphics", summary: "A coordinated exhibition and retail presentation created for Essilor.", imageUrl: "/images/Essilor (1).png", featured: true, sortOrder: 1 },
  { brand: "Airtel", title: "Campaign colour, made visible", category: "Campaign printing", summary: "Campaign and display graphics developed for Airtel.", imageUrl: "/images/exhibition-graphics.svg", featured: true, sortOrder: 2 },
  { brand: "Lexar", title: "Product storytelling at the point of sale", category: "Display graphics", summary: "Retail display and branded presentation work for Lexar.", imageUrl: "/images/Lexar (1).png", featured: true, sortOrder: 3 },
  { brand: "Stall 1", title: "An exhibition space with presence", category: "Exhibition stall", summary: "Exhibition stall design and printed brand environment.", imageUrl: "/images/Stall 1 (1).jpeg", featured: true, sortOrder: 4 },
  { brand: "Stall 2", title: "A considered show-floor experience", category: "Exhibition stall", summary: "Exhibition stall planning, fabrication and visual graphics.", imageUrl: "/images/Stall 2 (1).jpeg", featured: true, sortOrder: 5 },
];

async function main() {
  for (const service of services) {
    const { ratePerSqft, ...data } = service;
    const existing = await prisma.service.findUnique({ where: { slug: service.slug }, select: { id: true } });
    if (existing) await prisma.service.update({ where: { id: existing.id }, data });
    else await prisma.service.create({ data: { ...data, ratePerSqft } });
  }
  for (const item of portfolio) {
    const id = `seed-${item.brand.toLowerCase()}`;
    const existing = await prisma.portfolioItem.findUnique({ where: { id }, select: { id: true } });
    if (existing) await prisma.portfolioItem.update({ where: { id }, data: item });
    else await prisma.portfolioItem.create({ data: { id, ...item } });
  }
}

main().finally(() => prisma.$disconnect());