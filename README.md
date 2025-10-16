# Umaru Creative Website

A modern, multi-language website for Umaru Creative web design studio, built with Astro and featuring beautiful animations and responsive design.

## 🚀 Project Structure

```
/
├── public/
│   ├── favicon.svg
│   └── Logo-dango-only.svg
├── src/
│   ├── components/
│   │   ├── Header.astro              # Navigation with language switcher
│   │   ├── EnhancedHero.astro        # ✨ NEW: Hero with animations & glass sections
│   │   ├── NewHero.astro             # 📦 LEGACY: Original hero component
│   │   ├── Hero.astro                # 📦 LEGACY: Basic hero component
│   │   ├── NewAbout.astro            # ✅ ACTIVE: About section
│   │   ├── About.astro               # 📦 LEGACY: Original about
│   │   ├── NewWhy.astro              # ✅ ACTIVE: Why section
│   │   ├── Why.astro                 # 📦 LEGACY: Original why
│   │   ├── NewHowIWork.astro         # ✅ ACTIVE: Process section
│   │   ├── HowIWork.astro            # 📦 LEGACY: Original process
│   │   ├── NewWhoIWorkWith.astro     # ✅ ACTIVE: Clients section
│   │   ├── WhoIWorkWith.astro        # 📦 LEGACY: Original clients
│   │   ├── NewContact.astro          # ✅ ACTIVE: Contact section
│   │   ├── Contact.astro             # 📦 LEGACY: Original contact
│   │   ├── NewFooter.astro           # ✅ ACTIVE: Footer with animations
│   │   ├── Footer.astro              # 📦 LEGACY: Original footer
│   │   ├── MyCreations.astro         # ✅ ACTIVE: Portfolio showcase
│   │   ├── PricingSection.astro      # ✅ ACTIVE: Pricing tables
│   │   ├── ServiceHero.astro         # ✅ ACTIVE: Service page hero
│   │   ├── TestimonialsSection.astro # ✅ ACTIVE: Client testimonials
│   │   ├── FAQSection.astro          # ✅ ACTIVE: FAQ with toggles
│   │   ├── LoadingSpinner.astro      # ✅ ACTIVE: Loading animation
│   │   └── ...
│   ├── content/
│   │   ├── articles/                 # Blog articles
│   │   └── config.ts                 # Content collections config
│   ├── layouts/
│   │   └── Layout.astro              # Base layout with lang support
│   ├── pages/
│   │   ├── en/                       # English pages
│   │   │   ├── index.astro           # ✅ ACTIVE: English homepage
│   │   │   ├── contact.astro         # ✅ ACTIVE: Contact page
│   │   │   ├── articles/             # Blog pages
│   │   │   └── services/             # Service pages
│   │   ├── fi/index.astro            # ✅ ACTIVE: Finnish homepage
│   │   ├── sv/index.astro            # ✅ ACTIVE: Swedish homepage
│   │   ├── fr/index.astro            # ✅ ACTIVE: French homepage
│   │   ├── no/index.astro            # ✅ ACTIVE: Norwegian homepage
│   │   └── index.astro               # 📦 LEGACY: Original homepage
│   └── middleware.ts                 # Route redirects
├── astro.config.mjs                  # Astro configuration
├── tailwind.config.mjs               # Tailwind with blog image styling
└── package.json
```

## 🎨 Component Status

### ✅ Active Components (Currently Used)
- **EnhancedHero.astro**: New hero with line-by-line text animation, floating logos, and glass liquid sections
- **New*.astro**: All "New" prefixed components are the current active versions
- **Service components**: PricingSection, ServiceHero, TestimonialsSection, FAQSection
- **Interactive components**: LoadingSpinner, Header with language switcher

### 📦 Legacy Components (Kept for Reference)
- **Hero.astro**: Original basic hero
- **About.astro, Why.astro, etc.**: Original versions without "New" prefix
- These are maintained for fallback but not actively used

## 🌍 Multi-Language Setup

- **English**: `/en/` (full site with all pages)
- **Finnish**: `/fi/` (homepage only, hardcoded content)
- **Swedish**: `/sv/` (homepage only, hardcoded content)  
- **French**: `/fr/` (homepage only, hardcoded content)
- **Norwegian**: `/no/` (homepage only, hardcoded content)

Language switching uses localStorage and proper HTML lang attributes for SEO.

## ✨ New Features

### Enhanced Hero Section
- Line-by-line text fade-in with 0.5s delays
- Animated logo characters that "run" between positions
- Glass liquid section with 4 business type highlights
- Floating animations and backdrop blur effects

### Header Improvements
- Logo SVG added to navbar
- Working language dropdown with proper toggle
- Mobile menu with close "X" button
- localStorage language persistence

### Blog Image Styling
- Moved from Layout.astro to tailwind.config.mjs
- Max-width: 700px, centered, rounded corners
- Consistent styling across all blog posts

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 Configuration Notes

- **Base URL**: Currently set to `/` for GitHub Pages
- **Output**: Builds to `docs/` directory for GitHub Pages
- **Blog URLs**: Fixed double language code issue
- **Responsive**: Mobile-first design with proper breakpoints
- **Animations**: GSAP with ScrollTrigger for smooth effects

## 🎯 Ready for Deployment

The site is ready for deployment to GitHub Pages or can be easily adapted for other hosting by changing the base URL in `astro.config.mjs`.