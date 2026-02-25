import React from 'react';
import { styled } from '@mui/material/styles';
import { Box, Typography, Container } from '@mui/material';
import { keyframes } from '@mui/system';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';

const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(0, 243, 255, 0.2); }
  50% { box-shadow: 0 0 20px rgba(0, 243, 255, 0.4); }
  100% { box-shadow: 0 0 5px rgba(0, 243, 255, 0.2); }
`;

const FooterContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4, 2),
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

const FooterContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(3),
}));

const Copyright = styled(Typography)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '0.9rem',
  textAlign: 'center',
  '& a': {
    color: '#00f3ff',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    '&:hover': {
      textShadow: '0 0 10px rgba(0, 243, 255, 0.5)',
    }
  }
}));

const SocialLinks = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(1),
}));

const SocialIcon = styled('a')(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.7)',
  transition: 'all 0.3s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(1),
  borderRadius: '50%',
  textDecoration: 'none',
  '&:hover': {
    color: '#00f3ff',
    transform: 'translateY(-3px)',
  },
  '& svg': {
    fontSize: '1.5rem',
  }
}));

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <FooterContainer maxWidth={false}>
      <FooterContent>
        <SocialLinks>
          <SocialIcon href="https://github.com/k1r4-id" target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faGithub} />
          </SocialIcon>
          <SocialIcon href="https://www.linkedin.com/in/k1r4/" target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faLinkedin} />
          </SocialIcon>
        </SocialLinks>
        <Copyright variant="body2">
          © {currentYear} <a href="https://github.com/k1r4-id" target="_blank" rel="noopener noreferrer">K1r44</a>. All rights reserved.
        </Copyright>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer;