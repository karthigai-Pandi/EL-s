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
  { brand: "Essilor", title: "A clearer kind of retail presence", category: "Retail graphics", summary: "Representative concept for coordinated storefront and in-store communication. Replace with approved project images and verified outcomes.", featured: true, sortOrder: 1 },
  { brand: "Airtel", title: "Campaign colour, made visible", category: "Campaign printing", summary: "Representative concept for high-impact campaign graphics. This is illustrative copy, not a claim of commissioned work.", featured: true, sortOrder: 2 },
  { brand: "Lexar", title: "Product storytelling at the point of sale", category: "Display graphics", summary: "Representative concept for retail display graphics. Replace with approved images and verified project details before publication.", featured: true, sortOrder: 3 },
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
    if (!await prisma.portfolioItem.findUnique({ where: { id }, select: { id: true } })) {
      await prisma.portfolioItem.create({ data: { id, ...item } });
    }
  }
}

main().finally(() => prisma.$disconnect());