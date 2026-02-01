// -------------------------
// Labels - Custom labels management and filtering
// -------------------------

import {
  cards,
  customLabels,
  activeFilters,
  currentCardId,
  setCustomLabels,
  setActiveFilters,
  saveData,
  saveCustomLabels,
  getLabelById
} from './state.js';
import { escapeHtml } from './helpers.js';
import { PALETTE_COLORS } from './constants.js';
import { renderBoard } from './board.js';
import { renderMapMarkers } from './maps.js';

// -------------------------
// Labels State
// -------------------------
export let selectedLabels = [];
export let detailSelectedLabels = [];
let editingLabelId = null;

export function resetSelectedLabels() {
  selectedLabels = [];
}

export function setSelectedLabels(labels) {
  selectedLabels = labels;
}

export function setDetailSelectedLabels(labels) {
  detailSelectedLabels = labels;
}

// -------------------------
// Filtering
// -------------------------

/**
 * Get cards filtered by active label filters (AND logic)
 * @param {Array} cardsList - Array of cards to filter
 * @returns {Array} Filtered cards
 */
export function getFilteredCards(cardsList) {
  if (activeFilters.length === 0) {
    return cardsList;
  }
  return cardsList.filter(card => {
    // Card must have all selected filter labels (AND logic)
    // Cards without labels are hidden when filters are active
    if (!card.labels || card.labels.length === 0) {
      return false;
    }
    return activeFilters.every(filterId => card.labels.includes(filterId));
  });
}

// -------------------------
// Label Selection - Add Card Modal
// -------------------------

export function toggleLabelSelection(labelId) {
  const idx = selectedLabels.indexOf(labelId);
  if (idx > -1) {
    selectedLabels.splice(idx, 1);
  } else {
    selectedLabels.push(labelId);
  }
  renderAddCardLabelSelector();
}

export function renderAddCardLabelSelector() {
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

// -------------------------
// Label Selection - Detail Modal
// -------------------------

export function toggleDetailLabelSelection(labelId) {
  const idx = detailSelectedLabels.indexOf(labelId);
  if (idx > -1) {
    detailSelectedLabels.splice(idx, 1);
  } else {
    detailSelectedLabels.push(labelId);
  }
  renderDetailLabelSelector();
}

export function renderDetailLabelSelector() {
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

// -------------------------
// Search Handlers
// -------------------------

export function handleAddCardLabelSearch() {
  renderAddCardLabelSelector();
}

export function handleDetailLabelSearch() {
  renderDetailLabelSelector();
}

// -------------------------
// Quick Create Label
// -------------------------

export function quickCreateLabel(name, mode) {
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

export function openLabelsManagementModal() {
  document.getElementById('labelsManagementModal').classList.add('show');
  editingLabelId = null;
  renderLabelsManagementList();
  resetLabelForm();
  closeCardOptionsMenu();
}

export function closeLabelsManagementModal() {
  document.getElementById('labelsManagementModal').classList.remove('show');
  editingLabelId = null;
}

function closeCardOptionsMenu() {
  document.getElementById('cardOptionsMenu').classList.remove('show');
}

export function renderLabelsManagementList() {
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

export function renderPaletteColors() {
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

export function selectPaletteColor(color) {
  document.getElementById('labelColorInput').value = color;
  renderPaletteColors();
}

export function updatePaletteFromInput() {
  renderPaletteColors();
}

export function saveLabel() {
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

export function editLabel(labelId) {
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

export function cancelEditLabel() {
  resetLabelForm();
}

export function deleteLabel(labelId) {
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
  const newLabels = customLabels.filter(l => l.id !== labelId);
  setCustomLabels(newLabels);

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
// Render Detail Labels (display in card detail)
// -------------------------

export function renderDetailLabels(card) {
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

// -------------------------
// Label Filter Modal
// -------------------------

export function openLabelFilterModal() {
  document.getElementById('labelFilterModal').classList.add('show');
  renderLabelFilterModal();
}

export function closeLabelFilterModal() {
  document.getElementById('labelFilterModal').classList.remove('show');
}

export function renderLabelFilterModal() {
  const activeSection = document.getElementById('activeFiltersSection');
  const activeList = document.getElementById('activeFiltersList');
  const filterList = document.getElementById('filterLabelsList');

  // Render active filters
  if (activeFilters.length > 0) {
    activeSection.style.display = 'block';
    activeList.innerHTML = '';
    activeFilters.forEach(labelId => {
      const label = getLabelById(labelId);
      if (label) {
        const badge = document.createElement('span');
        badge.className = 'filter-label-badge';
        badge.style.backgroundColor = label.color;
        badge.innerHTML = `${escapeHtml(label.name)} <button type="button" onclick="toggleFilterLabel(${label.id})">&times;</button>`;
        activeList.appendChild(badge);
      }
    });
  } else {
    activeSection.style.display = 'none';
  }

  // Render available labels
  filterList.innerHTML = '';
  if (customLabels.length === 0) {
    filterList.innerHTML = '<div class="filter-labels-empty">Aucune étiquette disponible. Créez des étiquettes via le menu "Gérer les étiquettes".</div>';
    return;
  }

  customLabels.forEach(label => {
    const isActive = activeFilters.includes(label.id);
    const item = document.createElement('div');
    item.className = 'filter-label-item' + (isActive ? ' active' : '');
    item.innerHTML = `
      <span class="filter-label-color" style="background-color: ${label.color}"></span>
      <span class="filter-label-name">${escapeHtml(label.name)}</span>
      ${isActive ? '<i class="fas fa-check"></i>' : ''}
    `;
    item.onclick = () => toggleFilterLabel(label.id);
    filterList.appendChild(item);
  });
}

export function toggleFilterLabel(labelId) {
  const idx = activeFilters.indexOf(labelId);
  if (idx > -1) {
    activeFilters.splice(idx, 1);
  } else {
    activeFilters.push(labelId);
  }

  // Re-render modal
  renderLabelFilterModal();

  // Update board and map
  renderBoard();
  renderMapMarkers({ fit: false, reason: 'filter' });

  // Update filter indicator
  updateFilterIndicator();
}

export function clearAllFilters() {
  setActiveFilters([]);

  // Re-render modal if open
  if (document.getElementById('labelFilterModal').classList.contains('show')) {
    renderLabelFilterModal();
  }

  // Update board and map
  renderBoard();
  renderMapMarkers({ fit: true, reason: 'clearFilters' });

  // Update filter indicator
  updateFilterIndicator();
}

export function updateFilterIndicator() {
  const indicator = document.getElementById('filterIndicator');
  const countSpan = document.getElementById('filterCount');

  if (activeFilters.length > 0) {
    indicator.style.display = 'flex';
    indicator.setAttribute('data-count', activeFilters.length);
    countSpan.textContent = activeFilters.length;
  } else {
    indicator.style.display = 'none';
  }
}
