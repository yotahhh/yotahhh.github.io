import { filmProjects } from '../data/projects';
import { motion } from 'framer-motion';

const Film = () => {
  return (
    <div className="container mx-auto px-6 py-24 min-h-screen">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 gap-12 max-w-4xl mx-auto"
      >
        {filmProjects.map((project, index) => (
          <motion.div 
            key={project.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.2 }}
            className="group relative border border-white/10 hover:border-[var(--hover-color)] transition-colors duration-500 overflow-hidden bg-white/5"
          >
            <div className="aspect-video relative bg-black/20">
              {project.embedUrl ? (
                <iframe 
                  src={project.embedUrl} 
                  className="w-full h-full absolute inset-0"
                  frameBorder="0" 
                  allow="autoplay; fullscreen; picture-in-picture" 
                  allowFullScreen
                  title={project.title}
                />
              ) : (
                <div className="w-full h-full relative group-hover:scale-[1.02] transition-transform duration-700">
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                  {project.status && (
                    <div className="absolute top-4 right-4 bg-primary/90 text-background px-3 py-1 text-xs font-mono uppercase tracking-wider">
                      {project.status}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-8 space-y-4 bg-background">
              <h3 className="text-2xl font-bold font-sans tracking-tighter text-white">{project.title}</h3>
              <p className="font-sans text-zinc-400 text-sm leading-relaxed max-w-2xl">{project.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Film;
