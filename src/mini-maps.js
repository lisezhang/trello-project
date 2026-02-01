// -------------------------
// Mini-Maps - Modal mini-maps for detail and add card
// -------------------------

import { cards } from './state.js';
import { escapeHtml, formatDateDisplay, formatDateRangeDisplay } from './helpers.js';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, FIT_MAX_ZOOM } from './constants.js';

// -------------------------
// Mini-Map Instances
// -------------------------
export let detailMiniMap = null;
export let detailMiniMarkersLayer = null;
export let detailMiniCurrentMarker = null;

export let addCardMiniMap = null;
export let addCardMiniMarker = null;

// -------------------------
// Maps Choice Modal State
// -------------------------
export let mapsChoiceData = null;

// -------------------------
// Detail Mini-Map
// -------------------------

/**
 * Initialize or update the detail modal mini-map
 * @param {Object} card - Card object with coordinates
 */
export function initOrUpdateDetailMiniMap(card) {
  const container = document.getElementById('detailMiniMapContainer');

  // Check if card has valid coordinates
  if (!card.coordinates || typeof card.coordinates.lat !== 'number' || typeof card.coordinates.lon !== 'number') {
    container.style.display = 'none';
    return;
  }

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

/**
 * Render markers on the detail mini-map
 * @param {number} focusedCardId - ID of the focused card
 */
export function renderDetailMiniMarkers(focusedCardId) {
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

    // Build popup HTML with clickable address link
    let addressHtml = '';
    if (c.address) {
      addressHtml = `
        <span class="popup-address-link" onclick='openMapsChoiceModal(${lat}, ${lon}, ${JSON.stringify(c.address)}, event)'>
          📍 ${escapeHtml(c.address)} <i class="fas fa-external-link-alt"></i>
        </span><br>
      `;
    }

    const miniDateDisplay = formatDateRangeDisplay(c.startDate, c.startTime, c.endDate, c.endTime)
      || (c.dueDate ? formatDateDisplay(c.dueDate, null) : null);
    const popupHtml = `
      <strong>${escapeHtml(c.title)}</strong><br>
      ${c.description ? escapeHtml(c.description) + '<br>' : ''}
      ${addressHtml}
      ${miniDateDisplay ? '📅 ' + escapeHtml(miniDateDisplay) : ''}
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
// Add Card Mini-Map
// -------------------------

/**
 * Show mini-map in add card modal
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} address - Address string
 */
export function showAddCardMiniMap(lat, lon, address) {
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

  // Build popup HTML with clickable address link (same as detail modal)
  const title = document.getElementById('cardTitleInput').value || 'Nouvelle carte';
  let addressHtml = '';
  if (address) {
    addressHtml = `
      <span class="popup-address-link" onclick='openMapsChoiceModal(${lat}, ${lon}, ${JSON.stringify(address)}, event)'>
        📍 ${escapeHtml(address)} <i class="fas fa-external-link-alt"></i>
      </span>
    `;
  }

  const popupHtml = `
    <strong>${escapeHtml(title)}</strong><br>
    ${addressHtml}
  `;

  addCardMiniMarker.bindPopup(popupHtml);

  // Invalidate size after display
  requestAnimationFrame(() => {
    setTimeout(() => {
      addCardMiniMap.invalidateSize();
      addCardMiniMap.setView([lat, lon], 13);
    }, 100);
  });
}

// -------------------------
// Helper Functions
// -------------------------

function getCardsWithCoords() {
  return cards.filter(c => c.coordinates && typeof c.coordinates.lat === 'number' && typeof c.coordinates.lon === 'number');
}

// -------------------------
// Maps Choice Modal (Google Maps / Apple Plans)
// -------------------------

/**
 * Open the maps choice modal
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} address - Address string
 * @param {Event} event - Click event
 */
export function openMapsChoiceModal(lat, lon, address, event) {
  // Prevent event propagation to avoid triggering other click handlers
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  // Store coordinates and address for use when user chooses an app
  mapsChoiceData = { lat, lon, address };

  document.getElementById('mapsChoiceModal').classList.add('show');
}

export function closeMapsChoiceModal() {
  document.getElementById('mapsChoiceModal').classList.remove('show');
  mapsChoiceData = null;
}

export function openInGoogleMaps() {
  if (!mapsChoiceData) return;

  const { lat, lon, address } = mapsChoiceData;
  // Google Maps URL - use address for display, fallback to coordinates
  const query = address ? encodeURIComponent(address) : `${lat},${lon}`;
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;

  window.open(url, '_blank');
  closeMapsChoiceModal();
}

export function openInAppleMaps() {
  if (!mapsChoiceData) return;

  const { lat, lon, address } = mapsChoiceData;
  // Apple Maps URL - use address for display with coordinates for precise location
  const url = address
    ? `https://maps.apple.com/?q=${encodeURIComponent(address)}&ll=${lat},${lon}`
    : `https://maps.apple.com/?q=${lat},${lon}`;

  window.open(url, '_blank');
  closeMapsChoiceModal();
}

// -------------------------
// Event Listeners Initialization
// -------------------------

export function initMiniMapsEventListeners() {
  // Handle click outside maps choice modal
  window.addEventListener('mouseup', (event) => {
    const mapsChoiceModal = document.getElementById('mapsChoiceModal');
    if (event.target === mapsChoiceModal) {
      closeMapsChoiceModal();
    }
  });
}
