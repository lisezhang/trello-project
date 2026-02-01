// -------------------------
// Card Detail - Card detail modal and editing
// -------------------------

import { cards, currentCardId, setCurrentCardId, setCards, saveData, getLabelById } from './state.js';
import { escapeHtml, formatDateDisplay } from './helpers.js';
import { renderBoard } from './board.js';
import { renderMapMarkers } from './maps.js';
import { initOrUpdateDetailMiniMap, renderDetailMiniMarkers, openMapsChoiceModal, detailMiniMap } from './mini-maps.js';
import {
  detailSelectedLabels,
  setDetailSelectedLabels,
  renderDetailLabelSelector,
  renderDetailLabels,
  toggleDetailLabelSelection
} from './labels.js';
import { renderDetailLinks, showDetailLinks, openDetailLinkForm } from './links.js';
import { openCoverImageModal } from './images.js';
import { closeAddCardModal } from './card-add.js';
import { closeLabelsManagementModal } from './labels.js';

// -------------------------
// Address Search
// -------------------------
let detailAddressSearchTimeout = null;

export function searchDetailAddress(query) {
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

        // Update and show address value with "Open in Maps" button, hide input
        valueDiv.innerHTML = `
          <div class="address-display-container">
            <span class="address-text">${escapeHtml(card.address)}</span>
            <button type="button" class="address-open-btn" onclick='openMapsChoiceModal(${card.coordinates.lat}, ${card.coordinates.lon}, ${JSON.stringify(card.address)}, event)'>
              <i class="fas fa-external-link-alt"></i> Ouvrir
            </button>
          </div>
        `;
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
// Card Detail Modal
// -------------------------

export function openCardDetailModal(card) {
  // Close any other open modals first
  closeAddCardModal();
  closeLabelsManagementModal();

  setCurrentCardId(card.id);
  setDetailSelectedLabels([...(card.labels || [])]);

  document.getElementById('detailCardTitle').textContent = card.title;

  document.getElementById('detailTitle').textContent = card.title;
  document.getElementById('detailTitleInput').value = card.title;

  document.getElementById('detailDescription').textContent = card.description || '(Vide)';
  document.getElementById('detailDescription').className = card.description ? 'card-detail-value' : 'card-detail-value empty';
  document.getElementById('detailDescriptionInput').value = card.description || '';

  // Start Date display
  const startDateDisplay = formatDateDisplay(card.startDate, card.startTime);
  document.getElementById('detailStartDate').textContent = startDateDisplay || '(Pas de date)';
  document.getElementById('detailStartDate').className = startDateDisplay ? 'card-detail-value' : 'card-detail-value empty';
  document.getElementById('detailStartDateDateInput').value = card.startDate || '';
  document.getElementById('detailStartTimeInput').value = card.startTime || '';
  document.getElementById('detailStartTimeInput').style.display = card.startTime ? 'block' : 'none';
  document.getElementById('detailStartTimeToggle').checked = !!card.startTime;
  document.getElementById('detailStartDateInput').style.display = 'none';

  // End Date display
  const endDateDisplay = formatDateDisplay(card.endDate, card.endTime);
  document.getElementById('detailEndDate').textContent = endDateDisplay || '(Pas de date)';
  document.getElementById('detailEndDate').className = endDateDisplay ? 'card-detail-value' : 'card-detail-value empty';
  document.getElementById('detailEndDateDateInput').value = card.endDate || '';
  document.getElementById('detailEndTimeInput').value = card.endTime || '';
  document.getElementById('detailEndTimeInput').style.display = card.endTime ? 'block' : 'none';
  document.getElementById('detailEndTimeToggle').checked = !!card.endTime;
  document.getElementById('detailEndDateInput').style.display = 'none';

  // Address display with optional "Open in Maps" button
  const detailAddressEl = document.getElementById('detailAddress');
  detailAddressEl.innerHTML = '';

  if (card.address) {
    const hasCoords = card.coordinates && typeof card.coordinates.lat === 'number' && typeof card.coordinates.lon === 'number';

    if (hasCoords) {
      // Create container with address text and open button
      detailAddressEl.innerHTML = `
        <div class="address-display-container">
          <span class="address-text">${escapeHtml(card.address)}</span>
          <button type="button" class="address-open-btn" onclick='openMapsChoiceModal(${card.coordinates.lat}, ${card.coordinates.lon}, ${JSON.stringify(card.address)}, event)'>
            <i class="fas fa-external-link-alt"></i> Ouvrir
          </button>
        </div>
      `;
    } else {
      detailAddressEl.textContent = card.address;
    }
    detailAddressEl.className = 'card-detail-value';
  } else {
    detailAddressEl.textContent = '(Aucune adresse)';
    detailAddressEl.className = 'card-detail-value empty';
  }

  document.getElementById('detailAddressInput').value = card.address || '';
  document.getElementById('detailAddressAutocomplete').style.display = 'none';

  // Cover image
  const coverContainer = document.getElementById('detailCoverImageContainer');
  const coverImg = document.getElementById('detailCoverImage');
  if (card.coverImage) {
    coverContainer.style.display = 'block';
    coverImg.src = card.coverImage;
  } else {
    coverContainer.style.display = 'none';
  }

  // Reset labels input panel
  document.getElementById('detailLabelsInput').style.display = 'none';
  document.getElementById('detailLabels').style.display = 'flex';
  document.getElementById('detailLabelSearch').value = '';

  renderDetailLabels(card);

  // Show checklist section only if card has checklist items
  const checklistSection = document.getElementById('detailChecklistSection');
  if (card.checklist && card.checklist.length > 0) {
    checklistSection.style.display = 'block';
  } else {
    checklistSection.style.display = 'none';
  }

  renderChecklist(card);
  renderDetailLinks(card);
  renderHistory(card);

  const modal = document.getElementById('cardDetailModal');
  modal.classList.add('show');
  // Reset scroll to top on mobile
  modal.scrollTop = 0;

  // Mini-map after modal is visible
  setTimeout(() => initOrUpdateDetailMiniMap(card), 300);
}

export function closeCardDetailModal() {
  document.getElementById('cardDetailModal').classList.remove('show');
  document.getElementById('cardOptionsMenu').classList.remove('show');
  document.getElementById('detailAddMenu').classList.remove('show');
  setCurrentCardId(null);
}

// -------------------------
// Options Menu
// -------------------------

export function toggleCardOptionsMenu() {
  const menu = document.getElementById('cardOptionsMenu');
  menu.classList.toggle('show');
}

export function closeCardOptionsMenu() {
  document.getElementById('cardOptionsMenu').classList.remove('show');
}

export function toggleNavbarOptionsMenu() {
  const menu = document.getElementById('navbarOptionsMenu');
  menu.classList.toggle('show');
}

export function closeNavbarOptionsMenu() {
  document.getElementById('navbarOptionsMenu').classList.remove('show');
}

// -------------------------
// Detail Add Menu
// -------------------------

export function toggleDetailAddMenu() {
  const menu = document.getElementById('detailAddMenu');
  menu.classList.toggle('show');
}

export function closeDetailAddMenu() {
  document.getElementById('detailAddMenu').classList.remove('show');
}

export function showDetailChecklist() {
  const section = document.getElementById('detailChecklistSection');
  section.style.display = 'block';
  closeDetailAddMenu();
}

// -------------------------
// Edit Card Fields
// -------------------------

export function editCardField(field) {
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

  // Date fields: show date-time edit row
  if (field === 'startDate' || field === 'endDate') {
    valueDiv.style.display = 'none';
    inputElement.style.display = 'flex';
    return;
  }

  valueDiv.style.display = 'none';
  inputElement.style.display = 'block';
  inputElement.focus();
}

export function saveCardField(event, field) {
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
  } else if (field === 'startDate') {
    card.startDate = document.getElementById('detailStartDateDateInput').value || null;
    card.startTime = document.getElementById('detailStartTimeToggle').checked
      ? document.getElementById('detailStartTimeInput').value || null
      : null;
    const display = formatDateDisplay(card.startDate, card.startTime);
    valueDiv.textContent = display || '(Pas de date)';
    valueDiv.className = display ? 'card-detail-value' : 'card-detail-value empty';
    inputElement.style.display = 'none';
    valueDiv.style.display = 'flex';
  } else if (field === 'endDate') {
    card.endDate = document.getElementById('detailEndDateDateInput').value || null;
    card.endTime = document.getElementById('detailEndTimeToggle').checked
      ? document.getElementById('detailEndTimeInput').value || null
      : null;
    const display = formatDateDisplay(card.endDate, card.endTime);
    valueDiv.textContent = display || '(Pas de date)';
    valueDiv.className = display ? 'card-detail-value' : 'card-detail-value empty';
    inputElement.style.display = 'none';
    valueDiv.style.display = 'flex';
  } else if (field === 'address') {
    card.address = inputElement.value.trim();

    if (window.detailAddressCoordinates) {
      card.coordinates = window.detailAddressCoordinates;
      window.detailAddressCoordinates = null;
    }

    // Update address display with optional "Open in Maps" button
    valueDiv.innerHTML = '';
    if (card.address) {
      const hasCoords = card.coordinates && typeof card.coordinates.lat === 'number' && typeof card.coordinates.lon === 'number';

      if (hasCoords) {
        valueDiv.innerHTML = `
          <div class="address-display-container">
            <span class="address-text">${escapeHtml(card.address)}</span>
            <button type="button" class="address-open-btn" onclick='openMapsChoiceModal(${card.coordinates.lat}, ${card.coordinates.lon}, ${JSON.stringify(card.address)}, event)'>
              <i class="fas fa-external-link-alt"></i> Ouvrir
            </button>
          </div>
        `;
      } else {
        valueDiv.textContent = card.address;
      }
      valueDiv.className = 'card-detail-value';
    } else {
      valueDiv.textContent = '(Aucune adresse)';
      valueDiv.className = 'card-detail-value empty';
    }

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

// -------------------------
// Delete Card
// -------------------------

export function deleteCard() {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) return;

  const newCards = cards.filter(c => c.id !== currentCardId);
  setCards(newCards);

  saveData();
  renderBoard();

  // If deleting last marker, keep map as is
  renderMapMarkers({ fit: true, reason: 'deleteCard' });

  closeCardDetailModal();
}

// -------------------------
// Checklist
// -------------------------

export function renderChecklist(card) {
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

export function addChecklistItem() {
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

// -------------------------
// History
// -------------------------

export function renderHistory(card) {
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
