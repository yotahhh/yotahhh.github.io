# AI Context & Development Guide

This file is intended to help AI coding assistants and developers quickly understand the project structure, tech stack, and conventions for Yves Spiri's portfolio website.

## Project Overview
- **Name:** Yves Spiri Portfolio
- **Purpose:** Personal portfolio showcasing Sound Design, Music, and Engineering work.
- **Tech Stack:**
  - **Framework:** React (Vite)
  - **Styling:** Tailwind CSS
  - **Animation:** Framer Motion
  - **Icons:** Lucide React
  - **Routing:** React Router DOM
  - **Deployment:** GitHub Pages (`gh-pages`)

## Project Structure
- **`src/`**: Source code root.
  - **`pages/`**: Main page components (`Home.jsx`, `Music.jsx`, `Film.jsx`, `Mixing.jsx`).
  - **`components/`**: Reusable UI components (e.g., `Navigation.jsx`, `GrainOverlay.jsx`).
  - **`data/`**: Static data files. **This is where content is managed.**
    - `projects.js`: Contains arrays for `musicProjects` and `filmProjects`. Edit this file to add/remove/update portfolio entries.
  - **`assets/`**: Source assets (if any, but images are primarily in `public/`).
  - **`styles/`**: Global styles or specific CSS modules if not using Tailwind directly.
  - `App.jsx`: Main application component with routing setup.
  - `main.jsx`: Entry point.
- **`public/`**: Static assets served directly.
  - **`images/`**: Project images, thumbnails, and other static media.
- **`dist/`**: Build output directory (generated).

## Key Workflows

### 1. Adding a New Project
To add a new project (Music or Film):
1.  **Add Assets:** Place any new images in `public/images/`.
2.  **Update Data:** Open `src/data/projects.js`.
3.  **Add Entry:** Add a new object to the `musicProjects` or `filmProjects` array.
    - **Structure:**
      ```javascript
      {
        id: "unique-id",
        title: "Project Title",
        description: "Description text...",
        image: "/images/filename.jpg", // Path relative to public/
        // Optional fields depending on type:
        embedUrl: "...", // For iframes (Bandcamp, Vimeo, etc.)
        status: "Work in Progress (Year)", // For ongoing projects
        credits: "...",
        tracks: "...",
        bandcampLink: "...",
      }
      ```

### 2. Development Commands
- **Start Dev Server:** `npm run dev` (Runs on `http://localhost:5173`)
- **Build:** `npm run build`
- **Deploy:** `npm run deploy` (Builds and pushes `dist` folder to `gh-pages` branch)

## Design System & Styling
- **Tailwind CSS:** Used for almost all styling.
- **Colors:** Defined in `tailwind.config.js` (primary, secondary, background, etc.).
- **Typography:** Font families are set in `tailwind.config.js` and imported in `index.html`.
- **Animations:** `framer-motion` is used for page transitions and element animations.

## Deployment
The site is hosted on GitHub Pages. The `gh-pages` package is used to deploy the `dist` folder to the `gh-pages` branch.
- **URL:** [https://yvesspiri.net/](https://yvesspiri.net/) (or GitHub Pages URL)

## Recent Updates (as of 2026)
- Added "Terminarch" film project (Work in Progress).
- Updated "About Me" text on the Home page to be in the first person.
- Added extraction of images/text from PDF dossiers for project entries.
