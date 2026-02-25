import React, { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import ShieldIcon from '@mui/icons-material/Shield';
import SecurityIcon from '@mui/icons-material/Security';
import BugReportIcon from '@mui/icons-material/BugReport';
import MonitorIcon from '@mui/icons-material/Monitor';
import StorageIcon from '@mui/icons-material/Storage';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import '../assets/styles/Main.scss';

// Styled Components
const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 160,
  height: 160,
  border: '2px solid rgba(0, 243, 255, 0.3)',
  boxShadow: '0 0 15px rgba(0, 243, 255, 0.2)',
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
    border: '2px solid rgba(0, 243, 255, 0.5)',
  }
}));

const SocialButton = styled(Button)(({ theme }) => ({
  color: '#fff',
  padding: theme.spacing(1),
  minWidth: 'auto',
  transition: 'all 0.3s ease',
  '&:hover': {
    color: '#00f3ff',
    transform: 'translateY(-2px)',
  }
}));

const Section = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(0),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  position: 'relative',
  paddingTop: `calc(${theme.spacing(8)} + env(safe-area-inset-top, 0px))`,
  [theme.breakpoints.down('md')]: {
    minHeight: 'auto',
    paddingTop: theme.spacing(10),
    paddingBottom: theme.spacing(4),
  },
  [theme.breakpoints.down('sm')]: {
    paddingTop: theme.spacing(8),
    paddingBottom: theme.spacing(4),
  },
}));

const SectionContent = styled(Box)(({ theme }) => ({
  maxWidth: '1200px',
  width: '100%',
  margin: '0 auto',
  padding: theme.spacing(0, 4),
  position: 'relative',
  zIndex: 1,
  overflow: 'hidden',
}));

const SkillContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  marginTop: theme.spacing(3),
  justifyContent: 'center',
  [theme.breakpoints.down('sm')]: {
    justifyContent: 'center',
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(1),
  }
}));

const SkillItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 2),
  borderRadius: '8px',
  background: 'rgba(0, 243, 255, 0.05)',
  transition: 'all 0.3s ease',
  minWidth: '140px',
  [theme.breakpoints.down('sm')]: {
    flex: '1 1 calc(50% - 16px)',
    justifyContent: 'center'
  },
  '&:hover': {
    background: 'rgba(0, 243, 255, 0.1)',
    transform: 'translateY(-2px)'
  }
}));

const SkillIcon = styled(Box)(({ theme }) => ({
  color: '#00f3ff',
  display: 'flex',
  alignItems: 'center',
  '& svg': {
    fontSize: '1.2rem'
  }
}));

function Main() {
  const [aboutContent, setAboutContent] = useState<string>('');

  useEffect(() => {
    fetch('/about.md')
      .then(res => res.text())
      .then(text => setAboutContent(text))
      .catch(() => setAboutContent(''));
  }, []);

  return (
    <Box>
      <Section id="home">
        <SectionContent>
          <Grid container spacing={{ xs: 3, md: 6 }} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, mt: 2, flexDirection: { xs: 'column', sm: 'row' }, textAlign: { xs: 'center', sm: 'left' } }}>
                <ProfileAvatar
                  src="https://github.com/k1r4-id.png"
                  alt="K1r44"
                  sx={{
                    width: { xs: 120, sm: 140, md: 160 },
                    height: { xs: 120, sm: 140, md: 160 },
                    mb: { xs: 2, sm: 0 }
                  }}
                />
                <Box sx={{ ml: { xs: 0, sm: 3 } }}>
                  <Chip 
                    label="Security Analyst & Bug Hunter" 
                    size="small" 
                    sx={{ 
                      mb: 1.5,
                      background: 'rgba(0, 243, 255, 0.1)',
                      border: '1px solid rgba(0, 243, 255, 0.3)',
                      color: '#fff',
                      fontSize: { xs: '0.75rem', sm: '0.85rem' },
                      height: { xs: '24px', sm: '26px' },
                      whiteSpace: 'normal',
                      maxWidth: { xs: '280px', sm: 'none' },
                      display: { xs: 'inline-flex', sm: 'none' }
                    }} 
                  />
                  <Typography 
                    variant="h4" 
                    component="h1" 
                    sx={{ 
                      fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      color: '#fff',
                      lineHeight: 1.2,
                      wordBreak: 'break-word'
                    }}
                  >
                    K1r44
                  </Typography>
                </Box>
              </Box>

              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  opacity: 0.9,
                  color: '#00f3ff',
                  fontWeight: 500,
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                Security Analyst | Penetration Tester | Bug Hunter
              </Typography>

              <Box
                sx={{
                  mb: 4,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  lineHeight: 1.7,
                  opacity: 0.9,
                  color: '#fff',
                  maxWidth: '92%'
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {aboutContent || 'Loading...'}
                </ReactMarkdown>
              </Box>

              <Box sx={{ display: 'flex', gap: 0.5, mb: 3 }}>
                <SocialButton
                  onClick={() => window.open('https://github.com/k1r4-id', '_blank')}
                  startIcon={<GitHubIcon />}
                />
                <SocialButton
                  onClick={() => window.open('https://www.linkedin.com/in/k1r4/', '_blank')}
                  startIcon={<LinkedInIcon />}
                />
                <SocialButton
                  onClick={() => window.location.href = 'mailto:akiratsuyoi2705@gmail.com'}
                  startIcon={<EmailIcon />}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ mt: { xs: 0, sm: 1, md: 2 }, ml: { md: 2 } }}>
                <SkillContainer>
                  <SkillItem>
                    <SkillIcon>
                      <ShieldIcon />
                    </SkillIcon>
                    <Typography
                      sx={{
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}
                    >
                      Offensive Security
                    </Typography>
                  </SkillItem>
                  <SkillItem>
                    <SkillIcon>
                      <SecurityIcon />
                    </SkillIcon>
                    <Typography
                      sx={{
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}
                    >
                      Penetration Testing
                    </Typography>
                  </SkillItem>
                  <SkillItem>
                    <SkillIcon>
                      <BugReportIcon />
                    </SkillIcon>
                    <Typography
                      sx={{
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}
                    >
                      Vulnerability Assessment
                    </Typography>
                  </SkillItem>
                  <SkillItem>
                    <SkillIcon>
                      <MonitorIcon />
                    </SkillIcon>
                    <Typography
                      sx={{
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}
                    >
                      Red Teaming
                    </Typography>
                  </SkillItem>
                  <SkillItem>
                    <SkillIcon>
                      <StorageIcon />
                    </SkillIcon>
                    <Typography
                      sx={{
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}
                    >
                      Network Security
                    </Typography>
                  </SkillItem>
                  <SkillItem>
                    <SkillIcon>
                      <ShieldIcon />
                    </SkillIcon>
                    <Typography
                      sx={{
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}
                    >
                      Web Security
                    </Typography>
                  </SkillItem>
                  <SkillItem>
                    <SkillIcon>
                      <SecurityIcon />
                    </SkillIcon>
                    <Typography
                      sx={{
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}
                    >
                      Mobile Security
                    </Typography>
                  </SkillItem>
                  <SkillItem>
                    <SkillIcon>
                      <BugReportIcon />
                    </SkillIcon>
                    <Typography
                      sx={{
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}
                    >
                      Active Directory
                    </Typography>
                  </SkillItem>
                </SkillContainer>
              </Box>
            </Grid>
          </Grid>
        </SectionContent>
      </Section>
    </Box>
  );
}

export default Main;
