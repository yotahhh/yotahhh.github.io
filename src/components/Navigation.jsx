import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { createPortal } from 'react-dom';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [neonColor, setNeonColor] = useState('#ff00ff');

  const neonColors = ['#ff00ff', '#00ffff', '#00ff00', '#ffff00', '#ff0080', '#0080ff', '#ff6600', '#ff0066'];

  useEffect(() => {
    const randomColor = neonColors[Math.floor(Math.random() * neonColors.length)];
    setNeonColor(randomColor);
    document.documentElement.style.setProperty('--hover-color', randomColor);
  }, []);

  const links = [
    { to: "/", label: "About" },
    { to: "/music", label: "Music" },
    { to: "/film", label: "Film" },
    { to: "/mixing", label: "Mixing & Mastering" },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 p-6 md:p-8 flex justify-between items-center text-primary font-sans mix-blend-difference pointer-events-none">
        <NavLink to="/" className="text-xl md:text-2xl font-bold tracking-tight hover:text-[var(--hover-color)] transition-colors pointer-events-auto">
          Yves Spiri
        </NavLink>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 text-sm font-medium pointer-events-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `transition-colors duration-200 hover:text-[var(--hover-color)] ${
                  isActive ? 'text-[var(--hover-color)] underline decoration-wavy underline-offset-4' : ''
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button onClick={toggleMenu} className="md:hidden z-50 hover:text-[var(--hover-color)] transition-colors pointer-events-auto">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay - Portaled out to avoid mix-blend-difference issues */}
      {isOpen && createPortal(
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center gap-8 md:hidden font-sans">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `text-3xl font-bold tracking-tight transition-colors duration-200 hover:text-[var(--hover-color)] ${
                  isActive ? 'text-[var(--hover-color)]' : 'text-primary'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

export default Navigation;
