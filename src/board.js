// -------------------------
// Board - Kanban board rendering and drag & drop
// -------------------------

import { lists, cards, saveData, getLabelById, setCurrentListId, setCurrentCardId } from './state.js';
import { escapeHtml, formatDateRangeDisplay, formatDateDisplay } from './helpers.js';
import { getFilteredCards } from './labels.js';
import { renderMapMarkers } from './maps.js';
import { openAddListModal, openDeleteListModal, enableEditListTitle } from './lists.js';
import { openCardDetailModal } from './card-detail.js';
import { openAddCardModal } from './card-add.js';

// -------------------------
// Board State
// -------------------------
let sortableInstances = [];

// -------------------------
// Board Rendering
// -------------------------

export function renderBoard() {
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

  // Also update calendar if it's the active view
  const calendarSection = document.getElementById('calendarSection');
  if (calendarSection && calendarSection.classList.contains('active') && window.renderCalendar) {
    window.renderCalendar();
  }
}

export function createListElement(list) {
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

  // Apply filter to cards in this list
  const listCards = cards.filter(c => c.listId === list.id);
  const filteredListCards = getFilteredCards(listCards);
  filteredListCards.forEach(card => {
    cardsContainer.appendChild(createCardElement(card));
  });

  const addCardButton = document.createElement('button');
  addCardButton.className = 'btn btn-secondary';
  addCardButton.style.width = '100%';
  addCardButton.innerHTML = '<i class="fas fa-plus"></i> Ajouter une carte';
  addCardButton.onclick = () => {
    setCurrentListId(list.id);
    setCurrentCardId(null);
    openAddCardModal();
  };

  listContainer.appendChild(listHeader);
  listContainer.appendChild(cardsContainer);
  listContainer.appendChild(addCardButton);

  return listContainer;
}

export function createCardElement(card) {
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

  // Display date range (support both old dueDate and new startDate/endDate)
  const dateDisplay = formatDateRangeDisplay(card.startDate, card.startTime, card.endDate, card.endTime)
    || (card.dueDate ? formatDateDisplay(card.dueDate, null) : null);
  if (dateDisplay) {
    const dateItem = document.createElement('div');
    dateItem.className = 'card-info-item';
    dateItem.innerHTML = `<i class="fas fa-calendar"></i> ${dateDisplay}`;
    infoDiv.appendChild(dateItem);
  }

  cardDiv.appendChild(title);
  cardDiv.appendChild(labelsDiv);
  cardDiv.appendChild(infoDiv);

  cardDiv.onclick = () => openCardDetailModal(card);

  return cardDiv;
}

// -------------------------
// Drag & Drop (SortableJS)
// -------------------------

export function initSortable() {
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

        // Update cards array in place
        cards.length = 0;
        cards.push(...otherCards, ...listCards);

        saveData();
        // Don't re-render board to avoid destroying drag state
        renderMapMarkers({ fit: false, reason: 'drag' });
      }
    });
    sortableInstances.push(sortable);
  });
}

// -------------------------
// Board Initialization
// -------------------------

export function initBoard() {
  renderBoard();
}
