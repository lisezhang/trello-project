// -------------------------
// State & Constants
// -------------------------
let currentListId = null;
let currentCardId = null;

let selectedLabels = [];
let detailSelectedLabels = [];

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

const labelColors = {
  '#FF6B6B': 'Rouge',
  '#FFA500': 'Orange',
  '#FFD93D': 'Jaune',
  '#6BCB77': 'Vert',
  '#4D96FF': 'Bleu',
  '#9D4EDD': 'Violet',
  '#FF006E': 'Rose',
  '#00F5FF': 'Cyan'
};

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
  if (savedLists) lists = JSON.parse(savedLists);
  if (savedCards) cards = JSON.parse(savedCards);
}

function saveData() {
  localStorage.setItem('trelloLists', JSON.stringify(lists));
  localStorage.setItem('trelloCards', JSON.stringify(cards));
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
  cardsContainer.ondragover = (e) => handleDragOver(e, list.id);
  cardsContainer.ondrop = (e) => handleDrop(e, list.id);
  cardsContainer.ondragleave = handleDragLeave;

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
  cardDiv.draggable = true;
  cardDiv.id = `card-${card.id}`;
  cardDiv.ondragstart = handleDragStart;
  cardDiv.ondragend = handleDragEnd;

  const title = document.createElement('div');
  title.className = 'card-title';
  title.textContent = card.title;

  const labelsDiv = document.createElement('div');
  labelsDiv.className = 'card-labels';
  (card.labels || []).forEach(labelColor => {
    const label = document.createElement('div');
    label.className = 'label';
    label.style.backgroundColor = labelColor;
    label.textContent = labelColors[labelColor] || 'Label';
    labelsDiv.appendChild(label);
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
// Drag & drop
// -------------------------
let draggedCard = null;

function handleDragStart(e) {
  draggedCard = e.target.closest('.card');
  draggedCard.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd() {
  if (draggedCard) draggedCard.classList.remove('dragging');
  draggedCard = null;
  document.querySelectorAll('.cards-container').forEach(c => c.classList.remove('drag-over'));
}

function handleDragOver(e, listId) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.getElementById(`cards-${listId}`).classList.add('drag-over');
}

function handleDragLeave(e) {
  if (e.target.classList.contains('cards-container')) {
    e.target.classList.remove('drag-over');
  }
}

function handleDrop(e, listId) {
  e.preventDefault();
  e.target.closest('.cards-container').classList.remove('drag-over');
  if (!draggedCard) return;

  const cardId = parseInt(draggedCard.id.replace('card-', ''), 10);
  const card = cards.find(c => c.id === cardId);
  if (!card) return;

  card.listId = listId;
  saveData();
  renderBoard();
  // Markers don't depend on listId, no fit needed
  renderMapMarkers({ fit: false, reason: 'drag' });
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
  document.getElementById('cardModalTitle').textContent = 'Ajouter une carte';
  document.getElementById('cardTitleInput').value = '';
  document.getElementById('cardDescriptionInput').value = '';
  document.getElementById('cardAddressInput').value = '';
  document.getElementById('cardDueDateInput').value = '';
  document.querySelectorAll('#labelPicker .color-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('addressAutocomplete').style.display = 'none';
  document.getElementById('addCardMiniMapContainer').style.display = 'none';
  document.getElementById('addCardChecklistContainer').innerHTML = '';
  window.currentAddressCoordinates = null;

  document.getElementById('addCardModal').classList.add('show');
  document.getElementById('cardTitleInput').focus();
}

function closeAddCardModal() {
  document.getElementById('addCardModal').classList.remove('show');
  document.getElementById('addressAutocomplete').style.display = 'none';
  document.getElementById('addCardMiniMapContainer').style.display = 'none';
  addCardChecklist = [];
}

function toggleColor(element, color) {
  element.classList.toggle('selected');
  const idx = selectedLabels.indexOf(color);
  if (idx > -1) selectedLabels.splice(idx, 1);
  else selectedLabels.push(color);
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
    checklist: [...addCardChecklist],
    history: [{ action: 'Carte créée', timestamp: new Date().toLocaleString('fr-FR') }],
    createdAt: new Date().toLocaleString('fr-FR')
  };

  cards.push(newCard);
  window.currentAddressCoordinates = null;
  addCardChecklist = [];

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
    card.labels.forEach(labelColor => {
      const label = document.createElement('div');
      label.className = 'label';
      label.style.backgroundColor = labelColor;
      label.textContent = labelColors[labelColor] || 'Label';
      labelsContainer.appendChild(label);
    });
    labelsContainer.className = 'card-detail-value';
  } else {
    labelsContainer.textContent = '(Aucune étiquette)';
    labelsContainer.className = 'card-detail-value empty';
  }

  document.querySelectorAll('#detailLabelsInput .color-option').forEach(el => el.classList.remove('selected'));
  (card.labels || []).forEach(color => {
    document.querySelectorAll('#detailLabelsInput .color-option').forEach(el => {
      if (rgbToHex(el.style.backgroundColor) === color.toLowerCase()) el.classList.add('selected');
    });
  });
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

function toggleDetailColor(element, color) {
  element.classList.toggle('selected');
  const idx = detailSelectedLabels.indexOf(color);
  if (idx > -1) detailSelectedLabels.splice(idx, 1);
  else detailSelectedLabels.push(color);
}

function editCardField(field) {
  const valueDiv = document.getElementById(`detail${field.charAt(0).toUpperCase() + field.slice(1)}`);
  const inputElement = document.getElementById(`detail${field.charAt(0).toUpperCase() + field.slice(1)}Input`);

  if (!inputElement) return;

  // Labels: show panel instead of input
  if (field === 'labels') {
    const panel = document.getElementById('detailLabelsInput');
    valueDiv.style.display = 'none';
    panel.style.display = 'block';
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

  const addressAutocomplete = document.getElementById('addressAutocomplete');

  if (event.target === addListModal) closeAddListModal();
  if (event.target === addCardModal) closeAddCardModal();
  if (event.target === cardDetailModal) closeCardDetailModal();
  if (event.target === deleteListModal) closeDeleteListModal();

  if (!event.target.closest('.form-group-relative') && addressAutocomplete) {
    addressAutocomplete.style.display = 'none';
  }

  mouseDownTarget = null;
};

// -------------------------
// Boot
// -------------------------
window.onload = init;
