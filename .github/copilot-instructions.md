# EL's Studio

- Application: Next.js App Router, TypeScript, PostgreSQL, Prisma.
- Keep payment amounts server-calculated from current database rates. Never trust a browser-provided amount.
- Keep admin and payment secrets server-only. Validate uploaded file metadata and retain uploads in a private S3-compatible bucket.
- Orders and case studies must describe real work accurately; seeded portfolio copy is explicitly representative until verified.
- Run `npm run typecheck`, `npm run db:generate`, and `npm run build` after changes.