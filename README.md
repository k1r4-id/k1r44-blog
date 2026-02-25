# K1r44 Blog & Portfolio

This is the personal portfolio and blog website for K1r44, built with React, TypeScript, and Material UI. It features a dynamic blog system powered by Markdown files.

## Features

- **Portfolio Showcase**: Display projects with details and links.
- **Dynamic Blog**: Blog posts are generated from Markdown files located in `src/content/posts`.
- **Markdown Support**: Full Markdown rendering with GFM (GitHub Flavored Markdown) support using `react-markdown` and `remark-gfm`.
- **Responsive Design**: Optimized for both desktop and mobile devices.
- **Dark/Light Mode**: Toggle between dark and light themes.
- **Search & Filter**: Search articles by keyword and filter by tags.
- **Pagination**: 9 articles per page with navigation controls.
- **Table of Contents**: Auto-generated sticky table of contents for blog posts.

## Tech Stack

- **Framework**: React (v18)
- **Language**: TypeScript
- **Styling**: Material UI (MUI), SCSS
- **Routing**: React Router DOM
- **Markdown Processing**:
  - `gray-matter`: Frontmatter parsing
  - `react-markdown`: Markdown rendering
  - `remark-gfm`: GitHub Flavored Markdown support
- **Build Tool**: React Scripts (Create React App)

## Project Structure

```
k1r44-blog/
├── public/                 # Static assets (images, attachments)
├── scripts/                # Build scripts
│   ├── generate-blog.js    # Generates blog metadata JSON from Markdown files
│   └── migrate-cpts.js     # Helper to migrate/clean notes
├── src/
│   ├── assets/             # Source assets
│   ├── components/         # React components
│   ├── content/
│   │   └── posts/          # Blog post Markdown files (*.md)
│   ├── data/               # Data files and generated JSON
│   ├── styles/             # Global styles
│   └── ...
└── ...
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/k1r4-id/k1r44-blog.git
   cd k1r44-blog
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

To start the development server:

```bash
npm start
```

This command automatically runs the `generate-blog` script to index all markdown posts before starting the React development server on `http://localhost:3000`.

### Building for Production

To create a production build:

```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

## Writing Blog Posts

1. Create a new `.md` file in `src/content/posts/`.
2. Add the required frontmatter at the top of the file:
   ```yaml
   ---
   title: "Your Post Title"
   date: "2024-03-20"
   description: "A brief description of the post."
   thumbnail: "/attachments/image.png"
   tags: ['tag1', 'tag2']
   draft: true
   ---
   ```
3. Write your content in Markdown.
4. The post will be automatically picked up when you run `npm start` or `npm run generate-blog`.

### Draft Notes
- During `npm start`, drafts are included so you can preview them.
- During `npm run build`, drafts are excluded from production.

## License

[MIT](LICENSE)
