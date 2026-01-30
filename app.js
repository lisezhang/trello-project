// -------------------------
// State & Constants
// -------------------------
let currentListId = null;
let currentCardId = null;

let selectedLabels = [];        // IDs of selected labels for add card modal
let detailSelectedLabels = [];  // IDs of selected labels for detail modal

// Custom labels system
let customLabels = [];          // Array of { id, name, color }
const STORAGE_CUSTOM_LABELS = 'trelloCustomLabels';

// Default palette colors for creating new labels
const PALETTE_COLORS = [
  '#FF6B6B', '#FFA500', '#FFD93D', '#6BCB77', '#4D96FF',
  '#9D4EDD', '#FF006E', '#00F5FF', '#8B5CF6', '#EC4899',
  '#14B8A6', '#F97316', '#84CC16', '#06B6D4', '#A855F7'
];

let map = null;
let markers = {};               // markers[cardId] = L.marker
let markersLayer = null;        // L.layerGroup for big map markers
let markersHidden = false;

let addressSearchTimeout = null;
let detailAddressSearchTimeout = null;

// Mini-map (detail modal)
let detailMiniMap = null;
let detailMiniMarkersLayer = null;
let detailMiniCurrentMarker = null;

// Mini-map (add card modal)
let addCardMiniMap = null;
let addCardMiniMarker = null;

// Persisted UI
const STORAGE_ACTIVE_VIEW = 'trelloActiveView';
const STORAGE_MAP_VIEW = 'trelloMapView'; // {lat,lng,zoom}

// Map defaults
const DEFAULT_MAP_CENTER = [48.8566, 2.3522]; // Paris
const DEFAULT_MAP_ZOOM = 6;
const FIT_PADDING = [40, 40];
const FIT_MAX_ZOOM = 8;

// Track marker count for fitBounds trigger
let lastMarkerCount = 0;

let lists = [];
let cards = [];

// -------------------------
// Init
// -------------------------
function init() {
  loadData();

  // First launch: create default lists, no demo cards
  if (lists.length === 0) {
    lists = [
      { id: 1, title: 'À faire' },
      { id: 2, title: 'En cours' },
      { id: 3, title: 'Terminé' }
    ];
    cards = [];
    saveData();
  }

  renderBoard();
  initMap();

  // Preload markers
  renderMapMarkers({ fit: true, reason: 'init' });

  // Restore last view (board/map)
  restoreLastView();
}

function loadData() {
  const savedLists = localStorage.getItem('trelloLists');
  const savedCards = localStorage.getItem('trelloCards');
  const savedLabels = localStorage.getItem(STORAGE_CUSTOM_LABELS);
  if (savedLists) lists = JSON.parse(savedLists);
  if (savedCards) cards = JSON.parse(savedCards);
  if (savedLabels) customLabels = JSON.parse(savedLabels);
}

function saveData() {
  localStorage.setItem('trelloLists', JSON.stringify(lists));
  localStorage.setItem('trelloCards', JSON.stringify(cards));
}

function saveCustomLabels() {
  localStorage.setItem(STORAGE_CUSTOM_LABELS, JSON.stringify(customLabels));
}

// Get label by ID
function getLabelById(id) {
  return customLabels.find(l => l.id === id);
}

// -------------------------
// Board rendering
// -------------------------
function renderBoard() {
  const boardContent = document.getElementById('boardContent');
  boardContent.innerHTML = '';

  lists.forEach(list => {
    const listDiv = createListElement(list);
    boardContent.appendChild(listDiv);
  });

  const addListDiv = document.createElement('div');
  addListDiv.className = 'add-list-btn';
  addListDiv.innerHTML = '<i class="fas fa-plus"></i> Ajouter une liste';
  addListDiv.onclick = openAddListModal;
  boardContent.appendChild(addListDiv);

  // Initialize SortableJS for drag & drop (works on mobile)
  initSortable();
}

function createListElement(list) {
  const listContainer = document.createElement('div');
  listContainer.className = 'list-container';
  listContainer.id = `list-${list.id}`;

  const listHeader = document.createElement('div');
  listHeader.className = 'list-header';

  const listTitle = document.createElement('div');
  listTitle.className = 'list-title';
  listTitle.textContent = list.title;
  listTitle.onclick = () => enableEditListTitle(listTitle, list);

  const listActions = document.createElement('div');
  listActions.className = 'list-actions';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'list-action-btn';
  deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
  deleteBtn.onclick = () => openDeleteListModal(list);

  listActions.appendChild(deleteBtn);
  listHeader.appendChild(listTitle);
  listHeader.appendChild(listActions);

  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'cards-container';
  cardsContainer.id = `cards-${list.id}`;
  cardsContainer.setAttribute('data-list-id', list.id);

  cards.filter(c => c.listId === list.id).forEach(card => {
    cardsContainer.appendChild(createCardElement(card));
  });

  const addCardButton = document.createElement('button');
  addCardButton.className = 'btn btn-secondary';
  addCardButton.style.width = '100%';
  addCardButton.innerHTML = '<i class="fas fa-plus"></i> Ajouter une carte';
  addCardButton.onclick = () => {
    currentListId = list.id;
    currentCardId = null;
    openAddCardModal();
  };

  listContainer.appendChild(listHeader);
  listContainer.appendChild(cardsContainer);
  listContainer.appendChild(addCardButton);

  return listContainer;
}

function enableEditListTitle(titleElement, list) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'list-title-input';
  input.value = list.title;

  titleElement.replaceWith(input);
  input.focus();
  input.select();

  function saveTitle() {
    const newTitle = input.value.trim();
    if (newTitle && newTitle !== list.title) {
      list.title = newTitle;
      saveData();
    }
    renderBoard();
  }

  input.onblur = saveTitle;
  input.onkeydown = (e) => {
    if (e.key === 'Enter') saveTitle();
    if (e.key === 'Escape') renderBoard();
  };
}

function createCardElement(card) {
  const cardDiv = document.createElement('div');
  cardDiv.className = 'card';
  cardDiv.id = `card-${card.id}`;

  // Cover image thumbnail
  if (card.coverImage) {
    const coverImg = document.createElement('div');
    coverImg.className = 'card-cover-image';
    coverImg.style.backgroundImage = `url(${card.coverImage})`;
    cardDiv.appendChild(coverImg);
  }

  const title = document.createElement('div');
  title.className = 'card-title';
  title.textContent = card.title;

  const labelsDiv = document.createElement('div');
  labelsDiv.className = 'card-labels';
  (card.labels || []).forEach(labelId => {
    const labelData = getLabelById(labelId);
    if (labelData) {
      const label = document.createElement('div');
      label.className = 'label';
      label.style.backgroundColor = labelData.color;
      label.textContent = labelData.name;
      labelsDiv.appendChild(label);
    }
  });

  const infoDiv = document.createElement('div');
  infoDiv.className = 'card-info';

  if (card.dueDate) {
    const dateItem = document.createElement('div');
    dateItem.className = 'card-info-item';
    dateItem.innerHTML = `<i class="fas fa-calendar"></i> ${card.dueDate}`;
    infoDiv.appendChild(dateItem);
  }

  cardDiv.appendChild(title);
  cardDiv.appendChild(labelsDiv);
  cardDiv.appendChild(infoDiv);

  cardDiv.onclick = () => openCardDetailModal(card);

  return cardDiv;
}

// -------------------------
// Drag & drop (SortableJS)
// -------------------------
let sortableInstances = [];

function initSortable() {
  // Destroy existing instances
  sortableInstances.forEach(s => s.destroy());
  sortableInstances = [];

  // Initialize Sortable on each cards container
  document.querySelectorAll('.cards-container').forEach(container => {
    const sortable = new Sortable(container, {
      group: 'cards',
      animation: 150,
      ghostClass: 'card-ghost',
      chosenClass: 'card-chosen',
      dragClass: 'card-drag',
      handle: '.card',
      draggable: '.card',
      // Touch settings for mobile
      delay: 100,
      delayOnTouchOnly: true,
      touchStartThreshold: 5,
      onEnd: function(evt) {
        const cardId = parseInt(evt.item.id.replace('card-', ''), 10);
        const newListId = parseInt(evt.to.getAttribute('data-list-id'), 10);

        const card = cards.find(c => c.id === cardId);
        if (!card) return;

        // Update card's listId
        card.listId = newListId;

        // Update cards order within the list based on DOM order
        const cardElements = evt.to.querySelectorAll('.card');
        const newOrder = Array.from(cardElements).map(el => parseInt(el.id.replace('card-', ''), 10));

        // Reorder cards array to match DOM order
        const otherCards = cards.filter(c => c.listId !== newListId);
        const listCards = newOrder.map(id => cards.find(c => c.id === id)).filter(Boolean);
        cards = [...otherCards, ...listCards];

        saveData();
        // Don't re-render board to avoid destroying drag state
        renderMapMarkers({ fit: false, reason: 'drag' });
      }
    });
    sortableInstances.push(sortable);
  });
}

// -------------------------
// Modals - lists
// -------------------------
function openAddListModal() {
  document.getElementById('addListModal').classList.add('show');
  document.getElementById('listNameInput').focus();
}

function closeAddListModal() {
  document.getElementById('addListModal').classList.remove('show');
  document.getElementById('listNameInput').value = '';
}

function saveNewList() {
  const listName = document.getElementById('listNameInput').value.trim();
  if (!listName) return alert('Veuillez entrer un nom de liste');

  const newList = { id: Math.max(...lists.map(l => l.id), 0) + 1, title: listName };
  lists.push(newList);
  saveData();
  renderBoard();
  closeAddListModal();
}

function openDeleteListModal(list) {
  const listCards = cards.filter(card => card.listId === list.id);
  document.getElementById('deleteListMessage').innerHTML =
    `<strong>${list.title}</strong> contient ${listCards.length} carte(s). Que souhaitez-vous faire ?`;
  document.getElementById('deleteListModal').setAttribute('data-list-id', list.id);
  document.getElementById('deleteListModal').classList.add('show');
}

function closeDeleteListModal() {
  document.getElementById('deleteListModal').classList.remove('show');
}

function moveCardsToArchives() {
  const listId = parseInt(document.getElementById('deleteListModal').getAttribute('data-list-id'), 10);
  let archivesList = lists.find(l => l.title === 'Archives');

  if (!archivesList) {
    archivesList = { id: Math.max(...lists.map(l => l.id), 0) + 1, title: 'Archives' };
    lists.push(archivesList);
  }

  cards.filter(c => c.listId === listId).forEach(card => { card.listId = archivesList.id; });
  lists = lists.filter(l => l.id !== listId);

  saveData();
  renderBoard();
  renderMapMarkers({ fit: true, reason: 'archive' });
  closeDeleteListModal();
}

function deleteCardsAndList() {
  const listId = parseInt(document.getElementById('deleteListModal').getAttribute('data-list-id'), 10);
  cards = cards.filter(c => c.listId !== listId);
  lists = lists.filter(l => l.id !== listId);

  saveData();
  renderBoard();
  renderMapMarkers({ fit: true, reason: 'deleteList' });
  closeDeleteListModal();
}

// -------------------------
// Modals - cards
// -------------------------
let addCardChecklist = []; // Temporary checklist for new card

function openAddCardModal() {
  selectedLabels = [];
  addCardChecklist = [];
  addCardCoverImage = null;
  document.getElementById('cardModalTitle').textContent = 'Ajouter une carte';
  document.getElementById('cardTitleInput').value = '';
  document.getElementById('cardDescriptionInput').value = '';
  document.getElementById('cardAddressInput').value = '';
  document.getElementById('cardDueDateInput').value = '';
  document.getElementById('addCardLabelSearch').value = '';
  document.getElementById('addressAutocomplete').style.display = 'none';
  document.getElementById('addCardMiniMapContainer').style.display = 'none';
  document.getElementById('addCardChecklistContainer').innerHTML = '';
  document.getElementById('addCardCoverImageContainer').style.display = 'none';
  document.getElementById('addCardImageSearchInput').value = '';
  document.getElementById('addCardImageSearchResults').style.display = 'none';
  document.getElementById('addCardUrlInputContainer').style.display = 'none';
  document.getElementById('addCardImageUrlInput').value = '';
  window.currentAddressCoordinates = null;

  document.getElementById('addCardModal').classList.add('show');
  document.getElementById('cardTitleInput').focus();

  // Initialize label selector
  renderAddCardLabelSelector();
}

function closeAddCardModal() {
  document.getElementById('addCardModal').classList.remove('show');
  document.getElementById('addressAutocomplete').style.display = 'none';
  document.getElementById('addCardMiniMapContainer').style.display = 'none';
  document.getElementById('addCardCoverImageContainer').style.display = 'none';
  document.getElementById('addCardImageSearchResults').style.display = 'none';
  addCardChecklist = [];
  addCardCoverImage = null;
}

// Toggle label selection for add card modal
function toggleLabelSelection(labelId) {
  const idx = selectedLabels.indexOf(labelId);
  if (idx > -1) {
    selectedLabels.splice(idx, 1);
  } else {
    selectedLabels.push(labelId);
  }
  renderAddCardLabelSelector();
}

// Toggle label selection for detail modal
function toggleDetailLabelSelection(labelId) {
  const idx = detailSelectedLabels.indexOf(labelId);
  if (idx > -1) {
    detailSelectedLabels.splice(idx, 1);
  } else {
    detailSelectedLabels.push(labelId);
  }
  renderDetailLabelSelector();
}

function addCardChecklistItem() {
  const text = prompt("Entrez l'item de la checklist:");
  if (!text || !text.trim()) return;

  addCardChecklist.push({ text: text.trim(), completed: false });
  renderAddCardChecklist();
}

function renderAddCardChecklist() {
  const container = document.getElementById('addCardChecklistContainer');
  container.innerHTML = '';

  addCardChecklist.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'checklist-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!item.completed;
    checkbox.onchange = () => {
      item.completed = checkbox.checked;
      renderAddCardChecklist();
    };

    const text = document.createElement('div');
    text.className = 'checklist-item-text';
    text.textContent = item.text;

    const del = document.createElement('button');
    del.className = 'checklist-item-delete';
    del.textContent = 'Supprimer';
    del.onclick = () => {
      addCardChecklist.splice(index, 1);
      renderAddCardChecklist();
    };

    itemDiv.appendChild(checkbox);
    itemDiv.appendChild(text);
    itemDiv.appendChild(del);
    container.appendChild(itemDiv);
  });
}

function saveNewCard() {
  const title = document.getElementById('cardTitleInput').value.trim();
  if (!title) return alert('Veuillez entrer un titre');

  const newCard = {
    id: Math.max(...cards.map(c => c.id), 0) + 1,
    listId: currentListId,
    title,
    description: document.getElementById('cardDescriptionInput').value,
    labels: [...selectedLabels],
    address: document.getElementById('cardAddressInput').value.trim(),
    coordinates: window.currentAddressCoordinates || null,
    dueDate: document.getElementById('cardDueDateInput').value,
    coverImage: addCardCoverImage ? addCardCoverImage.url : null,
    coverImageCredit: addCardCoverImage ? addCardCoverImage.credit : null,
    checklist: [...addCardChecklist],
    history: [{ action: 'Carte créée', timestamp: new Date().toLocaleString('fr-FR') }],
    createdAt: new Date().toLocaleString('fr-FR')
  };

  cards.push(newCard);
  window.currentAddressCoordinates = null;
  addCardChecklist = [];
  addCardCoverImage = null;

  saveData();
  renderBoard();

  // New point => auto fitBounds (especially if 0 markers before)
  renderMapMarkers({ fit: true, reason: 'createCard' });

  closeAddCardModal();
}

// -------------------------
// Card detail modal
// -------------------------
function openCardDetailModal(card) {
  currentCardId = card.id;
  detailSelectedLabels = [...(card.labels || [])];

  document.getElementById('detailCardTitle').textContent = card.title;

  document.getElementById('detailTitle').textContent = card.title;
  document.getElementById('detailTitleInput').value = card.title;

  document.getElementById('detailDescription').textContent = card.description || '(Vide)';
  document.getElementById('detailDescription').className = card.description ? 'card-detail-value' : 'card-detail-value empty';
  document.getElementById('detailDescriptionInput').value = card.description || '';

  document.getElementById('detailDate').textContent = card.dueDate || '(Pas de date)';
  document.getElementById('detailDate').className = card.dueDate ? 'card-detail-value' : 'card-detail-value empty';
  document.getElementById('detailDateInput').value = card.dueDate || '';

  document.getElementById('detailAddress').textContent = card.address || '(Aucune adresse)';
  document.getElementById('detailAddress').className = card.address ? 'card-detail-value' : 'card-detail-value empty';
  document.getElementById('detailAddressInput').value = card.address || '';
  document.getElementById('detailAddressAutocomplete').style.display = 'none';

  // Cover image
  const coverContainer = document.getElementById('detailCoverImageContainer');
  const coverImg = document.getElementById('detailCoverImage');
  const removeCoverOption = document.getElementById('removeCoverImageOption');
  if (card.coverImage) {
    coverContainer.style.display = 'block';
    coverImg.src = card.coverImage;
    if (removeCoverOption) removeCoverOption.style.display = 'block';
  } else {
    coverContainer.style.display = 'none';
    if (removeCoverOption) removeCoverOption.style.display = 'none';
  }

  // Reset image search
  document.getElementById('imageSearchInput').value = '';
  document.getElementById('imageSearchResults').style.display = 'none';
  document.getElementById('detailUrlInputContainer').style.display = 'none';
  document.getElementById('detailImageUrlInput').value = '';

  // Reset labels input panel
  document.getElementById('detailLabelsInput').style.display = 'none';
  document.getElementById('detailLabels').style.display = 'flex';
  document.getElementById('detailLabelSearch').value = '';

  renderDetailLabels(card);
  renderChecklist(card);
  renderHistory(card);

  document.getElementById('cardDetailModal').classList.add('show');

  // Mini-map after modal is visible
  setTimeout(() => initOrUpdateDetailMiniMap(card), 300);
}

function closeCardDetailModal() {
  document.getElementById('cardDetailModal').classList.remove('show');
  document.getElementById('cardOptionsMenu').classList.remove('show');
  currentCardId = null;
}

function toggleCardOptionsMenu() {
  const menu = document.getElementById('cardOptionsMenu');
  menu.classList.toggle('show');
}

function closeCardOptionsMenu() {
  document.getElementById('cardOptionsMenu').classList.remove('show');
}

function toggleNavbarOptionsMenu() {
  const menu = document.getElementById('navbarOptionsMenu');
  menu.classList.toggle('show');
}

function closeNavbarOptionsMenu() {
  document.getElementById('navbarOptionsMenu').classList.remove('show');
}

function renderDetailLabels(card) {
  const labelsContainer = document.getElementById('detailLabels');
  labelsContainer.innerHTML = '';

  if (card.labels && card.labels.length > 0) {
    card.labels.forEach(labelId => {
      const labelData = getLabelById(labelId);
      if (labelData) {
        const label = document.createElement('div');
        label.className = 'label';
        label.style.backgroundColor = labelData.color;
        label.textContent = labelData.name;
        labelsContainer.appendChild(label);
      }
    });
    labelsContainer.className = 'card-detail-value';
  } else {
    labelsContainer.textContent = '(Aucune étiquette)';
    labelsContainer.className = 'card-detail-value empty';
  }
}

function rgbToHex(rgb) {
  if (!rgb) return '';
  if (rgb.startsWith('#')) return rgb.toLowerCase();
  const m = rgb.match(/\d+/g);
  if (!m) return '';
  const r = parseInt(m[0], 10).toString(16).padStart(2, '0');
  const g = parseInt(m[1], 10).toString(16).padStart(2, '0');
  const b = parseInt(m[2], 10).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toLowerCase();
}

function editCardField(field) {
  const valueDiv = document.getElementById(`detail${field.charAt(0).toUpperCase() + field.slice(1)}`);
  const inputElement = document.getElementById(`detail${field.charAt(0).toUpperCase() + field.slice(1)}Input`);

  if (!inputElement) return;

  // Labels: show label selector panel
  if (field === 'labels') {
    const panel = document.getElementById('detailLabelsInput');
    valueDiv.style.display = 'none';
    panel.style.display = 'block';
    renderDetailLabelSelector();
    return;
  }

  valueDiv.style.display = 'none';
  inputElement.style.display = 'block';
  inputElement.focus();
}

function saveCardField(event, field) {
  if (event && event.key !== 'Enter' && event.type !== 'blur') return;

  const card = cards.find(c => c.id === currentCardId);
  if (!card) return;

  const valueDiv = document.getElementById(`detail${field.charAt(0).toUpperCase() + field.slice(1)}`);
  const inputElement = document.getElementById(`detail${field.charAt(0).toUpperCase() + field.slice(1)}Input`);

  if (field === 'title') {
    const v = inputElement.value.trim();
    if (v) {
      card.title = v;
      document.getElementById('detailCardTitle').textContent = v;
      valueDiv.textContent = v;
    }
  } else if (field === 'description') {
    card.description = inputElement.value.trim();
    valueDiv.textContent = card.description || '(Vide)';
    valueDiv.className = card.description ? 'card-detail-value' : 'card-detail-value empty';
  } else if (field === 'dueDate') {
    card.dueDate = inputElement.value;
    valueDiv.textContent = card.dueDate || '(Pas de date)';
    valueDiv.className = card.dueDate ? 'card-detail-value' : 'card-detail-value empty';
  } else if (field === 'address') {
    card.address = inputElement.value.trim();

    if (window.detailAddressCoordinates) {
      card.coordinates = window.detailAddressCoordinates;
      window.detailAddressCoordinates = null;
    }

    valueDiv.textContent = card.address || '(Aucune adresse)';
    valueDiv.className = card.address ? 'card-detail-value' : 'card-detail-value empty';

    document.getElementById('detailAddressAutocomplete').style.display = 'none';

    // Update both maps
    renderMapMarkers({ fit: true, reason: 'editAddress' });
    if (detailMiniMap) renderDetailMiniMarkers(card.id);
  } else if (field === 'labels') {
    card.labels = [...detailSelectedLabels];
    renderDetailLabels(card);

    document.getElementById('detailLabelsInput').style.display = 'none';
    document.getElementById('detailLabels').style.display = 'flex';
  }

  if (field !== 'labels') {
    card.history.push({ action: `${field} modifié`, timestamp: new Date().toLocaleString('fr-FR') });
  }

  saveData();
  renderBoard();

  if (field !== 'labels') {
    inputElement.style.display = 'none';
    valueDiv.style.display = 'flex';
  }
}

function deleteCard() {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) return;

  cards = cards.filter(c => c.id !== currentCardId);
  saveData();
  renderBoard();

  // If deleting last marker, keep map as is
  renderMapMarkers({ fit: true, reason: 'deleteCard' });

  closeCardDetailModal();
}

// -------------------------
// Checklist + history
// -------------------------
function renderChecklist(card) {
  const container = document.getElementById('checklistContainer');
  container.innerHTML = '';

  (card.checklist || []).forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'checklist-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!item.completed;
    checkbox.onchange = () => {
      item.completed = checkbox.checked;
      card.history.push({
        action: `Item checklist: "${item.text}" ${item.completed ? 'coché' : 'décoché'}`,
        timestamp: new Date().toLocaleString('fr-FR')
      });
      saveData();
      renderChecklist(card);
      renderHistory(card);
    };

    const text = document.createElement('div');
    text.className = 'checklist-item-text';
    text.textContent = item.text;

    const del = document.createElement('button');
    del.className = 'checklist-item-delete';
    del.textContent = 'Supprimer';
    del.onclick = () => {
      card.checklist.splice(index, 1);
      card.history.push({
        action: `Item checklist supprimé: "${item.text}"`,
        timestamp: new Date().toLocaleString('fr-FR')
      });
      saveData();
      renderChecklist(card);
      renderHistory(card);
    };

    itemDiv.appendChild(checkbox);
    itemDiv.appendChild(text);
    itemDiv.appendChild(del);
    container.appendChild(itemDiv);
  });
}

function addChecklistItem() {
  const card = cards.find(c => c.id === currentCardId);
  if (!card) return;

  const text = prompt("Entrez l'item de la checklist:");
  if (!text || !text.trim()) return;

  card.checklist = card.checklist || [];
  card.checklist.push({ text: text.trim(), completed: false });
  card.history.push({ action: `Item checklist ajouté: "${text.trim()}"`, timestamp: new Date().toLocaleString('fr-FR') });
  saveData();
  renderChecklist(card);
  renderHistory(card);
}

function renderHistory(card) {
  const container = document.getElementById('historyContainer');
  container.innerHTML = '';

  if (!card.history || card.history.length === 0) {
    container.innerHTML = '<div class="history-item">Aucun historique</div>';
    return;
  }

  card.history.forEach(entry => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `<div class="history-action">${entry.action}</div><div class="history-time">${entry.timestamp}</div>`;
    container.appendChild(item);
  });
}

// -------------------------
// Address autocomplete (Add modal)
// -------------------------
function searchAddress(query) {
  clearTimeout(addressSearchTimeout);
  if (!query || query.length < 2) {
    document.getElementById('addressAutocomplete').style.display = 'none';
    return;
  }
  addressSearchTimeout = setTimeout(() => performAddressSearch(query), 500);
}

async function performAddressSearch(query) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
    const results = await response.json();

    const ac = document.getElementById('addressAutocomplete');
    ac.innerHTML = '';
    if (!results || results.length === 0) { ac.style.display = 'none'; return; }

    results.forEach(r => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.textContent = r.display_name;
      item.onclick = () => {
        document.getElementById('cardAddressInput').value = r.display_name;
        window.currentAddressCoordinates = { lat: parseFloat(r.lat), lon: parseFloat(r.lon) };
        ac.style.display = 'none';

        // Show mini-map with selected address
        showAddCardMiniMap(parseFloat(r.lat), parseFloat(r.lon));
      };
      ac.appendChild(item);
    });

    ac.style.display = 'block';
  } catch (e) {
    console.error(e);
  }
}

// -------------------------
// Mini-map for Add Card modal
// -------------------------
function showAddCardMiniMap(lat, lon) {
  const container = document.getElementById('addCardMiniMapContainer');
  container.style.display = 'block';

  // Force reflow
  container.offsetHeight;

  if (!addCardMiniMap) {
    addCardMiniMap = L.map('addCardMiniMap').setView([lat, lon], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(addCardMiniMap);
  } else {
    addCardMiniMap.setView([lat, lon], 13);
  }

  // Remove existing marker if any
  if (addCardMiniMarker) {
    addCardMiniMap.removeLayer(addCardMiniMarker);
  }

  // Add marker at selected location
  addCardMiniMarker = L.marker([lat, lon]).addTo(addCardMiniMap);

  // Invalidate size after display
  requestAnimationFrame(() => {
    setTimeout(() => {
      addCardMiniMap.invalidateSize();
      addCardMiniMap.setView([lat, lon], 13);
    }, 100);
  });
}

// -------------------------
// Address autocomplete (Detail modal)
// -------------------------
function searchDetailAddress(query) {
  clearTimeout(detailAddressSearchTimeout);
  if (!query || query.length < 2) {
    document.getElementById('detailAddressAutocomplete').style.display = 'none';
    return;
  }
  detailAddressSearchTimeout = setTimeout(() => performDetailAddressSearch(query), 500);
}

async function performDetailAddressSearch(query) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
    const results = await response.json();

    const ac = document.getElementById('detailAddressAutocomplete');
    ac.innerHTML = '';
    if (!results || results.length === 0) { ac.style.display = 'none'; return; }

    results.forEach(r => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.textContent = r.display_name;

      item.onclick = () => {
        const input = document.getElementById('detailAddressInput');
        const valueDiv = document.getElementById('detailAddress');

        input.value = r.display_name;
        window.detailAddressCoordinates = { lat: parseFloat(r.lat), lon: parseFloat(r.lon) };
        ac.style.display = 'none';

        const card = cards.find(c => c.id === currentCardId);
        if (!card) return;

        card.address = r.display_name;
        card.coordinates = { lat: parseFloat(r.lat), lon: parseFloat(r.lon) };
        card.history.push({ action: 'Adresse modifiée via auto-complétion', timestamp: new Date().toLocaleString('fr-FR') });

        saveData();

        // Update and show address value, hide input
        valueDiv.textContent = card.address;
        valueDiv.className = 'card-detail-value';
        valueDiv.style.display = 'flex';
        input.style.display = 'none';

        // FitBounds auto (including 0 -> 1 point)
        renderMapMarkers({ fit: true, reason: 'detailAutocomplete' });

        // Initialize or update mini-map immediately
        initOrUpdateDetailMiniMap(card);

        renderBoard();
      };

      ac.appendChild(item);
    });

    ac.style.display = 'block';
  } catch (e) {
    console.error(e);
  }
}

// -------------------------
// Main map (big)
// -------------------------
function initMap() {
  map = L.map('map');

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);

  // Restore last map position if exists
  const savedView = getSavedMapView();
  if (savedView) {
    map.setView([savedView.lat, savedView.lng], savedView.zoom);
  } else {
    map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
  }

  // Persist map view
  map.on('moveend zoomend', () => saveMapView());

  // Search
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchMapLocation(document.getElementById('searchInput').value);
  });
}

function getSavedMapView() {
  try {
    const raw = localStorage.getItem(STORAGE_MAP_VIEW);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj.lat !== 'number' || typeof obj.lng !== 'number' || typeof obj.zoom !== 'number') return null;
    return obj;
  } catch {
    return null;
  }
}

function saveMapView() {
  if (!map) return;
  const c = map.getCenter();
  const z = map.getZoom();
  localStorage.setItem(STORAGE_MAP_VIEW, JSON.stringify({ lat: c.lat, lng: c.lng, zoom: z }));
}

function searchMapLocation(query) {
  if (!query || query.length < 2) return;

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
    .then(r => r.json())
    .then(results => {
      if (results && results.length > 0) {
        map.setView([parseFloat(results[0].lat), parseFloat(results[0].lon)], 13);
      }
    })
    .catch(console.error);
}

function clearMapMarkersOnly() {
  markersHidden = !markersHidden;
  if (markersHidden) {
    markersLayer.clearLayers();
  } else {
    renderMapMarkers({ fit: false, reason: 'unhideMarkers' });
  }
}

function getCardsWithCoords() {
  return cards.filter(c => c.coordinates && typeof c.coordinates.lat === 'number' && typeof c.coordinates.lon === 'number');
}

function renderMapMarkers({ fit, reason } = { fit: false, reason: 'unknown' }) {
  if (!map || !markersLayer) return;

  // Clear
  markersLayer.clearLayers();
  markers = {};

  if (markersHidden) {
    // Don't recreate visual markers, keep fitBounds logic inactive
    lastMarkerCount = 0;
    return;
  }

  const cardsWithCoords = getCardsWithCoords();
  const count = cardsWithCoords.length;

  cardsWithCoords.forEach(card => {
    const m = L.marker([card.coordinates.lat, card.coordinates.lon]);

    const popupHtml = `
      <strong>${escapeHtml(card.title)}</strong><br>
      ${card.description ? escapeHtml(card.description) + '<br>' : ''}
      ${card.address ? '📍 ' + escapeHtml(card.address) + '<br>' : ''}
      ${card.dueDate ? '📅 ' + escapeHtml(card.dueDate) : ''}
    `;

    m.bindPopup(popupHtml);
    m.addTo(markersLayer);
    markers[card.id] = m;
  });

  const hadZeroBefore = (lastMarkerCount === 0);
  lastMarkerCount = count;

  // Intelligent fitBounds:
  // - on load (fit:true)
  // - after modifications (fit:true)
  // - especially when going from 0 -> >0
  if (count > 0 && (fit || hadZeroBefore)) {
    fitMapToMarkers(false);
  }
}

function fitMapToMarkers(animate) {
  if (!map) return;
  const cardsWithCoords = getCardsWithCoords();
  if (cardsWithCoords.length === 0) return; // keep map as is

  const bounds = L.latLngBounds(cardsWithCoords.map(c => [c.coordinates.lat, c.coordinates.lon]));
  map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, animate: !!animate });
}

function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// -------------------------
// Mini-map (detail modal)
// -------------------------
function initOrUpdateDetailMiniMap(card) {
  const container = document.getElementById('detailMiniMapContainer');
  container.style.display = 'block';

  // Force a reflow to ensure container is visible
  container.offsetHeight;

  if (!detailMiniMap) {
    detailMiniMap = L.map('detailMiniMap').setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(detailMiniMap);

    detailMiniMarkersLayer = L.layerGroup().addTo(detailMiniMap);
  }

  // Important in modal: recalculate size once visible, then render markers
  requestAnimationFrame(() => {
    setTimeout(() => {
      detailMiniMap.invalidateSize();
      renderDetailMiniMarkers(card.id);
    }, 100);
  });
}

function renderDetailMiniMarkers(focusedCardId) {
  if (!detailMiniMap || !detailMiniMarkersLayer) return;

  detailMiniMarkersLayer.clearLayers();
  detailMiniCurrentMarker = null;

  const cardsWithCoords = getCardsWithCoords();
  let focusLatLng = null;

  cardsWithCoords.forEach(c => {
    const lat = c.coordinates.lat;
    const lon = c.coordinates.lon;
    const isCurrent = c.id === focusedCardId;

    let markerOptions = {};
    if (isCurrent) {
      const bigIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [35, 57],
        iconAnchor: [17, 56],
        popupAnchor: [1, -34],
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        shadowSize: [41, 41],
        shadowAnchor: [12, 41]
      });
      markerOptions.icon = bigIcon;
      focusLatLng = [lat, lon];
    }

    const marker = L.marker([lat, lon], markerOptions);

    const popupHtml = `
      <strong>${escapeHtml(c.title)}</strong><br>
      ${c.description ? escapeHtml(c.description) + '<br>' : ''}
      ${c.address ? '📍 ' + escapeHtml(c.address) + '<br>' : ''}
      ${c.dueDate ? '📅 ' + escapeHtml(c.dueDate) : ''}
    `;

    marker.bindPopup(popupHtml);

    marker.on('click', () => {
      // Mini-map recenters, big map doesn't move
      detailMiniMap.setView([lat, lon], 13);
      marker.openPopup();
    });

    marker.addTo(detailMiniMarkersLayer);

    if (isCurrent) detailMiniCurrentMarker = marker;
  });

  if (focusLatLng) {
    detailMiniMap.setView(focusLatLng, 13);
  } else if (cardsWithCoords.length > 0) {
    const bounds = L.latLngBounds(cardsWithCoords.map(c => [c.coordinates.lat, c.coordinates.lon]));
    detailMiniMap.fitBounds(bounds, { padding: [20, 20], maxZoom: FIT_MAX_ZOOM });
  }
}

// -------------------------
// Persisted Board/Map view
// -------------------------
function restoreLastView() {
  const saved = localStorage.getItem(STORAGE_ACTIVE_VIEW) || 'board';
  switchView(saved, { fromInit: true });
}

function switchView(view, opts = { fromInit: false }) {
  const boardSection = document.getElementById('boardSection');
  const mapSection = document.getElementById('mapSection');

  const btnBoard = document.getElementById('btnViewBoard');
  const btnMap = document.getElementById('btnViewMap');

  btnBoard.classList.remove('active');
  btnMap.classList.remove('active');

  if (view === 'map') {
    boardSection.classList.remove('active');
    mapSection.classList.add('active');
    btnMap.classList.add('active');
  } else {
    mapSection.classList.remove('active');
    boardSection.classList.add('active');
    btnBoard.classList.add('active');
  }

  localStorage.setItem(STORAGE_ACTIVE_VIEW, view);

  if (view === 'map') {
    // After display (container size change)
    setTimeout(() => {
      map && map.invalidateSize();
      // If we have markers, fitBounds is possible (otherwise keep view)
      renderMapMarkers({ fit: false, reason: 'switchView' });
    }, 250);
  }
}

// -------------------------
// Delete all cards (test)
// -------------------------
function deleteAllCards() {
  if (!confirm('Supprimer toutes les cartes ?')) return;

  cards = [];
  saveData();
  renderBoard();

  // Map stays displayed, just without markers
  renderMapMarkers({ fit: true, reason: 'deleteAll' });

  // If mini-map was open, refresh it too
  if (detailMiniMap) {
    detailMiniMarkersLayer && detailMiniMarkersLayer.clearLayers();
  }
}

// -------------------------
// Click outside modals
// -------------------------
let mouseDownTarget = null;

window.onmousedown = (event) => {
  mouseDownTarget = event.target;
};

window.onmouseup = (event) => {
  // Close dropdown menus if clicking outside of them
  const cardDropdown = document.getElementById('cardOptionsDropdown');
  if (cardDropdown && !cardDropdown.contains(event.target)) {
    closeCardOptionsMenu();
  }

  const navbarDropdown = document.getElementById('navbarOptionsDropdown');
  if (navbarDropdown && !navbarDropdown.contains(event.target)) {
    closeNavbarOptionsMenu();
  }

  // Only close modal if mousedown AND mouseup both happened on the modal backdrop
  // This prevents closing when selecting text and releasing outside
  if (mouseDownTarget !== event.target) {
    mouseDownTarget = null;
    return;
  }

  const addListModal = document.getElementById('addListModal');
  const addCardModal = document.getElementById('addCardModal');
  const cardDetailModal = document.getElementById('cardDetailModal');
  const deleteListModal = document.getElementById('deleteListModal');
  const labelsManagementModal = document.getElementById('labelsManagementModal');

  const addressAutocomplete = document.getElementById('addressAutocomplete');

  if (event.target === addListModal) closeAddListModal();
  if (event.target === addCardModal) closeAddCardModal();
  if (event.target === cardDetailModal) closeCardDetailModal();
  if (event.target === deleteListModal) closeDeleteListModal();
  if (event.target === labelsManagementModal) closeLabelsManagementModal();

  if (!event.target.closest('.form-group-relative') && addressAutocomplete) {
    addressAutocomplete.style.display = 'none';
  }

  mouseDownTarget = null;
};

// -------------------------
// Image Search (Teleport API - free, no key required)
// -------------------------
let addCardCoverImage = null; // Temporary cover image for new card

// Predefined image collections for common travel/place searches
const IMAGE_COLLECTIONS = {
  // Monuments & landmarks
  'tour eiffel': ['https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=800', 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=800', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800'],
  'paris': ['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', 'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800'],
  'london': ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800', 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800'],
  'new york': ['https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800', 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800', 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800'],
  'tokyo': ['https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800', 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800'],

  // Nature
  'plage': ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800', 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800'],
  'beach': ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800', 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800'],
  'montagne': ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800', 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800'],
  'mountain': ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800', 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800'],
  'foret': ['https://images.unsplash.com/photo-1448375240586-882707db888b?w=800', 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800', 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800'],
  'forest': ['https://images.unsplash.com/photo-1448375240586-882707db888b?w=800', 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800', 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800'],
  'lac': ['https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800'],
  'lake': ['https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800'],

  // Places
  'restaurant': ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'],
  'cafe': ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800'],
  'hotel': ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800'],
  'musee': ['https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800', 'https://images.unsplash.com/photo-1503152394-c571994fd383?w=800', 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800'],
  'museum': ['https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800', 'https://images.unsplash.com/photo-1503152394-c571994fd383?w=800', 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800'],
  'shopping': ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800', 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800'],
  'parc': ['https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800', 'https://images.unsplash.com/photo-1496429862132-5ab36b6ae330?w=800', 'https://images.unsplash.com/photo-1558101776-36d2a8b0f9a6?w=800'],
  'park': ['https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800', 'https://images.unsplash.com/photo-1496429862132-5ab36b6ae330?w=800', 'https://images.unsplash.com/photo-1558101776-36d2a8b0f9a6?w=800'],

  // Activities
  'voyage': ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=800'],
  'travel': ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=800'],
  'avion': ['https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800', 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800', 'https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=800'],
  'airport': ['https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800', 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800', 'https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=800'],

  // Default/generic
  'default': ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=800', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800']
};

// Search images for detail modal
function searchImages() {
  const query = document.getElementById('imageSearchInput').value.trim();
  if (!query) return;

  const resultsContainer = document.getElementById('imageSearchResults');
  displayImageSearchResults(query, resultsContainer, 'detail');
}

// Search images for add card modal
function searchAddCardImages() {
  const query = document.getElementById('addCardImageSearchInput').value.trim();
  if (!query) return;

  const resultsContainer = document.getElementById('addCardImageSearchResults');
  displayImageSearchResults(query, resultsContainer, 'addCard');
}

function displayImageSearchResults(query, container, mode) {
  container.style.display = 'grid';
  container.innerHTML = '<div class="image-search-loading"><i class="fas fa-spinner fa-spin"></i> Recherche en cours...</div>';

  // Small delay to show loading state
  setTimeout(() => {
    const queryLower = query.toLowerCase().trim();
    let images = [];

    // Try to find matching collection
    for (const [key, urls] of Object.entries(IMAGE_COLLECTIONS)) {
      if (queryLower.includes(key) || key.includes(queryLower)) {
        images = [...urls];
        break;
      }
    }

    // If no match found, use default collection
    if (images.length === 0) {
      images = [...IMAGE_COLLECTIONS['default']];
    }

    // Shuffle and take up to 9 images
    images = shuffleArray(images).slice(0, 9);

    // Add more variety by appending random params
    images = images.map((url, i) => `${url}&sig=${Date.now()}-${i}`);

    displayLocalResults(images, query, container, mode);
  }, 300);
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function displayLocalResults(images, query, container, mode) {
  container.innerHTML = '';

  if (images.length === 0) {
    container.innerHTML = '<div class="image-search-empty">Aucune image trouvée. Essayez d\'autres mots-clés.</div>';
    return;
  }

  images.forEach((imageUrl, index) => {
    const item = document.createElement('div');
    item.className = 'image-search-item';
    item.innerHTML = `
      <img src="${imageUrl}" alt="${query}" onerror="this.parentElement.style.display='none'">
      <div class="image-credit">Unsplash</div>
    `;
    item.onclick = () => {
      // Use larger version for the cover
      const largeUrl = imageUrl.replace('w=800', 'w=1200');
      if (mode === 'detail') {
        selectCoverImage(largeUrl, 'Unsplash');
      } else {
        selectAddCardCoverImage(largeUrl, 'Unsplash');
      }
    };
    container.appendChild(item);
  });
}

// Select cover image for existing card (detail modal)
function selectCoverImage(imageUrl, photographer) {
  const card = cards.find(c => c.id === currentCardId);
  if (!card) return;

  card.coverImage = imageUrl;
  card.coverImageCredit = photographer;
  card.history.push({
    action: `Image de couverture ajoutée (${photographer})`,
    timestamp: new Date().toLocaleString('fr-FR')
  });

  saveData();
  renderBoard();

  // Update modal display
  const container = document.getElementById('detailCoverImageContainer');
  const img = document.getElementById('detailCoverImage');

  container.style.display = 'block';
  img.src = imageUrl;

  // Show the remove option in menu
  const removeCoverOption = document.getElementById('removeCoverImageOption');
  if (removeCoverOption) removeCoverOption.style.display = 'block';

  // Hide search results
  document.getElementById('imageSearchResults').style.display = 'none';
  document.getElementById('imageSearchInput').value = '';

  renderHistory(card);
}

// Select cover image for new card (add card modal)
function selectAddCardCoverImage(imageUrl, photographer) {
  addCardCoverImage = { url: imageUrl, credit: photographer };

  // Update modal display
  const container = document.getElementById('addCardCoverImageContainer');
  const img = document.getElementById('addCardCoverImage');

  container.style.display = 'block';
  img.src = imageUrl;

  // Hide search results
  document.getElementById('addCardImageSearchResults').style.display = 'none';
  document.getElementById('addCardImageSearchInput').value = '';
}

// Remove cover image from existing card (detail modal)
function removeCoverImage() {
  const card = cards.find(c => c.id === currentCardId);
  if (!card) return;

  card.coverImage = null;
  card.coverImageCredit = null;
  card.history.push({
    action: 'Image de couverture supprimée',
    timestamp: new Date().toLocaleString('fr-FR')
  });

  saveData();
  renderBoard();

  // Update modal display
  document.getElementById('detailCoverImageContainer').style.display = 'none';

  // Hide the remove option in menu
  const removeCoverOption = document.getElementById('removeCoverImageOption');
  if (removeCoverOption) removeCoverOption.style.display = 'none';

  renderHistory(card);
}

// Remove cover image from new card (add card modal)
function removeAddCardCoverImage() {
  addCardCoverImage = null;
  document.getElementById('addCardCoverImageContainer').style.display = 'none';
}

// Toggle URL input visibility
function toggleUrlInput(mode) {
  const containerId = mode === 'detail' ? 'detailUrlInputContainer' : 'addCardUrlInputContainer';
  const container = document.getElementById(containerId);

  if (container.style.display === 'none' || container.style.display === '') {
    container.style.display = 'flex';
    container.querySelector('input').focus();
  } else {
    container.style.display = 'none';
  }
}

// Apply image from URL
function applyImageUrl(mode) {
  const inputId = mode === 'detail' ? 'detailImageUrlInput' : 'addCardImageUrlInput';
  const url = document.getElementById(inputId).value.trim();

  if (!url) {
    alert('Veuillez entrer une URL d\'image valide');
    return;
  }

  // Validate URL format
  if (!url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i) && !url.match(/^https?:\/\/.+/i)) {
    // Try to use it anyway, the browser will validate
  }

  if (mode === 'detail') {
    selectCoverImage(url, 'Lien externe');
    document.getElementById('detailUrlInputContainer').style.display = 'none';
    document.getElementById('detailImageUrlInput').value = '';
  } else {
    selectAddCardCoverImage(url, 'Lien externe');
    document.getElementById('addCardUrlInputContainer').style.display = 'none';
    document.getElementById('addCardImageUrlInput').value = '';
  }
}

// Handle image file upload
function handleImageUpload(input, mode) {
  const file = input.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Veuillez sélectionner un fichier image valide');
    return;
  }

  // Validate file size (max 5MB for localStorage)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    alert('L\'image est trop grande. Taille maximum : 5 Mo');
    return;
  }

  const reader = new FileReader();

  reader.onload = function(e) {
    const base64Data = e.target.result;

    if (mode === 'detail') {
      selectCoverImage(base64Data, 'Image importée');
    } else {
      selectAddCardCoverImage(base64Data, 'Image importée');
    }
  };

  reader.onerror = function() {
    alert('Erreur lors de la lecture du fichier');
  };

  reader.readAsDataURL(file);

  // Reset input to allow selecting the same file again
  input.value = '';
}

// Add Enter key support for image search and URL input
document.addEventListener('DOMContentLoaded', () => {
  // Detail modal image search
  const imageSearchInput = document.getElementById('imageSearchInput');
  if (imageSearchInput) {
    imageSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchImages();
      }
    });
  }

  // Add card modal image search
  const addCardImageSearchInput = document.getElementById('addCardImageSearchInput');
  if (addCardImageSearchInput) {
    addCardImageSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchAddCardImages();
      }
    });
  }

  // Detail modal URL input
  const detailImageUrlInput = document.getElementById('detailImageUrlInput');
  if (detailImageUrlInput) {
    detailImageUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyImageUrl('detail');
      }
    });
  }

  // Add card modal URL input
  const addCardImageUrlInput = document.getElementById('addCardImageUrlInput');
  if (addCardImageUrlInput) {
    addCardImageUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyImageUrl('addCard');
      }
    });
  }
});

// -------------------------
// Mobile Keyboard Detection & Modal Adjustment
// -------------------------
function initMobileKeyboardHandler() {
  // Only run on mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (!isMobile) return;

  const modals = document.querySelectorAll('.modal');
  let initialViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  let keyboardOpen = false;
  let scrollTimeoutId = null;
  let lastFocusedElement = null;
  let hasScrolledForCurrentFocus = false;

  // Set initial CSS custom property for viewport height
  updateViewportHeight();

  // Use visualViewport API if available (better support on iOS/Android)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportResize);
    window.visualViewport.addEventListener('scroll', handleViewportScroll);
  } else {
    // Fallback for older browsers
    window.addEventListener('resize', handleWindowResize);
  }

  function updateViewportHeight() {
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--visual-viewport-height', `${vh}px`);

    // Also update the keyboard height for margin calculation
    const keyboardHeight = initialViewportHeight - vh;
    document.documentElement.style.setProperty('--keyboard-height', `${Math.max(0, keyboardHeight)}px`);
  }

  function handleViewportResize() {
    const currentHeight = window.visualViewport.height;
    const heightDiff = initialViewportHeight - currentHeight;

    // Update CSS custom property in real-time
    updateViewportHeight();

    // Keyboard is considered open if height reduced by more than 150px
    const isKeyboardNowOpen = heightDiff > 150;

    if (isKeyboardNowOpen !== keyboardOpen) {
      keyboardOpen = isKeyboardNowOpen;
      handleKeyboardChange(keyboardOpen);
    }
  }

  function handleViewportScroll() {
    // Update viewport height on iOS scroll (iOS moves viewport when keyboard opens)
    updateViewportHeight();
  }

  function handleWindowResize() {
    const currentHeight = window.innerHeight;
    const heightDiff = initialViewportHeight - currentHeight;

    updateViewportHeight();

    const isKeyboardNowOpen = heightDiff > 150;

    if (isKeyboardNowOpen !== keyboardOpen) {
      keyboardOpen = isKeyboardNowOpen;
      handleKeyboardChange(keyboardOpen);
    }
  }

  function handleKeyboardChange(isOpen) {
    modals.forEach(modal => {
      if (isOpen) {
        modal.classList.add('keyboard-open');
        // Force body to not scroll
        document.body.style.overflow = 'hidden';
      } else {
        modal.classList.remove('keyboard-open');
        // Restore body scroll only if no modal is open
        const anyModalOpen = document.querySelector('.modal.show');
        if (!anyModalOpen) {
          document.body.style.overflow = '';
        }
      }
    });

    // When keyboard opens, scroll to focused element once (if not already done)
    if (isOpen && lastFocusedElement && !hasScrolledForCurrentFocus) {
      scrollToElementOnce(lastFocusedElement);
    }
  }

  function scrollToElementOnce(element) {
    // Clear any pending scroll
    if (scrollTimeoutId) {
      clearTimeout(scrollTimeoutId);
    }

    // Find the open modal
    const openModal = document.querySelector('.modal.show');
    if (!openModal) return;

    // Single scroll to position the element, then user has free scroll
    scrollTimeoutId = setTimeout(() => {
      // Get element position relative to the modal
      const modalContent = openModal.querySelector('.modal-content');
      if (!modalContent) return;

      // Calculate element position within the modal
      const elementRect = element.getBoundingClientRect();
      const currentScrollTop = openModal.scrollTop;

      // Get visible height (accounting for keyboard)
      const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

      // Calculate where we need to scroll to show the element
      // Position element at roughly 1/3 from top of visible area
      const elementTopAbsolute = elementRect.top + currentScrollTop;
      const targetScrollTop = elementTopAbsolute - (viewportHeight / 3);

      openModal.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });

      hasScrolledForCurrentFocus = true;
      scrollTimeoutId = null;
    }, 150);
  }

  // Handle focus events on inputs - scroll once when focused
  document.addEventListener('focusin', (e) => {
    const target = e.target;
    const isInput = target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.tagName === 'SELECT';

    if (!isInput) return;

    const openModal = document.querySelector('.modal.show');
    if (!openModal) return;

    // Track new focus
    if (lastFocusedElement !== target) {
      lastFocusedElement = target;
      hasScrolledForCurrentFocus = false;
    }

    // Delay to allow keyboard to open, then scroll once
    setTimeout(() => {
      if (!hasScrolledForCurrentFocus) {
        scrollToElementOnce(target);
      }
    }, 350);
  });

  // Handle blur to reset scroll tracking
  document.addEventListener('focusout', (e) => {
    // Small delay to check if focus moved to another input
    setTimeout(() => {
      const activeElement = document.activeElement;
      const isStillInInput = activeElement &&
        (activeElement.tagName === 'INPUT' ||
         activeElement.tagName === 'TEXTAREA' ||
         activeElement.tagName === 'SELECT');

      if (!isStillInInput) {
        // Clear scroll timeout if user leaves all inputs
        if (scrollTimeoutId) {
          clearTimeout(scrollTimeoutId);
          scrollTimeoutId = null;
        }
        lastFocusedElement = null;
        hasScrolledForCurrentFocus = false;
      }
    }, 100);
  });

  // Update initial height on orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      initialViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      updateViewportHeight();
      // Reset keyboard state after orientation change
      keyboardOpen = false;
      modals.forEach(modal => modal.classList.remove('keyboard-open'));
    }, 500);
  });

  // Also update on page visibility change (when returning to the page)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setTimeout(() => {
        initialViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        updateViewportHeight();
      }, 300);
    }
  });
}

// Initialize mobile keyboard handler when DOM is ready
document.addEventListener('DOMContentLoaded', initMobileKeyboardHandler);

// -------------------------
// Custom Labels Management
// -------------------------

// Render label selector for Add Card modal
function renderAddCardLabelSelector() {
  const container = document.getElementById('addCardLabelSelector');
  if (!container) return;

  const searchInput = document.getElementById('addCardLabelSearch');
  const query = searchInput ? searchInput.value.trim() : '';
  const queryLower = query.toLowerCase();

  // Filter labels based on search
  const filteredLabels = customLabels.filter(label =>
    label.name.toLowerCase().includes(queryLower)
  );

  // Check if exact match exists
  const exactMatch = customLabels.find(label => label.name.toLowerCase() === queryLower);

  // Build selected labels display
  const selectedContainer = document.getElementById('addCardSelectedLabels');
  if (selectedContainer) {
    selectedContainer.innerHTML = '';
    selectedLabels.forEach(labelId => {
      const label = getLabelById(labelId);
      if (label) {
        const badge = document.createElement('span');
        badge.className = 'selected-label-badge';
        badge.style.backgroundColor = label.color;
        badge.innerHTML = `${escapeHtml(label.name)} <button type="button" onclick="toggleLabelSelection(${label.id})">&times;</button>`;
        selectedContainer.appendChild(badge);
      }
    });
  }

  // Build suggestions list
  const suggestionsContainer = document.getElementById('addCardLabelSuggestions');
  if (suggestionsContainer) {
    suggestionsContainer.innerHTML = '';

    // Show "Create" option if query exists and no exact match
    if (query && !exactMatch) {
      const createItem = document.createElement('div');
      createItem.className = 'label-suggestion-item label-create-item';
      createItem.innerHTML = `
        <i class="fas fa-plus"></i>
        <span class="label-suggestion-name">Créer "<strong>${escapeHtml(query)}</strong>"</span>
      `;
      createItem.onclick = () => quickCreateLabel(query, 'addCard');
      suggestionsContainer.appendChild(createItem);
    }

    if (filteredLabels.length === 0 && query === '') {
      suggestionsContainer.innerHTML += '<div class="label-suggestion-empty">Aucune étiquette. Tapez un nom pour en créer une.</div>';
    } else {
      filteredLabels.forEach(label => {
        const isSelected = selectedLabels.includes(label.id);
        const item = document.createElement('div');
        item.className = 'label-suggestion-item' + (isSelected ? ' selected' : '');
        item.innerHTML = `
          <span class="label-suggestion-color" style="background-color: ${label.color}"></span>
          <span class="label-suggestion-name">${escapeHtml(label.name)}</span>
          ${isSelected ? '<i class="fas fa-check"></i>' : ''}
        `;
        item.onclick = () => toggleLabelSelection(label.id);
        suggestionsContainer.appendChild(item);
      });
    }
  }
}

// Render label selector for Detail modal
function renderDetailLabelSelector() {
  const container = document.getElementById('detailLabelsInput');
  if (!container) return;

  const searchInput = document.getElementById('detailLabelSearch');
  const query = searchInput ? searchInput.value.trim() : '';
  const queryLower = query.toLowerCase();

  // Filter labels based on search
  const filteredLabels = customLabels.filter(label =>
    label.name.toLowerCase().includes(queryLower)
  );

  // Check if exact match exists
  const exactMatch = customLabels.find(label => label.name.toLowerCase() === queryLower);

  // Build selected labels display
  const selectedContainer = document.getElementById('detailSelectedLabels');
  if (selectedContainer) {
    selectedContainer.innerHTML = '';
    detailSelectedLabels.forEach(labelId => {
      const label = getLabelById(labelId);
      if (label) {
        const badge = document.createElement('span');
        badge.className = 'selected-label-badge';
        badge.style.backgroundColor = label.color;
        badge.innerHTML = `${escapeHtml(label.name)} <button type="button" onclick="toggleDetailLabelSelection(${label.id})">&times;</button>`;
        selectedContainer.appendChild(badge);
      }
    });
  }

  // Build suggestions list
  const suggestionsContainer = document.getElementById('detailLabelSuggestions');
  if (suggestionsContainer) {
    suggestionsContainer.innerHTML = '';

    // Show "Create" option if query exists and no exact match
    if (query && !exactMatch) {
      const createItem = document.createElement('div');
      createItem.className = 'label-suggestion-item label-create-item';
      createItem.innerHTML = `
        <i class="fas fa-plus"></i>
        <span class="label-suggestion-name">Créer "<strong>${escapeHtml(query)}</strong>"</span>
      `;
      createItem.onclick = () => quickCreateLabel(query, 'detail');
      suggestionsContainer.appendChild(createItem);
    }

    if (filteredLabels.length === 0 && query === '') {
      suggestionsContainer.innerHTML += '<div class="label-suggestion-empty">Aucune étiquette. Tapez un nom pour en créer une.</div>';
    } else {
      filteredLabels.forEach(label => {
        const isSelected = detailSelectedLabels.includes(label.id);
        const item = document.createElement('div');
        item.className = 'label-suggestion-item' + (isSelected ? ' selected' : '');
        item.innerHTML = `
          <span class="label-suggestion-color" style="background-color: ${label.color}"></span>
          <span class="label-suggestion-name">${escapeHtml(label.name)}</span>
          ${isSelected ? '<i class="fas fa-check"></i>' : ''}
        `;
        item.onclick = () => toggleDetailLabelSelection(label.id);
        suggestionsContainer.appendChild(item);
      });
    }
  }
}

// Handle label search input for add card modal
function handleAddCardLabelSearch() {
  renderAddCardLabelSelector();
}

// Handle label search input for detail modal
function handleDetailLabelSearch() {
  renderDetailLabelSelector();
}

// Quick create a label from the search field
function quickCreateLabel(name, mode) {
  // Pick a random color from the palette
  const randomColor = PALETTE_COLORS[Math.floor(Math.random() * PALETTE_COLORS.length)];

  // Create the new label
  const newId = customLabels.length > 0 ? Math.max(...customLabels.map(l => l.id)) + 1 : 1;
  const newLabel = { id: newId, name: name.trim(), color: randomColor };
  customLabels.push(newLabel);
  saveCustomLabels();

  // Auto-select the new label
  if (mode === 'addCard') {
    selectedLabels.push(newId);
    document.getElementById('addCardLabelSearch').value = '';
    renderAddCardLabelSelector();
  } else if (mode === 'detail') {
    detailSelectedLabels.push(newId);
    document.getElementById('detailLabelSearch').value = '';
    renderDetailLabelSelector();
  }

  // Update board to reflect new label if used elsewhere
  renderBoard();
}

// -------------------------
// Labels Management Modal
// -------------------------
let editingLabelId = null;

function openLabelsManagementModal() {
  document.getElementById('labelsManagementModal').classList.add('show');
  editingLabelId = null;
  renderLabelsManagementList();
  resetLabelForm();
  closeCardOptionsMenu();
}

function closeLabelsManagementModal() {
  document.getElementById('labelsManagementModal').classList.remove('show');
  editingLabelId = null;
}

function renderLabelsManagementList() {
  const container = document.getElementById('labelsManagementList');
  container.innerHTML = '';

  if (customLabels.length === 0) {
    container.innerHTML = '<div class="labels-empty">Aucune étiquette créée. Utilisez le formulaire ci-dessus pour en créer une.</div>';
    return;
  }

  customLabels.forEach(label => {
    const item = document.createElement('div');
    item.className = 'label-management-item';
    item.innerHTML = `
      <span class="label-management-preview" style="background-color: ${label.color}">${escapeHtml(label.name)}</span>
      <div class="label-management-actions">
        <button class="btn btn-secondary btn-sm" onclick="editLabel(${label.id})">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteLabel(${label.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    container.appendChild(item);
  });
}

function resetLabelForm() {
  document.getElementById('labelNameInput').value = '';
  document.getElementById('labelColorInput').value = '#FF6B6B';
  document.getElementById('labelFormTitle').textContent = 'Nouvelle étiquette';
  document.getElementById('saveLabelBtn').textContent = 'Créer';
  document.getElementById('cancelEditBtn').style.display = 'none';
  editingLabelId = null;
  renderPaletteColors();
}

function renderPaletteColors() {
  const container = document.getElementById('labelColorPalette');
  const currentColor = document.getElementById('labelColorInput').value;
  container.innerHTML = '';

  PALETTE_COLORS.forEach(color => {
    const colorBtn = document.createElement('div');
    colorBtn.className = 'palette-color' + (color.toLowerCase() === currentColor.toLowerCase() ? ' selected' : '');
    colorBtn.style.backgroundColor = color;
    colorBtn.onclick = () => selectPaletteColor(color);
    container.appendChild(colorBtn);
  });
}

function selectPaletteColor(color) {
  document.getElementById('labelColorInput').value = color;
  renderPaletteColors();
}

function updatePaletteFromInput() {
  renderPaletteColors();
}

function saveLabel() {
  const name = document.getElementById('labelNameInput').value.trim();
  const color = document.getElementById('labelColorInput').value;

  if (!name) {
    alert('Veuillez entrer un nom pour l\'étiquette');
    return;
  }

  if (editingLabelId) {
    // Update existing label
    const label = getLabelById(editingLabelId);
    if (label) {
      label.name = name;
      label.color = color;
    }
  } else {
    // Create new label
    const newId = customLabels.length > 0 ? Math.max(...customLabels.map(l => l.id)) + 1 : 1;
    customLabels.push({ id: newId, name, color });
  }

  saveCustomLabels();
  renderLabelsManagementList();
  renderBoard();
  resetLabelForm();

  // Refresh label selectors if modal is open
  if (document.getElementById('cardDetailModal').classList.contains('show')) {
    renderDetailLabelSelector();
  }
}

function editLabel(labelId) {
  const label = getLabelById(labelId);
  if (!label) return;

  editingLabelId = labelId;
  document.getElementById('labelNameInput').value = label.name;
  document.getElementById('labelColorInput').value = label.color;
  document.getElementById('labelFormTitle').textContent = 'Modifier l\'étiquette';
  document.getElementById('saveLabelBtn').textContent = 'Enregistrer';
  document.getElementById('cancelEditBtn').style.display = 'inline-block';
  renderPaletteColors();

  // Scroll to form
  document.getElementById('labelNameInput').focus();
}

function cancelEditLabel() {
  resetLabelForm();
}

function deleteLabel(labelId) {
  const label = getLabelById(labelId);
  if (!label) return;

  // Count cards using this label
  const cardsUsingLabel = cards.filter(c => c.labels && c.labels.includes(labelId)).length;

  let message = `Supprimer l'étiquette "${label.name}" ?`;
  if (cardsUsingLabel > 0) {
    message += `\n\nAttention: ${cardsUsingLabel} carte(s) utilisent cette étiquette.`;
  }

  if (!confirm(message)) return;

  // Remove label from all cards
  cards.forEach(card => {
    if (card.labels) {
      card.labels = card.labels.filter(id => id !== labelId);
    }
  });

  // Remove from customLabels
  customLabels = customLabels.filter(l => l.id !== labelId);

  // Remove from selected labels
  selectedLabels = selectedLabels.filter(id => id !== labelId);
  detailSelectedLabels = detailSelectedLabels.filter(id => id !== labelId);

  saveCustomLabels();
  saveData();
  renderLabelsManagementList();
  renderBoard();

  // Reset form if we were editing this label
  if (editingLabelId === labelId) {
    resetLabelForm();
  }

  // Refresh label selectors if modal is open
  if (document.getElementById('cardDetailModal').classList.contains('show')) {
    const card = cards.find(c => c.id === currentCardId);
    if (card) renderDetailLabels(card);
    renderDetailLabelSelector();
  }
}

// -------------------------
// Boot
// -------------------------
window.onload = init;
