# src/CLAUDE.md - Documentation technique des modules

## Architecture des Modules

```
src/
├── main.js          # Point d'entrée, orchestration, exposition window
├── state.js         # État global, localStorage, setters
├── constants.js     # Constantes (map, storage, couleurs, images)
├── helpers.js       # Fonctions utilitaires pures
├── board.js         # Rendu board Kanban, SortableJS
├── card-add.js      # Modal ajout carte
├── card-detail.js   # Modal détail carte, édition
├── maps.js          # Grande carte Leaflet, marqueurs
├── mini-maps.js     # Mini-cartes modals, choix Maps
├── images.js        # Images couverture, upload, recherche
├── labels.js        # Labels custom, filtrage
├── links.js         # Liens internet
├── lists.js         # Gestion des listes
└── mobile.js        # Clavier mobile iOS/Android
```

---

## Graphe de Dépendances

```
constants.js  helpers.js  mobile.js    (modules leaf - aucune dépendance)
     │             │
     └─────┬───────┘
           ▼
       state.js
           │
     ┌─────┴─────┐
     ▼           ▼
 labels.js    lists.js
     │           │
     ├───────────┤
     ▼           ▼
  maps.js    board.js ◄───── card-add.js
     │           │                │
     │           │                │
     └─────┬─────┘                │
           ▼                      │
   mini-maps.js                   │
           │                      │
           └──────────────────────┤
                                  ▼
                          card-detail.js
                                  │
                                  ▼
                             images.js
                                  │
                                  ▼
                              links.js
                                  │
                                  ▼
                              main.js (orchestre tout)
```

---

## Détail des Modules

### main.js
Point d'entrée de l'application.

**Responsabilités** :
- Initialise l'application via `init()`
- Configure les event listeners globaux
- Expose toutes les fonctions sur `window` pour les onclick inline

**Fonctions exposées sur window** : ~60 fonctions (modals, board, maps, labels, images, links)

---

### state.js
État global et persistance localStorage.

**Variables d'état** :
```js
export let lists = [];
export let cards = [];
export let customLabels = [];
export let activeFilters = [];
export let currentListId = null;
export let currentCardId = null;
```

**Exports** :
- `setLists()`, `setCards()`, `setCustomLabels()`, `setActiveFilters()`
- `setCurrentListId()`, `setCurrentCardId()`
- `loadData()`, `saveData()`, `saveCustomLabels()`
- `getLabelById()`, `initState()`

---

### constants.js
Toutes les constantes de configuration.

**Exports** :
- Map : `DEFAULT_MAP_CENTER`, `DEFAULT_MAP_ZOOM`, `FIT_PADDING`, `FIT_MAX_ZOOM`
- Storage : `STORAGE_LISTS`, `STORAGE_CARDS`, `STORAGE_CUSTOM_LABELS`, `STORAGE_ACTIVE_VIEW`, `STORAGE_MAP_VIEW`
- Labels : `PALETTE_COLORS` (15 couleurs)
- Images : `IMAGE_COLLECTIONS` (Unsplash par catégorie)

---

### helpers.js
Fonctions utilitaires pures (pas d'effet de bord).

**Exports** :
- `escapeHtml(s)` - Prévention XSS
- `shuffleArray(array)` - Fisher-Yates
- `toggleTimeInput(prefix, show)` - Affiche/masque champ heure
- `formatDateDisplay(date, time)` - Format dd/mm/yyyy
- `formatDateRangeDisplay(start, startTime, end, endTime)`
- `isValidUrl(string)` - Validation URL
- `rgbToHex(rgb)` - Conversion couleur
- `getLabelById(id, customLabels)`

---

### board.js
Rendu du board Kanban et drag & drop.

**Exports** :
- `renderBoard()` - Reconstruit le DOM complet
- `createListElement(list)` - Crée une liste
- `createCardElement(card)` - Crée une carte
- `initSortable()` - Configure SortableJS
- `initBoard()` - Setup initial

**Dépendances** : state, helpers, labels, maps, lists, card-detail, card-add

---

### card-add.js
Modal d'ajout de carte.

**État local** :
```js
export let addCardChecklist = [];
```

**Exports** :
- `openAddCardModal()`, `closeAddCardModal()`
- `saveNewCard()`
- `searchAddress(query)` - Autocomplétion Nominatim
- `showAddCardChecklist()`, `addCardChecklistItem()`
- `toggleAddCardAddMenu()`, `closeAddCardAddMenu()`
- `resetAddCardChecklist()`

---

### card-detail.js
Modal de détail et édition de carte.

**Exports** :
- `openCardDetailModal(card)`, `closeCardDetailModal()`
- `editCardField(field)`, `saveCardField(event, field)`
- `deleteCard()`
- `toggleCardOptionsMenu()`, `toggleDetailAddMenu()`
- `showDetailChecklist()`, `addChecklistItem()`
- `searchDetailAddress(query)`
- `renderChecklist(card)`, `renderHistory(card)`

---

### maps.js
Grande carte Leaflet principale.

**État** :
```js
export let map = null;
export let markers = {};
export let markersLayer = null;
export let markersHidden = false;
```

**Exports** :
- `initMap()` - Initialise Leaflet
- `renderMapMarkers({ fit, reason })` - Gère les marqueurs
- `fitMapToMarkers(animate)` - Auto-centrage
- `clearMapMarkersOnly()` - Toggle visibilité
- `searchMapLocation(query)`
- `switchView(view, opts)`, `restoreLastView()`
- `getSavedMapView()`, `saveMapView()`
- `getCardsWithCoords()`

---

### mini-maps.js
Mini-cartes dans les modals + choix Google/Apple Maps.

**État** :
```js
export let detailMiniMap = null;
export let addCardMiniMap = null;
export let mapsChoiceData = null;
```

**Exports** :
- `initOrUpdateDetailMiniMap(card)`, `renderDetailMiniMarkers(focusedCardId)`
- `showAddCardMiniMap(lat, lon, address)`
- `openMapsChoiceModal(lat, lon, address, event)`
- `closeMapsChoiceModal()`
- `openInGoogleMaps()`, `openInAppleMaps()`
- `initMiniMapsEventListeners()`

---

### images.js
Gestion des images de couverture.

**État** :
```js
export let addCardCoverImage = null;
export let isImageUploading = false;
export let coverImageMode = null;
```

**Exports** :
- Recherche : `searchImages()`, `searchAddCardImages()`, `searchCoverImages()`
- Sélection : `selectCoverImage()`, `selectAddCardCoverImage()`
- Suppression : `removeCoverImage()`, `removeAddCardCoverImage()`, `removeCoverImageFromModal()`
- URL : `toggleUrlInput()`, `applyImageUrl()`
- Upload : `handleImageUpload(input, mode)`
- Modal : `openCoverImageModal(mode)`, `closeCoverImageModal()`
- Init : `initImageEventListeners()`

---

### labels.js
Système complet de labels custom et filtrage.

**État** :
```js
export let selectedLabels = [];
export let detailSelectedLabels = [];
```

**Exports** :
- Filtrage : `getFilteredCards(cardsList)`
- Sélection : `toggleLabelSelection()`, `toggleDetailLabelSelection()`
- Rendu : `renderAddCardLabelSelector()`, `renderDetailLabelSelector()`, `renderDetailLabels(card)`
- Création rapide : `quickCreateLabel(name, mode)`
- Management : `openLabelsManagementModal()`, `saveLabel()`, `editLabel()`, `deleteLabel()`
- Filtres : `openLabelFilterModal()`, `toggleFilterLabel()`, `clearAllFilters()`, `updateFilterIndicator()`

---

### links.js
Gestion des liens internet.

**État** :
```js
export let addCardLinks = [];
export let linkModalMode = null;
export let editingLinkIndex = null;
```

**Exports** :
- Affichage : `showAddCardLinks()`, `showDetailLinks()`, `renderAddCardLinks()`, `renderDetailLinks(card)`
- Modal : `openLinkModal()`, `closeLinkModal()`, `saveLink()`
- Actions : `editLink()`, `deleteLink()`
- Init : `initLinkEventListeners()`

---

### lists.js
Gestion des listes.

**Exports** :
- Modal ajout : `openAddListModal()`, `closeAddListModal()`, `saveNewList()`
- Modal suppression : `openDeleteListModal()`, `closeDeleteListModal()`
- Actions : `moveCardsToArchives()`, `deleteCardsAndList()`
- Édition : `enableEditListTitle()`

---

### mobile.js
Gestion du clavier virtuel mobile.

**Export unique** :
- `initMobileKeyboardHandler()`

**Variables CSS dynamiques** :
- `--visual-viewport-height`
- `--visual-viewport-offset`
- `--keyboard-height`

**Classe CSS** : `.keyboard-open` sur les modals

---

## Patterns Utilisés

### Pattern État
```js
// Modifier l'état
import { lists, setLists, saveData } from './state.js';
lists.push(newList);  // ou setLists([...])
saveData();
renderBoard();
```

### Pattern Modal
```js
export function openXxxModal() {
  // Fermer autres modals
  closeOtherModals();
  // Reset état local
  resetLocalState();
  // Configurer DOM
  document.getElementById('xxxModal').classList.add('show');
}

export function closeXxxModal() {
  document.getElementById('xxxModal').classList.remove('show');
}
```

### Pattern Exposition Window
```js
// main.js
import { myFunction } from './module.js';
window.myFunction = myFunction;
```

---

## Points d'Attention Techniques

### iOS Safari
- **FileReader** : Ne jamais reset `input.value` avant la fin de `readAsDataURL()`
- **Clavier** : Le modal garde `height: 100vh` même avec clavier ouvert
- **Scroll** : Zone visible = 20%-70% du viewport, scroll minimal

### Dépendances Circulaires
Évitées grâce à :
- `state.js` centralisé
- Imports dynamiques si nécessaire
- `main.js` comme orchestrateur

### Performance
- `renderBoard()` reconstruit tout le DOM (simple mais efficace)
- `renderMapMarkers()` utilise `markersLayer.clearLayers()` puis recréation
- Debounce 500ms sur les autocomplétions

---

## Ajouter une Nouvelle Feature

1. **Créer le module** dans `src/`
2. **Importer state** si besoin de données globales
3. **Exporter les fonctions** publiques
4. **Importer dans main.js** et exposer sur `window` si onclick inline
5. **Mettre à jour ce fichier** CLAUDE.md
