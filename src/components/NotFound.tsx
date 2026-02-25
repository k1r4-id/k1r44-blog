import React from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { Box, Typography, Button } from '@mui/material';
import { keyframes } from '@mui/system';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(0, 243, 255, 0.2); }
  50% { box-shadow: 0 0 20px rgba(0, 243, 255, 0.4); }
  100% { box-shadow: 0 0 5px rgba(0, 243, 255, 0.2); }
`;

const Container = styled(Box)(({ theme }) => ({
  minHeight: '70vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  textAlign: 'center',
  padding: theme.spacing(6, 2),
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
  fontSize: '3rem',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  textShadow: `
    0 0 10px rgba(0, 243, 255, 0.35),
    0 0 18px rgba(0, 243, 255, 0.25)
  `,
  marginBottom: theme.spacing(2),
}));

const Subtitle = styled(Typography)(({ theme }) => ({
  color: 'rgba(255,255,255,0.75)',
  fontSize: '1.1rem',
  marginBottom: theme.spacing(4),
}));

const BackButton = styled(Button)(({ theme }) => ({
  color: '#fff',
  borderColor: 'rgba(255,255,255,0.5)',
  '&:hover': {
    borderColor: '#00f3ff',
    color: '#00f3ff',
    textShadow: '0 0 10px rgba(0, 243, 255, 0.5)',
  }
}));

function NotFound() {
  const navigate = useNavigate();
  return (
    <Container>
      <Title variant="h1">Page Not Found</Title>
      <Subtitle variant="subtitle1">
        Sorry, the page you’re looking for doesn’t exist.
      </Subtitle>
      <BackButton
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
      >
        Back to Home
      </BackButton>
    </Container>
  );
}

export default NotFound;
