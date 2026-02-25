const fs = require('fs');
const path = require('path');

const sourcePath = './data/blog/CPTS Notes.md';
const destPath = './src/content/posts/cpts-notes.md';

console.log(`Reading from ${sourcePath}...`);
if (!fs.existsSync(sourcePath)) {
    console.error('Source file not found!');
    process.exit(1);
}

const content = fs.readFileSync(sourcePath, 'utf8');

// Extract Frontmatter
const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
let frontmatter = '';
let body = '';

if (fmMatch) {
    frontmatter = fmMatch[1];
    body = content.substring(fmMatch[0].length);
} else {
    console.error('No frontmatter found');
    // If no frontmatter, assume all is body and create default frontmatter
    frontmatter = "title: 'CPTS Notes'\ndate: '2025-03-24'\ntags: ['notes']\ndraft: false\nsummary: 'CPTS Notes extracted from HTML'";
    body = content;
}

// Fix tags format if needed: tags: ['certification,notes'] -> tags: ['certification', 'notes']
frontmatter = frontmatter.replace(/tags: \['(.*?)'\]/, (match, p1) => {
    if (p1.includes(',') && !p1.includes("','")) {
        const tags = p1.split(',').map(t => `'${t.trim()}'`).join(', ');
        return `tags: [${tags}]`;
    }
    return match;
});

let markdownBody = '';

// Regex to capture Headers and Code blocks (pre>code)
// We use a global regex to find them in order
const tagRegex = /(<h([1-6])[^>]*>[\s\S]*?<\/h\2>)|(<pre[^>]*><code>[\s\S]*?<\/code><\/pre>)/gi;

let match;
const matches = [];
while ((match = tagRegex.exec(body)) !== null) {
    matches.push(match[0]);
}

console.log(`Found ${matches.length} content blocks.`);

// Helper to unescape HTML
function unescapeHtml(text) {
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

// Convert matches to markdown
const decodedMatches = matches.map(html => {
    if (html.toLowerCase().startsWith('<h')) {
        const levelMatch = html.match(/<h([1-6])/i);
        const level = levelMatch ? levelMatch[1] : 2;
        // Extract text, remove all tags
        let text = html.replace(/<[^>]+>/g, '').trim();
        return `\n${'#'.repeat(level)} ${text}\n`;
    } else if (html.toLowerCase().startsWith('<pre')) {
        // Extract code
        const codeMatch = html.match(/<code>([\s\S]*?)<\/code>/i);
        if (codeMatch) {
            let code = unescapeHtml(codeMatch[1]);
            return '```\n' + code + '\n```\n';
        }
    }
    return '';
});

markdownBody = decodedMatches.join('\n');

const newContent = `---\n${frontmatter}\n---\n\n${markdownBody}`;

const destDir = path.dirname(destPath);
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

fs.writeFileSync(destPath, newContent);
console.log(`Migrated to ${destPath}`);
