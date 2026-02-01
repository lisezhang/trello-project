// -------------------------
// Lists - List modals and management
// -------------------------

import { lists, cards, setLists, setCards, saveData } from './state.js';
import { renderBoard } from './board.js';
import { renderMapMarkers } from './maps.js';

// -------------------------
// List State
// -------------------------
let listToDelete = null;

// -------------------------
// Add List Modal
// -------------------------

export function openAddListModal() {
  document.getElementById('addListModal').classList.add('show');
  document.getElementById('listNameInput').focus();
}

export function closeAddListModal() {
  document.getElementById('addListModal').classList.remove('show');
  document.getElementById('listNameInput').value = '';
}

export function saveNewList() {
  const listName = document.getElementById('listNameInput').value.trim();
  if (!listName) return alert('Veuillez entrer un nom de liste');

  const newList = { id: Math.max(...lists.map(l => l.id), 0) + 1, title: listName };
  lists.push(newList);
  saveData();
  renderBoard();
  closeAddListModal();
}

// -------------------------
// Delete List Modal
// -------------------------

export function openDeleteListModal(list) {
  listToDelete = list;
  const listCards = cards.filter(card => card.listId === list.id);
  document.getElementById('deleteListMessage').innerHTML =
    `<strong>${list.title}</strong> contient ${listCards.length} carte(s). Que souhaitez-vous faire ?`;
  document.getElementById('deleteListModal').setAttribute('data-list-id', list.id);
  document.getElementById('deleteListModal').classList.add('show');
}

export function closeDeleteListModal() {
  document.getElementById('deleteListModal').classList.remove('show');
  listToDelete = null;
}

export function moveCardsToArchives() {
  const listId = parseInt(document.getElementById('deleteListModal').getAttribute('data-list-id'), 10);
  let archivesList = lists.find(l => l.title === 'Archives');

  if (!archivesList) {
    archivesList = { id: Math.max(...lists.map(l => l.id), 0) + 1, title: 'Archives' };
    lists.push(archivesList);
  }

  cards.filter(c => c.listId === listId).forEach(card => { card.listId = archivesList.id; });
  const newLists = lists.filter(l => l.id !== listId);
  setLists(newLists);

  saveData();
  renderBoard();
  renderMapMarkers({ fit: true, reason: 'archive' });
  closeDeleteListModal();
}

export function deleteCardsAndList() {
  const listId = parseInt(document.getElementById('deleteListModal').getAttribute('data-list-id'), 10);
  const newCards = cards.filter(c => c.listId !== listId);
  const newLists = lists.filter(l => l.id !== listId);

  setCards(newCards);
  setLists(newLists);

  saveData();
  renderBoard();
  renderMapMarkers({ fit: true, reason: 'deleteList' });
  closeDeleteListModal();
}

// -------------------------
// Inline Title Editing
// -------------------------

export function enableEditListTitle(titleElement, list) {
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
