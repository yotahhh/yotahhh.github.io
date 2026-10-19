// Site-level content: meta, readme, about, mixing & mastering, links.
// Project entries live in ./projects.js. Both files are consumed by
// scripts/build-site.mjs to generate the static pages.
//
// Copy rules from the design brief: no em dashes, no all caps, dates as
// DD.MM.YY. Text may contain inline HTML (links, &amp; entities).

export const siteMeta = {
  name: "Yves Spiri",
  domain: "yvesspiri.net",
  description:
    "Yves Spiri is an artist based in Zürich and a Master's student in Sound Design at ZHdK. The work spans music, film, and live performance. Music released as Yotah.",
  email: "hi@yvesspiri.net",
};

// The readme.txt window on the home page.
export const readme = [
  "Artist based in Zürich. Master's student in Sound Design at ZHdK.",
  'The work moves between music, film and live performance. Music is released as <a href="/music/">Yotah</a>.',
];

// The track in the home page player. The audio itself is prepared by
// scripts/encode-landing.mjs, which writes src/data/landing-track.json.
export const landingTrack = {
  title: "Fight Fears Today",
  note: "unreleased",
};

export const links = [
  { label: "instagram", display: "@yotahmusic", href: "https://instagram.com/yotahmusic" },
  { label: "spotify", display: "Yotah", href: "https://open.spotify.com/artist/7fs3wG76Bmdh2z3MIh2uib" },
  { label: "soundcloud", display: "soundcloud.com/yotahh", href: "https://soundcloud.com/yotahh" },
  { label: "bandcamp", display: "CRTTR", href: "https://crttrcollective.bandcamp.com" },
];

export const about = {
  image: "/images/yves.jpg",
  photoCredit: { display: "@zoec.lemence", href: "https://instagram.com/zoec.lemence" },
  paragraphs: [
    "I am a Zürich-based artist and MA Sound Design student at ZHdK, working across music, film, and live performance. With over ten years of practice spanning engineering, curation, composition, and DJing, my work moves fluidly between technical and creative roles. Yotah is my experimental club music project, one expression of a broader obsession with sound in all its forms.",
    "I am available for film and game scoring, mixing and mastering, and music production tutoring, online or in person.",
  ],
};

export const mixing = {
  lead:
    "I offer professional mixing and mastering services for musicians, podcasts, film, and any media involving sound.",
  references: [
    {
      id: "crttr-clb",
      title: "CRTTR-CLB",
      artist: "CRTTR",
      image: "/images/crttr_clb_011.jpg",
      href: "https://crttrcollective.bandcamp.com/album/crttr-clb-011",
      text: "I mastered all ten releases in this club series so far. Pictured: CRTTR-CLB-011.",
      embedUrl:
        "https://bandcamp.com/EmbeddedPlayer/album=1297599169/size=small/bgcol=ffffff/linkcol=0687f5/transparent=true/",
    },
    {
      id: "artificial-landscapes",
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
};
