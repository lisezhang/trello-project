# CLAUDE.md - Analyse du Projet Trello Clone avec Carte

## Résumé du Projet

Application web de type **Trello (Kanban)** enrichie d'une **carte interactive Leaflet/OpenStreetMap** pour géolocaliser les cartes. L'application permet de gérer des listes de tâches, des cartes détaillées avec adresses géolocalisées, et offre une visualisation cartographique complète.

**Stack technique** : HTML5, CSS3, JavaScript ES6+ (vanilla), Leaflet.js 1.9.4, OpenStreetMap, API Nominatim

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
- Affichage des labels colorés sur chaque carte
- Drag & drop entre colonnes
- Suppression depuis le modal de détail

### 3. Modal de Détail
- **Titre** : édition inline + historisation
- **Description** : édition textarea + sauvegarde blur/Enter
- **Étiquettes** : sélecteur multi-couleurs
- **Date d'échéance** : champ date éditable
- **Adresse** : édition + auto-complétion Nominatim + mise à jour des coordonnées

### 4. Auto-complétion d'Adresses
- Debounce 500ms sur la saisie
- Appel API Nominatim
- Stockage automatique des coordonnées GPS
- Disponible dans le modal d'ajout ET le modal de détail

### 5. Mini-carte (Modal Détail)
- Affiche tous les points avec coordonnées
- Marqueur spécial (plus gros) pour la carte courante
- Popup complet sur chaque marqueur
- Recentrage de la mini-carte uniquement au clic

### 6. Grande Carte (Vue Map)
- Marqueurs préchargés au démarrage
- Centrage intelligent (`fitBounds`) avec padding et maxZoom
- Barre de recherche de lieu
- Bouton "Recentrer sur les marqueurs"
- Bouton "Masquer les marqueurs (visuel)"
- Conservation de la vue même après suppression de toutes les cartes

### 7. Checklist
- Ajout/suppression d'items
- Checkbox coché/décoché
- Historisation de toutes les actions

### 8. Historique
- Log de toutes les actions : création, modifications, checklist
- Affichage avec timestamp localisé (fr-FR)

### 9. Vue Board vs Map
- Toggle entre vue Kanban et vue Carte
- Vue active persistée dans localStorage

### 10. Persistance
- `trelloLists` et `trelloCards` dans localStorage
- Vue active (board/map) persistée
- Dernière position de la carte (centre + zoom) persistée

---

## Structure du Code JavaScript

### Variables d'État Principales
```javascript
let lists = [];              // Tableau des listes
let cards = [];              // Tableau des cartes
let map = null;              // Instance Leaflet (grande carte)
let markers = {};            // markers[cardId] = L.marker
let markersLayer = null;     // L.layerGroup pour la grande carte
let detailMiniMap = null;    // Instance Leaflet (mini-carte)
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
| `initOrUpdateDetailMiniMap(card)` | Initialise/met à jour la mini-carte |
| `renderDetailMiniMarkers(focusedCardId)` | Gère les marqueurs de la mini-carte |
| `searchAddress(query)` | Auto-complétion modal ajout |
| `searchDetailAddress(query)` | Auto-complétion modal détail |

### Constantes de Configuration
```javascript
const DEFAULT_MAP_CENTER = [48.8566, 2.3522]; // Paris
const DEFAULT_MAP_ZOOM = 6;
const FIT_PADDING = [40, 40];
const FIT_MAX_ZOOM = 14;
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
  labels: string[],        // Couleurs hex
  address: string,
  coordinates: { lat: number, lon: number } | null,
  dueDate: string,
  checklist: [{ text: string, completed: boolean }],
  history: [{ action: string, timestamp: string }],
  createdAt: string
}
```

---

## Clés localStorage

| Clé | Contenu |
|-----|---------|
| `trelloLists` | JSON des listes |
| `trelloCards` | JSON des cartes |
| `trelloActiveView` | 'board' ou 'map' |
| `trelloMapView` | `{ lat, lng, zoom }` |

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

---

## Notes pour le Développement

### Ajouter une Nouvelle Fonctionnalité
1. Lire le code existant dans le fichier HTML unique
2. Identifier les fonctions concernées (voir tableau ci-dessus)
3. Respecter le pattern de persistance : modifier l'état → `saveData()` → `renderBoard()` et/ou `renderMapMarkers()`
4. Ajouter une entrée dans `history` si modification traçable

### Conventions
- Les ID sont des entiers auto-incrémentés
- Les couleurs des labels sont en format hex majuscule (#FF6B6B)
- Les timestamps utilisent `toLocaleString('fr-FR')`
- Les coordonnées utilisent `{ lat, lon }` (attention : lon, pas lng)

### Points d'Attention
- La mini-carte nécessite `invalidateSize()` car elle est dans un conteneur caché au départ
- Le fitBounds se déclenche uniquement quand on passe de 0 à >0 marqueurs, ou explicitement
- L'auto-complétion a un debounce de 500ms pour limiter les appels API
