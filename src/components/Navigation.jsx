import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

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
    { to: "/", label: "about" },
    { to: "/music", label: "music" },
    { to: "/film", label: "film" },
    { to: "/mixing", label: "mixing & mastering" },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 p-6 md:p-8 flex justify-between items-center mix-blend-difference text-primary">
      <NavLink to="/" className="text-xl md:text-2xl font-mono font-bold tracking-tight hover:text-[var(--hover-color)] transition-colors">
        yves spiri
      </NavLink>

      {/* Desktop Menu */}
      <div className="hidden md:flex gap-8 font-mono text-sm">
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
      <button onClick={toggleMenu} className="md:hidden z-50 hover:text-[var(--hover-color)] transition-colors">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-40 flex flex-col items-center justify-center gap-8 md:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `text-2xl font-mono transition-colors duration-200 hover:text-[var(--hover-color)] ${
                  isActive ? 'text-[var(--hover-color)]' : ''
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navigation;
