import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { musicProjects } from '../data/projects';
import CDViewer from '../components/CDViewer';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const Music = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeProject, setActiveProject] = useState(null);

  useEffect(() => {
    if (projectId) {
      const project = musicProjects.find(p => p.id === projectId);
      setActiveProject(project || null);
      if (!project) navigate('/music', { replace: true });
    } else {
      setActiveProject(null);
    }
  }, [projectId, navigate]);

  const closeProject = () => navigate('/music');

  const navigateProject = (direction) => {
    if (!activeProject) return;
    const currentIndex = musicProjects.findIndex(p => p.id === activeProject.id);
    let nextIndex;
    
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % musicProjects.length;
    } else {
      nextIndex = (currentIndex - 1 + musicProjects.length) % musicProjects.length;
    }
    
    navigate(`/music/${musicProjects[nextIndex].id}`);
  };

  return (
    <div className="container mx-auto px-6 py-24 min-h-screen">
      <AnimatePresence mode="wait">
        {!activeProject ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {musicProjects.map((project, index) => (
              <motion.div
                key={project.id}
                layoutId={`project-${project.id}`}
                onClick={() => navigate(`/music/${project.id}`)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative aspect-square bg-white/5 cursor-pointer overflow-hidden border border-white/10 hover:border-[var(--hover-color)] transition-colors duration-500"
              >
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-center p-4 backdrop-blur-sm">
                  <h3 className="text-xl font-bold font-sans tracking-tighter mb-2 text-white">{project.title}</h3>
                  <span className="text-xs uppercase tracking-widest text-[var(--hover-color)] border border-[var(--hover-color)] px-2 py-1">View Project</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="detail"
            layoutId={`project-${activeProject.id}`}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto"
          >
            {/* Top Navigation Bar for Detail View */}
            <div className="fixed top-0 left-0 w-full z-[60] p-6 flex justify-between items-center pointer-events-none">
                <button 
                  onClick={closeProject} 
                  className="pointer-events-auto p-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-white hover:text-[var(--hover-color)] hover:border-[var(--hover-color)] transition-all"
                  aria-label="Close project"
                >
                  <X size={24} />
                </button>

                <div className="flex gap-4 pointer-events-auto">
                    <button 
                      onClick={() => navigateProject('prev')}
                      className="p-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-white hover:text-[var(--hover-color)] hover:border-[var(--hover-color)] transition-all"
                      aria-label="Previous project"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button 
                      onClick={() => navigateProject('next')}
                      className="p-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-white hover:text-[var(--hover-color)] hover:border-[var(--hover-color)] transition-all"
                      aria-label="Next project"
                    >
                      <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            <div className="min-h-screen flex flex-col md:flex-row pt-20 md:pt-0">
              {/* Left: CD Viewer */}
              <div className="w-full md:w-1/2 h-[50vh] md:h-screen md:sticky md:top-0 bg-gradient-to-br from-black to-zinc-900 flex items-center justify-center relative overflow-hidden order-1 md:order-none">
                <div className="w-full h-full relative z-10 flex items-center justify-center p-8 md:p-12">
                  <div className="aspect-square w-full h-full max-w-lg max-h-lg relative flex items-center justify-center">
                    <CDViewer image={activeProject.image} tracks={activeProject.tracks} />
                    <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/30 animate-pulse pointer-events-none">
                      DRAG TO ROTATE
                    </p>
                  </div>
                </div>

                {/* Background blurred image for ambiance */}
                <div 
                  className="absolute inset-0 opacity-20 blur-3xl scale-150 pointer-events-none"
                  style={{ backgroundImage: `url(${activeProject.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
              </div>

              {/* Right: Content */}
              <div className="w-full md:w-1/2 min-h-screen p-8 md:p-16 flex flex-col justify-center bg-background border-l border-white/5 relative order-2 md:order-none z-10">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="max-w-xl mx-auto space-y-8 pb-20 md:pb-0"
                >
                  <h2 className="text-4xl md:text-6xl font-bold font-sans tracking-tighter text-white mb-2 leading-none">
                    {activeProject.title}
                  </h2>
                  
                  <div className="w-20 h-1 bg-[var(--hover-color)]" />

                  <div className="prose prose-invert prose-sm md:prose-base font-sans text-zinc-400">
                    <p>{activeProject.description}</p>
                    {activeProject.extendedDescription && (
                      <p className="mt-4 text-sm italic border-l-2 border-white/10 pl-4">{activeProject.extendedDescription}</p>
                    )}
                  </div>

                  {activeProject.embedUrl && (
                    <div className="w-full border border-white/10 bg-black">
                      <iframe 
                        style={{ border: 0, width: '100%', height: '42px' }} 
                        src={activeProject.embedUrl} 
                        seamless
                        title={`${activeProject.title} Bandcamp Player`}
                      />
                    </div>
                  )}

                  {activeProject.soundcloudEmbed && (
                    <div className="w-full border border-white/10">
                      <iframe 
                        width="100%" 
                        height="166" 
                        scrolling="no" 
                        frameBorder="no" 
                        allow="autoplay" 
                        src={activeProject.soundcloudEmbed}
                        title={`${activeProject.title} Soundcloud Player`}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-8 text-xs font-sans uppercase tracking-wider text-zinc-500 pt-8 border-t border-white/5">
                    <div>
                       <span className="block mb-2 text-[var(--hover-color)]">Platform</span>
                       {activeProject.bandcampLink ? (
                         <a href={activeProject.bandcampLink} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline decoration-dotted">Bandcamp</a>
                       ) : 'Soundcloud'}
                    </div>
                    {activeProject.credits && (
                      <div className="col-span-2 whitespace-pre-line leading-relaxed">
                        <span className="block mb-2 text-[var(--hover-color)]">Credits</span>
                        {activeProject.credits}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Music;
