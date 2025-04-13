# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- `npm run dev` - Start development server with turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Code Style
- TypeScript with strict mode
- Use functional React components with explicit typing
- File naming: kebab-case for files, PascalCase for components
- Use tailwind-merge utility `cn()` from @/lib/utils for className merging
- Import aliases: @/ for src/ directory
- Follow shadcn/ui "new-york" style conventions

## Architecture
- Next.js App Router structure
- Use React hooks pattern (prefix with "use")
- Leverage zod for validation
- Form handling with react-hook-form
- UI components from shadcn/ui
- Use CSS variables for theming