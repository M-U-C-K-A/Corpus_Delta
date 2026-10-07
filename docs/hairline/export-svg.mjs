/**
 * Exporte chaque figure Hairline en SVG autonome, clair et sombre.
 *
 * Les pages Hairline dessinent leur figure en JavaScript et la peignent au
 * moyen de classes CSS. GitHub n'exécute ni l'un ni l'autre dans un README :
 * on ouvre donc la page, on laisse le dessin se stabiliser, puis on recopie le
 * SVG en figeant chaque trait en attribut.
 */
import { chromium } from "/Users/admin/Library/Caches/hairline-look/node_modules/playwright-core/index.mjs";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FIGURES = ["delta", "abri", "casier"];
const THEMES = ["light", "dark"];

/** Recopie le SVG de la page en remplaçant les classes par des attributs. */
function freeze() {
  const src = document.querySelector("svg");
  const out = src.cloneNode(true);
  const srcEls = [src, ...src.querySelectorAll("*")];
  const outEls = [out, ...out.querySelectorAll("*")];

  srcEls.forEach((s, i) => {
    const o = outEls[i];
    if (o === out || !(o instanceof SVGElement)) return;
    const cs = getComputedStyle(s);
    if (cs.stroke && cs.stroke !== "none") {
      o.setAttribute("stroke", cs.stroke);
      o.setAttribute("stroke-width", cs.strokeWidth);
      o.setAttribute("stroke-linejoin", "round");
      o.setAttribute("stroke-linecap", "round");
    } else {
      o.setAttribute("stroke", "none");
    }
    o.setAttribute("fill", cs.fill && cs.fill !== "none" ? cs.fill : "none");
    if (cs.strokeDasharray && cs.strokeDasharray !== "none") o.setAttribute("stroke-dasharray", cs.strokeDasharray);
    if (cs.opacity && cs.opacity !== "1") o.setAttribute("opacity", cs.opacity);
    o.removeAttribute("class");
  });

  out.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  out.removeAttribute("class");
  out.removeAttribute("style");
  return out.outerHTML;
}

const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });

for (const name of FIGURES) {
  for (const theme of THEMES) {
    const url = "file://" + resolve(`hairline-${name}.html`) + `?theme=${theme}`;
    await page.goto(url);
    // Les traits apparaissent en 260 ms et les ressorts mettent environ une seconde.
    await page.waitForTimeout(1800);
    const svg = await page.evaluate(freeze);
    const file = `${name}${theme === "dark" ? "-dark" : ""}.svg`;
    writeFileSync(file, svg + "\n");
    console.log(`  ${file}  ${(svg.length / 1024).toFixed(1)} Ko`);
  }
}

await browser.close();
