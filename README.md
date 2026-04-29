# Ernesto Tzompantzi's Portfolio

A modern, fully-featured portfolio website showcasing frontend development work, projects, and insights.

**View live:** [ernesto-tzompantzi.com](https://ernesto-tzompantzi.com)

![Magic Portfolio](https://ernesto-tzompantzi.com/images/og/home.jpg)

## Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Components:** ShadCN/ui
- **CMS:** Sanity (headless content management)
- **Runtime:** Node.js 18.17+, pnpm
- **Deployment:** Vercel

## Features

- **Dynamic Content Management** — All projects, blog posts, and gallery images managed through Sanity Studio
- **SEO Optimized** — Automatic Open Graph image generation, schema markup, and dynamic sitemaps
- **Dark/Light Theme** — Built-in theme switcher with persistent preferences
- **Responsive Design** — Optimized for mobile, tablet, and desktop
- **Password-Protected Routes** — Optional protection for sensitive project details
- **Analytics** — Vercel Analytics integration for traffic insights
- **Type Safe** — Full TypeScript support with strict configuration
- **Performance Focused** — Fast load times, optimized images, smart code splitting

## Getting Started

### Prerequisites
- Node.js v18.17 or higher
- pnpm (recommended) or npm/yarn

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/Ernesto-Tz/personal-portfolio.git
cd personal-portfolio
```

**2. Install dependencies**
```bash
pnpm install
```

**3. Configure environment variables**

Create a `.env.local` file with your Sanity credentials:
```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
SANITY_API_TOKEN=your_api_token
SANITY_REVALIDATE_SECRET=your_secret_key
```

Get your Sanity credentials from [sanity.io](https://www.sanity.io)

**4. Start the development server**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── about/         # About page
│   ├── work/          # Project showcase
│   ├── sports/        # Blog/posts section
│   ├── gallery/       # Gallery page
│   ├── api/           # API routes
│   └── resources/     # Configuration
├── components/        # Reusable React components
├── sanity/           # Sanity schema definitions
└── lib/              # Utility functions
```

## Customization

### Site Configuration
Edit `src/app/resources/config.js` to customize:
- Site title and description
- Navigation labels
- Timezone and location display
- Font stack
- Theme options

### Design & Styling
- **Colors:** CSS variables in `src/app/globals.css`
- **Typography:** Font imports in `src/app/resources/config.js`
- **Components:** ShadCN/ui components in `src/components/ui/`

### Content Management
1. Access Sanity Studio at `/studio` (when running locally)
2. Manage projects, posts, and gallery images
3. Edit schema types in `src/sanity/schemaTypes/`

## Deployment

This portfolio is optimized for [Vercel](https://vercel.com):

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy — automatically triggered on every push to `main`

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Run production build
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript type checking
```

## License

CC BY-NC 4.0 — Attribution required for non-commercial use. For commercial use, please contact.

---

Built with care. Feel free to use this as inspiration for your own portfolio.
