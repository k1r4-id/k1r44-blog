import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { styled } from '@mui/material/styles';
import { blogPosts, BlogPost } from '../data/blogPosts';
import '../assets/styles/Main.scss';

type ImgProps = { src?: string; alt?: string };

function getLanguageFromClass(className: string): string {
  const m = /language-([\w+-]+)/.exec(className || '');
  return m ? m[1] : 'text';
}

const CATEGORY_COLORS: Record<string, string> = {
  shell: '#00aaff',
  markup: '#ff8f3d',
  web: '#ffd166',
  scripting: '#9db4ff',
  data: '#7bd88f',
  database: '#2ec4b6',
  backend: '#e67e22',
  system: '#00aaff',
  devops: '#00a1ff',
  style: '#ff69b4',
  default: '#9bdcff',
};

const LANGUAGE_CATEGORY: Record<string, string> = {
  bash: 'shell',
  sh: 'shell',
  shell: 'shell',
  zsh: 'shell',
  powershell: 'shell',
  xml: 'markup',
  html: 'markup',
  svg: 'markup',
  css: 'style',
  scss: 'style',
  less: 'style',
  javascript: 'web',
  js: 'web',
  typescript: 'web',
  ts: 'web',
  tsx: 'web',
  jsx: 'web',
  json: 'data',
  yaml: 'data',
  yml: 'data',
  toml: 'data',
  ini: 'data',
  python: 'scripting',
  py: 'scripting',
  ruby: 'scripting',
  rb: 'scripting',
  php: 'backend',
  go: 'system',
  rust: 'system',
  rs: 'system',
  c: 'system',
  cpp: 'system',
  java: 'backend',
  kotlin: 'backend',
  kt: 'backend',
  sql: 'database',
  postgres: 'database',
  mysql: 'database',
  docker: 'devops',
  dockerfile: 'devops',
  makefile: 'devops',
  terraform: 'devops',
  tf: 'devops',
  text: 'default',
};

function getCategoryAccent(lang: string): string {
  const l = (lang || '').toLowerCase();
  const cat = LANGUAGE_CATEGORY[l] || 'default';
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;
}

function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  }
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightCodeHTML(codeText: string, lang: string, accent: string): string {
  const kw = (list: string[]) => new RegExp(`\\b(${list.join('|')})\\b`, 'g');
  const esc = escapeHtml(codeText);
  const keywordColor = '#89b4fa';
  const stringColor = '#a6e3a1';
  const numberColor = '#f8bd96';
  const commentColor = '#8b949e';
  const attrColor = '#f2cdcd';
  const boolColor = '#cba6f7';
  let out = esc;
  const tokens: { style: string; text: string }[] = [];
  const apply = (regex: RegExp, style: string) => {
    out = out.replace(regex, (m) => {
      const idx = tokens.length;
      tokens.push({ style, text: m });
      return `\x00T${idx}T\x00`;
    });
  };
  const l = (lang || '').toLowerCase();
  if (['js', 'javascript', 'ts', 'typescript', 'tsx', 'jsx'].includes(l)) {
    apply(/(\/\/.*?$)/gm, `color:${commentColor}`);
    apply(/\/\*[\s\S]*?\*\//g, `color:${commentColor}`);
    apply(/(["'`])(?:\\.|(?!\1).)*\1/g, `color:${stringColor}`);
    apply(kw(['const','let','var','function','return','if','else','for','while','switch','case','break','continue','new','class','extends','import','export','try','catch','finally','throw','await','async']), `color:${keywordColor};font-weight:600`);
    apply(/\b\d+(?:\.\d+)?\b/g, `color:${numberColor}`);
    apply(/\b(true|false|null|undefined)\b/g, `color:${boolColor};font-weight:600`);
  } else if (['py', 'python'].includes(l)) {
    apply(/(#.*?$)/gm, `color:${commentColor}`);
    apply(/(['"]){3}[\s\S]*?\1{3}/g, `color:${stringColor}`);
    apply(/(["'])[^"'\n]*\1/g, `color:${stringColor}`);
    apply(kw(['def','class','return','if','elif','else','for','while','try','except','finally','import','from','as','pass','raise','with','lambda','yield','global','nonlocal']), `color:${keywordColor};font-weight:600`);
    apply(/\b\d+(?:\.\d+)?\b/g, `color:${numberColor}`);
    apply(/\b(True|False|None)\b/g, `color:${boolColor};font-weight:600`);
  } else if (['bash','sh','shell','zsh','powershell'].includes(l)) {
    apply(/(^|\s)#.*$/gm, `color:${commentColor}`);
    apply(/(["'])[^"']*\1/g, `color:${stringColor}`);
    apply(/\$\{?[A-Za-z_][A-Za-z0-9_]*\}?/g, `color:${attrColor}`);
    apply(kw(['if','then','else','fi','for','do','done','case','esac','function','in']), `color:${keywordColor};font-weight:600`);
    apply(/\b\d+(?:\.\d+)?\b/g, `color:${numberColor}`);
    const lines = out.split('\n');
    const promptRegex = /^(\s*)((?:[A-Za-z0-9_.-]+@[A-Za-z0-9_.-]+:[^$#%\s]+)?\s*[$#%])\s?/;
    out = lines.map((line) => {
      const m = promptRegex.exec(line);
      if (m) {
        const pre = m[1] || '';
        const prompt = m[2] || '';
        const rest = line.slice(m[0].length);
        return `${pre}<span style="color:${accent};font-weight:700">${prompt}</span>${rest}`;
      }
      return `<span style="opacity:0.85">${line}</span>`;
    }).join('\n');
  } else if (['sql','postgres','mysql'].includes(l)) {
    apply(/(--.*?$)/gm, `color:${commentColor}`);
    apply(/\/\*[\s\S]*?\*\//g, `color:${commentColor}`);
    apply(/'[^']*'/g, `color:${stringColor}`);
    apply(kw(['select','insert','update','delete','create','drop','alter','table','database','where','join','left','right','inner','outer','on','group','order','by','limit','offset','values','into','from']), `color:${keywordColor};font-weight:600`);
    apply(/\b\d+(?:\.\d+)?\b/g, `color:${numberColor}`);
  } else if (['xml','html','svg'].includes(l)) {
    apply(/&lt;!--[\s\S]*?--&gt;/g, `color:${commentColor}`);
    out = out.replace(
      /(&lt;\/?)([A-Za-z0-9:_-]+)([^&]*?)(\/?&gt;)/g,
      (m: string) =>
        m
          .replace(/(&lt;\/?)([A-Za-z0-9:_-]+)/, (_a: string, a: string, b: string) => {
            return `${a}<span style="color:${keywordColor};font-weight:600">${b}</span>`;
          })
          .replace(/([A-Za-z_:][-A-Za-z0-9_:.]*)(=)/g, (_mm: string, name: string, eq: string) => {
            return `<span style="color:${attrColor}">${name}</span>${eq}`;
          })
    );
    apply(/"[^"]*"|'[^']*'/g, `color:${stringColor}`);
  } else if (['json','yaml','yml','toml','ini'].includes(l)) {
    apply(/"([^"]+)"\s*(?=:)/g, `color:${keywordColor};font-weight:600`);
    apply(/:\s*"[^"]*"/g, `color:${stringColor}`);
    apply(/\b(true|false|null)\b/g, `color:${boolColor};font-weight:600`);
    apply(/\b\d+(?:\.\d+)?\b/g, `color:${numberColor}`);
  } else {
    apply(/(["'])[^"']*\1/g, `color:${stringColor}`);
    apply(/\b\d+(?:\.\d+)?\b/g, `color:${numberColor}`);
  }
  out = out.replace(/\x00T(\d+)T\x00/g, (_, idx) => {
    const t = tokens[parseInt(idx)];
    return `<span style="${t.style}">${t.text}</span>`;
  });
  return out;
}

const DetailSection = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(12, 4, 6),
  maxWidth: '1200px',
  margin: '0 auto',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(10, 2, 4),
  },
}));



// removed tag chip (unused)

const ContentContainer = styled(Box)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.87)',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
  '& img': {
    maxWidth: '100%',
    borderRadius: '8px',
    margin: `${theme.spacing(2)} auto`,
    display: 'block',
  },
  '& video': {
    maxWidth: '100%',
    borderRadius: '8px',
    margin: `${theme.spacing(2)} auto`,
    display: 'block',
    backgroundColor: '#0f0f10',
  },
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(2),
    color: '#ffffff',
    fontWeight: 700,
  },
  '& p': {
    marginBottom: theme.spacing(2),
    lineHeight: 1.7,
    color: 'rgba(255, 255, 255, 0.87)',
  },
  '& strong': {
    color: '#ffffff',
    fontWeight: 700,
  },
  '& li': {
    color: 'rgba(255, 255, 255, 0.87)',
    marginBottom: theme.spacing(1),
    lineHeight: 1.6,
  },
  '& code': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
  },
  '& pre': {
    backgroundColor: '#1e1e1e',
    padding: theme.spacing(2),
    borderRadius: '8px',
    overflowX: 'auto',
    '& code': {
      backgroundColor: 'transparent',
      padding: 0,
    },
  },
  '& blockquote': {
    borderLeft: '4px solid #00f3ff',
    margin: theme.spacing(2, 0),
    padding: theme.spacing(1, 2),
    backgroundColor: 'rgba(0, 243, 255, 0.05)',
    borderRadius: '0 8px 8px 0',
  },
  '& a': {
    color: '#00f3ff',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
}));

const ContentLayout = styled(Box)(({ theme }) => ({
  display: 'block',
  [theme.breakpoints.up('md')]: {
    display: 'grid',
    gridTemplateColumns: '300px minmax(0, 1fr)',
    gap: theme.spacing(4),
    alignItems: 'start',
  },
}));

const BreadcrumbsRow = styled(Box)(({ theme }) => ({
  color: '#9bdcff',
  fontSize: '0.9rem',
  marginBottom: theme.spacing(1),
  '& a': {
    color: '#9bdcff',
    textDecoration: 'none',
  }
}));

const AuthorRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  color: 'rgba(255,255,255,0.8)',
  marginBottom: theme.spacing(2),
}));

const HeroBox = styled(Box)(() => ({
  position: 'relative',
  borderRadius: '12px',
  overflow: 'hidden',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 60%)',
  }
}));

// removed banner card (replaced by hero overlay)

const RightSidebar = styled(Box)(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.up('md')]: {
    display: 'block',
    position: 'sticky',
    top: theme.spacing(12),
    width: 300,
  },
}));

const TocContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: '8px',
  background: '#151515',
  border: '1px solid rgba(255,255,255,0.08)',
}));

const CodeBlockContainer = styled(Box)(({ theme }) => ({
  borderRadius: '12px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 100%)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 10px 20px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(0, 243, 255, 0.08)',
  overflow: 'hidden',
  margin: theme.spacing(2, 0),
}));

const CodeHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1.25, 2),
  background: 'linear-gradient(90deg, rgba(0, 243, 255, 0.08), rgba(0, 243, 255, 0.02))',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
}));

const CodeLang = styled(Typography)(() => ({
  fontSize: '0.85rem',
  color: '#9bdcff',
  letterSpacing: '0.02em',
  fontWeight: 600,
}));

const CodeContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  background: '#0f0f10',
  '& pre': {
    margin: 0,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '0.9rem',
    lineHeight: 1.7,
    color: 'rgba(255,255,255,0.95)',
    overflowX: 'auto',
    whiteSpace: 'pre',
  },
}));

const BackButton = styled(Button)(({ theme }) => ({
  color: '#fff',
  textTransform: 'none',
  fontSize: '1rem',
  padding: theme.spacing(1, 2),
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  '& .MuiSvgIcon-root': {
    color: '#fff',
  },
}));

const MobileTocBox = styled(Box)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(4),
  display: 'block',
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [activeId, setActiveId] = useState<string>('');
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [heroVariants, setHeroVariants] = useState<string[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroSrc, setHeroSrc] = useState('');
  const toAbs = (base: string, rel: string) =>
    /^https?:\/\//i.test(rel) ? rel : (rel.startsWith('/') ? `${base}${rel}` : `${base}/${rel}`);
  const onHeroError = () => {
    const next = heroIndex + 1;
    if (next < heroVariants.length) {
      setHeroIndex(next);
      {
        const rel = heroVariants[next];
        const proto = window.location.protocol || 'https:';
        const host = window.location.host || 'localhost:3000';
        const hostname = window.location.hostname || 'localhost';
        const isDev = hostname === 'localhost';
        const apex = hostname.replace(/^www\./, '');
        const base = isDev ? `${proto}//${host}` : `${proto}//${apex}`;
        setHeroSrc(toAbs(base, rel));
      }
    } else {
      const proto = window.location.protocol || 'https:';
      const host = window.location.host || 'localhost:3000';
      const hostname = window.location.hostname || 'localhost';
      const isDev = hostname === 'localhost';
      const apex = hostname.replace(/^www\./, '');
      const base = isDev ? `${proto}//${host}` : `${proto}//${apex}`;
      setHeroSrc(toAbs(base, '/attachments/blog.png'));
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const foundPost = blogPosts.find((p) => p.slug === slug);
    if (foundPost) {
      setPost(foundPost);
    }
  }, [slug]);
  useEffect(() => {
    if (!post || !post.thumbnail) {
      setHeroVariants([]);
      setHeroSrc('');
      setHeroIndex(0);
      return;
    }
    const u = String(post.thumbnail || '');
    const proto = window.location.protocol || 'https:';
    const host = window.location.host || 'localhost:3000';
    const hostname = window.location.hostname || 'localhost';
    const isDev = hostname === 'localhost';
    const apex = hostname.replace(/^www\./, '');
    const base = isDev ? `${proto}//${host}` : `${proto}//${apex}`;
    const i = u.lastIndexOf('/');
    let vars: string[] = [u];
    if (i >= 0) {
      const dir = u.slice(0, i + 1);
      const file = u.slice(i + 1);
      const dot = file.lastIndexOf('.');
      if (dot >= 0) {
        const name = file.slice(0, dot);
        const ext = file.slice(dot);
        const lower = `${dir}${name.toLowerCase()}${ext}`;
        const upperFirst = `${dir}${name.charAt(0).toUpperCase()}${name.slice(1).toLowerCase()}${ext}`;
        vars = Array.from(new Set([u, lower, upperFirst]));
      }
    }
    setHeroVariants(vars);
    setHeroIndex(0);
    setHeroSrc(toAbs(base, vars[0] || u));
  }, [post]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - (window.innerWidth < 768 ? 80 : 100);
    window.scrollTo({ top: y, behavior: 'smooth' });
    setActiveId(id);
    window.history.replaceState(null, '', `#${id}`);
  };

  const readingTime = useMemo(() => {
    if (!post) return '';
    const words = post.content.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min read`;
  }, [post]);

  useEffect(() => {
    if (!contentRef.current) return;
    const headings = contentRef.current.querySelectorAll('h1, h2, h3');
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top > b.boundingClientRect.top ? 1 : -1));
        if (visible.length > 0) {
          const id = visible[0].target.id;
          if (id) setActiveId(id);
        }
      },
      { rootMargin: '0px 0px -70% 0px', threshold: [0, 1] }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [post]);

  const headings = useMemo(() => {
    if (!post) return [];
    const lines = post.content.split('\n');
    const hs: { level: number; text: string; id: string }[] = [];
    lines.forEach((line) => {
      const match = /^(#{1,6})\s+(.*)/.exec(line);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = slugify(text);
        hs.push({ level, text, id });
      }
    });
    return hs.slice(0, 20);
  }, [post]);

  const contentToRender = useMemo(() => {
    if (!post) return '';
    if (!post.thumbnail) return post.content;
    const lines = post.content.split('\n');
    const idx = lines.findIndex((l) => /!\[.*\]\(([^)]+)\)/.test(l));
    if (idx !== -1) {
      const match = /!\[.*\]\(([^)]+)\)/.exec(lines[idx]);
      const firstImageUrl = match ? match[1].trim() : '';
      const normalize = (url: string) => url.replace(/\/+$/, '');
      if (firstImageUrl && normalize(firstImageUrl) === normalize(post.thumbnail)) {
        const filtered = [...lines.slice(0, idx), ...lines.slice(idx + 1)];
        return filtered.join('\n');
      }
    }
    return post.content;
  }, [post]);

  // excerpt removed (not displayed)

  const MarkdownImage: React.FC<ImgProps> = ({ src, alt }) => {
    const s = String(src || '');
    const [useVideo, setUseVideo] = React.useState(true);
    const ext = s.split('.').pop()?.toLowerCase() || '';
    if (ext === 'gif') {
      const mp4 = s.replace(/\.gif(?:\?.*)?$/i, '.mp4');
      const webm = s.replace(/\.gif(?:\?.*)?$/i, '.webm');
      return (
        <>
          {useVideo ? (
            <video
              playsInline
              muted
              loop
              autoPlay
              controls={false}
              poster={s}
              onError={() => setUseVideo(false)}
              onCanPlay={() => setUseVideo(true)}
            >
              <source src={webm} type="video/webm" />
              <source src={mp4} type="video/mp4" />
            </video>
          ) : (
            <img
              src={s}
              alt={String(alt || '')}
              loading="lazy"
              decoding="async"
            />
          )}
        </>
      );
    }
    return (
      <img
        src={s}
        alt={String(alt || '')}
        loading="lazy"
        decoding="async"
      />
    );
  };

  if (!post) {
    return (
      <DetailSection>
        <Typography variant="h4" gutterBottom>
          Article not found
        </Typography>
        <BackButton
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          variant="outlined"
          sx={{ mt: 2, borderColor: 'rgba(255,255,255,0.5)' }}
        >
          Back to Home
        </BackButton>
      </DetailSection>
    );
  }

  if (post.lock === true) {
    return (
      <DetailSection>
        <Typography variant="h4" gutterBottom>
          Artikel terkunci
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
          Tulisan ini belum dapat diakses karena challenge belum boleh dipublikasikan.
        </Typography>
        <BackButton
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          variant="outlined"
          sx={{ mt: 2, borderColor: 'rgba(255,255,255,0.5)' }}
        >
          Kembali ke Home
        </BackButton>
      </DetailSection>
    );
  }

  return (
    <DetailSection>
      <BackButton
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ mb: 4 }}
      >
        Back to Home
      </BackButton>

      {post.thumbnail && (
        <HeroBox
          sx={{
            minHeight: { xs: 260, md: 420 },
            mb: 3,
            backgroundSize: 'cover',
            backgroundPosition: { xs: 'center 75%', md: 'center 55%' },
          }}
        >
          <Box
            component="img"
            src={heroSrc}
            onError={onHeroError}
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: { xs: 'center 75%', md: 'center 55%' }
            }}
          />
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              maxWidth: '1200px',
              mx: 'auto',
              px: { xs: 2, md: 4 },
              py: { xs: 6, md: 8 },
            }}
          >
            <BreadcrumbsRow>
              <Link to="/" state={{ targetId: 'articles' }}>Home</Link>
              {' / '}
              <Link to="/" state={{ targetId: 'articles' }}>Blog</Link>
              {' / '}
              <Link to="/" state={{ targetId: 'articles', filterTag: post.tags?.[0] || 'Article' }}>
                {post.tags?.[0] || 'Article'}
              </Link>
            </BreadcrumbsRow>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '2rem', md: '3rem' },
                color: '#fff',
                textShadow: '0 2px 6px rgba(0,0,0,0.6)'
              }}
            >
              {post.title}
            </Typography>
            <AuthorRow>
              <Avatar
                src="https://github.com/k1r4-id.png"
                alt="Author"
                sx={{ width: 28, height: 28, border: '2px solid rgba(0, 243, 255, 0.2)' }}
              />
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)' }}>K1r44</Typography>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>•</Typography>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.85)' }}>{post.date}</Typography>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>•</Typography>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.85)' }}>{readingTime}</Typography>
            </AuthorRow>
          </Box>
        </HeroBox>
      )}

      <ContentLayout>
        {headings.length > 0 && (
          <RightSidebar>
            <TocContainer>
              <Typography variant="subtitle1" sx={{ color: '#fff', mb: 1, fontWeight: 600 }}>
                Table of Contents
              </Typography>
              <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                {headings.map((h, i) => (
                  <Box
                    key={`${h.id}-${i}`}
                    component="li"
                    sx={{
                      pl: (h.level - 1) * 2,
                      py: 0.75,
                      my: 0.25,
                      fontSize: '0.9rem',
                      color: activeId === h.id ? '#fff' : 'rgba(255,255,255,0.75)',
                      borderLeft: `3px solid ${activeId === h.id ? '#00aaff' : 'transparent'}`,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <a
                      href={`#${h.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToHeading(h.id);
                      }}
                      style={{ color: activeId === h.id ? '#00aaff' : '#9bdcff', textDecoration: 'none' }}
                    >
                      {h.text}
                    </a>
                  </Box>
                ))}
              </Box>
            </TocContainer>
          </RightSidebar>
        )}
        <Box>
          {/* removed breadcrumbs, title, author, tags/share by request */}

          {headings.length > 0 && (
            <MobileTocBox>
              <Button
                onClick={() => setMobileTocOpen(!mobileTocOpen)}
                endIcon={mobileTocOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                fullWidth
                sx={{
                  color: '#fff',
                  textTransform: 'none',
                  justifyContent: 'space-between',
                  p: 0,
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                Table of Contents
              </Button>
              <Collapse in={mobileTocOpen}>
                <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', mt: 2 }}>
                  {headings.map((h, i) => (
                    <Box
                      key={`mobile-${h.id}-${i}`}
                      component="li"
                      sx={{
                        pl: (h.level - 1) * 2,
                        py: 0.75,
                        fontSize: '0.9rem',
                        borderLeft: `2px solid ${activeId === h.id ? '#00aaff' : 'rgba(255,255,255,0.1)'}`,
                      }}
                    >
                      <a
                        href={`#${h.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setMobileTocOpen(false);
                          scrollToHeading(h.id);
                        }}
                        style={{
                          color: activeId === h.id ? '#00aaff' : 'rgba(255,255,255,0.7)',
                          textDecoration: 'none',
                          display: 'block',
                          paddingLeft: '12px',
                        }}
                      >
                        {h.text}
                      </a>
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </MobileTocBox>
          )}

          <ContentContainer ref={contentRef}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: (props: any) => <MarkdownImage {...props} />,
                pre({ children }) {
                  const child: any = Array.isArray(children) ? children[0] : children;
                  const className: string = child?.props?.className || '';
                  const language = getLanguageFromClass(className);
                  const accent = getCategoryAccent(language);
                  const raw = child?.props?.children;
                  const codeText = Array.isArray(raw) ? String(raw[0]).replace(/\n$/, '') : String(raw).replace(/\n$/, '');
                  return (
                    <CodeBlockContainer
                      sx={{
                        boxShadow: `0 10px 20px rgba(0,0,0,0.25), inset 0 0 0 1px ${hexToRgba(accent, 0.2)}`,
                      }}
                    >
                      <CodeHeader
                        sx={{
                          background: `linear-gradient(90deg, ${hexToRgba(accent, 0.15)}, rgba(255, 255, 255, 0.02))`,
                        }}
                      >
                        <CodeLang variant="caption" sx={{ color: accent }}>{language}</CodeLang>
                        <IconButton
                          size="small"
                          aria-label="Copy code"
                          onClick={() => navigator.clipboard.writeText(codeText)}
                          sx={{
                            color: accent,
                            border: `1px solid ${hexToRgba(accent, 0.35)}`,
                            borderRadius: '8px',
                            p: 0.5,
                            '&:hover': {
                              backgroundColor: hexToRgba(accent, 0.12),
                            },
                          }}
                        >
                          <Typography variant="caption" sx={{ px: 1, fontWeight: 600 }}>
                            Copy
                          </Typography>
                        </IconButton>
                      </CodeHeader>
                      <CodeContent>
                        <pre
                          dangerouslySetInnerHTML={{
                            __html: highlightCodeHTML(codeText, language, accent),
                          }}
                        />
                      </CodeContent>
                    </CodeBlockContainer>
                  );
                },
                code({ className, children }) {
                  const languageMatch = /language-(\w+)/.exec(className || '');
                  if (languageMatch) {
                    const accent = getCategoryAccent(languageMatch[1]);
                    return (
                      <code
                        style={{
                          backgroundColor: hexToRgba(accent, 0.12),
                          padding: '2px 6px',
                          borderRadius: '6px',
                          color: '#fff',
                          fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        }}
                      >
                        {children}
                      </code>
                    );
                  }
                  const codeText = String(children);
                  return (
                    <code
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        fontFamily:
                          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                      }}
                    >
                      {codeText}
                    </code>
                  );
                },
                h1({ children }) {
                  const text = String(children);
                  const id = slugify(text);
                  return <h1 id={id}>{children}</h1>;
                },
                h2({ children }) {
                  const text = String(children);
                  const id = slugify(text);
                  return <h2 id={id}>{children}</h2>;
                },
                h3({ children }) {
                  const text = String(children);
                  const id = slugify(text);
                  return <h3 id={id}>{children}</h3>;
                },
              }}
            >
              {contentToRender}
            </ReactMarkdown>
          </ContentContainer>
        </Box>
      </ContentLayout>
    </DetailSection>
  );
};

export default BlogDetail;
