import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt, faCalendarAlt, faLock, faSearch, faChevronLeft, faChevronRight, faClock } from '@fortawesome/free-solid-svg-icons';
import { styled } from '@mui/material/styles';
import { Container, Typography, Box, Grid, Card, CardContent, Chip, InputBase } from '@mui/material';
import { keyframes } from '@mui/system';
import { blogPosts } from '../data/blogPosts';

const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(0, 243, 255, 0.2); }
  50% { box-shadow: 0 0 20px rgba(0, 243, 255, 0.4); }
  100% { box-shadow: 0 0 5px rgba(0, 243, 255, 0.2); }
`;

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(8, 2),
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, #00f3ff, transparent)',
    animation: `${glow} 3s infinite`,
  }
}));

const Title = styled(Typography)(({ theme }) => ({
  color: '#fff',
  marginBottom: theme.spacing(6),
  textAlign: 'center',
  fontSize: '3.5rem',
  fontWeight: 800,
  letterSpacing: '-0.03em',
  textShadow: `
    0 0 10px rgba(0, 243, 255, 0.5),
    0 0 20px rgba(0, 243, 255, 0.3),
    0 0 30px rgba(0, 243, 255, 0.2)
  `,
  position: 'relative',
  zIndex: 2,
  '&::before': {
    content: '""',
    position: 'absolute',
    bottom: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '120px',
    height: '4px',
    background: 'linear-gradient(90deg, transparent, #00f3ff, transparent)',
    borderRadius: '2px',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-15px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80px',
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #00f3ff, transparent)',
    borderRadius: '1px',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '2.5rem',
  }
}));

const ArticleCard = styled(Card)(() => ({
  background: 'rgba(0, 243, 255, 0.05)',
  backdropFilter: 'blur(8px)',
  border: '2px solid rgba(0, 243, 255, 0.3)',
  borderRadius: '12px',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 30px rgba(0, 243, 255, 0.2)',
    borderColor: 'rgba(0, 243, 255, 0.5)',
    '& .MuiCardMedia-root': {
      transform: 'scale(1.05)',
    }
  }
}));


const CardContentWrapper = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  padding: theme.spacing(3),
}));

const ArticleTitle = styled(Typography)(({ theme }) => ({
  color: '#fff',
  fontSize: '1.5rem',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  position: 'relative',
  paddingBottom: theme.spacing(1),
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '40px',
    height: '3px',
    background: 'linear-gradient(90deg, #00f3ff, transparent)',
    borderRadius: '2px',
  },
  '& svg': {
    color: '#00f3ff',
    fontSize: '1.1rem',
    filter: 'drop-shadow(0 0 5px rgba(0, 243, 255, 0.5))',
  },
}));

const ArticleDescription = styled(Typography)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '1rem',
  lineHeight: 1.7,
  flexGrow: 1,
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  position: 'relative',
  padding: theme.spacing(1, 0),
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(180deg, transparent 0%, rgba(0, 243, 255, 0.05) 100%)',
    pointerEvents: 'none',
  }
}));

const TagsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
}));

const Tag = styled(Chip)(() => ({
  background: 'rgba(0, 243, 255, 0.1)',
  border: '1px solid rgba(0, 243, 255, 0.2)',
  color: '#00f3ff',
  fontSize: '0.8rem',
  height: '26px',
  transition: 'all 0.3s ease',
  fontWeight: 500,
  '&:hover': {
    background: 'rgba(0, 243, 255, 0.2)',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 243, 255, 0.15)',
  }
}));

const LinkButton = styled(Link)(({ theme }) => ({
  color: '#00f3ff',
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  fontSize: '0.95rem',
  fontWeight: 500,
  transition: 'all 0.3s ease',
  padding: theme.spacing(0.5, 1),
  borderRadius: '4px',
  '&:hover': {
    color: '#fff',
    background: 'rgba(0, 243, 255, 0.1)',
    '& svg': {
      transform: 'translateX(3px)',
      filter: 'drop-shadow(0 0 5px rgba(0, 243, 255, 0.5))',
    }
  },
  '& svg': {
    transition: 'all 0.3s ease',
  }
}));

const DateContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: '0.85rem',
  fontWeight: 500,
  '& svg': {
    color: '#00f3ff',
    fontSize: '0.9rem',
    filter: 'drop-shadow(0 0 3px rgba(0, 243, 255, 0.3))',
  }
}));

const SearchWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  background: 'rgba(0, 243, 255, 0.05)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(0, 243, 255, 0.25)',
  borderRadius: '12px',
  padding: theme.spacing(1.5, 2),
  marginBottom: theme.spacing(3),
  transition: 'all 0.3s ease',
  '&:focus-within': {
    borderColor: 'rgba(0, 243, 255, 0.6)',
    boxShadow: '0 0 20px rgba(0, 243, 255, 0.15)',
  },
  '& svg': {
    color: 'rgba(0, 243, 255, 0.6)',
    fontSize: '1rem',
  },
}));

const SearchInput = styled(InputBase)(() => ({
  color: '#fff',
  fontSize: '1rem',
  flex: 1,
  '& input': {
    padding: 0,
    '&::placeholder': {
      color: 'rgba(255, 255, 255, 0.4)',
      opacity: 1,
    },
  },
}));

const FilterSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  alignItems: 'center',
}));

const FilterTag = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>(({ active }) => ({
  background: active ? 'rgba(0, 243, 255, 0.3)' : 'rgba(0, 243, 255, 0.08)',
  border: `1px solid ${active ? 'rgba(0, 243, 255, 0.7)' : 'rgba(0, 243, 255, 0.2)'}`,
  color: active ? '#fff' : 'rgba(0, 243, 255, 0.8)',
  fontSize: '0.82rem',
  height: '30px',
  fontWeight: active ? 600 : 400,
  cursor: 'pointer',
  transition: 'all 0.25s ease',
  boxShadow: active ? '0 0 12px rgba(0, 243, 255, 0.2)' : 'none',
  '&:hover': {
    background: active ? 'rgba(0, 243, 255, 0.35)' : 'rgba(0, 243, 255, 0.15)',
    borderColor: 'rgba(0, 243, 255, 0.5)',
  },
}));

const ArticleCount = styled(Typography)(() => ({
  color: 'rgba(255, 255, 255, 0.5)',
  fontSize: '0.85rem',
  marginBottom: '16px',
  textAlign: 'right',
}));

const PaginationWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginTop: theme.spacing(4),
}));

const PageButton = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>(({ active }) => ({
  width: '38px',
  height: '38px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: active ? 700 : 500,
  color: active ? '#fff' : 'rgba(0, 243, 255, 0.8)',
  background: active ? 'rgba(0, 243, 255, 0.3)' : 'rgba(0, 243, 255, 0.05)',
  border: `1px solid ${active ? 'rgba(0, 243, 255, 0.7)' : 'rgba(0, 243, 255, 0.2)'}`,
  boxShadow: active ? '0 0 12px rgba(0, 243, 255, 0.25)' : 'none',
  transition: 'all 0.25s ease',
  userSelect: 'none',
  '&:hover': {
    background: active ? 'rgba(0, 243, 255, 0.35)' : 'rgba(0, 243, 255, 0.15)',
    borderColor: 'rgba(0, 243, 255, 0.5)',
  },
}));

const NavButton = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'disabled',
})<{ disabled?: boolean }>(({ disabled }) => ({
  width: '38px',
  height: '38px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  color: disabled ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 243, 255, 0.8)',
  background: 'rgba(0, 243, 255, 0.05)',
  border: `1px solid ${disabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 243, 255, 0.2)'}`,
  transition: 'all 0.25s ease',
  userSelect: 'none',
  ...(!disabled && {
    '&:hover': {
      background: 'rgba(0, 243, 255, 0.15)',
      borderColor: 'rgba(0, 243, 255, 0.5)',
    },
  }),
}));

const NewBadge = styled(Box)(() => ({
  position: 'absolute',
  top: '12px',
  right: '12px',
  background: 'linear-gradient(135deg, #00f3ff, #0080ff)',
  color: '#fff',
  fontSize: '0.7rem',
  fontWeight: 700,
  padding: '3px 10px',
  borderRadius: '20px',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  boxShadow: '0 0 12px rgba(0, 243, 255, 0.4)',
  zIndex: 2,
}));

const MetaRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  flexWrap: 'wrap',
}));

const ReadTime = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: '0.82rem',
  fontWeight: 400,
  '& svg': {
    color: 'rgba(0, 243, 255, 0.5)',
    fontSize: '0.8rem',
  },
}));

interface MediumPost {
  title: string;
  description: string;
  thumbnail: string;
  link: string;
  tags: string[];
  pubDate: string;
  fullDate: string;
  readTime: number;
  lock?: boolean;
}

function Project() {
  const location = useLocation();
  const filterTag = (location.state as any)?.filterTag as string | undefined;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(filterTag ? [filterTag] : []);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9; // 3 rows × 3 columns

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    blogPosts.forEach(p => p.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSearchQuery('');
    setCurrentPage(1);
  };

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return blogPosts.filter(p => {
      const matchesTags = selectedTags.length === 0 || selectedTags.some(t => p.tags.includes(t));
      if (!matchesTags) return false;
      if (!query) return true;
      return (
        p.title.toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query))
      );
    });
  }, [searchQuery, selectedTags]);

  const resolveAsset = (u: string) => {
    const p = String(u || '');
    if (!p) return '';
    if (/^https?:\/\//i.test(p)) return p;
    const proto = window.location.protocol || 'https:';
    const host = window.location.host || 'localhost:3000';
    const hostname = window.location.hostname || 'localhost';
    const isDev = hostname === 'localhost';
    const apex = hostname.replace(/^www\./, '');
    const base = isDev ? `${proto}//${host}` : `${proto}//${apex}`;
    return p.startsWith('/') ? `${base}${p}` : `${base}/${p}`;
  };
  const variations = (u: string): string[] => {
    const p = String(u || '');
    if (!p) return [];
    const i = p.lastIndexOf('/');
    if (i < 0) return [p];
    const dir = p.slice(0, i + 1);
    const file = p.slice(i + 1);
    const dot = file.lastIndexOf('.');
    if (dot < 0) return [p];
    const name = file.slice(0, dot);
    const ext = file.slice(dot);
    const lower = `${dir}${name.toLowerCase()}${ext}`;
    const upperFirst = `${dir}${name.charAt(0).toUpperCase()}${name.slice(1).toLowerCase()}${ext}`;
    const uniq = Array.from(new Set([p, lower, upperFirst]));
    return uniq;
  };
  function ResilientImg({ src, alt, sx }: { src: string; alt: string; sx?: any }) {
    const vars = variations(src);
    const [idx, setIdx] = useState(0);
    const [cur, setCur] = useState(resolveAsset(vars[0] || src));
    const onErr = () => {
      const next = idx + 1;
      if (next < vars.length) {
        setIdx(next);
        setCur(resolveAsset(vars[next]));
      } else {
        setCur('');
      }
    };
    return (
      <Box component="img" src={cur} alt={alt} onError={onErr} sx={sx} />
    );
  }

  const posts: MediumPost[] = filtered.map(post => {
    const wordCount = (post.content || '').split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));
    return {
      title: post.title,
      description: post.description || "",
      thumbnail: post.thumbnail || '',
      link: `/blog/${post.slug}`,
      tags: post.tags,
      pubDate: post.date.split('-')[0],
      fullDate: post.date,
      readTime,
      lock: (post as any).lock === true,
    };
  });

  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPosts = posts.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  return (
    <StyledContainer id="articles">
      <Title variant="h1">Articles</Title>

      <Box sx={{ mt: 4, mb: 1 }}>
        <SearchWrapper>
          <FontAwesomeIcon icon={faSearch} />
          <SearchInput
            placeholder="Search articles by title, description, or tag..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </SearchWrapper>

        <FilterSection>
          <FilterTag
            label="All"
            active={selectedTags.length === 0 && searchQuery === ''}
            onClick={clearFilters}
            size="small"
          />
          {allTags.map(tag => (
            <FilterTag
              key={tag}
              label={tag}
              active={selectedTags.includes(tag)}
              onClick={() => toggleTag(tag)}
              size="small"
            />
          ))}
        </FilterSection>

        <ArticleCount>
          Showing {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, posts.length)} of {posts.length} articles
        </ArticleCount>
      </Box>

      <Grid container spacing={3}>
        {paginatedPosts.map((post, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <ArticleCard sx={{ position: 'relative' }}>
              {(() => {
                const daysDiff = (Date.now() - new Date(post.fullDate).getTime()) / (1000 * 60 * 60 * 24);
                return daysDiff <= 30 ? <NewBadge>New</NewBadge> : null;
              })()}
              {post.thumbnail && (
                <ResilientImg
                  src={post.thumbnail}
                  alt={post.title}
                  sx={{
                    height: 220,
                    width: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center 30%',
                    transition: 'transform 0.3s ease',
                    display: 'block'
                  }}
                />
              )}
              <CardContentWrapper>
                <ArticleTitle>
                  {post.title}
                </ArticleTitle>
                <MetaRow>
                  <DateContainer>
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    {post.pubDate}
                  </DateContainer>
                  <ReadTime>
                    <FontAwesomeIcon icon={faClock} />
                    {post.readTime} min read
                  </ReadTime>
                </MetaRow>
                <ArticleDescription>
                  {post.description}
                </ArticleDescription>
                <TagsContainer>
                  {post.tags.map((tag, tagIndex) => (
                    <Tag
                      key={tagIndex}
                      label={tag}
                      size="small"
                    />
                  ))}
                </TagsContainer>
                {post.lock ? (
                  <Box
                    sx={{
                      color: 'rgba(255,255,255,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      padding: 0.5,
                      borderRadius: '4px',
                      cursor: 'not-allowed',
                      border: '1px dashed rgba(255,255,255,0.2)',
                    }}
                  >
                    <FontAwesomeIcon icon={faLock} />
                    Locked
                  </Box>
                ) : (
                  <LinkButton to={post.link}>
                    Read Article
                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                  </LinkButton>
                )}
              </CardContentWrapper>
            </ArticleCard>
          </Grid>
        ))}
      </Grid>

      {totalPages > 1 && (
        <PaginationWrapper>
          <NavButton
            disabled={currentPage === 1}
            onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </NavButton>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <PageButton
              key={page}
              active={page === currentPage}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </PageButton>
          ))}
          <NavButton
            disabled={currentPage === totalPages}
            onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </NavButton>
        </PaginationWrapper>
      )}
    </StyledContainer>
  );
}

export default Project; 
