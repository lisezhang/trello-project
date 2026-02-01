// -------------------------
// Maps - Main Leaflet map and markers
// -------------------------

import { cards } from './state.js';
import { escapeHtml, formatDateDisplay, formatDateRangeDisplay } from './helpers.js';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  FIT_PADDING,
  FIT_MAX_ZOOM,
  STORAGE_ACTIVE_VIEW,
  STORAGE_MAP_VIEW
} from './constants.js';
import { getFilteredCards } from './labels.js';

// -------------------------
// Map State
// -------------------------
export let map = null;
export let markers = {};
export let markersLayer = null;
export let markersHidden = false;
let lastMarkerCount = 0;

// -------------------------
// Map Initialization
// -------------------------

export function initMap() {
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

// -------------------------
// Map View Persistence
// -------------------------

export function getSavedMapView() {
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

export function saveMapView() {
  if (!map) return;
  const c = map.getCenter();
  const z = map.getZoom();
  localStorage.setItem(STORAGE_MAP_VIEW, JSON.stringify({ lat: c.lat, lng: c.lng, zoom: z }));
}

// -------------------------
// Map Search
// -------------------------

export function searchMapLocation(query) {
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

// -------------------------
// Markers Management
// -------------------------

export function clearMapMarkersOnly() {
  markersHidden = !markersHidden;
  if (markersHidden) {
    markersLayer.clearLayers();
  } else {
    renderMapMarkers({ fit: false, reason: 'unhideMarkers' });
  }
}

export function getCardsWithCoords() {
  return cards.filter(c => c.coordinates && typeof c.coordinates.lat === 'number' && typeof c.coordinates.lon === 'number');
}

export function renderMapMarkers({ fit, reason } = { fit: false, reason: 'unknown' }) {
  if (!map || !markersLayer) return;

  // Clear
  markersLayer.clearLayers();
  markers = {};

  if (markersHidden) {
    // Don't recreate visual markers, keep fitBounds logic inactive
    lastMarkerCount = 0;
    return;
  }

  // Apply filter to cards with coordinates
  const cardsWithCoords = getFilteredCards(getCardsWithCoords());
  const count = cardsWithCoords.length;

  cardsWithCoords.forEach(card => {
    const m = L.marker([card.coordinates.lat, card.coordinates.lon]);

    // Build popup HTML with clickable address link
    let addressHtml = '';
    if (card.address) {
      addressHtml = `
        <span class="popup-address-link" onclick='openMapsChoiceModal(${card.coordinates.lat}, ${card.coordinates.lon}, ${JSON.stringify(card.address)}, event)'>
          📍 ${escapeHtml(card.address)} <i class="fas fa-external-link-alt"></i>
        </span><br>
      `;
    }

    const dateDisplay = formatDateRangeDisplay(card.startDate, card.startTime, card.endDate, card.endTime)
      || (card.dueDate ? formatDateDisplay(card.dueDate, null) : null);
    const popupHtml = `
      <strong>${escapeHtml(card.title)}</strong><br>
      ${card.description ? escapeHtml(card.description) + '<br>' : ''}
      ${addressHtml}
      ${dateDisplay ? '📅 ' + escapeHtml(dateDisplay) : ''}
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

export function fitMapToMarkers(animate) {
  if (!map) return;
  // Apply filter to cards with coordinates
  const cardsWithCoords = getFilteredCards(getCardsWithCoords());
  if (cardsWithCoords.length === 0) return; // keep map as is

  const bounds = L.latLngBounds(cardsWithCoords.map(c => [c.coordinates.lat, c.coordinates.lon]));
  map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, animate: !!animate });
}

// -------------------------
// View Switching
// -------------------------

export function restoreLastView() {
  const saved = localStorage.getItem(STORAGE_ACTIVE_VIEW) || 'board';
  switchView(saved, { fromInit: true });
}

export function switchView(view, opts = { fromInit: false }) {
  const boardSection = document.getElementById('boardSection');
  const mapSection = document.getElementById('mapSection');
  const calendarSection = document.getElementById('calendarSection');

  const btnBoard = document.getElementById('btnViewBoard');
  const btnMap = document.getElementById('btnViewMap');
  const btnCalendar = document.getElementById('btnViewCalendar');

  // Remove active from all buttons
  btnBoard.classList.remove('active');
  btnMap.classList.remove('active');
  btnCalendar.classList.remove('active');

  // Hide all sections
  boardSection.classList.remove('active');
  mapSection.classList.remove('active');
  calendarSection.classList.remove('active');

  if (view === 'map') {
    mapSection.classList.add('active');
    btnMap.classList.add('active');
  } else if (view === 'calendar') {
    calendarSection.classList.add('active');
    btnCalendar.classList.add('active');
  } else {
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
  } else if (view === 'calendar') {
    // Render calendar when switching to it
    setTimeout(() => {
      if (window.renderCalendar) {
        window.renderCalendar();
      }
    }, 100);
  }
}

// -------------------------
// Delete All Cards (test utility)
// -------------------------

export function deleteAllCards() {
  if (!confirm('Supprimer toutes les cartes ?')) return;

  // Note: This modifies the cards array imported from state
  // In practice, this should use setCards from state.js
  cards.length = 0;

  const { saveData } = require('./state.js');
  const { renderBoard } = require('./board.js');

  saveData();
  renderBoard();

  // Map stays displayed, just without markers
  renderMapMarkers({ fit: true, reason: 'deleteAll' });
}
