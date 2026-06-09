# R&D Therm — Backend API

Production-grade REST API for the R&D Therm website + CMS admin panel.

**Stack:** Node.js · Express · Prisma · MySQL · JWT · Multer · Nodemailer

## Setup

```bash
cd D:\rdtherm-api
npm install

# 1. Configure .env (DATABASE_URL points at the `rdtherm` MySQL database).
#    Default assumes XAMPP root with no password.

# 2. Create the schema
npx prisma migrate deploy      # or: npx prisma migrate dev

# 3. Seed: admin user + all CMS content + downloaded images
npm run seed

# 4. Run
npm run dev                    # http://localhost:4000  (nodemon)
# or
npm start
```

Seeded admin login: **admin@rdtherm.com / Admin@1234** (configurable in `.env`).

## Architecture

```
src/
├─ config/      env, prisma client (BigInt→string JSON)
├─ middleware/  auth (JWT), validate (custom, no Zod), rateLimit, errorHandler
├─ modules/
│  ├─ auth/         login, refresh (rotation), logout, logout-all, forgot/reset
│  ├─ crud.factory  generic CRUD: list/get/create/update/status/reorder/bulk-delete
│  ├─ resources     all content resources wired to the factory
│  ├─ settings/     site settings singleton + social + hours
│  ├─ activity/     dashboard audit feed
│  ├─ uploads/      multer file upload (type + size validated)
│  └─ public/       website-facing, published content only + contact form
├─ utils/       response envelope, tokens, mailer, sanitize-html, audit
├─ routes/      router mount
├─ app.js       express app (helmet, cors allowlist, compression, static /uploads)
└─ server.js    bootstrap + graceful shutdown
prisma/
├─ schema.prisma
├─ seedData.js  the dataset (mirrors the admin's content)
└─ seed.js      seeder + image downloader
```

## Security

JWT access + rotating refresh tokens (24h) · bcrypt password hashing · helmet ·
CORS allowlist · rate limiting (general / auth / public-write) · sanitize-html on
all rich text · centralized error handling · uniform response envelope.

## Response format

```jsonc
// success
{ "success": true, "data": { ... } }
// list
{ "success": true, "data": { "items": [...], "total": 7, "page": 1, "pageSize": 10, "totalPages": 1 } }
// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": { "field": "..." } } }
```

## Key endpoints

| Area | Endpoint |
| --- | --- |
| Auth | `POST /api/auth/login` · `/refresh` · `/logout` · `/logout-all` · `GET /me` · `POST /forgot-password` · `/reset-password` |
| Resources | `/api/{features,testimonials,industries,products,blogs,case-studies,faqs,team,logos,careers,leads}` |
| Per resource | `GET /` (search,filter,sort,paginate) · `GET /:id` · `POST /` · `PUT /:id` · `PATCH /:id/status` · `PATCH /reorder` · `POST /bulk-delete` · `DELETE /:id` |
| Settings | `GET/PUT /api/settings` |
| Activity | `GET /api/activity` |
| Uploads | `POST /api/uploads` (multipart `file`) → `{ url }` |
| Public (website) | `GET /api/public/{products,blogs,industries,...}` · `POST /api/public/leads` |

All `/api/*` resource routes require `Authorization: Bearer <accessToken>`.
`/api/public/*` is unauthenticated and returns only published content.
