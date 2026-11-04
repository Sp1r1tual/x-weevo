# X-Weevo – Premium Clothing Store

**X-Weevo** is a modern, fast, and stylish online clothing store built with cutting-edge web technologies. It is designed to provide a premium shopping experience, combining beautiful aesthetics with uncompromised performance and reliability.

Explore our limited collections, find your perfect look, and enjoy a seamless journey from the catalog to checkout.

---

<p align="center">
  <img src="https://vzzjcgycihmvgklaahyv.supabase.co/storage/v1/object/public/Public/Promo/main-page-view.avif" alt="X-Weevo" />
</p>

---

## Why X-Weevo Stands Out?

**Premium Aesthetics & Dynamic Design**
A highly visual, responsive interface that feels alive. We prioritize rich aesthetics, curated color palettes, and subtle micro-animations that elevate the shopping experience.

**Seamless Internationalization (i18n)**
Built with a global audience in mind. X-Weevo supports multiple languages seamlessly (English & Ukrainian out of the box), adapting the UI and content instantly to the user's preference without reloading the page.

**Robust Authentication & Profiles**
Secure sign-in via Google OAuth powered by Auth.js. Users get access to a personalized dashboard, order history tracking, and favorite items list. Profile data is synced seamlessly across sessions.

**Lightning-Fast Data Fetching**
Powered by Next.js Server Components and Server Actions, ensuring instant page loads, excellent SEO out of the box, and a zero-JS feel where possible.

**Deep E-commerce Features**
A fully functional shopping cart, robust search capabilities, and detailed product filtering.

---

## Tech Stack

### Client & Core Framework

| Category       | Technology                                                                           |
| :------------- | :----------------------------------------------------------------------------------- |
| **Framework**  | [Next.js 16.2](https://nextjs.org/) (App Router, Server Actions, Server Components)  |
| **UI Library** | [React 19](https://react.dev/) with React Compiler                                   |
| **State**      | [Zustand 5](https://zustand-demo.pmnd.rs/) – lightweight global state management     |
| **i18n**       | [next-intl](https://next-intl-docs.vercel.app/) – internationalization               |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) – dynamic, buttery-smooth animations |
| **Forms**      | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) validation |
| **Styling**    | Vanilla CSS / CSS Modules                                                            |
| **Language**   | TypeScript 5                                                                         |

### Server, Database & API

| Category       | Technology                                                                     |
| :------------- | :----------------------------------------------------------------------------- |
| **Database**   | [PostgreSQL (Supabase)](https://supabase.com/)                                 |
| **ORM**        | [Prisma 7](https://www.prisma.io/) with `@prisma/adapter-pg`                   |
| **Auth**       | [Auth.js v5 (Next-Auth)](https://authjs.dev/) – Google OAuth & secure sessions |
| **Validation** | [Zod 4](https://zod.dev/) – end-to-end type-safe validation                    |

### DevOps & Code Quality

| Category        | Technology                                                                      |
| :-------------- | :------------------------------------------------------------------------------ |
| **Git Hooks**   | [Husky](https://typicode.github.io/husky/) – pre-commit automation              |
| **Lint Staged** | [lint-staged](https://github.com/lint-staged/lint-staged) – incremental linting |
| **Linting**     | ESLint 9 + Prettier (with `@trivago/prettier-plugin-sort-imports`)              |
| **Unused Code** | [knip](https://knip.dev/) – dead export & dependency detection                  |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **Yarn** (package manager)
- **Supabase** account / PostgreSQL Database

### 1. Clone & Install

```bash
git clone https://github.com/Sp1r1tual/x-weevo.git
cd x-weevo

# Install dependencies
yarn install
```

### 2. Configure Environment

Copy the example `.env` file to set up your environment variables:

```bash
cp .env.example .env
```

Open `.env` and fill in the values:

- `AUTH_SECRET` (generate with `npx auth secret`)
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` (Google OAuth credentials)
- `DATABASE_URL` (Connection pooler URL for runtime queries - usually port 6543)
- `DIRECT_URL` (Direct connection for Prisma migrations - usually port 5432)
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (server-only, used for admin image uploads)
- `NEXT_PUBLIC_SITE_URL`

The database must be reachable during `yarn build`, because the sitemap is generated from it.

### 3. Database Setup

Apply the migrations and seed the base categories:

```bash
yarn prisma:migrate
yarn prisma:seed
```

Optionally, fill the store with demo products (photos from [Unsplash](https://unsplash.com)):

```bash
yarn prisma:seed:demo
```

To access the admin panel at `/admin`, sign in once and then set your user's `role` to `ADMIN` in Prisma Studio.

_Optional: Open Prisma Studio to view and edit your database via UI:_

```bash
yarn prisma:studio
```

### 4. Run in Development

Start the Next.js development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command                 | Description                                 |
| :---------------------- | :------------------------------------------ |
| `yarn dev`              | Start the development server                |
| `yarn build`            | Create an optimized production build        |
| `yarn start`            | Start the production server                 |
| `yarn lint`             | Run ESLint to check for code issues         |
| `yarn format`           | Format code using Prettier                  |
| `yarn knip`             | Detect unused code, files, and dependencies |
| `yarn prisma:migrate`   | Run Prisma migrations to update DB schema   |
| `yarn prisma:generate`  | Generate the Prisma client for type safety  |
| `yarn prisma:seed`      | Seed the base categories                    |
| `yarn prisma:seed:demo` | Add demo products (`--remove` deletes them) |
| `yarn prisma:studio`    | Open Prisma Studio database UI              |

---

## License

This project is licensed under the License – see the [LICENCE](./LICENCE) file for details.
