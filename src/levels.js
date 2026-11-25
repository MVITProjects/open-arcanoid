// One string per row, 10 chars per string (CONFIG.BLOCKS.cols).
// . = empty, r/y/c/m/h/g = red/yellow/cyan/magenta/hotpink/green
const LEVEL_COLORS = {
  r: "red",
  y: "yellow",
  c: "cyan",
  m: "magenta",
  h: "hotpink",
  g: "green",
};

const LEVELS = [
  // 1 — Classic: the original 6 full rows
  [
    "rrrrrrrrrr",
    "yyyyyyyyyy",
    "cccccccccc",
    "mmmmmmmmmm",
    "hhhhhhhhhh",
    "gggggggggg",
  ],
  // 2 — Pyramid
  [
    "....rr....",
    "...yyyy...",
    "..cccccc..",
    ".mmmmmmmm.",
    "hhhhhhhhhh",
    "gggggggggg",
  ],
  // 3 — Checkerboard
  [
    "r.r.r.r.r.",
    ".y.y.y.y.y",
    "c.c.c.c.c.",
    ".m.m.m.m.m",
    "h.h.h.h.h.",
    ".g.g.g.g.g",
  ],
  // 4 — Frame
  [
    "rrrrrrrrrr",
    "y........y",
    "c.hhhhhh.c",
    "m.hhhhhh.m",
    "g........g",
    "gggggggggg",
  ],
  // 5 — Dense weave (8 rows)
  [
    "rrrrrrrrrr",
    "yyyyyyyyyy",
    "cccccccccc",
    "m.m.m.m.m.",
    ".h.h.h.h.h",
    "m.m.m.m.m.",
    ".h.h.h.h.h",
    "gggggggggg",
  ],
];
