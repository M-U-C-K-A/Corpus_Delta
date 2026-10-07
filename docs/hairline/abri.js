/**
 * Abri: a louvred weather screen on four legs, the instrument behind every
 * series the site plots. The pointer runs up and down the stack and the
 * louvres open under it, falling off with distance, each on its own spring.
 * At rest they are shut and slanted, and the top one keeps the bright stroke.
 *
 * The pattern: a continuous field. Springs, a falloff by distance, and a
 * reading taken from the resting screen heights, which never move.
 */
const {
  Cam, clamp, facing, fillet, fit, poly, prism, proj, rings, seg, spring, stepS,
  disposer, mk, pointer, put, register, reflect, solid,
} = HL;

const N = 4, W = 26, L = 30, LEG = 9, BODY = 56, ROOF = 5, POST = 4.4;
const SL = L - 4, SW = 21, SK = 1.6, SHUT = -47, OPEN = 5;
const TOP = LEG + BODY, Z0 = LEG + 7, DZ = (BODY - 14) / (N - 1);

const slatZ = (i) => Z0 + i * DZ;

/** The share of the full opening at u slats from the pointer: 1 → .34 → .11 → .04. */
const falloff = (u) =>
  u <= 0 ? 1 : u <= 0.45 ? 1 - (u / 0.45) * 0.66 : u <= 1 ? 0.34 - ((u - 0.45) / 0.55) * 0.23 : 0.04;

/** One louvre, as a rounded blade lying in its own plane. */
const blade = fillet(
  [[-SL, -SW / 2], [SL, -SW / 2], [SL, SW / 2], [-SL, SW / 2]],
  [2.4, 2.4, 2.4, 2.4],
);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let R = value;

  const C = Cam(45, 0.5, 2.04);
  fit(C, [
    [-W - 5, -L - 5, 0], [W + 5, L + 5, 0], [W + 5, -L - 5, 0], [-W - 5, L + 5, 0],
    [-W - 5, -L - 5, TOP + ROOF], [W + 5, L + 5, TOP + ROOF],
  ], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [rr] = rings(-W - 5, -L - 5, W + 5, L + 5, 6, 1.6);
  reflect(svg, g, P, front, rr, 0, 14);

  // Posts, far pair first: a near post must cover the louvre ends behind it.
  const px = W - POST / 2, py = L - POST / 2;
  const corners = [[-px, -py], [px, -py], [-px, py], [px, py]];
  const post = (cx, cy) => {
    const [ring, inner] = rings(cx - POST / 2, cy - POST / 2, cx + POST / 2, cy + POST / 2, 1.5, 0.7);
    put(solid(g), prism(P, front, ring, inner, 0, TOP));
  };
  post(corners[0][0], corners[0][1]);
  post(corners[1][0], corners[1][1]);
  post(corners[2][0], corners[2][1]);

  // The louvres, shut at rest, painted bottom to top so each overlaps the one below.
  const slats = [];
  for (let i = 0; i < N; i++) {
    const grp = mk("g", {}, g);
    slats.push({
      i,
      back: mk("path", { class: "lo" }, grp),
      face: mk("path", { class: "sil" }, grp),
      edge: mk("path", { class: "nf lo" }, grp),
      sp: spring(SHUT, { eps: 0.05 }),
      drawn: NaN,
    });
  }

  post(corners[3][0], corners[3][1]);

  // The roof, overhanging on every side, painted last: it covers the post tops.
  const [rg, ri] = rings(-W - 5, -L - 5, W + 5, L + 5, 6, 1.8);
  put(solid(g), prism(P, front, rg, ri, TOP, TOP + ROOF));

  /** Louvre i tilted th degrees about its own length. */
  function draw(s) {
    const th = s.sp.x;
    if (th === s.drawn) return;
    s.drawn = th;
    const z = slatZ(s.i), sn = Math.sin(th * Math.PI / 180), cs = Math.cos(th * Math.PI / 180);
    const w = (u, v) => P(v * cs, u, z + v * sn);
    const wb = (u, v) => P(v * cs + SK * sn, u, z + v * sn - SK * cs);
    s.back.setAttribute("d", poly(blade.map((p) => wb(p[0], p[1]))));
    s.face.setAttribute("d", poly(blade.map((p) => w(p[0], p[1]))));
    s.edge.setAttribute("d", seg(w(-SL + 3, 0), w(SL - 3, 0)));
  }

  const B = register(stage, (dt) => {
    let moving = false;
    for (const s of slats) { if (stepS(s.sp, dt)) moving = true; draw(s); }
    return moving;
  });
  bag.add(B.unregister);

  // The reading runs along the louvres' RESTING centres on screen, which never move.
  const yOf = (i) => P(0, 0, slatZ(i))[1];
  const yTop = yOf(N - 1), yBot = yOf(0);

  let over = null;
  function retarget() {
    for (const s of slats) {
      s.sp.t = over === null ? SHUT : SHUT + (OPEN - SHUT) * falloff(Math.abs(s.i - over) / R);
    }
    if (over === null) {
      read.textContent = "rest";
      slats.forEach((s, i) => s.face.classList.toggle("hi", i === N - 1));
    } else {
      const a = clamp(Math.round(over), 0, N - 1);
      read.textContent = "lame " + String(a + 1).padStart(2, "0");
      slats.forEach((s, i) => s.face.classList.toggle("hi", i === a));
    }
    B.wake();
  }

  retarget();

  bag.add(pointer(stage, {
    move: ([, sy]) => { over = clamp(((yBot - sy) / (yBot - yTop)) * (N - 1), -0.6, N - 0.4); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v; if (over !== null) retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "abri",
  means: "A louvred weather screen: the louvres open under the pointer and shut again with distance.",
  rules: [1, 3, 5, 8],
  range: [0.7, 2.2, 3.6],
  mount,
});
