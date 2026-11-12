# 👾 PixelBot - Compagnon Tamagotchi Rétro

Un petit compagnon interactif en **Pixel Art (8-bit)** pensé pour recycler un ancien smartphone posé sur un bureau. Il réagit à la voix, aux bruits ambiants et aux caresses sur l'écran.

## ✨ Fonctionnalités
- **100% Pixel Art (Licence CC0 / Libre)** : 12 sprites PNG 16x16 upscalés proprement en 256x256 (`image-rendering: pixelated`).
- **Réveil sonore (Web Audio API)** :
  - **Silence** : Dort paisiblement (`Zzz...`).
  - **Voix douce / Clavier** : Se réveille joyeusement ou affiche des yeux en cœurs (`<3`).
  - **Bruit moyen (Rire, appel)** : Regard surpris (`Oh ?!`).
  - **Bruit fort / Choc** : Fronce les sourcils (`Trop de bruit !`).
- **Mode Caresse tactile** : Glisse le doigt sur l'écran pour le faire ronronner et vibrer (`^w^`).
- **Bruitages 8-bit intégrés** : Sons synthétisés façon GameBoy / Tamagotchi sans aucun fichier MP3 externe.
- **PWA & Wake Lock** : Fonctionne en plein écran via GitHub Pages (HTTPS natif, donc accès au micro autorisé directement sur Android).

## 🚀 Déploiement sur GitHub Pages (Recommandé pour Android)
1. Crée un nouveau dépôt sur GitHub (ex: `pixel-bot`).
2. Uploade tous les fichiers de cette archive (`index.html`, `style.css`, `app.js`, `manifest.json`, et le dossier `assets/`).
3. Va dans **Settings > Pages** sur ton dépôt GitHub, puis active la branche `main`.
4. Ouvre l'URL `https://<ton-pseudo>.github.io/pixel-bot/` sur le smartphone Android et fais **Ajouter à l'écran d'accueil** pour l'avoir en plein écran permanent !

## 🎨 Remplacer par d'autres packs Pixel Art gratuits (CC0 / Usage privé)
Si tu souhaites changer l'apparence du robot par un chat, un dinosaure ou un monstre, remplace simplement les images dans `assets/` par des sprites issus de ces banques libres de droits :
- **Kenney.nl (CC0 - Domaine Public)** : `https://kenney.nl/assets` (ex: *Animal Pack Redux*, *Pixel Platformer*).
- **OpenGameArt.org (CC0 / CC-BY)** : `https://opengameart.org/`
- **Itch.io Free Pixel Pets** : `https://itch.io/game-assets/free/tag-pixel-art/tag-creatures` (ex: *Dino Characters* par Arks ou *Cat Sprite Sheet* par Elthen).
