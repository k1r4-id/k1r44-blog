import React from 'react';
import { styled } from '@mui/material/styles';
import { Container, Typography, Box } from '@mui/material';
import { keyframes } from '@mui/system';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldAlt, faUserShield } from '@fortawesome/free-solid-svg-icons';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const gradientFlow = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const HeaderSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(4, 0),
  marginBottom: theme.spacing(6),
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '150px',
    height: '3px',
    background: 'linear-gradient(90deg, #FF6B6B, #4ECDC4)',
    borderRadius: '2px',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '150px',
    height: '3px',
    background: 'linear-gradient(90deg, #4ECDC4, #FF6B6B)',
    borderRadius: '2px',
  },
}));

const Title = styled(Typography)(({ theme }) => ({
  color: '#fff',
  textAlign: 'center',
  fontSize: '2.8rem',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  marginBottom: theme.spacing(2),
  background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
  backgroundSize: '200% 200%',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  animation: `${fadeIn} 0.6s ease-out, ${gradientFlow} 3s ease infinite`,
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    fontSize: '2rem',
  }
}));

const Subtitle = styled(Typography)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.8)',
  textAlign: 'center',
  fontSize: '1.2rem',
  maxWidth: '600px',
  margin: '0 auto',
  animation: `${fadeIn} 0.6s ease-out`,
  position: 'relative',
  padding: theme.spacing(0, 2),
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '0',
    right: '0',
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
    transform: 'translateY(-50%)',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '1rem',
  }
}));

const TimelineContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(4, 0),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(6),
}));

const TimelineItem = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(3),
  animation: `${fadeIn} 0.6s ease-out`,
  animationFillMode: 'both',
  '&:nth-child(1)': { animationDelay: '0.2s' },
  '&:nth-child(2)': { animationDelay: '0.4s' },
  '&:nth-child(3)': { animationDelay: '0.6s' },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  width: '50px',
  height: '50px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#4ECDC4',
  fontSize: '1.5rem',
  transition: 'all 0.3s ease',
  '&:hover': {
    color: '#FF6B6B',
    transform: 'scale(1.1)',
  },
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
}));

const TimelineDate = styled(Typography)(({ theme }) => ({
  color: '#4ECDC4',
  fontSize: '0.9rem',
  fontWeight: 500,
  marginBottom: theme.spacing(1),
}));

const TimelineTitle = styled(Typography)(({ theme }) => ({
  color: '#fff',
  fontSize: '1.4rem',
  fontWeight: 600,
  marginBottom: theme.spacing(1),
}));

const TimelineDescription = styled(Typography)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '1rem',
  lineHeight: 1.6,
}));

const CompanyText = styled(Typography)(({ theme }) => ({
  color: '#FF6B6B',
  fontSize: '0.95rem',
  fontWeight: 500,
  marginBottom: theme.spacing(1),
}));

const timelineData = [
  {
    date: '2024 - Present',
    title: 'Security Analyst',
    company: 'PT SGI Asia',
    description: 'Working as a Security Analyst, focusing on identifying and mitigating security risks.',
    icon: faShieldAlt,
  },
  {
    date: '2023 - 2025',
    title: 'Team Leader of Public Relations',
    company: 'Jogja Cyber Security',
    description: 'Leading the Public Relations Division and contributing to the community.',
    icon: faUserShield,
  },
  {
    date: '2022 - 2023',
    title: 'Red Team Member',
    company: 'Jogja Cyber Security',
    description: 'Gained hands-on experience in Red Teaming and real-world cybersecurity challenges.',
    icon: faUserShield,
  },
];

function Timeline() {
  return (
    <Box id="history" sx={{ py: 8, px: { xs: 2, sm: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <HeaderSection>
          <Title>Professional Journey</Title>
          <Subtitle>My path through the world of cybersecurity</Subtitle>
        </HeaderSection>
        
        <TimelineContainer>
          {timelineData.map((item, index) => (
            <TimelineItem key={index}>
              <IconWrapper>
                <FontAwesomeIcon icon={item.icon} />
              </IconWrapper>
              <ContentWrapper>
                <TimelineDate>{item.date}</TimelineDate>
                <TimelineTitle>{item.title}</TimelineTitle>
                <CompanyText>{item.company}</CompanyText>
                <TimelineDescription>{item.description}</TimelineDescription>
              </ContentWrapper>
            </TimelineItem>
          ))}
        </TimelineContainer>
      </Container>
    </Box>
  );
}

export default Timeline;