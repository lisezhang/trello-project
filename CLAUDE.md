# CLAUDE.md - Projet Trello Clone avec Carte

## Résumé du Projet

Application web de type **Trello (Kanban)** enrichie d'une **carte interactive Leaflet/OpenStreetMap** pour géolocaliser les cartes. L'application permet de gérer des listes de tâches, des cartes détaillées avec adresses géolocalisées, et offre une visualisation cartographique complète.

**Stack technique** : HTML5, CSS3, JavaScript ES6+ (modules), Leaflet.js 1.9.4, OpenStreetMap, API Nominatim, Unsplash (images prédéfinies)

## Structure des Fichiers

```
trello-project/
├── index.html              # Structure HTML et modals
├── styles.css              # Styles CSS (layout, composants, responsive)
├── CLAUDE.md               # Documentation projet (ce fichier)
├── README.md               # Readme initial
├── trello-projet.md        # Specs originales
└── src/                    # Modules JavaScript ES6
    ├── CLAUDE.md           # Documentation technique détaillée des modules
    ├── main.js             # Point d'entrée, orchestration
    ├── state.js            # État global, localStorage
    ├── constants.js        # Constantes (map, couleurs, images)
    ├── helpers.js          # Utilitaires purs
    ├── board.js            # Rendu board, drag & drop (SortableJS)
    ├── card-add.js         # Modal ajout carte
    ├── card-detail.js      # Modal détail carte
    ├── maps.js             # Grande carte Leaflet
    ├── mini-maps.js        # Mini-cartes dans modals
    ├── images.js           # Gestion images couverture
    ├── labels.js           # Système étiquettes + filtrage
    ├── links.js            # Gestion liens internet
    ├── lists.js            # Modals listes
    └── mobile.js           # Gestion clavier mobile
```

### Dépendances externes (CDN)
- Font Awesome 6.4.0 (icônes)
- Leaflet 1.9.4 (cartographie)
- SortableJS (drag & drop)

---

## Fonctionnalités

### Gestion des Listes
- Création, renommage (édition inline), suppression
- Choix à la suppression : archiver ou supprimer les cartes
- Drag & drop des cartes entre listes

### Gestion des Cartes
- Création avec titre, description, adresse (auto-complétion), dates, étiquettes
- Image de couverture (recherche, upload, URL)
- Checklist avec items cochables
- Liens internet avec titre et URL
- Historique de toutes les modifications
- Drag & drop entre colonnes

### Carte Interactive
- Grande carte avec tous les marqueurs géolocalisés
- Mini-cartes dans les modals
- Recherche de lieu
- Ouverture dans Google Maps / Apple Plans
- Centrage intelligent (fitBounds)

### Étiquettes
- Création d'étiquettes personnalisées (nom + couleur)
- Filtrage par étiquettes (logique ET)
- Indicateur de filtres actifs dans la navbar

### Mobile
- Support iOS Safari et Android
- Gestion du clavier virtuel
- Layout responsive

### Compatibilité Safari
- Normalisation des couleurs (Display P3 vs sRGB)
- Gradient de fond isolé via pseudo-élément `body::before` pour éviter les problèmes de rendu en mode responsive
- Meta tag `color-scheme: light` pour cohérence des couleurs

---

## Structure de Données

### Liste
```javascript
{ id: number, title: string }
```

### Carte
```javascript
{
  id: number,
  listId: number,
  title: string,
  description: string,
  labels: number[],                    // IDs des étiquettes
  address: string,
  coordinates: { lat, lon } | null,
  startDate: string | null,            // YYYY-MM-DD
  startTime: string | null,            // HH:MM:SS
  endDate: string | null,
  endTime: string | null,
  coverImage: string | null,           // URL ou Base64
  coverImageCredit: string | null,
  checklist: [{ text, completed }],
  links: [{ title, url }],
  history: [{ action, timestamp }],
  createdAt: string
}
```

### Étiquette
```javascript
{ id: number, name: string, color: string }
```

---

## Clés localStorage

| Clé | Contenu |
|-----|---------|
| `trelloLists` | JSON des listes |
| `trelloCards` | JSON des cartes |
| `trelloCustomLabels` | JSON des étiquettes |
| `trelloActiveView` | 'board' ou 'map' |
| `trelloMapView` | `{ lat, lng, zoom }` |

---

## Documentation Technique

Pour les détails d'implémentation (modules, exports, dépendances, patterns, points d'attention), voir **[src/CLAUDE.md](src/CLAUDE.md)**.

---

## Améliorations Possibles

### UX/UI
- [ ] Édition des items de checklist
- [ ] Animations de transition
- [ ] Cohérence visuelle labels / marqueurs

### Fonctionnel
- [x] Filtres par étiquettes
- [ ] Moteur de recherche global
- [ ] Export / import JSON
- [ ] Système d'undo/redo

### Technique
- [x] Compatibilité couleurs Safari mobile (pseudo-élément `::before`)
- [ ] Gestion erreurs API Nominatim
- [ ] Clustering des marqueurs
- [ ] Compression images Base64
