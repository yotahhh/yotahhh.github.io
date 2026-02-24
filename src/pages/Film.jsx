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
            <div className="aspect-video relative">
              <iframe 
                src={project.embedUrl} 
                className="w-full h-full absolute inset-0"
                frameBorder="0" 
                allow="autoplay; fullscreen; picture-in-picture" 
                allowFullScreen
                title={project.title}
              />
            </div>
            <div className="p-8 space-y-4 bg-background">
              <h3 className="text-2xl font-bold font-mono tracking-tighter text-white">{project.title}</h3>
              <p className="font-mono text-zinc-400 text-sm leading-relaxed max-w-2xl">{project.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Film;
