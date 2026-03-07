import { motion } from 'framer-motion';

const Home = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="container mx-auto px-6 py-12 md:py-32 max-w-4xl text-primary font-sans leading-relaxed"
    >
      <div className="flex flex-col md:flex-row gap-12 items-start">
        <div className="w-full md:w-1/3 relative group md:mt-2">
          <div className="aspect-[3/4] overflow-hidden border border-primary/30 relative">
            <img 
              src="/images/yves.jpg" 
              alt="Yves Spiri" 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
          </div>
          <p className="mt-2 text-xs text-secondary italic text-right">Photo by <a href="https://instagram.com/zoec.lemence" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--hover-color)] transition-colors">@zoec.lemence</a></p>
        </div>

        <div className="w-full md:w-2/3 space-y-8 text-sm md:text-base">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8 text-primary leading-none">
            Sound, Music,<br />
            <span className="text-secondary/50">Engineering.</span>
          </h1>

          <p>
            I am a Bern-based artist and MA Sound Design student at ZHdK, working across music, film, and live performance. With over ten years of practice spanning engineering, curation, composition, and DJing, my work moves fluidly between technical and creative roles. Yotah is my experimental club music project, one expression of a broader obsession with sound in all its forms.
          </p>
          
          <p>
            I am available for film and game scoring, mixing and mastering, and music production tutoring, online or in person.
          </p>

          <div className="pt-8 border-t border-primary/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs tracking-wider uppercase font-mono">
            <div>
              <span className="text-secondary block mb-1">Email</span>
              <a href="mailto:hi@yvesspiri.net" className="hover:text-[var(--hover-color)] transition-colors">hi@yvesspiri.net</a>
            </div>
            <div>
              <span className="text-secondary block mb-1">Instagram</span>
              <a href="https://instagram.com/yotahmusic" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--hover-color)] transition-colors">@yotahmusic</a>
            </div>
            <div>
              <span className="text-secondary block mb-1">Spotify</span>
              <a href="https://open.spotify.com/artist/7fs3wG76Bmdh2z3MIh2uib" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--hover-color)] transition-colors">Yotah</a>
            </div>
            <div>
              <span className="text-secondary block mb-1">SoundCloud</span>
              <a href="https://soundcloud.com/yotahh" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--hover-color)] transition-colors">soundcloud.com/yotahh</a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Home;
