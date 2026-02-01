// -------------------------
// Card Add - Add card modal and logic
// -------------------------

import { cards, currentListId, saveData } from './state.js';
import { escapeHtml } from './helpers.js';
import { renderBoard } from './board.js';
import { renderMapMarkers } from './maps.js';
import { showAddCardMiniMap } from './mini-maps.js';
import {
  selectedLabels,
  resetSelectedLabels,
  renderAddCardLabelSelector,
  toggleLabelSelection
} from './labels.js';
import {
  addCardLinks,
  resetAddCardLinks,
  renderAddCardLinks,
  showAddCardLinks,
  openAddCardLinkForm
} from './links.js';
import {
  addCardCoverImage,
  resetAddCardCoverImage,
  isImageUploading,
  openCoverImageModal
} from './images.js';
import { closeCardDetailModal } from './card-detail.js';
import { closeLabelsManagementModal } from './labels.js';

// -------------------------
// Add Card State
// -------------------------
export let addCardChecklist = [];

export function resetAddCardChecklist() {
  addCardChecklist = [];
}

// -------------------------
// Address Search
// -------------------------
let addressSearchTimeout = null;

export function searchAddress(query) {
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
        showAddCardMiniMap(parseFloat(r.lat), parseFloat(r.lon), r.display_name);
      };
      ac.appendChild(item);
    });

    ac.style.display = 'block';
  } catch (e) {
    console.error(e);
  }
}

// -------------------------
// Add Card Modal
// -------------------------

export function openAddCardModal() {
  // Close any other open modals first
  closeCardDetailModal();
  closeLabelsManagementModal();

  resetSelectedLabels();
  resetAddCardChecklist();
  resetAddCardLinks();
  resetAddCardCoverImage();

  document.getElementById('cardModalTitle').textContent = 'Ajouter une carte';
  document.getElementById('cardTitleInput').value = '';
  document.getElementById('cardDescriptionInput').value = '';
  document.getElementById('cardAddressInput').value = '';
  // Reset start date/time fields
  document.getElementById('cardStartDateInput').value = '';
  document.getElementById('cardStartTimeInput').value = '';
  document.getElementById('cardStartTimeInput').style.display = 'none';
  document.getElementById('cardStartTimeToggle').checked = false;
  // Reset end date/time fields
  document.getElementById('cardEndDateInput').value = '';
  document.getElementById('cardEndTimeInput').value = '';
  document.getElementById('cardEndTimeInput').style.display = 'none';
  document.getElementById('cardEndTimeToggle').checked = false;
  document.getElementById('addCardLabelSearch').value = '';
  document.getElementById('addressAutocomplete').style.display = 'none';
  document.getElementById('addCardMiniMapContainer').style.display = 'none';
  document.getElementById('addCardChecklistContainer').innerHTML = '';
  document.getElementById('addCardChecklistSection').style.display = 'none';
  document.getElementById('addCardLinksContainer').innerHTML = '';
  document.getElementById('addCardLinksSection').style.display = 'none';
  document.getElementById('addCardCoverImageContainer').style.display = 'none';
  window.currentAddressCoordinates = null;

  const modal = document.getElementById('addCardModal');
  modal.classList.add('show');
  // Reset scroll to top on mobile
  modal.scrollTop = 0;

  // Small delay before focus to ensure modal is rendered
  setTimeout(() => {
    document.getElementById('cardTitleInput').focus();
  }, 100);

  // Initialize label selector
  renderAddCardLabelSelector();
}

export function closeAddCardModal() {
  document.getElementById('addCardModal').classList.remove('show');
  document.getElementById('addressAutocomplete').style.display = 'none';
  document.getElementById('addCardMiniMapContainer').style.display = 'none';
  document.getElementById('addCardCoverImageContainer').style.display = 'none';
  document.getElementById('addCardAddMenu').classList.remove('show');
  resetAddCardChecklist();
  resetAddCardLinks();
  resetAddCardCoverImage();
}

// -------------------------
// Add Card Checklist
// -------------------------

export function showAddCardChecklist() {
  const section = document.getElementById('addCardChecklistSection');
  section.style.display = 'block';
  closeAddCardAddMenu();
}

export function addCardChecklistItem() {
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

// -------------------------
// Add Card Menu
// -------------------------

export function toggleAddCardAddMenu() {
  const menu = document.getElementById('addCardAddMenu');
  menu.classList.toggle('show');
}

export function closeAddCardAddMenu() {
  document.getElementById('addCardAddMenu').classList.remove('show');
}

// -------------------------
// Save New Card
// -------------------------

export function saveNewCard() {
  // Prevent saving while image is still uploading
  if (isImageUploading) {
    alert('Veuillez attendre la fin du chargement de l\'image.');
    return;
  }

  const title = document.getElementById('cardTitleInput').value.trim();
  if (!title) return alert('Veuillez entrer un titre');

  // Get start date/time
  const startDate = document.getElementById('cardStartDateInput').value;
  const startTime = document.getElementById('cardStartTimeToggle').checked
    ? document.getElementById('cardStartTimeInput').value
    : null;
  // Get end date/time
  const endDate = document.getElementById('cardEndDateInput').value;
  const endTime = document.getElementById('cardEndTimeToggle').checked
    ? document.getElementById('cardEndTimeInput').value
    : null;

  const newCard = {
    id: Math.max(...cards.map(c => c.id), 0) + 1,
    listId: currentListId,
    title,
    description: document.getElementById('cardDescriptionInput').value,
    labels: [...selectedLabels],
    address: document.getElementById('cardAddressInput').value.trim(),
    coordinates: window.currentAddressCoordinates || null,
    startDate: startDate || null,
    startTime: startTime,
    endDate: endDate || null,
    endTime: endTime,
    coverImage: addCardCoverImage ? addCardCoverImage.url : null,
    coverImageCredit: addCardCoverImage ? addCardCoverImage.credit : null,
    checklist: [...addCardChecklist],
    links: [...addCardLinks],
    history: [{ action: 'Carte créée', timestamp: new Date().toLocaleString('fr-FR') }],
    createdAt: new Date().toLocaleString('fr-FR')
  };

  cards.push(newCard);
  window.currentAddressCoordinates = null;
  resetAddCardChecklist();
  resetAddCardLinks();
  resetAddCardCoverImage();

  saveData();
  renderBoard();

  // New point => auto fitBounds (especially if 0 markers before)
  renderMapMarkers({ fit: true, reason: 'createCard' });

  closeAddCardModal();
}
