// Site-level content (header, hero, about, services, footer).
// Project entries live in ./projects.js — both files are consumed by
// scripts/build-site.mjs to generate index.html.

export const siteMeta = {
  name: "Yves Spiri",
  title: "Yves Spiri — Sound, Music, Engineering",
  description:
    "Yves Spiri is a Bern-based artist and MA Sound Design student at ZHdK, working across music, film, and live performance. Also releasing as Yotah.",
  email: "hi@yvesspiri.net",
  place: "BERN/CH",
  year: "2026",
};

export const hero = {
  eyebrow: "SOUND · MUSIC · ENGINEERING",
  title: "Yves Spiri",
  subtitle: "Bern-based artist &#x26; MA Sound Design student at ZHdK<br />\nYotah — experimental club music",
};

export const links = [
  { label: "Instagram", display: "@yotahmusic", href: "https://instagram.com/yotahmusic" },
  { label: "Spotify", display: "Yotah", href: "https://open.spotify.com/artist/7fs3wG76Bmdh2z3MIh2uib" },
  { label: "SoundCloud", display: "soundcloud.com/yotahh", href: "https://soundcloud.com/yotahh" },
  { label: "Bandcamp", display: "CRTTR", href: "https://crttrcollective.bandcamp.com" },
];

export const about = {
  image: "/images/yves.jpg",
  photoCredit: { display: "@zoec.lemence", href: "https://instagram.com/zoec.lemence" },
  heading: "Sound, Music, Engineering.",
  paragraphs: [
    "I am a Bern-based artist and MA Sound Design student at ZHdK, working across music, film, and live performance. With over ten years of practice spanning engineering, curation, composition, and DJing, my work moves fluidly between technical and creative roles. Yotah is my experimental club music project, one expression of a broader obsession with sound in all its forms.",
    "I am available for film and game scoring, mixing and mastering, and music production tutoring, online or in person.",
  ],
};

export const mixing = {
  heading: "Mixing &#x26; Mastering",
  lead:
    "I offer professional mixing and mastering services for musicians, podcasts, film, and any media involving sound.",
  referenceLabel: "Reference",
  reference:
    'Check out the <a href="https://crttrcollective.bandcamp.com/album/crttr-clb-009" target="_blank"><u>CRTTR-CLB</u></a> project, where I mastered all ten releases so far.',
  closing:
    "Please contact me for a free initial master and to discuss individual pricing.",
  ctaLabel: "Get in touch ↗",
};
