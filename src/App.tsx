import React, {useState, useEffect, createContext, useContext} from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import {
  Main,
  Expertise,
  Project,
  Contact,
  Navigation,
  Footer,
  NotFound,
} from "./components";
import FadeIn from './components/FadeIn';
import BlogDetail from './components/BlogDetail';
import ScrollToTop from './components/ScrollToTop';
import StatsCounter from './components/StatsCounter';
import './index.scss';

export const ThemeContext = createContext<{ mode: string; toggleMode: () => void }>({
  mode: 'dark',
  toggleMode: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

const Home = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.state && (location.state as any).targetId) {
      const targetId = (location.state as any).targetId;
      const element = document.getElementById(targetId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

  return (
    <>
      <FadeIn transitionDuration={700}>
        <Main/>
        <Expertise/>
        <StatsCounter/>
        <Project/>
        <Contact/>
      </FadeIn>
      <Footer />
    </>
  );
};

function App() {
    const [mode, setMode] = useState<string>(() => {
      return localStorage.getItem('theme') || 'dark';
    });

    const toggleMode = () => {
      setMode(prev => {
        const next = prev === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', next);
        return next;
      });
    };

    useEffect(() => {
        window.scrollTo({top: 0, left: 0, behavior: 'smooth'});
      }, []);

    return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
    <div className={`main-container ${mode === 'dark' ? 'dark-mode' : 'light-mode'}`}>
        <Router>
            <Navigation />
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/blog/:slug" element={<BlogDetail />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    </div>
    </ThemeContext.Provider>
    );
}

export default App;
