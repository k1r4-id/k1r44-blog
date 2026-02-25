const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const glob = require('glob');
const chokidar = require('chokidar');

const CONTENT_DIR = path.join(__dirname, '../src/content/posts');
const OUTPUT_FILE = path.join(__dirname, '../src/data/blogPosts.json');
const includeDrafts = process.env.GENERATE_INCLUDE_DRAFTS === '1';

// Ensure content directory exists
if (!fs.existsSync(CONTENT_DIR)) {
  console.log('Creating content directory...');
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
}

function generate() {
  const files = glob.sync('**/*.md', { cwd: CONTENT_DIR });
  const posts = files.map((file) => {
    const filePath = path.join(CONTENT_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    const slug = data.slug || file.replace(/\.md$/, '');

    let thumbnail = data.thumbnail || '';
    if (!thumbnail) {
      const imageMatch = content.match(/!\[.*?\]\((.*?)\)/);
      if (imageMatch) {
        thumbnail = imageMatch[1];
      }
    }

    return {
      slug,
      title: data.title || slug,
      date: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      tags: data.tags || [],
      description: data.description || '',
      thumbnail,
      content,
      ...data,
    };
  });

  const filtered = includeDrafts ? posts : posts.filter(p => p.draft !== true);
  const normalized = filtered.map(p => (p.lock === true ? { ...p, summary: '' } : p));
  normalized.sort((a, b) => new Date(b.date) - new Date(a.date));
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(normalized, null, 2));
  console.log(`Generated ${normalized.length} blog posts. Include drafts: ${includeDrafts}`);
}

generate();

if (process.env.WATCH === '1') {
  const watcher = chokidar.watch(CONTENT_DIR, {
    persistent: true,
    ignoreInitial: true,
  });
  watcher.on('add', generate)
    .on('change', generate)
    .on('unlink', generate);
  console.log(`Watching for changes in ${CONTENT_DIR}...`);
}
