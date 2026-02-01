// -------------------------
// Images - Cover image management
// -------------------------

import { cards, currentCardId, saveData } from './state.js';
import { shuffleArray } from './helpers.js';
import { IMAGE_COLLECTIONS } from './constants.js';
import { renderBoard } from './board.js';

// -------------------------
// Images State
// -------------------------
export let addCardCoverImage = null;
export let isImageUploading = false;
export let coverImageMode = null;

export function resetAddCardCoverImage() {
  addCardCoverImage = null;
}

export function setAddCardCoverImage(imageData) {
  addCardCoverImage = imageData;
}

// -------------------------
// Image Search Functions
// -------------------------

export function searchImages() {
  const query = document.getElementById('imageSearchInput').value.trim();
  if (!query) return;

  const resultsContainer = document.getElementById('imageSearchResults');
  displayImageSearchResults(query, resultsContainer, 'detail');
}

export function searchAddCardImages() {
  const query = document.getElementById('addCardImageSearchInput').value.trim();
  if (!query) return;

  const resultsContainer = document.getElementById('addCardImageSearchResults');
  displayImageSearchResults(query, resultsContainer, 'addCard');
}

export function searchCoverImages() {
  const query = document.getElementById('coverImageSearchInput').value.trim();
  if (!query) return;

  const resultsContainer = document.getElementById('coverImageSearchResults');
  // Use existing displayImageSearchResults with mode based on coverImageMode
  const mode = coverImageMode === 'detail' ? 'cover-detail' : 'cover-addCard';
  displayImageSearchResults(query, resultsContainer, mode);
}

export function displayImageSearchResults(query, container, mode) {
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
      if (mode === 'detail' || mode === 'cover-detail') {
        selectCoverImage(largeUrl, 'Unsplash');
      } else {
        selectAddCardCoverImage(largeUrl, 'Unsplash');
      }
      // Close cover modal if open
      if (mode === 'cover-detail' || mode === 'cover-addCard') {
        closeCoverImageModal();
      }
    };
    container.appendChild(item);
  });
}

// -------------------------
// Select Cover Image
// -------------------------

export function selectCoverImage(imageUrl, photographer) {
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

  renderHistory(card);
}

export function selectAddCardCoverImage(imageUrl, photographer) {
  addCardCoverImage = { url: imageUrl, credit: photographer };

  // Update modal display
  const container = document.getElementById('addCardCoverImageContainer');
  const img = document.getElementById('addCardCoverImage');

  container.style.display = 'block';
  img.src = imageUrl;
}

// -------------------------
// Remove Cover Image
// -------------------------

export function removeCoverImage() {
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

  renderHistory(card);
}

export function removeAddCardCoverImage() {
  addCardCoverImage = null;
  document.getElementById('addCardCoverImageContainer').style.display = 'none';
}

export function removeCoverImageFromModal() {
  if (coverImageMode === 'detail') {
    removeCoverImage();
  } else if (coverImageMode === 'addCard') {
    removeAddCardCoverImage();
  }
  closeCoverImageModal();
}

// -------------------------
// URL Input
// -------------------------

export function toggleUrlInput(mode) {
  let containerId;
  if (mode === 'detail') {
    containerId = 'detailUrlInputContainer';
  } else if (mode === 'addCard') {
    containerId = 'addCardUrlInputContainer';
  } else if (mode === 'cover') {
    containerId = 'coverUrlInputContainer';
  }
  const container = document.getElementById(containerId);
  if (!container) return;

  if (container.style.display === 'none' || container.style.display === '') {
    container.style.display = 'flex';
    container.querySelector('input').focus();
  } else {
    container.style.display = 'none';
  }
}

export function applyImageUrl(mode) {
  let inputId, containerId;
  if (mode === 'detail') {
    inputId = 'detailImageUrlInput';
    containerId = 'detailUrlInputContainer';
  } else if (mode === 'addCard') {
    inputId = 'addCardImageUrlInput';
    containerId = 'addCardUrlInputContainer';
  } else if (mode === 'cover') {
    inputId = 'coverImageUrlInput';
    containerId = 'coverUrlInputContainer';
  }

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
  } else if (mode === 'addCard') {
    selectAddCardCoverImage(url, 'Lien externe');
  } else if (mode === 'cover') {
    // Use coverImageMode to determine which function to call
    if (coverImageMode === 'detail') {
      selectCoverImage(url, 'Lien externe');
    } else {
      selectAddCardCoverImage(url, 'Lien externe');
    }
    closeCoverImageModal();
  }

  document.getElementById(containerId).style.display = 'none';
  document.getElementById(inputId).value = '';
}

// -------------------------
// Image Upload
// -------------------------

export function handleImageUpload(input, mode) {
  const file = input.files[0];
  if (!file) return;

  // Validate file type - improved for mobile/HEIC support
  const validImageTypes = ['image/', 'application/octet-stream'];
  const fileExtension = file.name ? file.name.split('.').pop().toLowerCase() : '';
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic', 'heif', 'tiff', 'tif'];

  const isValidType = !file.type ||
                      validImageTypes.some(type => file.type.startsWith(type)) ||
                      file.type.includes('heic') ||
                      file.type.includes('heif');
  const isValidExtension = validExtensions.includes(fileExtension);

  if (!isValidType && !isValidExtension) {
    alert('Veuillez sélectionner un fichier image valide');
    input.value = '';
    return;
  }

  // Validate file size (max 5MB for localStorage)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    alert('L\'image est trop grande. Taille maximum : 5 Mo');
    input.value = '';
    return;
  }

  // Show loading state
  isImageUploading = true;
  showImageUploadLoading(mode, true);

  const reader = new FileReader();

  // Timeout for stuck reads (common on mobile)
  const readTimeout = setTimeout(() => {
    if (isImageUploading) {
      isImageUploading = false;
      showImageUploadLoading(mode, false);
      alert('Le chargement de l\'image a pris trop de temps. Veuillez réessayer.');
      input.value = '';
    }
  }, 30000);

  reader.onload = function(e) {
    clearTimeout(readTimeout);
    isImageUploading = false;
    showImageUploadLoading(mode, false);

    const base64Data = e.target.result;

    if (mode === 'detail') {
      selectCoverImage(base64Data, 'Image importée');
    } else if (mode === 'addCard') {
      selectAddCardCoverImage(base64Data, 'Image importée');
    } else if (mode === 'cover') {
      if (coverImageMode === 'detail') {
        selectCoverImage(base64Data, 'Image importée');
      } else {
        selectAddCardCoverImage(base64Data, 'Image importée');
      }
      closeCoverImageModal();
    }

    // Reset input AFTER successful read
    input.value = '';
  };

  reader.onerror = function(e) {
    clearTimeout(readTimeout);
    isImageUploading = false;
    showImageUploadLoading(mode, false);
    console.error('FileReader error:', e);
    alert('Erreur lors de la lecture du fichier. Veuillez réessayer.');
    input.value = '';
  };

  reader.onabort = function() {
    clearTimeout(readTimeout);
    isImageUploading = false;
    showImageUploadLoading(mode, false);
    input.value = '';
  };

  reader.readAsDataURL(file);
}

function showImageUploadLoading(mode, show) {
  let container;
  if (mode === 'detail') {
    container = document.querySelector('#cardDetailModal .image-alt-buttons');
  } else if (mode === 'addCard') {
    container = document.querySelector('#addCardModal .image-alt-buttons');
  } else if (mode === 'cover') {
    container = document.querySelector('#coverImageModal .image-alt-buttons');
  }

  if (!container) return;

  // Remove existing loading indicator
  const existingLoading = container.querySelector('.image-upload-loading');
  if (existingLoading) {
    existingLoading.remove();
  }

  if (show) {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'image-upload-loading';
    loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement de l\'image...';
    container.appendChild(loadingDiv);

    container.querySelectorAll('button').forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.5';
    });
  } else {
    container.querySelectorAll('button').forEach(btn => {
      btn.disabled = false;
      btn.style.opacity = '1';
    });
  }
}

// -------------------------
// Cover Image Modal
// -------------------------

export function openCoverImageModal(mode) {
  coverImageMode = mode;

  const modal = document.getElementById('coverImageModal');
  const removeSection = document.getElementById('coverRemoveSection');

  // Reset state
  document.getElementById('coverImageSearchInput').value = '';
  document.getElementById('coverImageSearchResults').style.display = 'none';
  document.getElementById('coverUrlInputContainer').style.display = 'none';
  document.getElementById('coverImageUrlInput').value = '';

  // Show/hide remove button based on whether an image exists
  let hasImage = false;
  if (mode === 'detail') {
    const card = cards.find(c => c.id === currentCardId);
    hasImage = card && card.coverImage;
  } else if (mode === 'addCard') {
    hasImage = addCardCoverImage && addCardCoverImage.url;
  }

  removeSection.style.display = hasImage ? 'block' : 'none';

  modal.classList.add('show');
}

export function closeCoverImageModal() {
  document.getElementById('coverImageModal').classList.remove('show');
  coverImageMode = null;
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

export function initImageEventListeners() {
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

  // Cover modal image search
  const coverImageSearchInput = document.getElementById('coverImageSearchInput');
  if (coverImageSearchInput) {
    coverImageSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchCoverImages();
      }
    });
  }

  // Cover modal URL input
  const coverImageUrlInput = document.getElementById('coverImageUrlInput');
  if (coverImageUrlInput) {
    coverImageUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyImageUrl('cover');
      }
    });
  }

  // Handle click outside cover image modal
  window.addEventListener('mouseup', (event) => {
    const coverImageModal = document.getElementById('coverImageModal');
    if (event.target === coverImageModal) {
      closeCoverImageModal();
    }
  });
}
