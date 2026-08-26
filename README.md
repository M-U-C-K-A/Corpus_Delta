# Corpus Delta

[![CI](https://github.com/M-U-C-K-A/Corpus_Delta/actions/workflows/ci.yml/badge.svg)](https://github.com/M-U-C-K-A/Corpus_Delta/actions/workflows/ci.yml)

Annuaire de publications scientifiques sur le climat et les risques naturels, doublé d'un
glossaire des termes techniques. Le site ne publie pas de recherche : il référence des
travaux existants et renvoie systématiquement à leur source.

## Principe

**Aucune métadonnée bibliographique n'est saisie à la main.** On fournit un DOI, un script
interroge OpenAlex (Crossref en repli) et écrit la fiche. Ce choix rend la fabrication de
références structurellement impossible et garde le corpus alignable sur sa source.

Le même principe s'applique aux graphiques : les séries chiffrées sont récupérées par script
chez leur producteur — NOAA, NASA, Atlas interactif du GIEC — versionnées avec leur date de
relevé, et cette provenance est affichée sous chaque graphique. Une série dont l'origine ne
peut pas être montrée n'est pas publiée.

Ce qui relève du jugement humain — rattachement thématique, choix d'inclusion, notes de
contexte, définitions du glossaire — est identifié comme tel et documenté sur la page
[Méthode](/fr/methodologie).

## Démarrer

```bash
pnpm install
pnpm dev
```

Le site est servi sur `http://localhost:3000`, redirigé vers `/fr`.

## Commandes

| Commande | Rôle |
|---|---|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build de production (lance `validate` au préalable) |
| `pnpm start` | Sert le build de production |
| `pnpm validate` | Valide schémas et renvois croisés entre contenus |
| `pnpm study:add <doi> --themes=…` | Ajoute une étude depuis son DOI |
| `pnpm datasets:fetch [id]` | Régénère les jeux de données des graphiques |
| `pnpm links:check` | Vérifie que les liens sortants répondent |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Vérification des types, sans émettre |
| `pnpm test` | Tests unitaires (Vitest) |

### Ajouter une étude

```bash
pnpm study:add 10.5194/essd-15-5301-2023 --themes=carbone,observation
```

`--themes` est obligatoire : le rattachement thématique est une décision éditoriale que le
script ne peut pas prendre. Les thèmes disponibles sont listés dans
`lib/content/taxonomy.ts`. Relancer la commande sur un DOI déjà présent rafraîchit les
métadonnées **sans écraser** l'apport rédactionnel.

Pour un rapport institutionnel sans DOI exploitable :

```bash
pnpm study:add --manual --title="…" --url=https://… --year=2023 --publisher="GIEC" --themes=politiques
```

### Régénérer les données des graphiques

```bash
pnpm datasets:fetch                        # tout
pnpm datasets:fetch co2-mauna-loa          # une seule série
```

Chaque source a son format, donc son analyseur, dans `scripts/fetch-datasets.ts`. Les séries
NOAA et NASA sont de simples fichiers tabulaires ; les projections par scénario demandent
une agrégation, isolée dans `scripts/lib/cmip6.ts`, qui télécharge 145 fichiers et prend
quelques minutes.

## Pages

| Section | URL française | Contenu |
|---|---|---|
| Études | `/fr/etudes` | L'annuaire, avec recherche et facettes |
| Glossaire | `/fr/glossaire` | Définitions sourcées des termes techniques |
| Dossiers | `/fr/dossiers` | Synthèses thématiques renvoyant à l'annuaire |
| Parcours | `/fr/parcours` | Séquences de lecture ordonnées |
| Indicateurs | `/fr/indicateurs` | Séries de référence et comparateur de scénarios |
| Quoi de neuf | `/fr/quoi-de-neuf` | Journal des ajouts, même source que le flux RSS |
| Méthode | `/fr/methodologie` | Le contrat du site avec son lecteur |

Une recherche globale est disponible partout au clavier (`⌘K` / `Ctrl+K`). Chaque langue
expose un flux RSS sur `/<lang>/rss.xml`.

## Organisation

```
app/[lang]/          Routes, segments anglais ; les URLs françaises viennent
                     des réécritures déclarées dans next.config.mjs
content/studies/     Une étude = un JSON, produit par le script d'ingestion
content/glossary/fr/ Définitions en MDX, source obligatoire
content/topics/fr/   Dossiers thématiques en MDX
content/paths/fr/    Parcours de lecture : séquences ordonnées d'étapes
data/datasets/       Séries chiffrées des graphiques, avec provenance
lib/content/         Schémas zod, chargeurs, citations, taxonomie
components/mdx/      Composants disponibles dans les MDX
components/dither-kit/ Graphiques tramés — voir son README pour les correctifs React 18
scripts/             Ingestion, validation, contrôle des liens
scripts/lib/         Agrégations trop volumineuses pour tenir dans un script
tests/               Tests des fonctions de calcul et invariants du corpus
archive/content-v1/  Contenu de la v1, conservé hors build. Les images, elles,
                     ne sont plus dans l'arbre de travail : le commit f61612c9
                     les conserve, `git show f61612c9:public/articles/…` les rend
```

### Écrire un dossier

Les composants suivants sont disponibles dans les fichiers MDX, sans import :

```mdx
<Chart dataset="co2-mauna-loa" kind="line" />
<DataTable dataset="co2-mauna-loa" xLabel="Année" />
<Figure src="/…" alt="…" credit="…" sourceUrl="https://…" />
<Cite id="friedlingstein-2023-global-carbon-budget-2023" />
<Term id="canicule">canicules</Term>
<Callout variant="uncertainty" title="…">…</Callout>
```

Les pastilles de thème, les bandeaux tramés et les vignettes Open Graph reprennent tous la
teinte définie une seule fois par thème dans `lib/content/taxonomy.ts`.

`Cite` et `Term` sont vérifiés au build : un renvoi vers une étude ou un terme inexistant
fait échouer `pnpm validate`, donc le déploiement.

## Sur les projections de scénarios

Le comparateur SSP de la page Indicateurs mérite une mise en garde, parce qu'il est le seul
contenu chiffré du site à ne pas être une observation.

Les fourchettes de réchauffement les plus citées — celles du tableau SPM.1 du sixième rapport
du GIEC — ne sont publiées qu'en PDF. Aucune version exploitable par script n'a été trouvée,
et les recopier à la main aurait été la seule entorse au principe ci-dessus. Le comparateur
s'appuie donc sur les séries CMIP6 agrégées que publie l'[Atlas interactif du
GIEC](https://github.com/IPCC-WG1/Atlas), agrégées à leur tour par
`scripts/lib/cmip6.ts` : moyennes annuelles globales par modèle, écart au préindustriel
1850-1900 propre à chaque modèle, puis médiane sur les modèles disposant à la fois du run
historique et des quatre scénarios.

**Ce n'est pas la même chose que les fourchettes évaluées par le GIEC.** L'AR6 a resserré
l'éventail CMIP6 en pondérant les modèles à forte sensibilité climatique ; la dispersion
brute affichée ici est plus large. La page le dit, et le calcul est vérifiable dans le script.

## Langues

Le français est la langue de rédaction. L'anglais est en place techniquement — routes,
métadonnées, interface traduite — et les pages anglaises servent l'annuaire, dont les
métadonnées sont indépendantes de la langue. Tant qu'un contenu rédactionnel n'est pas
traduit, la page anglaise affiche le français en le signalant explicitement, plutôt que de
renvoyer une page vide.

## Licence

MIT, voir [LICENSE](LICENSE).

Les métadonnées bibliographiques proviennent d'OpenAlex (CC0) et de Crossref. Les résumés
restent la propriété de leurs éditeurs et sont reproduits à des fins de référencement. Les
jeux de données conservent la licence de leur producteur, indiquée avec leur source.

Ce site est indépendant : il n'est affilié à aucune institution, revue ou organisation, et
ne relaie l'identité visuelle d'aucune d'entre elles.
