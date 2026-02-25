import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { keyframes } from '@mui/system';

const pulse = keyframes`
  0% { box-shadow: 0 0 8px rgba(0, 243, 255, 0.3); }
  50% { box-shadow: 0 0 20px rgba(0, 243, 255, 0.5), 0 0 40px rgba(0, 243, 255, 0.2); }
  100% { box-shadow: 0 0 8px rgba(0, 243, 255, 0.3); }
`;

const Button = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'visible',
})<{ visible: boolean }>(({ visible }) => ({
  position: 'fixed',
  bottom: '32px',
  right: '32px',
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0, 243, 255, 0.15)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(0, 243, 255, 0.4)',
  color: '#00f3ff',
  cursor: 'pointer',
  zIndex: 1000,
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(20px)',
  pointerEvents: visible ? 'auto' : 'none',
  transition: 'opacity 0.3s ease, transform 0.3s ease, background 0.3s ease',
  animation: visible ? `${pulse} 2.5s infinite` : 'none',
  '&:hover': {
    background: 'rgba(0, 243, 255, 0.3)',
    transform: visible ? 'translateY(-3px)' : 'translateY(20px)',
    boxShadow: '0 0 25px rgba(0, 243, 255, 0.5)',
  },
  '& svg': {
    fontSize: '1.1rem',
    filter: 'drop-shadow(0 0 4px rgba(0, 243, 255, 0.5))',
  },
}));

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollUp = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <Button visible={visible} onClick={scrollUp}>
      <FontAwesomeIcon icon={faArrowUp} />
    </Button>
  );
}

export default ScrollToTop;
