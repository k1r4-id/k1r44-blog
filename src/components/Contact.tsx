import React from 'react';
import { styled } from '@mui/material/styles';
import { Container, Typography, Box } from '@mui/material';
import { keyframes } from '@mui/system';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(2deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const glow = keyframes`
  0% { filter: drop-shadow(0 0 5px rgba(0, 243, 255, 0.5)); }
  50% { filter: drop-shadow(0 0 20px rgba(0, 243, 255, 0.8)); }
  100% { filter: drop-shadow(0 0 5px rgba(0, 243, 255, 0.5)); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const Title = styled(Typography)(({ theme }) => ({
  color: '#fff',
  marginBottom: theme.spacing(1.5),
  textAlign: 'center',
  fontSize: '2rem',
  fontWeight: 600,
  letterSpacing: '-0.02em',
  textShadow: '0 0 10px rgba(0, 243, 255, 0.5)',
  animation: `${pulse} 3s infinite`,
  position: 'relative',
  zIndex: 2,
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.5rem',
  }
}));

const Subtitle = styled(Typography)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.7)',
  textAlign: 'center',
  fontSize: '0.95rem',
  maxWidth: '500px',
  margin: '0 auto',
  marginBottom: theme.spacing(4),
}));

const EmailLink = styled('a')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1rem',
  padding: '1.2rem 2.5rem',
  background: 'rgba(0, 243, 255, 0.03)',
  borderRadius: '20px',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  textDecoration: 'none',
  color: '#fff',
  maxWidth: '320px',
  margin: '0 auto',
  border: '1px solid rgba(0, 243, 255, 0.1)',
  position: 'relative',
  overflow: 'hidden',
  backdropFilter: 'blur(10px)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, transparent, rgba(0, 243, 255, 0.1), transparent)',
    transform: 'translateX(-100%)',
    transition: 'transform 0.6s ease',
  },
  '&:hover': {
    background: 'rgba(0, 243, 255, 0.08)',
    transform: 'translateY(-3px) scale(1.02)',
    boxShadow: '0 8px 32px rgba(0, 243, 255, 0.2)',
    border: '1px solid rgba(0, 243, 255, 0.3)',
    color: '#00f3ff',
    '&::before': {
      transform: 'translateX(100%)',
    },
    '& .fa-envelope': {
      transform: 'scale(1.2) rotate(10deg)',
      filter: 'drop-shadow(0 0 15px rgba(0, 243, 255, 0.8))',
    },
    '& .email-text': {
      transform: 'translateX(5px)',
      textShadow: '0 0 10px rgba(0, 243, 255, 0.5)',
    },
  },
  '& .fa-envelope': {
    color: '#00f3ff',
    fontSize: '1.4rem',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    filter: 'drop-shadow(0 0 8px rgba(0, 243, 255, 0.5))',
    animation: `${float} 3s ease-in-out infinite, ${glow} 2s ease-in-out infinite`,
  },
}));

const EmailText = styled('span')(({ theme }) => ({
  fontSize: '1.1rem',
  fontWeight: 500,
  letterSpacing: '0.5px',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-2px',
    left: '0',
    width: '0',
    height: '1px',
    background: '#00f3ff',
    transition: 'width 0.3s ease',
  },
  '&:hover::after': {
    width: '100%',
  },
}));

function Contact() {
  return (
    <Box id="contact" sx={{ py: 6, px: { xs: 2, sm: 3, md: 4 } }}>
      <Container maxWidth="md">
        <Title>Contact</Title>
        <Subtitle>Let's connect and discuss your next project</Subtitle>
        
        <EmailLink href="mailto:akiratsuyoi2705@gmail.com">
          <FontAwesomeIcon icon={faEnvelope} />
          <EmailText className="email-text">Email Me</EmailText>
        </EmailLink>
      </Container>
          </Box>
  );
}

export default Contact;