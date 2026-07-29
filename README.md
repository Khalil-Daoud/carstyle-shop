# CARSTYLE

Site vitrine statique (HTML/CSS/JS) de CARSTYLE — Le Bardo, Tunis.

## Développement

```bash
npm install          # une seule fois
npm run watch:css    # recompile assets/tailwind.css à chaque modification
npm run serve        # http://localhost:8080
```

## ⚠️ Tailwind est compilé, plus chargé depuis le CDN

Les classes Tailwind sont pré-générées dans `assets/tailwind.css` (fichier versionné).
**Après toute modification de classes dans un `.html` ou dans `main.js`, il faut relancer :**

```bash
npm run build:css
```

sinon les nouvelles classes n'existeront pas dans la feuille de style.

## Médias

Les photos sont en WebP (`assets/*.webp`) et la vidéo hero est la version 720p
(`assets/vids/hero-720.mp4`) avec un poster (`hero-poster.webp`) affiché avant lecture.
Pour ajouter une photo, exporter en WebP (qualité ~78, largeur max 1024 px) plutôt qu'en PNG.
