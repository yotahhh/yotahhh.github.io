// Site-level content (header, hero, about, services, footer).
// Project entries live in ./projects.js — both files are consumed by
// scripts/build-site.mjs to generate index.html.

export const siteMeta = {
  name: "Yves Spiri",
  title: "Yves Spiri — Sound, Music, Engineering",
  description:
    "Yves Spiri is a Zürich-based artist and MA Sound Design student at ZHdK, working across music, film, and live performance. Also releasing as Yotah.",
  email: "hi@yvesspiri.net",
};

export const hero = {
  eyebrow: "SOUND · MUSIC · ENGINEERING",
  title: "Yves Spiri",
  subtitle: "Zürich-based artist &#x26; MA Sound Design student at ZHdK<br />\nYotah — experimental club music",
};

// Typeface for the big name on the home page (the h1). Gaisyr is one of the
// template's own fonts, so it needs no external request; the character comes
// from the WebGL treatment in scripts/hero-effect.js instead of the face itself.
// Any Google Fonts family also works — set provider: "google" and the Cargo
// runtime loads it (e.g. "Instrument Serif", "Bodoni Moda", "Space Grotesk").
export const displayFont = {
  family: "Gaisyr",
  provider: "cargo",
  weight: 400,
  letterSpacing: "-0.02em",
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
    "I am a Zürich-based artist and MA Sound Design student at ZHdK, working across music, film, and live performance. With over ten years of practice spanning engineering, curation, composition, and DJing, my work moves fluidly between technical and creative roles. Yotah is my experimental club music project, one expression of a broader obsession with sound in all its forms.",
    "I am available for film and game scoring, mixing and mastering, and music production tutoring, online or in person.",
  ],
};

export const mixing = {
  heading: "Mixing &#x26; Mastering",
  lead:
    "I offer professional mixing and mastering services for musicians, podcasts, film, and any media involving sound.",
  referenceLabel: "References",
  // Each entry renders as a cover beside its text, like the film page — the
  // build reads the cover's intrinsic size, so the image must exist in images/.
  references: [
    {
      title: "CRTTR-CLB",
      artist: "CRTTR",
      image: "/images/crttr_clb_011.jpg",
      href: "https://crttrcollective.bandcamp.com/album/crttr-clb-011",
      text: "I mastered all ten releases in this club series so far. Pictured: CRTTR-CLB-011.",
      embedUrl:
        "https://bandcamp.com/EmbeddedPlayer/album=1297599169/size=small/bgcol=ffffff/linkcol=0687f5/transparent=true/",
    },
    {
      title: "Artificial Landscapes",
      artist: "Dane Itte",
      image: "/images/artificial_landscapes.jpg",
      href: "https://daneitte.bandcamp.com/album/artificial-landscapes",
      text: "I mixed and mastered this twelve-track album, released in May 2026.",
      embedUrl:
        "https://bandcamp.com/EmbeddedPlayer/album=615968157/size=small/bgcol=ffffff/linkcol=0687f5/transparent=true/",
    },
  ],
  closing:
    "Please contact me for a free initial master and to discuss individual pricing.",
  ctaLabel: "Get in touch ↗",
};
