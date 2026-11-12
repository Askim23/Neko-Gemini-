# PixelBot 🤖

PixelBot transforme un ancien smartphone Android en compagnon de bureau rétro en Pixel Art.

## Contenu
- `index.html` : interface et scène du compagnon
- `style.css` : habillage arcade responsive
- `app.js` : microphone, analyse du volume, émotions, caresses et sons 8-bit
- `manifest.json` : configuration PWA portrait
- `sw.js` : cache hors ligne
- `assets/` : 12 sprites Pixel Art (16×16) et icônes PWA

## Mise en ligne sur GitHub Pages
1. Crée un dépôt GitHub, par exemple `pixel-bot`.
2. Décompresse cette archive et envoie **le contenu** du dossier à la racine du dépôt.
3. Dans **Settings → Pages**, choisis `Deploy from a branch`, la branche `main` et le dossier `/ (root)`.
4. Attends la publication puis ouvre l'URL HTTPS fournie par GitHub Pages.
5. Sur Android, ouvre la page dans Chrome, accepte le microphone, puis utilise le menu du navigateur → **Ajouter à l'écran d'accueil**.

## Première utilisation
- Appuie sur **ACTIVER LE MICRO** : le navigateur demandera l'autorisation.
- Le niveau sonore est analysé localement. Aucun son n'est enregistré ni envoyé.
- Touche ou fais glisser ton doigt sur le robot pour le caresser.
- Le bouton **SON ON/OFF** coupe ou réactive les effets sonores générés par le navigateur.

## États
- Silence prolongé : sommeil (`Zzz...`)
- Son doux : écoute / affection
- Pic moyen : surprise pendant environ 3 secondes
- Pic fort : colère pendant environ 4 secondes
- Contact tactile : ronron pendant environ 2,4 secondes

Les seuils audio sont configurables au début de `app.js`, dans l'objet `config`.

## Notes techniques et limites Android
- Le microphone nécessite HTTPS (GitHub Pages convient) et une autorisation explicite de l'utilisateur.
- L'écoute démarre uniquement après un appui sur le bouton : c'est une exigence habituelle des navigateurs.
- `Wake Lock` demande à empêcher l'extinction de l'écran, mais Android, le navigateur, le mode économie d'énergie ou la surchauffe peuvent tout de même interrompre l'activité.
- Pour un affichage réellement permanent, branche le téléphone, désactive l'optimisation batterie pour le navigateur et vérifie les réglages de mise en veille de l'appareil.
- Le navigateur peut limiter le micro lorsque l'onglet passe en arrière-plan ou lorsque l'écran est verrouillé. Garde PixelBot au premier plan.
- La police Press Start 2P est chargée depuis Google Fonts ; en cas d'absence de réseau, une police monospace de secours sera utilisée.

## Confidentialité
Le flux micro reste dans le navigateur : l'application calcule un niveau RMS et ne conserve ni n'envoie de fichier audio.
