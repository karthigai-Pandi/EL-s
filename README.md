# EL's Studio

EL's Studio is split into two independently deployable applications in this repository:

- **Frontend (`/`)**: Next.js App Router, React, TypeScript. Deploy the repository root to Vercel.
- **Backend (`/backend`)**: Express 5, TypeScript, Prisma, PostgreSQL. Deploy the `backend` directory as a Render Web Service.

The Sony India homepage is used only as a high-level layout reference: compact black navigation, broad campaign hero, announcement band, featured service browsing, and gallery/promotional sections. EL's Studio uses original copy and does not reuse Sony trademarks or assets. Service rates are representative INR estimates. Portfolio concepts are illustrative, not claims of commissioned work.

## Local Development

Requirements: Node.js 22.x, npm, PostgreSQL 14+, and S3-compatible private object storage to test artwork uploads. Razorpay test credentials are needed to run checkout end to end.

1. Start PostgreSQL and create an empty `els_studio` database.
2. In `backend`, copy `.env.example` to `.env`. Set `DATABASE_URL`, `ADMIN_TOKEN` (at least 24 characters), Razorpay test credentials, private bucket credentials, and `FRONTEND_ORIGINS=http://localhost:3000`.
3. Initialize and run the API:

   ```sh
   cd backend
   npm install
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

   Health check: `http://localhost:4000/health`.

4. In a second terminal at the repository root, copy `.env.example` to `.env`, then run:

   ```sh
   npm install
   npm run dev
   ```

5. Open `http://localhost:3000`. If the API is offline, the storefront displays its local fallback catalogue; ordering, admin data and live catalogue updates require the API.

## Deploy Backend To Render

1. Push this repository to GitHub and create a Render **Web Service** from it. Set **Root Directory** to `backend`. For an already-created service, update this setting in **Settings → Build & Deploy → Root Directory** and save it; a root-level deployment will run the Next.js frontend and fail to build the API. The backend `.node-version` and `backend/package.json` pin the service to Node 22.x.
2. Set **Build Command** to `npm install && npm run db:generate && npm run build`.
3. Set **Start Command** to `npm run db:migrate && npm start`.
4. Attach a Render PostgreSQL database and set `DATABASE_URL` to its internal connection string.
5. Add the variables from `backend/.env.example`: `NODE_ENV=production`, `ADMIN_TOKEN`, `FRONTEND_ORIGINS`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and optional `S3_ENDPOINT`. Set `FRONTEND_ORIGINS` to the exact Vercel production URL and intended preview origins. Do not set `NODE_ENV` to `development`, `dev`, or another non-standard value on Render.
6. After the first deploy, run `npm run db:seed` once from Render Shell. The seed does not overwrite existing prices or portfolio copy.
7. Verify `https://YOUR-RENDER-SERVICE.onrender.com/health` returns `{"status":"ok","service":"els-studio-api"}`.
8. Configure Razorpay's webhook URL as `https://YOUR-RENDER-SERVICE.onrender.com/api/payments/webhook`, subscribe to `payment.captured` and `payment.failed`, and set the signing secret as `RAZORPAY_WEBHOOK_SECRET`.

`render.yaml` contains the service root and build/start commands. You still need to attach a managed PostgreSQL database and provide secrets in the Render dashboard.

The S3-compatible artwork bucket must stay private. Configure bucket CORS to permit `PUT` from the Vercel origin and the `Content-Type` request header. Upload and admin download links expire after five minutes. Razorpay hosted checkout handles UPI, RuPay/cards, net banking and supported wallet methods; Google Pay availability depends on the customer's UPI app and device.

## Deploy Frontend To Vercel

1. Import the same GitHub repository into Vercel and leave **Root Directory** at the repository root, not `backend`.
2. The checked-in `vercel.json` selects the Next.js framework and `.next` output. In Project Settings, clear any manually configured `dist` output directory (or set it to `.next`). Build command: `npm run build`.
3. Set `NEXT_PUBLIC_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com` and `API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com` for Production and Preview as appropriate. Redeploy after setting these values; `NEXT_PUBLIC_*` is embedded into the browser bundle at build time.
4. Add the exact Vercel URL to Render's `FRONTEND_ORIGINS` and redeploy the backend if changed.
5. Test the storefront, `GET /health`, `GET /api/services`, and an order lookup in each deployed environment.

## API And Environment

Frontend variables are in the root `.env.example`. Database, payment, storage and admin secrets are in `backend/.env.example` and belong only in Render's environment settings in production. Never put secrets in `NEXT_PUBLIC_*` variables.

The API exposes `GET /health`, `GET /api/services`, `GET /api/portfolio`, `POST /api/uploads/presign`, `POST /api/orders`, `POST /api/payments/verify`, `POST /api/payments/webhook`, `GET /api/orders/:orderNumber`, and token-protected routes under `/api/admin`.

Order totals use current database rates and are snapshotted at creation. Artwork is validated by extension, MIME type and size before presigning; payment creation and signature verification happen on the server. Webhook event IDs are stored uniquely for retry safety. Test the full payment, webhook, storage permissions, admin workflow and fulfilment process before using live credentials.

The hero, vinyl print, one-way vision, and exhibition graphics in `public/images/` are original SVG concepts. The catalog PDF was not present as a file in the workspace when this update was made, so these visuals are not exact catalog reproductions. Replace them with approved, high-resolution catalog and branding artwork when those source files are available. Also replace the sample `hello@elsstudio.in` address and use only verified, authorized client case studies before public launch.