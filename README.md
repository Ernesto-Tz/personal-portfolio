# **Magic Portfolio**

View the [demo here](https://ernesto-tzompantzi.com).

![Magic Portfolio](https://ernesto-tzompantzi.com/images/og/home.jpg)


# **Getting started**

Magic Portfolio is a modern portfolio website built with [Next.js](https://nextjs.org), [React](https://react.dev), [TypeScript](https://www.typescriptlang.org), [Tailwind CSS](https://tailwindcss.com), and [Sanity CMS](https://www.sanity.io). It requires Node.js v18.17+ and uses pnpm as the package manager.

**1. Clone the repository**
```bash
git clone https://github.com/Ernesto-Tz/magic-portfolio.git
cd magic-portfolio
```

**2. Install dependencies**
```bash
pnpm install
```

**3. Set up environment variables**

Create a `.env.local` file with your Sanity CMS credentials:
```
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=your_dataset
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
```

**4. Run dev server**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view your portfolio.

**5. Edit content**

Configure your portfolio in `src/app/resources/config.js` and manage content through the Sanity Studio at `/studio`.

# **Features**

## **Built with Modern Stack**
- Next.js 15 with App Router
- React 19
- TypeScript for type safety
- Tailwind CSS v4 for styling
- ShadCN/ui components
- Sanity CMS for content management

## **SEO & Analytics**
- Automatic open-graph and X image generation with next/og
- Automatic schema and metadata generation
- Vercel Analytics integration
- Dynamic sitemap generation

## **Design**
- Responsive layout optimized for all screen sizes
- Dark/Light theme switcher
- Smooth animations with Framer Motion
- Custom font stack: Fraunces, Instrument Sans, JetBrains Mono

## **Content Management**
- Sanity Studio integration for easy content editing
- Support for projects, sports/blog posts, gallery, and about page
- Social links management
- Password-protected routes for sensitive content

## **Developer Experience**
- Type-safe TypeScript configuration
- ESLint and Biome for code quality
- Structured folder organization
- Easy customization through config files

# **Customization**

### Colors & Theme
Edit the CSS variables in `src/app/globals.css` to customize the color scheme.

### Content
- Edit the Sanity schema files in `src/sanity/schemaTypes/`
- Access Sanity Studio at `/studio` to manage your content

### Configuration
Update `src/app/resources/config.js` for:
- Site metadata
- Font families
- Display options
- Navigation labels

# **Deployment**

This portfolio is optimized for deployment on [Vercel](https://vercel.com). Simply connect your GitHub repository to Vercel and your portfolio will be automatically deployed on every push to the main branch.

## **Deploy with Vercel**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FErnesto-Tz%2Fmagic-portfolio)

# **License**

MIT License - feel free to use this as a template for your own portfolio.
