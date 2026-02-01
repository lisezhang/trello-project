// -------------------------
// Links - Internet links management
// -------------------------

import { cards, currentCardId, saveData } from './state.js';
import { escapeHtml, isValidUrl } from './helpers.js';

// -------------------------
// Links State
// -------------------------
export let addCardLinks = [];
export let linkModalMode = null;
export let editingLinkIndex = null;

export function resetAddCardLinks() {
  addCardLinks = [];
}

// -------------------------
// Show Links Section
// -------------------------

export function showAddCardLinks() {
  const section = document.getElementById('addCardLinksSection');
  section.style.display = 'block';
  closeAddCardAddMenu();
}

export function showDetailLinks() {
  const section = document.getElementById('detailLinksSection');
  section.style.display = 'block';
  closeDetailAddMenu();
}

function closeAddCardAddMenu() {
  document.getElementById('addCardAddMenu').classList.remove('show');
}

function closeDetailAddMenu() {
  document.getElementById('detailAddMenu').classList.remove('show');
}

// -------------------------
// Link Form Openers
// -------------------------

export function openAddCardLinkForm() {
  linkModalMode = 'addCard';
  editingLinkIndex = null;
  openLinkModal();
}

export function openDetailLinkForm() {
  linkModalMode = 'detail';
  editingLinkIndex = null;
  openLinkModal();
}

// -------------------------
// Link Modal
// -------------------------

export function openLinkModal() {
  const modal = document.getElementById('linkModal');
  const titleInput = document.getElementById('linkTitleInput');
  const urlInput = document.getElementById('linkUrlInput');
  const errorDiv = document.getElementById('linkUrlError');
  const modalTitle = document.getElementById('linkModalTitle');
  const saveBtn = document.getElementById('saveLinkBtn');

  // Reset form
  titleInput.value = '';
  urlInput.value = '';
  errorDiv.style.display = 'none';

  if (editingLinkIndex !== null) {
    // Editing existing link
    modalTitle.innerHTML = '<i class="fas fa-link"></i> Modifier le lien';
    saveBtn.textContent = 'Modifier';

    let link = null;
    if (linkModalMode === 'addCard') {
      link = addCardLinks[editingLinkIndex];
    } else if (linkModalMode === 'detail') {
      const card = cards.find(c => c.id === currentCardId);
      if (card && card.links) {
        link = card.links[editingLinkIndex];
      }
    }

    if (link) {
      titleInput.value = link.title || '';
      urlInput.value = link.url || '';
    }
  } else {
    // Adding new link
    modalTitle.innerHTML = '<i class="fas fa-link"></i> Ajouter un lien';
    saveBtn.textContent = 'Ajouter';
  }

  modal.classList.add('show');
  titleInput.focus();
}

export function closeLinkModal() {
  document.getElementById('linkModal').classList.remove('show');
  linkModalMode = null;
  editingLinkIndex = null;
}

// -------------------------
// Save Link
// -------------------------

export function saveLink() {
  const titleInput = document.getElementById('linkTitleInput');
  const urlInput = document.getElementById('linkUrlInput');
  const errorDiv = document.getElementById('linkUrlError');

  const title = titleInput.value.trim();
  let url = urlInput.value.trim();

  // Validate URL
  if (!url) {
    errorDiv.style.display = 'flex';
    urlInput.focus();
    return;
  }

  // Auto-add https:// if no protocol specified
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  if (!isValidUrl(url)) {
    errorDiv.style.display = 'flex';
    urlInput.focus();
    return;
  }

  errorDiv.style.display = 'none';

  // Use URL as title if no title provided
  const finalTitle = title || url;

  const linkData = {
    title: finalTitle,
    url: url
  };

  if (linkModalMode === 'addCard') {
    if (editingLinkIndex !== null) {
      // Update existing link
      addCardLinks[editingLinkIndex] = linkData;
    } else {
      // Add new link
      addCardLinks.push(linkData);
    }
    renderAddCardLinks();
  } else if (linkModalMode === 'detail') {
    const card = cards.find(c => c.id === currentCardId);
    if (!card) return;

    card.links = card.links || [];

    if (editingLinkIndex !== null) {
      // Update existing link
      card.links[editingLinkIndex] = linkData;
      card.history.push({
        action: `Lien modifié: "${finalTitle}"`,
        timestamp: new Date().toLocaleString('fr-FR')
      });
    } else {
      // Add new link
      card.links.push(linkData);
      card.history.push({
        action: `Lien ajouté: "${finalTitle}"`,
        timestamp: new Date().toLocaleString('fr-FR')
      });
    }

    saveData();
    renderDetailLinks(card);

    // Render history if function available
    const historyContainer = document.getElementById('historyContainer');
    if (historyContainer) {
      renderHistory(card);
    }
  }

  closeLinkModal();
}

// -------------------------
// Render Links
// -------------------------

export function renderAddCardLinks() {
  const container = document.getElementById('addCardLinksContainer');
  container.innerHTML = '';

  addCardLinks.forEach((link, index) => {
    const linkItem = createLinkElement(link, index, 'addCard');
    container.appendChild(linkItem);
  });
}

export function renderDetailLinks(card) {
  const container = document.getElementById('detailLinksContainer');
  const section = document.getElementById('detailLinksSection');
  container.innerHTML = '';

  if (!card.links || card.links.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  card.links.forEach((link, index) => {
    const linkItem = createLinkElement(link, index, 'detail');
    container.appendChild(linkItem);
  });
}

function createLinkElement(link, index, mode) {
  const linkItem = document.createElement('div');
  linkItem.className = 'link-item';

  linkItem.innerHTML = `
    <div class="link-item-icon">
      <i class="fas fa-link"></i>
    </div>
    <div class="link-item-content">
      <div class="link-item-title">${escapeHtml(link.title)}</div>
      <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="link-item-url" onclick="event.stopPropagation();">
        ${escapeHtml(link.url)}
      </a>
    </div>
    <div class="link-item-actions">
      <button class="link-item-action-btn edit" onclick="editLink(${index}, '${mode}')" title="Modifier">
        <i class="fas fa-edit"></i>
      </button>
      <button class="link-item-action-btn delete" onclick="deleteLink(${index}, '${mode}')" title="Supprimer">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;

  return linkItem;
}

// -------------------------
// Edit & Delete Links
// -------------------------

export function editLink(index, mode) {
  linkModalMode = mode;
  editingLinkIndex = index;
  openLinkModal();
}

export function deleteLink(index, mode) {
  if (mode === 'addCard') {
    addCardLinks.splice(index, 1);
    renderAddCardLinks();
  } else if (mode === 'detail') {
    const card = cards.find(c => c.id === currentCardId);
    if (!card || !card.links) return;

    const deletedLink = card.links[index];
    card.links.splice(index, 1);
    card.history.push({
      action: `Lien supprimé: "${deletedLink.title}"`,
      timestamp: new Date().toLocaleString('fr-FR')
    });

    saveData();
    renderDetailLinks(card);

    // Render history if function available
    const historyContainer = document.getElementById('historyContainer');
    if (historyContainer) {
      renderHistory(card);
    }
  }
}

// -------------------------
// History Render Helper
// -------------------------

function renderHistory(card) {
  const container = document.getElementById('historyContainer');
  if (!container) return;

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
// Event Listeners Initialization
// -------------------------

export function initLinkEventListeners() {
  const linkTitleInput = document.getElementById('linkTitleInput');
  const linkUrlInput = document.getElementById('linkUrlInput');

  if (linkTitleInput) {
    linkTitleInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        linkUrlInput.focus();
      }
    });
  }

  if (linkUrlInput) {
    linkUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveLink();
      }
    });

    // Hide error on input
    linkUrlInput.addEventListener('input', () => {
      document.getElementById('linkUrlError').style.display = 'none';
    });
  }

  // Handle click outside link modal
  window.addEventListener('mouseup', (event) => {
    const linkModal = document.getElementById('linkModal');
    if (event.target === linkModal) {
      closeLinkModal();
    }
  });
}
