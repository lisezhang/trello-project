# CLAUDE.md - Analyse du Projet Trello Clone avec Carte

## Résumé du Projet

Application web de type **Trello (Kanban)** enrichie d'une **carte interactive Leaflet/OpenStreetMap** pour géolocaliser les cartes. L'application permet de gérer des listes de tâches, des cartes détaillées avec adresses géolocalisées, et offre une visualisation cartographique complète.

**Stack technique** : HTML5, CSS3, JavaScript ES6+ (vanilla), Leaflet.js 1.9.4, OpenStreetMap, API Nominatim, Unsplash (images prédéfinies)

## Structure des Fichiers

```
trello-project/
├── index.html          # Structure HTML et modals
├── styles.css          # Styles CSS (layout, composants, responsive)
├── app.js              # Logique JavaScript complète
├── CLAUDE.md           # Documentation du projet
├── README.md           # Readme initial
└── trello-projet.md    # Specs originales (format RTF)
```

### Dépendances externes (CDN)
- Font Awesome 6.4.0 (icônes)
- Leaflet 1.9.4 (cartographie)

---

## Fonctionnalités Réalisées

### 1. Gestion des Listes
- Création de listes avec nom personnalisé
- Renommage en édition inline (clic sur le titre)
- Suppression avec choix : déplacer vers "Archives" ou supprimer les cartes
- Drag & drop des cartes entre listes

### 2. Gestion des Cartes
- Création avec : titre (obligatoire), description, adresse (auto-complétion), coordonnées GPS, date d'échéance, étiquettes (8 couleurs)
- **Image de couverture** : recherche par mots-clés (collections Unsplash prédéfinies)
- Affichage des labels colorés sur chaque carte
- **Miniature de l'image** affichée sur la carte dans le board
- Drag & drop entre colonnes
- Suppression depuis le menu "..." du modal de détail

### 3. Modal de Détail
- **Image de couverture** : affichée en haut du modal
- **Recherche d'image** : champ de recherche par mots-clés (monuments, lieux, restaurants...)
- **Import d'image** : upload depuis l'ordinateur/téléphone (stockage Base64, max 5Mo)
- **Lien externe** : coller une URL d'image depuis Google Images ou autre
- **Suppression de l'image** : via le menu "..." (options de la carte)
- **Titre** : édition inline + historisation
- **Description** : édition textarea + sauvegarde blur/Enter
- **Étiquettes** : sélecteur multi-couleurs
- **Date d'échéance** : champ date éditable
- **Adresse** : édition + auto-complétion Nominatim + mise à jour des coordonnées

### 4. Modal d'Ajout de Carte
- Mêmes fonctionnalités d'image que le modal de détail :
  - Recherche par mots-clés
  - Import depuis fichier
  - Coller un lien externe
- Mini-carte affichée après sélection d'une adresse

### 5. Auto-complétion d'Adresses
- Debounce 500ms sur la saisie
- Appel API Nominatim
- Stockage automatique des coordonnées GPS
- Disponible dans le modal d'ajout ET le modal de détail

### 6. Mini-carte (Modal Détail)
- **Affichage conditionnel** : la mini-carte n'apparaît que si la carte possède des coordonnées valides
- Affiche tous les points avec coordonnées
- Marqueur spécial (plus gros) pour la carte courante
- Popup complet sur chaque marqueur
- Recentrage de la mini-carte uniquement au clic

### 7. Grande Carte (Vue Map)
- Marqueurs préchargés au démarrage
- Centrage intelligent (`fitBounds`) avec padding et maxZoom
- Barre de recherche de lieu
- Bouton "Recentrer sur les marqueurs"
- Bouton "Masquer les marqueurs (visuel)"
- Conservation de la vue même après suppression de toutes les cartes

### 8. Checklist
- Ajout/suppression d'items
- Checkbox coché/décoché
- Historisation de toutes les actions

### 9. Historique
- Log de toutes les actions : création, modifications, checklist, images
- Affichage avec timestamp localisé (fr-FR)

### 10. Vue Board vs Map
- Toggle entre vue Kanban et vue Carte
- Vue active persistée dans localStorage

### 11. Persistance
- `trelloLists` et `trelloCards` dans localStorage
- Vue active (board/map) persistée
- Dernière position de la carte (centre + zoom) persistée

### 12. Gestion Mobile (Clavier Virtuel)
- **Détection du clavier** : utilise l'API `visualViewport` (iOS/Android) avec fallback sur `window.resize`
- **Scroll intelligent** : scroll minimal uniquement si l'élément focusé n'est pas visible dans la zone centrale (20%-70% de l'écran)
- **Scroll manuel libre** : l'utilisateur peut scroller librement pour voir le haut (header, image de couverture) ou le bas de la modal à tout moment
- **Pas de scroll agressif** : contrairement à un centrage forcé, le système ne scroll que si nécessaire pour rendre l'input visible
- **Modal alignée en haut** : sur mobile, la modal reste en haut de l'écran (pas centrée) même après fermeture du clavier
- **Couverture complète garantie** : le backdrop du modal couvre TOUJOURS tout l'écran avec `position: fixed` + `top/left/right/bottom: 0` + `width: 100vw` + `height: 100vh`
- **Hauteur fixe du modal** : le modal garde `height: 100vh` même quand le clavier est ouvert (ne jamais utiliser `--visual-viewport-height` pour la hauteur du modal, sinon le fond du board apparaît)
- **Overlay adaptatif** : overlay plus sombre (`rgba(0,0,0,0.7)` normal, `rgba(0,0,0,0.85-0.9)` avec clavier) pour masquer l'arrière-plan
- **Variables CSS dynamiques** :
  - `--visual-viewport-height` : hauteur visible du viewport (pour calculs internes uniquement, NE PAS utiliser pour la hauteur du modal)
  - `--visual-viewport-offset` : décalage du viewport (utile sur iOS Safari)
  - `--keyboard-height` : hauteur du clavier calculée dynamiquement (pour référence, mais non utilisée dans les marges)
- **Marges minimales avec clavier** : `margin-top: 5px`, `padding-bottom: 30px`, `margin-bottom: 20px` - évite les décalages de scroll (ne PAS utiliser `calc(keyboard-height + Xpx)` qui crée des espaces excessifs)
- **Blocage scroll body** : le scroll du body et du html est désactivé quand le clavier est ouvert
- **Gestion orientation** : réinitialisation correcte de l'état du clavier lors d'un changement d'orientation
- **MutationObserver** : reset du scroll à 0 et recalcul de la hauteur initiale à l'ouverture d'un modal
- **Fermeture des autres modals** : à l'ouverture d'un modal, les autres modals sont automatiquement fermés pour éviter les superpositions
- **Focus différé** : délai de 100ms avant de mettre le focus sur l'input pour laisser le modal se rendre correctement

### 13. Étiquettes Personnalisées
- **Création d'étiquettes** : nom + couleur personnalisée (palette prédéfinie ou sélecteur de couleur libre)
- **Gestion via menu "..."** : modal dédiée accessible depuis :
  - Le menu "..." de la **navbar** (en haut à droite du board)
  - Le menu "..." du **modal de détail** d'une carte
- **Création rapide** : taper un nom dans le champ de recherche et cliquer sur "Créer" pour créer instantanément une étiquette (couleur aléatoire auto-assignée)
- **Sélection avec auto-complétion** : champ de recherche pour filtrer les étiquettes existantes
- **Multi-sélection** : possibilité de sélectionner plusieurs étiquettes par carte
- **Affichage avec nom** : les étiquettes s'affichent avec leur nom dans une pastille colorée
- **Réutilisation globale** : les étiquettes créées sont disponibles pour toutes les cartes
- **Persistance** : stockage dans `trelloCustomLabels` dans localStorage

### 14. Layout Mobile (Navbar et Listes)
- **Scroll bloqué au niveau body** : sur mobile, `html` et `body` sont en `position: fixed` avec `overflow: hidden` pour empêcher tout scroll global
- **Scroll uniquement dans les listes** : seul le `.cards-container` a `overflow-y: auto`, le board lui-même ne scrolle pas verticalement
- **Navbar compacte à hauteur fixe** : la navbar utilise `height` (pas seulement `min-height`) pour garantir une hauteur stricte
- **Hauteurs explicites par breakpoint** :
  - ≤768px (tablettes) : navbar `height: 50px`, container `height: calc(100dvh - 50px)`, listes `height: calc(100dvh - 80px)`
  - ≤480px (mobiles) : navbar `height: 46px`, container `height: calc(100dvh - 46px)`, listes `height: calc(100dvh - 66px)`
- **Support iOS Safari** : utilisation de `100dvh` (dynamic viewport height) avec fallback sur `100vh` pour gérer la barre d'adresse dynamique
- **Boutons compacts** : les boutons Board/Map sont réduits pour tenir sur une ligne
- **Listes à hauteur fixe** : `height` au lieu de `max-height` + `min-height: 0` sur `.cards-container` pour le bon fonctionnement du flex overflow
- **Pas de chevauchement** : le calcul précis des hauteurs et le blocage du scroll global évitent toute superposition

### 15. Upload d'Images Mobile (iOS Safari)
- **Validation améliorée des types** : support des formats HEIC/HEIF (iOS), gestion des types MIME vides (fréquent sur iOS)
- **Extensions supportées** : jpg, jpeg, png, gif, webp, bmp, heic, heif, tiff, tif
- **Reset de l'input différé** : `input.value = ''` est appelé **après** la lecture complète du fichier (dans `reader.onload`) pour éviter l'invalidation de la référence fichier sur iOS Safari
- **État de chargement** : variable `isImageUploading` bloque la soumission du formulaire pendant le chargement
- **Indicateur visuel** : spinner et message "Chargement de l'image..." avec boutons désactivés
- **Timeout de sécurité** : 30 secondes max pour la lecture d'un fichier, avec message d'erreur si dépassé
- **Gestion complète des erreurs** : handlers `onerror` et `onabort` pour le FileReader

---

## Structure du Code JavaScript

### Variables d'État Principales
```javascript
let lists = [];              // Tableau des listes
let cards = [];              // Tableau des cartes
let map = null;              // Instance Leaflet (grande carte)
let markers = {};            // markers[cardId] = L.marker
let markersLayer = null;     // L.layerGroup pour la grande carte
let detailMiniMap = null;    // Instance Leaflet (mini-carte détail)
let addCardMiniMap = null;   // Instance Leaflet (mini-carte ajout)
let addCardCoverImage = null; // Image temporaire pour nouvelle carte
let isImageUploading = false; // État de chargement d'image (bloque la soumission)
```

### Fonctions Clés

| Fonction | Description |
|----------|-------------|
| `init()` | Point d'entrée, charge données, initialise carte |
| `loadData()` / `saveData()` | Gestion localStorage |
| `renderBoard()` | Reconstruit le DOM du Kanban |
| `createListElement(list)` | Crée le DOM d'une liste |
| `createCardElement(card)` | Crée le DOM d'une carte |
| `renderMapMarkers({ fit, reason })` | Gère les marqueurs de la grande carte |
| `fitMapToMarkers(animate)` | Calcule et applique fitBounds |
| `initOrUpdateDetailMiniMap(card)` | Initialise/met à jour la mini-carte détail |
| `showAddCardMiniMap(lat, lon)` | Affiche la mini-carte dans le modal d'ajout |
| `renderDetailMiniMarkers(focusedCardId)` | Gère les marqueurs de la mini-carte |
| `searchAddress(query)` | Auto-complétion modal ajout |
| `searchDetailAddress(query)` | Auto-complétion modal détail |
| `searchImages()` | Recherche d'images (modal détail) |
| `searchAddCardImages()` | Recherche d'images (modal ajout) |
| `selectCoverImage(url, credit)` | Sélectionne une image (modal détail) |
| `selectAddCardCoverImage(url, credit)` | Sélectionne une image (modal ajout) |
| `removeCoverImage()` | Supprime l'image de couverture |
| `handleImageUpload(input, mode)` | Gère l'upload de fichier image (avec support iOS) |
| `showImageUploadLoading(mode, show)` | Affiche/masque l'indicateur de chargement d'image |
| `applyImageUrl(mode)` | Applique une image depuis URL |
| `initMobileKeyboardHandler()` | Gère l'affichage des modals avec clavier mobile |
| `renderAddCardLabelSelector()` | Affiche le sélecteur d'étiquettes (modal ajout) |
| `renderDetailLabelSelector()` | Affiche le sélecteur d'étiquettes (modal détail) |
| `quickCreateLabel(name, mode)` | Crée une étiquette rapidement depuis le champ de recherche |
| `openLabelsManagementModal()` | Ouvre le modal de gestion des étiquettes |
| `saveLabel()` / `editLabel()` / `deleteLabel()` | CRUD des étiquettes personnalisées |
| `getLabelById(id)` | Récupère une étiquette par son ID |

### Constantes de Configuration
```javascript
const DEFAULT_MAP_CENTER = [48.8566, 2.3522]; // Paris
const DEFAULT_MAP_ZOOM = 6;
const FIT_PADDING = [40, 40];
const FIT_MAX_ZOOM = 8;
const IMAGE_COLLECTIONS = { ... }; // Collections d'images Unsplash par catégorie
const PALETTE_COLORS = ['#FF6B6B', '#FFA500', ...]; // 15 couleurs prédéfinies pour les étiquettes
```

---

## Structure de Données

### Liste
```javascript
{
  id: number,
  title: string
}
```

### Carte
```javascript
{
  id: number,
  listId: number,
  title: string,
  description: string,
  labels: number[],        // IDs des étiquettes personnalisées
  address: string,
  coordinates: { lat: number, lon: number } | null,
  dueDate: string,
  coverImage: string | null,       // URL ou Base64 de l'image
  coverImageCredit: string | null, // Source (Unsplash, Lien externe, Image importée)
  checklist: [{ text: string, completed: boolean }],
  history: [{ action: string, timestamp: string }],
  createdAt: string
}
```

### Étiquette Personnalisée
```javascript
{
  id: number,
  name: string,           // Nom de l'étiquette (ex: "Restaurant", "Shopping")
  color: string           // Couleur hex (ex: "#FF6B6B")
}
```

---

## Clés localStorage

| Clé | Contenu |
|-----|---------|
| `trelloLists` | JSON des listes |
| `trelloCards` | JSON des cartes |
| `trelloCustomLabels` | JSON des étiquettes personnalisées |
| `trelloActiveView` | 'board' ou 'map' |
| `trelloMapView` | `{ lat, lng, zoom }` |

---

## Images de Couverture

### Sources d'images disponibles
1. **Recherche par mots-clés** : Collections Unsplash prédéfinies (tour eiffel, paris, london, plage, restaurant, hotel, musée, etc.)
2. **Import de fichier** : Upload depuis l'appareil (max 5Mo, stocké en Base64)
3. **Lien externe** : Coller une URL d'image (Google Images, etc.)

### Suppression d'image
- Via le menu "..." (trois points) dans le modal de détail
- Option "Supprimer l'image de couverture" visible uniquement si une image existe

---

## Améliorations Possibles (Reste à Faire)

### UX/UI
- [ ] Édition des items de checklist (actuellement : ajout/suppression seulement)
- [ ] Animations de transition (modals, glissement des cartes)
- [ ] Limiter la longueur des titres et descriptions
- [ ] Cohérence visuelle labels / marqueurs de carte

### Fonctionnel
- [ ] Moteur de recherche global (titre, description, labels, adresse)
- [ ] Filtres (par liste, date d'échéance, label)
- [ ] Export / import JSON
- [ ] Système d'undo/redo

### Technique
- [ ] Gestion des erreurs API Nominatim (quota, réseau)
- [ ] Backend pour multi-utilisateur / partage
- [ ] Clustering des marqueurs pour beaucoup de cartes
- [ ] Compression des images Base64 pour économiser le localStorage

---

## Notes pour le Développement

### Ajouter une Nouvelle Fonctionnalité
1. Identifier les fonctions concernées (voir tableau ci-dessus)
2. Respecter le pattern de persistance : modifier l'état → `saveData()` → `renderBoard()` et/ou `renderMapMarkers()`
3. Ajouter une entrée dans `history` si modification traçable

### Conventions
- Les ID sont des entiers auto-incrémentés
- Les couleurs des labels sont en format hex majuscule (#FF6B6B)
- Les timestamps utilisent `toLocaleString('fr-FR')`
- Les coordonnées utilisent `{ lat, lon }` (attention : lon, pas lng)

### Points d'Attention
- La mini-carte du modal de détail vérifie `card.coordinates` avant de s'afficher (masquée si pas de coordonnées)
- La mini-carte nécessite `invalidateSize()` car elle est dans un conteneur caché au départ
- Le fitBounds se déclenche uniquement quand on passe de 0 à >0 marqueurs, ou explicitement
- L'auto-complétion a un debounce de 500ms pour limiter les appels API
- Les images uploadées sont stockées en Base64, attention à la limite de 5Mo du localStorage
- Variables CSS définies sur `:root` par JavaScript pour la gestion mobile :
  - `--visual-viewport-height` : hauteur visible du viewport (NE PAS utiliser pour la hauteur du modal !)
  - `--visual-viewport-offset` : décalage du viewport (iOS Safari)
  - `--keyboard-height` : hauteur du clavier (pour référence uniquement, NE PAS utiliser dans les marges CSS)
- Sur mobile, les modals utilisent `.keyboard-open` quand le clavier est détecté (hauteur réduite > 150px)
- **IMPORTANT iOS Safari** : le modal doit TOUJOURS garder `height: 100vh` même avec le clavier ouvert. Si on utilise `--visual-viewport-height` pour la hauteur, le fond du board apparaît derrière le modal
- **IMPORTANT marges avec clavier** : utiliser des valeurs fixes (`margin-top: 5px`, `margin-bottom: 20px`) et NON `calc(var(--keyboard-height) + Xpx)` qui crée des décalages de scroll (header coupé en haut, grand espace en bas)
- Le modal mobile utilise `position: fixed` avec `top/left/right/bottom: 0` + `width: 100vw` pour couvrir tout l'écran
- **Scroll intelligent sur iOS** : le scroll vers l'input ne se fait que si l'élément n'est pas dans la zone visible (20%-70% de l'écran), permettant à l'utilisateur de voir le haut de la modal (header, image de couverture)
- **MutationObserver** : surveille l'ouverture des modals pour reset le scroll à 0 et recalculer la hauteur initiale du viewport
- **Fermeture des modals** : `openAddCardModal()` et `openCardDetailModal()` ferment les autres modals avant de s'ouvrir pour éviter les superpositions
- **Upload d'images iOS** : ne jamais réinitialiser `input.value` avant la fin de `FileReader.readAsDataURL()` car iOS Safari peut invalider la référence au fichier
- L'état `isImageUploading` doit être vérifié avant toute soumission de formulaire impliquant une image
