// Colour themes, switchable from the swatches in the page header.
//
// The default theme is written as the base :root, the others as
// :root[data-theme="…"] overrides. "backroom" is the original design; the
// others are drawn from reference images in palettes/ (git-ignored, local
// only): surfaces from their light areas, ink from their darkest, the accent
// ("rust" in token names) from their most saturated colour. Text stays dark on light in every theme, and the
// build checks every text/surface pair for at least 4.5:1 contrast.

export const defaultTheme = "dumbo";

export const themes = [
  {
    // the octopus: pale sky blue skin, burnt orange fins, moss behind
    id: "dumbo",
    label: "dumbo",
    swatch: ["#7F8F80", "#D2652E"],
    tokens: {
      ground: "#97A596",
      window: "#C8D6E4",
      paper: "#E0E9F2",
      button: "#D1DDE9",
      "row-hover": "#B4C6D8",
      "row-current": "#E6C8B0",
      ink: "#18241B",
      "ink-2": "#223326",
      "ink-3": "#2F4234",
      "ink-4": "#394B3D",
      rust: "#8E3B12",
      "rust-btn": "#D2652E",
      "led-dead": "#576350",
      "led-alarm": "#D2652E",
      "f-about": "#A78567",
      "f-music": "#3A9CBE",
      "f-film": "#8E3B12",
      "f-live": "#576350",
      "f-sound": "#6FA9C5",
      "bevel-dark": "#97A8BA",
      "bevel-light": "#F2F6FA",
    },
  },
  {
    // the glitter face: mauve skin, violet shadow, green and pink glitter
    id: "glitter",
    label: "glitter",
    swatch: ["#A88F98", "#1F6B55"],
    tokens: {
      ground: "#B09AA3",
      window: "#DDCED5",
      paper: "#EEE4E9",
      button: "#E4D8DE",
      "row-hover": "#CFBCC5",
      "row-current": "#C4D8CB",
      ink: "#1A1822",
      "ink-2": "#28282F",
      "ink-3": "#38343F",
      "ink-4": "#443E4A",
      rust: "#1F6B55",
      "rust-btn": "#D385B1",
      "led-dead": "#7D5C68",
      "led-alarm": "#C2186B",
      "f-about": "#7D5C68",
      "f-music": "#254665",
      "f-film": "#72454D",
      "f-live": "#235B4F",
      "f-sound": "#6DA587",
      "bevel-dark": "#A8939D",
      "bevel-light": "#F7F1F4",
    },
  },
  {
    // the original design: damp green-grey wall, beige windows, rust
    id: "backroom",
    label: "backroom",
    swatch: ["#A9AB8C", "#7A3B26"],
    tokens: {
      ground: "#A9AB8C",
      window: "#CFC9AE",
      paper: "#DCD6C1",
      button: "#D5CFB6",
      "row-hover": "#C3BDA2",
      "row-current": "#B4B995",
      ink: "#1E211C",
      "ink-2": "#33352A",
      "ink-3": "#45463A",
      "ink-4": "#4E4F42",
      rust: "#7A3B26",
      "rust-btn": "#8E4E34",
      "led-dead": "#6E6C55",
      "led-alarm": "#9A2E1C",
      "f-about": "#7C6838",
      "f-music": "#55606C",
      "f-film": "#7A3B26",
      "f-live": "#6E6F62",
      "f-sound": "#62786B",
      "bevel-dark": "#9E9881",
      "bevel-light": "#EEEADB",
    },
  },
  {
    // the glare: steel light through glass, near-black, one edge of deep red
    id: "glare",
    label: "glare",
    swatch: ["#8E9AA8", "#7E0A11"],
    tokens: {
      ground: "#9AA5B2",
      window: "#C9D1DA",
      paper: "#E6EBF0",
      button: "#D3DAE2",
      "row-hover": "#B8C2CD",
      "row-current": "#D8BFC1",
      ink: "#0C0809",
      "ink-2": "#1D151A",
      "ink-3": "#30323A",
      "ink-4": "#3D4048",
      rust: "#7E0A11",
      "rust-btn": "#B0262A",
      "led-dead": "#525B66",
      "led-alarm": "#C0121A",
      "f-about": "#616B78",
      "f-music": "#393C45",
      "f-film": "#7E0A11",
      "f-live": "#7E8B9A",
      "f-sound": "#B0BECE",
      "bevel-dark": "#8E99A6",
      "bevel-light": "#F5F7FA",
    },
  },
];
