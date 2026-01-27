{\rtf1\ansi\ansicpg1252\cocoartf2867
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 # Trello Clone avec Carte \'96 Documentation\
\
## 1. R\'e9sum\'e9 global du projet\
\
Ce projet est une application web de type **Trello** (Kanban) enrichie par une carte interactive **Leaflet / OpenStreetMap** pour g\'e9olocaliser les cartes.  \
Elle permet de g\'e9rer des listes de t\'e2ches, des cartes d\'e9taill\'e9es, des adresses avec auto-compl\'e9tion et une visualisation de tous les points sur une grande carte ainsi que sur une mini-carte dans le modal de d\'e9tail.\
\
---\
\
## 2. Fonctionnalit\'e9s r\'e9alis\'e9es\
\
### 2.1. Gestion des listes\
\
- Cr\'e9ation de listes avec un nom personnalis\'e9.  \
- Renommage des listes en cliquant sur le titre (\'e9dition inline).  \
- Suppression des listes avec choix :\
  - d\'e9placer toutes les cartes dans une liste \'ab Archives \'bb,\
  - ou supprimer toutes les cartes de la liste.  \
- Drag & drop des cartes entre listes (mise \'e0 jour de l\'92\'e9tat + persistance).\
\
### 2.2. Gestion des cartes\
\
- Cr\'e9ation de cartes avec champs :\
  - Titre (obligatoire).\
  - Description (optionnelle).\
  - Adresse avec auto-compl\'e9tion (optionnelle).\
  - Coordonn\'e9es GPS stock\'e9es automatiquement si l\'92adresse est choisie via auto-compl\'e9tion.\
  - Date d\'92\'e9ch\'e9ance (optionnelle).\
  - \'c9tiquettes color\'e9es (8 couleurs pr\'e9d\'e9finies).  \
- Affichage des labels (pastilles de couleur) sur chaque carte.  \
- Drag & drop des cartes entre colonnes.  \
- Suppression d\'92une carte depuis le modal de d\'e9tail.  \
\
### 2.3. Modal de d\'e9tail d\'92une carte\
\
Dans le modal de d\'e9tail d\'92une carte, les fonctionnalit\'e9s suivantes sont disponibles :\
\
- **Titre** : clic sur le titre \uc0\u8594  \'e9dition inline, sauvegarde + ajout dans l\'92historique.  \
- **Description** :\
  - texte affich\'e9 par d\'e9faut,\
  - clic \uc0\u8594  transformation en textarea \'e9ditable,\
  - sauvegarde sur Enter ou perte de focus (blur),\
  - historisation de la modification.  \
- **\'c9tiquettes** :\
  - affichage des labels existants,\
  - clic sur le bloc \uc0\u8594  ouverture d\'92un s\'e9lecteur de couleurs,\
  - gestion multi-labels (ajout / suppression),\
  - mise \'e0 jour visuelle et dans les donn\'e9es.  \
- **Date d\'92\'e9ch\'e9ance** :\
  - affichage de la date ou mention "(Pas de date)",\
  - clic \uc0\u8594  champ date \'e9ditable,\
  - sauvegarde + historisation.  \
- **Adresse** :\
  - affichage de l\'92adresse ou "(Aucune adresse)",\
  - clic \uc0\u8594  champ texte \'e9ditable,\
  - auto-compl\'e9tion Nominatim (d\'e9tail ci-dessous),\
  - les coordonn\'e9es sont mises \'e0 jour si l\'92adresse est choisie dans la liste de suggestions,\
  - mise \'e0 jour de la grande carte et de la mini-carte.  \
\
### 2.4. Auto-compl\'e9tion d\'92adresses\
\
- Auto-compl\'e9tion dans le modal **d\'92ajout de carte** :\
  - champ adresse avec debounce (~500 ms),\
  - appel \'e0 l\'92API Nominatim,\
  - affichage d\'92une liste de suggestions,\
  - clic sur un r\'e9sultat \uc0\u8594  remplissage de l\'92adresse et stockage des coordonn\'e9es GPS.  \
- Auto-compl\'e9tion dans le **modal de d\'e9tail** :\
  - m\'eame m\'e9canique (debounce, Nominatim),\
  - clic sur une suggestion \uc0\u8594  mise \'e0 jour de l\'92adresse, des coordonn\'e9es, de l\'92historique,\
  - rafra\'eechissement imm\'e9diat de la mini-carte et de la grande carte.  \
\
### 2.5. Mini-carte dans le modal de d\'e9tail\
\
- Mini-carte Leaflet affich\'e9e dans la partie "Adresse" du modal.  \
- Affiche **tous les points** correspondant aux cartes ayant des coordonn\'e9es.  \
- Le marqueur de la carte courante est **sp\'e9cial** :\
  - plus gros (iconSize plus grande),\
  - m\'eame style visuel que les marqueurs Leaflet classiques mais mis en avant par la taille.  \
- Clic sur n\'92importe quel autre marqueur dans la mini-carte :\
  - affiche un **popup complet** (titre, description, adresse, date),\
  - recentre la **mini-carte** sur ce point,\
  - la grande carte ne bouge pas.  \
- La mini-carte est initialis\'e9e uniquement quand le modal est visible, avec `invalidateSize()` pour corriger l\'92affichage dans un conteneur cach\'e9.\
\
### 2.6. Grande carte (vue Map)\
\
- Affichage d\'92une grande carte Leaflet sur toute la hauteur de la vue Map.  \
- **Marqueurs pr\'e9charg\'e9s** :\
  - au d\'e9marrage, tous les marqueurs sont cr\'e9\'e9s \'e0 partir des cartes qui ont des coordonn\'e9es,\
  - pas besoin de cliquer sur une carte pour voir un marqueur.  \
- **Centrage intelligent (fitBounds)** :\
  - la carte compute un `LatLngBounds` sur tous les marqueurs,\
  - `fitBounds` avec padding et `maxZoom` pour conserver un zoom raisonnable,\
  - cela se d\'e9clenche :\
    - au chargement initial,\
    - apr\'e8s modifications d\'92adresse,\
    - apr\'e8s cr\'e9ations de cartes avec coordonn\'e9es,\
    - lorsqu\'92on passe de 0 \'e0 >0 marqueurs.  \
- Comportement si aucune carte n\'92a de coordonn\'e9es :\
  - aucun marqueur, mais la carte reste visible,\
  - la carte conserve la derni\'e8re vue utilis\'e9e (centre + zoom), m\'eame apr\'e8s suppression de toutes les cartes.  \
- Barre de recherche sur la carte :\
  - champ texte,\
  - Enter \uc0\u8594  appel Nominatim (1 r\'e9sultat),\
  - recentrage sur le lieu trouv\'e9.  \
- Boutons de contr\'f4le :\
  - **Recentrer sur les marqueurs** : recalcule un fitBounds sur les marqueurs existants.\
  - **Masquer les marqueurs (visuel)** : permet de cacher les marqueurs sans supprimer les cartes (utile pour tester l\'92affichage/zoom de la carte).\
\
### 2.7. Checklist\
\
- Ajout d\'92items dans la checklist via un prompt.  \
- Affichage des items avec :\
  - checkbox (coch\'e9 / d\'e9coch\'e9),\
  - texte,\
  - bouton "Supprimer".  \
- Historisation des actions de checklist :\
  - ajout,\
  - suppression,\
  - coche / d\'e9coche.  \
\
### 2.8. Historique (log des actions)\
\
- Chaque carte contient un tableau `history`.  \
- Sont enregistr\'e9s :\
  - cr\'e9ation de la carte,\
  - modification de titre,\
  - modification de description,\
  - modification de date d\'92\'e9ch\'e9ance,\
  - modifications d\'92adresse (y compris via auto-compl\'e9tion),\
  - actions sur la checklist.  \
- Affichage de l\'92historique dans le modal de d\'e9tail, avec :\
  - action,\
  - timestamp localis\'e9 (fr-FR).\
\
### 2.9. Vue Board vs Vue Map\
\
- Toggle entre vue **Board** (Kanban) et vue **Map** (carte).  \
- La vue active est **persist\'e9e** dans le stockage local :\
  - si l\'92utilisateur \'e9tait en vue Map, l\'92application r\'e9ouvre en vue Map.  \
- Lors du passage en vue Map, la carte est `invalidateSize()` pour corriger les probl\'e8mes de rendu.\
\
### 2.10. Persistance des donn\'e9es\
\
- Les listes et cartes sont stock\'e9es dans `localStorage` :\
  - `trelloLists` pour les listes,\
  - `trelloCards` pour les cartes.  \
- Toutes les op\'e9rations (cr\'e9ation, \'e9dition, suppression, drag & drop, checklist, etc.) mettent \'e0 jour le localStorage.  \
- Pas de cartes de d\'e9mo pr\'e9-remplies : au premier lancement, seules les listes standard ("\'c0 faire", "En cours", "Termin\'e9") sont cr\'e9\'e9es.\
\
---\
\
## 3. Stack technique\
\
### 3.1. Frontend\
\
- **HTML5** : structure de la page, modals, sections Board/Map.  \
- **CSS3** :\
  - layout via Flexbox,\
  - design responsive,\
  - styles personnalis\'e9s pour listes, cartes, modals, boutons,\
  - int\'e9gration d\'92un gradient de fond.  \
- **JavaScript (ES6+)** :\
  - gestion d\'92\'e9tat client (tableaux `lists`, `cards`),\
  - manipulation du DOM (cr\'e9ation dynamique de listes/cartes),\
  - drag & drop natif,\
  - appels HTTP \'e0 l\'92API Nominatim via `fetch`.  \
\
### 3.2. Cartographie\
\
- **Leaflet.js 1.9.4** :\
  - cr\'e9ation de la grande carte et de la mini-carte,\
  - gestion des marqueurs,\
  - `fitBounds` et `LatLngBounds` pour le centrage automatique.  \
- **OpenStreetMap** :\
  - tuiles cartographiques (`https://\{s\}.tile.openstreetmap.org/\{z\}/\{x\}/\{y\}.png`).  \
\
### 3.3. G\'e9ocodage\
\
- **API Nominatim (OpenStreetMap)** :\
  - recherche d\'92adresses pour auto-compl\'e9tion,\
  - r\'e9cup\'e9ration des coordonn\'e9es (lat, lon).  \
- Debounce manuel avec `setTimeout` pour limiter les requ\'eates.\
\
### 3.4. Ic\'f4nes & UI\
\
- **Font Awesome 6.x** :\
  - ic\'f4nes pour les boutons (plus, carte, trash, etc.).\
\
### 3.5. Persistance\
\
- **localStorage** :\
  - stockage de `lists`, `cards`,\
  - stockage de la vue active (board/map),\
  - stockage de la derni\'e8re vue de carte (centre + zoom).\
\
---\
\
## 4. Fonctions importantes (c\'f4t\'e9 JavaScript)\
\
### 4.1. Gestion de l\'92\'e9tat et persistance\
\
- `loadData()` / `saveData()`  \
  - Chargent et sauvegardent `lists` et `cards` dans localStorage.  \
\
- `init()`  \
  - Point d\'92entr\'e9e de l\'92app :\
    - r\'e9cup\'e8re les donn\'e9es,\
    - initialise les listes,\
    - initialise la carte,\
    - rend les marqueurs,\
    - restaure la vue (board/map).\
\
### 4.2. Board / Listes / Cartes\
\
- `renderBoard()`  \
  - Recontruit compl\'e8tement le DOM de la vue Board \'e0 partir de `lists` et `cards`.\
\
- `createListElement(list)`  \
  - Cr\'e9e le DOM d\'92une liste, son header, container de cartes, bouton "Ajouter une carte".\
\
- `createCardElement(card)`  \
  - Cr\'e9e le DOM d\'92une carte, labels, infos (date).\
\
- `enableEditListTitle(element, list)`  \
  - Transforme le titre en champ input, g\'e8re Enter/Escape/blur.  \
\
- Drag & drop :\
  - `handleDragStart(e)`, `handleDragEnd(e)`  \
  - `handleDragOver(e, listId)`, `handleDragLeave(e)`  \
  - `handleDrop(e, listId)` : met \'e0 jour le `listId` de la carte, sauvegarde, re-render.\
\
### 4.3. Modals\
\
- `openAddListModal()`, `closeAddListModal()`  \
- `openAddCardModal()`, `closeAddCardModal()`  \
- `openDeleteListModal(list)`, `closeDeleteListModal()`  \
- `openCardDetailModal(card)`, `closeCardDetailModal()`  \
\
Ces fonctions s\'92occupent aussi de pr\'e9-remplir les champs et de positionner le focus.\
\
### 4.4. Cr\'e9ation / suppression de cartes\
\
- `saveNewCard()`  \
  - Valide le titre,\
  - r\'e9cup\'e8re les champs (description, labels, adresse, date),\
  - stocke les coordonn\'e9es de `window.currentAddressCoordinates`,\
  - ajoute l\'92entr\'e9e dans l\'92historique,\
  - sauvegarde, re-render Board, re-render map + fitBounds.  \
\
- `deleteCard()`  \
  - Supprime la carte courante,\
  - sauvegarde,\
  - re-render Board,\
  - re-render map avec fitBounds intelligent,\
  - ferme le modal d\'e9tail.\
\
- `deleteAllCards()`  \
  - Supprime toutes les cartes,\
  - laisse la grande carte visible mais vide de marqueurs,\
  - ne modifie pas la vue active (on reste en Map ou Board selon le cas),\
  - la prochaine carte avec coordonn\'e9es d\'e9clenchera un fitBounds.  \
\
### 4.5. Historique et checklist\
\
- `renderChecklist(card)` / `addChecklistItem()`  \
  - affichage de la checklist,\
  - gestion checkbox, suppression, historique.  \
\
- `renderHistory(card)`  \
  - affiche la liste des actions avec timestamps.  \
\
### 4.6. Auto-compl\'e9tion d\'92adresses\
\
- Ajout modal :\
  - `searchAddress(query)` (debounce),\
  - `performAddressSearch(query)` (fetch Nominatim + suggestions, mise \'e0 jour de `window.currentAddressCoordinates`).  \
\
- D\'e9tail modal :\
  - `searchDetailAddress(query)` (debounce),\
  - `performDetailAddressSearch(query)` (mise \'e0 jour adresse + coords + historique + cartes).  \
\
### 4.7. Grande carte Leaflet\
\
- `initMap()`  \
  - Initialise Leaflet,\
  - ajoute la couche OSM,\
  - cr\'e9e `markersLayer`,\
  - restaure la derni\'e8re vue (centre + zoom) \'e0 partir du localStorage,\
  - \'e9coute `moveend` et `zoomend` pour sauvegarder la vue.\
\
- `renderMapMarkers(\{ fit, reason \})`  \
  - Nettoie la couche,\
  - cr\'e9e un marqueur par carte avec coordonn\'e9es,\
  - stocke les marqueurs dans `markers`,\
  - met \'e0 jour `lastMarkerCount`,\
  - si `fit===true` ou si on passe de 0 \'e0 >0 marqueurs :\
    - appelle `fitMapToMarkers(false)` pour faire un fitBounds.  \
\
- `fitMapToMarkers(animate)`  \
  - Calcule un `LatLngBounds` sur tous les points,\
  - applique `fitBounds(bounds, \{padding, maxZoom, animate\})`.  \
\
- `searchMapLocation(query)`  \
  - Utilise Nominatim pour trouver un lieu \'e0 partir de la barre de recherche,\
  - recentre la carte.  \
\
- `clearMapMarkersOnly()`  \
  - Permet de masquer/afficher les marqueurs visuels sans toucher aux donn\'e9es.\
\
### 4.8. Mini-carte Leaflet\
\
- `initOrUpdateDetailMiniMap(card)`  \
  - Cr\'e9e la mini-carte si besoin,\
  - d\'e9finit la vue par d\'e9faut,\
  - appelle `renderDetailMiniMarkers(card.id)`.\
\
- `renderDetailMiniMarkers(focusedCardId)`  \
  - Affiche tous les marqueurs des cartes avec coordonn\'e9es,\
  - marqueur sp\'e9cial pour la carte courante (ic\'f4ne plus grande),\
  - click sur un marqueur :\
    - ouverture d\'92un popup complet,\
    - recentrage de la mini-carte uniquement.  \
\
---\
\
## 5. Reste \'e0 faire (am\'e9liorations possibles)\
\
### 5.1. UX/UI\
\
- \'c9diter un item de checklist (actuellement : ajout/suppression seulement).  \
- Animations de transition (apparition des modals, glissement des cartes, etc.).  \
- Limiter la longueur des titres et descriptions.  \
- Meilleure coh\'e9rence visuelle entre la couleur des labels et les marqueurs (par exemple couleur du premier label).\
\
### 5.2. Fonctionnel\
\
- Moteur de recherche global (par titre, description, labels, adresse).  \
- Filtres (par liste, par date d\'92\'e9ch\'e9ance, par label).  \
- Export / import JSON (sauvegarde et restauration du board).  \
- Syst\'e8me d\'92undo/redo simple (pile d\'92actions).  \
\
### 5.3. Technique\
\
- Gestion plus fine des erreurs API Nominatim (quota, r\'e9seau).  \
- Eventuel backend (API) pour :\
  - multi-utilisateur,\
  - partage de board,\
  - stockage serveur.  \
- Optimisation des performances si beaucoup de cartes (cluster de marqueurs c\'f4t\'e9 Leaflet, etc.).\
\
---\
\
## 6. R\'e9sum\'e9 de ce que tu as demand\'e9 et des modifications cl\'e9s\
\
### 6.1. Demandes principales\
\
- Avoir une **mini-carte** dans le modal qui montre :\
  - tous les points,\
  - un marqueur sp\'e9cial pour la carte courante,\
  - un popup complet sur chaque marqueur,\
  - un recentrage uniquement de la mini-carte au clic.  \
- Faire en sorte que la **grande carte** :\
  - soit centr\'e9e automatiquement via un fitBounds intelligent,\
  - charge tous les marqueurs d\'e8s le chargement (pr\'e9-charg\'e9),\
  - se mette \'e0 jour automatiquement \'e0 chaque ajout/modification/suppression,\
  - conserve sa vue m\'eame lorsque toutes les cartes sont supprim\'e9es.  \
- Ajouter un bouton "Recentrer sur les marqueurs".  \
- Supprimer les cartes de d\'e9mo initiales et d\'e9marrer avec des listes vides.\
\
### 6.2. Modifications apport\'e9es\
\
- Ajout et configuration de la mini-carte dans le modal d\'e9tail :\
  - markers pour toutes les cartes,\
  - marker plus gros pour la carte courante,\
  - gestion des popups complets,\
  - clic \uc0\u8594  recentrage mini-carte.  \
- R\'e9\'e9criture / am\'e9lioration de la logique de la grande carte :\
  - gestion centralis\'e9e dans `renderMapMarkers()` + `fitMapToMarkers()`,\
  - fitBounds d\'e9clench\'e9 intelligemment (initialisation, modifications, transition 0\uc0\u8594 N),\
  - persistance de la derni\'e8re vue (centre/zoom) m\'eame en absence de marqueurs.  \
- Implementation d\'92un bouton **"Recentrer sur les marqueurs"**.  \
- Suppression des donn\'e9es de sample (cartes de Tokyo) pour laisser un board vierge.  \
- Persistance de la **vue active** (Board ou Map) dans localStorage,\
  - et restauration \'e0 l\'92ouverture de l\'92application.  \
- Harmonisation de l\'92historique et de la checklist pour que toutes les modifications critiques soient tra\'e7ables.\
\
---\
\
Si tu veux, je peux maintenant te g\'e9n\'e9rer un petit sch\'e9ma (en texte ou pseudo-code) montrant le flux de donn\'e9es entre : carte \uc0\u8594  localStorage \u8594  grande carte \u8594  mini-carte.\
}