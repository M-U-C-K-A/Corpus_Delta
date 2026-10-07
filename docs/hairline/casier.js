/**
 * Casier: a printer's type case, its compartments of unequal size, each holding
 * a sort. The pointer is projected back onto the floor of the case and every
 * sort takes its height from its distance to it, on its own spring. At rest the
 * sorts sit at uneven heights and the deepest compartment keeps the bright
 * stroke. The slider is the reach, in case widths.
 *
 * The pattern: a continuous field. Springs, a falloff by distance, and a hit
 * test on the floor, which never moves whatever the sorts do.
 */
const {
  Cam, clamp, facing, fit, prism, proj, rings, unproj, spring, stepS,
  disposer, mk, pointer, put, reflect, register, solid,
} = HL;

const PAD = 5, WALL = 2.6, BASE = 4, RIM = 7;
const INSET = 2.2, HMIN = 1.6, HMAX = 17;

/** A type case is laid out in unequal compartments; these are the ten of it. */
const CELLS = [
  [4, 4, 30, 27], [32, 4, 58, 27], [60, 4, 106, 27],
  [4, 29, 24, 51], [26, 29, 46, 51], [48, 29, 68, 51], [70, 29, 106, 51],
  [4, 53, 38, 76], [40, 53, 70, 76], [72, 53, 106, 76],
];
const EXT_X = 110, EXT_Y = 80;

/** The share of full height at u reaches from the pointer: 1 → .33 at 42% → .08 beyond. */
const falloff = (u) =>
  u <= 0 ? 1 : u <= 0.42 ? 1 - (u / 0.42) * 0.67 : u <= 1 ? 0.33 - ((u - 0.42) / 0.58) * 0.25 : 0.08;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let R = value * 30;

  const C = Cam(45, 0.5, 1.72);
  fit(C, [
    [-PAD, -PAD, -BASE], [EXT_X + PAD, EXT_Y + PAD, -BASE],
    [EXT_X + PAD, -PAD, -BASE], [-PAD, EXT_Y + PAD, -BASE],
    [0, 0, RIM + HMAX],
  ], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [or_, oi] = rings(-PAD, -PAD, EXT_X + PAD, EXT_Y + PAD, 6, 1.8);
  reflect(svg, g, P, front, or_, -BASE, 14);
  // The case itself: a shallow tray the sorts stand in.
  put(solid(g), prism(P, front, or_, oi, -BASE, RIM));

  // Back to front, so a near sort covers the partition behind it.
  const order = CELLS.map((c, i) => ({ c, i })).sort((a, b) => (a.c[0] + a.c[1]) - (b.c[0] + b.c[1]));
  const sorts = [];
  for (const { c, i } of order) {
    const [x0, y0, x1, y1] = c;
    // The partitions: a thin wall standing just inside the compartment's edge.
    const [wr, wi] = rings(x0, y0, x1, y1, 3, WALL);
    put(solid(g), prism(P, front, wr, wi, RIM - 1.2, RIM));
    const [sr, si] = rings(x0 + INSET, y0 + INSET, x1 - INSET, y1 - INSET, 2.4, 1);
    // Rest is uneven: a case in use is never filled to one level.
    const h0 = HMIN + 2.4 + 7.5 * Math.abs(Math.sin(i * 1.9)) + (i % 3) * 1.4;
    sorts.push({ i, c, sr, si, h0, sp: spring(h0, { eps: 0.04 }), el: solid(g), drawn: NaN });
  }

  function draw(s) {
    const h = Math.max(HMIN, s.sp.x);
    if (h === s.drawn) return;
    s.drawn = h;
    put(s.el, prism(P, front, s.sr, s.si, RIM, RIM + h));
  }

  const B = register(stage, (dt) => {
    let moving = false;
    for (const s of sorts) { if (stepS(s.sp, dt)) moving = true; draw(s); }
    return moving;
  });
  bag.add(B.unregister);

  const centre = (c) => [(c[0] + c[2]) / 2, (c[1] + c[3]) / 2];
  const tallest = sorts.reduce((a, b) => (b.h0 > a.h0 ? b : a));
  let over = null;

  function retarget() {
    let pick = tallest;
    if (over) {
      let near = Infinity;
      for (const s of sorts) {
        const [cx, cy] = centre(s.c), d = Math.hypot(cx - over[0], cy - over[1]);
        s.sp.t = HMAX * falloff(d / R);
        // The compartment the pointer is inside, or the nearest one to it.
        const dx = Math.max(s.c[0] - over[0], 0, over[0] - s.c[2]);
        const dy = Math.max(s.c[1] - over[1], 0, over[1] - s.c[3]);
        const edge = Math.hypot(dx, dy);
        if (edge < near) { near = edge; pick = s; }
      }
    } else {
      for (const s of sorts) s.sp.t = s.h0;
    }
    for (const s of sorts) s.el.sil.classList.toggle("hi", s === pick);
    read.textContent = over ? "case " + String(pick.i + 1).padStart(2, "0") : "rest";
    B.wake();
  }

  retarget();

  bag.add(pointer(stage, {
    move: (p) => { over = unproj(C, p[0], p[1], RIM); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v * 30; if (over) retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "casier",
  means: "A type case of unequal compartments: the sorts rise under the pointer and settle again with distance.",
  rules: [1, 3, 5, 9],
  range: [0.9, 1.7, 3],
  mount,
});
