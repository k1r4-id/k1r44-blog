import React from "react";
import '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldAlt, faBug, faSearch, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { styled } from '@mui/material/styles';
import { Box, Container, Typography, Chip, Paper } from '@mui/material';
import { keyframes } from '@mui/system';

const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(0, 243, 255, 0.2); }
  50% { box-shadow: 0 0 20px rgba(0, 243, 255, 0.4); }
  100% { box-shadow: 0 0 5px rgba(0, 243, 255, 0.2); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
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
    width: '100px',
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
    width: '60px',
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #00f3ff, transparent)',
    borderRadius: '1px',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '2.5rem',
  }
}));

const SkillsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: theme.spacing(2),
  position: 'relative',
  zIndex: 2,
  [theme.breakpoints.down('lg')]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: theme.spacing(3),
  },
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr',
    gap: theme.spacing(4),
  }
}));

const SkillCard = styled(Paper)(({ theme }) => ({
  background: 'rgba(0, 243, 255, 0.05)',
  backdropFilter: 'blur(8px)',
  borderRadius: '12px',
  padding: theme.spacing(2),
  border: '2px solid rgba(0, 243, 255, 0.3)',
  boxShadow: '0 4px 20px rgba(0, 243, 255, 0.15)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  height: '100%',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, transparent, rgba(0, 243, 255, 0.05), transparent)',
    transform: 'translateX(-100%)',
    transition: 'transform 0.6s ease',
  },
  '&:hover': {
    transform: 'scale(1.02)',
    border: '2px solid rgba(0, 243, 255, 0.5)',
    boxShadow: '0 8px 25px rgba(0, 243, 255, 0.25)',
    '&::before': {
      transform: 'translateX(100%)',
    },
    '& .icon-wrapper': {
      color: '#00f3ff',
      transform: 'scale(1.1) rotate(10deg)',
    },
    '& .skill-title': {
      color: '#00f3ff',
      textShadow: '0 0 10px rgba(0, 243, 255, 0.5)',
    }
  }
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  color: 'rgba(0, 243, 255, 0.7)',
  marginBottom: theme.spacing(2),
  transition: 'all 0.4s ease',
  animation: `${float} 3s ease-in-out infinite`,
  '& svg': {
    fontSize: '2.5rem',
  },
  '& img': {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    objectFit: 'cover',
    boxShadow: '0 0 10px rgba(0, 243, 255, 0.3)',
  },
}));

const SkillTitle = styled(Typography)(({ theme }) => ({
  color: '#fff',
  marginBottom: theme.spacing(1.5),
  fontSize: '1.25rem',
  fontWeight: 600,
  letterSpacing: '-0.02em',
  transition: 'all 0.3s ease',
  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
}));

const SkillDescription = styled(Typography)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.9)',
  marginBottom: theme.spacing(2),
  fontSize: '0.85rem',
  lineHeight: 1.5,
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
}));

const ChipsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(0.75),
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  background: 'rgba(0, 243, 255, 0.1)',
  color: '#fff',
  border: '1px solid rgba(0, 243, 255, 0.3)',
  borderRadius: '8px',
  fontSize: '0.75rem',
  fontWeight: 500,
  height: '24px',
  transition: 'all 0.3s ease',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
  '&:hover': {
    background: 'rgba(0, 243, 255, 0.15)',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(0, 243, 255, 0.15)',
    border: '1px solid rgba(0, 243, 255, 0.5)',
  },
}));

const labelsFirst = [
    "Active Directory",
    "C2 Frameworks",
    "Phishing",
    "Social Engineering",
    "Privilege Escalation",
    "Lateral Movement",
    "Evasion Techniques",
    "Cobalt Strike",
    "BloodHound"
];

const labelsSecond = [
    "Web App Testing",
    "Network Testing",
    "API Security",
    "OWASP Top 10",
    "Burp Suite",
    "Nmap",
    "Metasploit",
    "Python",
    "Bash"
];

const labelsThird = [
    "Android Security",
    "iOS Security",
    "Frida",
    "Objection",
    "SSL Pinning Bypass",
    "Static Analysis",
    "Dynamic Analysis",
    "ADB",
    "MobSF"
];

const CertLink = styled('a')(({ theme }) => ({
  color: '#00f3ff',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginTop: theme.spacing(2),
  fontSize: '0.9rem',
  fontWeight: 500,
  transition: 'all 0.3s ease',
  '&:hover': {
    color: '#fff',
    transform: 'translateX(5px)',
    textShadow: '0 0 8px rgba(0, 243, 255, 0.5)',
  }
}));

const CertsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  maxWidth: '500px',
  margin: '0 auto',
}));

const CertItem = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(3),
  padding: theme.spacing(3),
  background: 'rgba(0, 243, 255, 0.03)',
  backdropFilter: 'blur(8px)',
  borderRadius: '16px',
  border: '1px solid rgba(0, 243, 255, 0.1)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    background: 'rgba(0, 243, 255, 0.05)',
    border: '1px solid rgba(0, 243, 255, 0.3)',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(0, 243, 255, 0.1)',
  },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  }
}));

const CertContent = styled(Box)(({ theme }) => ({
  flex: 1,
  width: '100%',
}));

const CertHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
  }
}));

const CertTitleStyled = styled(Typography)(({ theme }) => ({
  color: '#fff',
  fontSize: '1.25rem',
  fontWeight: 600,
  lineHeight: 1.3,
}));

const CertIssuer = styled(Typography)(({ theme }) => ({
  color: '#00f3ff',
  fontSize: '0.9rem',
  fontWeight: 500,
  marginTop: theme.spacing(0.5),
}));

const CertDescriptionStyled = styled(Typography)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '0.95rem',
  lineHeight: 1.6,
  marginBottom: theme.spacing(2),
}));

const certifications = [
    {
        title: "Certified Web Exploitation Specialist (CWES)",
        issuer: "Credly",
        description: "Professional certification demonstrating proficiency in web exploitation techniques and web application security testing.",
        link: "https://www.credly.com/badges/53469607-f47b-463e-97fa-69b088b98e2a"
    },
    {
        title: "Certified Penetration Testing Specialist (CPTS)",
        issuer: "Credly",
        description: "Professional certification demonstrating proficiency in penetration testing methodologies, vulnerability assessment, and security analysis.",
        link: "https://www.credly.com/badges/5f782e58-dac8-4340-8e34-8ab2df94e453"
    }
];

function Expertise() {
    return (
        <StyledContainer id="expertise">
            <Title variant="h1">Expertise</Title>
            <SkillsGrid>
                <SkillCard elevation={0}>
                    <IconWrapper className="icon-wrapper">
                        <FontAwesomeIcon icon={faShieldAlt} />
                    </IconWrapper>
                    <SkillTitle className="skill-title">Offensive Security & Red Teaming</SkillTitle>
                    <SkillDescription>
                        Specialized in Red Teaming operations, including Active Directory exploitation, adversary simulation, and post-exploitation tactics. Proficient in simulating sophisticated attacks to test organizational resilience.
                    </SkillDescription>
                    <ChipsContainer>
                        {labelsFirst.map((label, index) => (
                            <StyledChip key={index} label={label} />
                        ))}
                    </ChipsContainer>
                </SkillCard>

                <SkillCard elevation={0}>
                    <IconWrapper className="icon-wrapper">
                        <FontAwesomeIcon icon={faBug} />
                    </IconWrapper>
                    <SkillTitle className="skill-title">Penetration Testing</SkillTitle>
                    <SkillDescription>
                        Skilled in conducting comprehensive security assessments including web application penetration testing, network security testing, and API security testing. Experienced in identifying and exploiting vulnerabilities while providing detailed remediation guidance.
                    </SkillDescription>
                    <ChipsContainer>
                        {labelsSecond.map((label, index) => (
                            <StyledChip key={index} label={label} />
                        ))}
                    </ChipsContainer>
                </SkillCard>

                <SkillCard elevation={0}>
                    <IconWrapper className="icon-wrapper">
                        <FontAwesomeIcon icon={faSearch} />
                    </IconWrapper>
                    <SkillTitle className="skill-title">Mobile Security</SkillTitle>
                    <SkillDescription>
                        Experienced in Mobile Application Security Testing (MAST) for Android and iOS platforms. Proficient in using tools like Frida and Objection for dynamic analysis, bypassing SSL pinning, and identifying security flaws in mobile apps.
                    </SkillDescription>
                    <ChipsContainer>
                        {labelsThird.map((label, index) => (
                            <StyledChip key={index} label={label} />
                        ))}
                    </ChipsContainer>
                </SkillCard>
            </SkillsGrid>

            <Title variant="h1" sx={{ mt: 10, mb: 6 }}>Certifications</Title>
            <CertsContainer>
                {certifications.map((cert, index) => (
                    <CertItem key={index} elevation={0}>
                        <CertContent>
                            <CertHeader>
                                <Box>
                                    <CertTitleStyled>{cert.title}</CertTitleStyled>
                                    <CertIssuer>{cert.issuer}</CertIssuer>
                                </Box>
                                <CertLink href={cert.link} target="_blank" rel="noopener noreferrer" sx={{ mt: 0 }}>
                                    View Credential <FontAwesomeIcon icon={faExternalLinkAlt} size="xs" />
                                </CertLink>
                            </CertHeader>
                            <CertDescriptionStyled>
                                {cert.description}
                            </CertDescriptionStyled>
                        </CertContent>
                    </CertItem>
                ))}
            </CertsContainer>
        </StyledContainer>
    );
}

export default Expertise;