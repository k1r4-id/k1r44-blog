import React, { useState, useEffect, useRef } from 'react';
import { styled } from '@mui/material/styles';
import { Container, Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNewspaper, faFlag, faCertificate, faCode } from '@fortawesome/free-solid-svg-icons';
import { blogPosts } from '../data/blogPosts';

const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(0, 243, 255, 0.2); }
  50% { box-shadow: 0 0 20px rgba(0, 243, 255, 0.4); }
  100% { box-shadow: 0 0 5px rgba(0, 243, 255, 0.2); }
`;

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(8, 2),
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
  },
}));

const StatsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: theme.spacing(3),
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: theme.spacing(2),
  },
}));

const StatCard = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(4, 2),
  background: 'rgba(0, 243, 255, 0.03)',
  backdropFilter: 'blur(8px)',
  borderRadius: '16px',
  border: '1px solid rgba(0, 243, 255, 0.15)',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(0, 243, 255, 0.08)',
    border: '1px solid rgba(0, 243, 255, 0.35)',
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 30px rgba(0, 243, 255, 0.15)',
  },
}));

const StatIcon = styled(Box)(() => ({
  color: '#00f3ff',
  fontSize: '1.8rem',
  marginBottom: '12px',
  filter: 'drop-shadow(0 0 8px rgba(0, 243, 255, 0.4))',
}));

const StatNumber = styled(Typography)(() => ({
  color: '#fff',
  fontSize: '2.8rem',
  fontWeight: 800,
  letterSpacing: '-0.03em',
  lineHeight: 1,
  marginBottom: '8px',
  textShadow: '0 0 15px rgba(0, 243, 255, 0.3)',
}));

const StatLabel = styled(Typography)(() => ({
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: '0.85rem',
  fontWeight: 500,
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
}));

function useCountUp(target: number, isVisible: boolean, duration = 1500) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;

    const steps = 60;
    const increment = target / steps;
    const stepTime = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isVisible, target, duration]);

  return count;
}

function StatsCounter() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const totalArticles = blogPosts.length;
  const ctfWriteups = blogPosts.filter(p =>
    p.tags.some(t => t.toLowerCase().includes('ctf') || t.toLowerCase().includes('htb') || t.toLowerCase().includes('hackthebox'))
  ).length || Math.floor(totalArticles * 0.4);
  const uniqueTags = new Set(blogPosts.flatMap(p => p.tags)).size;

  const articles = useCountUp(totalArticles, isVisible);
  const ctfs = useCountUp(ctfWriteups, isVisible);
  const certs = useCountUp(2, isVisible, 800);
  const tags = useCountUp(uniqueTags, isVisible);

  const stats = [
    { icon: faNewspaper, value: articles, suffix: '+', label: 'Articles' },
    { icon: faFlag, value: ctfs, suffix: '+', label: 'CTF Writeups' },
    { icon: faCertificate, value: certs, suffix: '', label: 'Certifications' },
    { icon: faCode, value: tags, suffix: '+', label: 'Topics' },
  ];

  return (
    <StyledContainer ref={ref}>
      <StatsGrid>
        {stats.map((stat, i) => (
          <StatCard key={i}>
            <StatIcon>
              <FontAwesomeIcon icon={stat.icon} />
            </StatIcon>
            <StatNumber>{stat.value}{stat.suffix}</StatNumber>
            <StatLabel>{stat.label}</StatLabel>
          </StatCard>
        ))}
      </StatsGrid>
    </StyledContainer>
  );
}

export default StatsCounter;
