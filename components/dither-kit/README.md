# Dither Kit — composants tiers

Installés via `npx @dither-kit/cli add …`, puis suivis par `dither-kit.json`
(version + empreinte de contenu), ce qui permet `dither-kit diff` et
`dither-kit update`.

## Modifications locales

La bibliothèque cible **React 19** et utilise la forme abrégée
`<MonContext value={…}>`. Sur React 18 cette syntaxe ne rend pas un fournisseur
de contexte : elle échoue au rendu. Les occurrences ont donc été réécrites en
`<MonContext.Provider value={…}>` dans `area.tsx`, `bar.tsx`, `cartesian-root.tsx`
et `polar-root.tsx`.

`dither-kit diff` fera apparaître ces écarts, et `dither-kit update` les
écrasera : il faut les réappliquer après chaque mise à jour, ou migrer le projet
vers React 19 pour s'en dispenser.

Second écart, dans `cartesian-canvas.tsx` : React 19 type `RefObject<T>.current`
comme non-nul, React 18 le type `T | null`. Un alias `NonNullRef<T>` local remplace
les trois annotations concernées, ce qui supprime une cinquantaine d'erreurs de
typage sans toucher à la logique.

## Palette

Dither Kit expose sept teintes nommées. La correspondance entre nos treize thèmes
et ces sept couleurs vit dans `components/mdx/ChartCanvas.tsx`.
