/**
 * Delta: the site's mark built as a solid. Five plates stacked, each narrower
 * than the one below, so the silhouette is the striated delta of Corpus Delta.
 * The pointer pulls one stratum out towards the viewer; its neighbours follow
 * less and less, staggered outwards from it on the 700ms lift curve. At rest
 * the stack leans, and the apex keeps the bright stroke.
 *
 * The pattern: discrete items. Tweens, a stagger by distance, and a hit test
 * on each plate's resting top, so a plate sliding out from under the pointer
 * cannot flip the choice.
 */
const {
  Cam, clamp, facing, fit, prism, proj, rings, unproj,
  tdone, tset, tval, tween, disposer, mk, pointer, put, register, reflect, solid,
} = HL;

const N = 5, W0 = 44, DW = 7.5, GAP = 3;
const SLIDE = 30, LIFT = 6;
/** Unequal thicknesses and an uneven lean: strata are not a machined pyramid. */
const THICK = [13, 8, 11.5, 7, 10];
const LEANS = [0, 4.2, 6.6, 3.1, 7.8];

const half = (i) => W0 - i * DW;
const lean = (i) => LEANS[i];
const foot = (i) => THICK.slice(0, i).reduce((s, t) => s + t + GAP, 0);

/** The share of the full pull at d plates from the one chosen: 1 → .40 → .16 → .05. */
const falloff = (d) => (d === 0 ? 1 : d === 1 ? 0.4 : d === 2 ? 0.16 : 0.05);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  // Fitted to the foot plate pulled all the way out, so no pose leaves the frame.
  const C = Cam(45, 0.5, 1.92);
  const w0 = half(0), wt = half(N - 1), zt = foot(N - 1) + THICK[N - 1];
  fit(C, [
    [-w0, -w0, 0], [w0 + SLIDE, w0, 0], [w0 + SLIDE, -w0, 0], [-w0, w0, 0],
    [lean(N - 1) - wt, -wt, zt + LIFT], [lean(N - 1) + wt, wt, zt + LIFT],
  ], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [r0] = rings(-w0, -w0, w0, w0, 7, 1.6);
  reflect(svg, g, P, front, r0, 0, 15);

  // Painted foot to apex: a plate resting on another covers its top face.
  const plates = [];
  for (let i = 0; i < N; i++) {
    plates.push({ i, el: solid(g), out: tween(0), up: tween(0), drawn: NaN, lifted: NaN });
  }

  /** Plate i pulled `out` along +x and raised by `up`. */
  function draw(p) {
    const o = tval(p.out, now0), u = tval(p.up, now0);
    if (o === p.drawn && u === p.lifted) return;
    p.drawn = o; p.lifted = u;
    const w = half(p.i), cx = lean(p.i) + o, z = foot(p.i) + u;
    const [ring, inner] = rings(cx - w, -w, cx + w, w, 7 - p.i * 0.6, 1.6);
    put(p.el, prism(P, front, ring, inner, z, z + THICK[p.i]));
  }

  let now0 = performance.now();
  const B = register(stage, (_dt, now) => {
    now0 = now;
    let moving = false;
    for (const p of plates) {
      draw(p);
      if (!tdone(p.out, now) || !tdone(p.up, now)) moving = true;
    }
    return moving;
  });
  bag.add(B.unregister);

  /**
   * The plate whose resting top the pointer sits nearest the middle of. Taking
   * the highest plate that merely contains the point picks the one behind a
   * raised top instead: seen from above, a screen point over a low plate also
   * falls inside a higher, smaller plate's plane.
   */
  function hit([sx, sy]) {
    let best = -1, near = Infinity;
    for (let i = 0; i < N; i++) {
      const [x, y] = unproj(C, sx, sy, foot(i) + THICK[i]);
      const w = half(i);
      const d = Math.max(Math.abs(x - lean(i)), Math.abs(y)) / w;
      if (d <= 1 && d < near) { near = d; best = i; }
    }
    return best;
  }

  let act = -1;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    for (const p of plates) {
      const d = Math.abs(p.i - from);
      tset(p.out, a < 0 ? 0 : SLIDE * falloff(Math.abs(p.i - a)), now, d * stag);
      tset(p.up, a === p.i ? LIFT : 0, now, d * stag);
      // One highlight: the apex holds it at rest, and gives it up to the plate chosen.
      p.el.sil.classList.toggle("hi", a < 0 ? p.i === N - 1 : p.i === a);
    }
    // A plate pulled towards the viewer has to cover the ones behind it.
    if (a >= 0) g.appendChild(plates[a].el.g);
    else for (const p of plates) g.appendChild(p.el.g);
    read.textContent = a < 0 ? "rest" : "strate " + String(a + 1).padStart(2, "0");
    B.wake();
  }

  setActive(-1);
  act = -1;
  plates[N - 1].el.sil.classList.add("hi");
  read.textContent = "rest";

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { stag = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "delta",
  means: "Five stacked strata in the shape of a delta: the pointer pulls one out, and its neighbours follow less and less.",
  rules: [1, 2, 5, 9],
  range: [0, 45, 100],
  mount,
});
