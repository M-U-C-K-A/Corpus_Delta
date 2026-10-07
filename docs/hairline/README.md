# Figures

Trois dessins isométriques qui accompagnent le README du dépôt, faits avec
[Hairline](https://github.com/lucasmarkes/hairline) : une figure, une idée, un
seul trait en quatre épaisseurs.

| Fichier | Objet | Ce que fait le pointeur |
|---|---|---|
| `delta.js` | la marque du site bâtie en volume, cinq strates empilées | tire une strate vers le lecteur, les voisines suivent de moins en moins |
| `abri.js` | un abri météorologique à persiennes | ouvre les lames sous lui, l'ouverture décroît avec la distance |
| `casier.js` | une casse d'imprimeur aux cases inégales | fait monter les caractères proches, les autres redescendent |

## Reconstruire

```bash
node ~/.claude/skills/hairline-create/look.mjs delta.js --answer 6.6,0,42.5 --edge 35,35,13
```

La commande rebâtit `hairline-delta.html`, le valide, prend les huit vues de
contrôle et vérifie le cadre, le relevé et la console.

## Réexporter les SVG

```bash
node export-svg.mjs
```

Les pages Hairline dessinent en JavaScript et peignent par classes CSS, deux
choses qu'un README GitHub n'exécute pas. Le script ouvre chaque page, attend
que le dessin se stabilise, puis recopie le SVG en figeant chaque trait en
attribut. Il produit une version claire et une version sombre, que le README
sélectionne avec `<picture>`.
