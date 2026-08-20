# Corpus Delta

Annuaire de publications scientifiques sur le climat et les risques naturels, doublé d'un
glossaire des termes techniques. Le site ne publie pas de recherche : il référence des
travaux existants et renvoie systématiquement à leur source.

## Principe

**Aucune métadonnée bibliographique n'est saisie à la main.** On fournit un DOI, un script
interroge OpenAlex (Crossref en repli) et écrit la fiche. Ce choix rend la fabrication de
références structurellement impossible et garde le corpus alignable sur sa source.

Le même principe s'applique aux graphiques : les séries chiffrées sont récupérées depuis
leur producteur (NOAA, NASA), versionnées avec leur date de relevé, et cette provenance est
affichée sous chaque graphique.

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
| `pnpm validate` | Valide schémas et renvois croisés entre contenus |
| `pnpm study:add <doi> --themes=…` | Ajoute une étude depuis son DOI |
| `pnpm datasets:fetch [id]` | Régénère les jeux de données des graphiques |
| `pnpm links:check` | Vérifie que les liens sortants répondent |
| `pnpm datasets:fetch` | Récupère les séries NOAA et NASA |
| `pnpm lint` | ESLint |

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
scripts/             Ingestion, validation, contrôle des liens
archive/             Version 1 du site, conservée hors build
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
