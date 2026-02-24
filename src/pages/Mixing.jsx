import { motion } from 'framer-motion';

const Mixing = () => {
  return (
    <div className="container mx-auto px-6 py-32 max-w-5xl text-primary font-mono min-h-screen flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative border border-dashed border-primary/40 p-12 max-w-2xl w-full bg-background/50 backdrop-blur-md shadow-2xl"
      >
        <div className="absolute -top-4 left-8 bg-background px-4 font-mono text-sm tracking-widest text-[var(--hover-color)] border border-primary/20">
          +-- MIXING & MASTERING --+
        </div>

        <div className="space-y-8 text-center md:text-left">
          <p className="text-xl md:text-2xl leading-relaxed font-light">
            I offer professional <span className="font-bold text-[var(--hover-color)]">mixing and mastering</span> services for musicians, podcasts, film, and any media involving sound.
          </p>
          
          <div className="p-6 bg-primary/5 border-l-2 border-[var(--hover-color)] text-sm">
            <p className="italic text-secondary mb-2">Reference Work:</p>
            <p>
              Check out the <a href="https://crttrcollective.bandcamp.com/album/crttr-clb-009" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-4 hover:text-[var(--hover-color)] transition-colors">CRTTR-CLB</a> project, where I mastered all ten releases so far.
            </p>
          </div>
          
          <div className="pt-8 border-t border-primary/10 flex flex-col items-center md:items-start gap-4">
            <p className="text-lg">
              Please contact me for a <strong className="text-[var(--hover-color)]">free initial master</strong> and to discuss individual pricing.
            </p>
            <a 
              href="mailto:hi@yvesspiri.net" 
              className="inline-block px-8 py-3 bg-primary text-background font-bold tracking-wider hover:bg-[var(--hover-color)] transition-colors duration-300"
            >
              GET IN TOUCH
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Mixing;
