// -------------------------
// Main - Application entry point
// -------------------------

import { initState } from './state.js';
import { toggleTimeInput } from './helpers.js';
import { initBoard, renderBoard } from './board.js';
import { initMap, renderMapMarkers, restoreLastView, switchView, searchMapLocation, clearMapMarkersOnly, fitMapToMarkers } from './maps.js';
import { initMobileKeyboardHandler } from './mobile.js';
import { initImageEventListeners, searchImages, searchAddCardImages, searchCoverImages, selectCoverImage, selectAddCardCoverImage, removeCoverImage, removeAddCardCoverImage, removeCoverImageFromModal, toggleUrlInput, applyImageUrl, handleImageUpload, openCoverImageModal, closeCoverImageModal } from './images.js';
import { initLinkEventListeners, showAddCardLinks, showDetailLinks, openAddCardLinkForm, openDetailLinkForm, openLinkModal, closeLinkModal, saveLink, editLink, deleteLink, renderAddCardLinks, renderDetailLinks } from './links.js';
import { initMiniMapsEventListeners, openMapsChoiceModal, closeMapsChoiceModal, openInGoogleMaps, openInAppleMaps, initOrUpdateDetailMiniMap, renderDetailMiniMarkers, showAddCardMiniMap } from './mini-maps.js';
import { openAddListModal, closeAddListModal, saveNewList, openDeleteListModal, closeDeleteListModal, moveCardsToArchives, deleteCardsAndList, enableEditListTitle } from './lists.js';
import { openAddCardModal, closeAddCardModal, saveNewCard, searchAddress, showAddCardChecklist, addCardChecklistItem, toggleAddCardAddMenu, closeAddCardAddMenu } from './card-add.js';
import { openCardDetailModal, closeCardDetailModal, toggleCardOptionsMenu, closeCardOptionsMenu, toggleNavbarOptionsMenu, closeNavbarOptionsMenu, toggleDetailAddMenu, closeDetailAddMenu, showDetailChecklist, editCardField, saveCardField, deleteCard, addChecklistItem, searchDetailAddress, renderChecklist, renderHistory } from './card-detail.js';
import { toggleLabelSelection, toggleDetailLabelSelection, renderAddCardLabelSelector, renderDetailLabelSelector, handleAddCardLabelSearch, handleDetailLabelSearch, quickCreateLabel, openLabelsManagementModal, closeLabelsManagementModal, renderLabelsManagementList, saveLabel, editLabel, cancelEditLabel, deleteLabel, renderPaletteColors, selectPaletteColor, updatePaletteFromInput, openLabelFilterModal, closeLabelFilterModal, renderLabelFilterModal, toggleFilterLabel, clearAllFilters, updateFilterIndicator, renderDetailLabels, getFilteredCards } from './labels.js';
import { initCalendar, renderCalendar, navigateMonth, goToToday } from './calendar.js';

// -------------------------
// Initialize Application
// -------------------------

function init() {
  initState();
  initBoard();
  initMap();
  initCalendar();

  // Preload markers
  renderMapMarkers({ fit: true, reason: 'init' });

  // Restore last view (board/map/calendar)
  restoreLastView();
}

// Boot
window.onload = init;

// Initialize mobile keyboard handler when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initMobileKeyboardHandler();
  initImageEventListeners();
  initLinkEventListeners();
  initMiniMapsEventListeners();
  initGlobalEventListeners();
});

// -------------------------
// Global Event Listeners (click outside modals)
// -------------------------

let mouseDownTarget = null;

function initGlobalEventListeners() {
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

    // Close "+" add menus if clicking outside of them
    const addCardAddDropdown = document.getElementById('addCardAddDropdown');
    if (addCardAddDropdown && !addCardAddDropdown.contains(event.target)) {
      closeAddCardAddMenu();
    }

    const detailAddDropdown = document.getElementById('detailAddDropdown');
    if (detailAddDropdown && !detailAddDropdown.contains(event.target)) {
      closeDetailAddMenu();
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
    const labelsManagementModal = document.getElementById('labelsManagementModal');
    const labelFilterModal = document.getElementById('labelFilterModal');

    const addressAutocomplete = document.getElementById('addressAutocomplete');

    if (event.target === addListModal) closeAddListModal();
    if (event.target === addCardModal) closeAddCardModal();
    if (event.target === cardDetailModal) closeCardDetailModal();
    if (event.target === deleteListModal) closeDeleteListModal();
    if (event.target === labelsManagementModal) closeLabelsManagementModal();
    if (event.target === labelFilterModal) closeLabelFilterModal();

    if (!event.target.closest('.form-group-relative') && addressAutocomplete) {
      addressAutocomplete.style.display = 'none';
    }

    mouseDownTarget = null;
  };
}

// -------------------------
// Expose functions to window for onclick inline handlers
// -------------------------

// Lists
window.openAddListModal = openAddListModal;
window.closeAddListModal = closeAddListModal;
window.saveNewList = saveNewList;
window.openDeleteListModal = openDeleteListModal;
window.closeDeleteListModal = closeDeleteListModal;
window.moveCardsToArchives = moveCardsToArchives;
window.deleteCardsAndList = deleteCardsAndList;
window.enableEditListTitle = enableEditListTitle;

// Card Add
window.openAddCardModal = openAddCardModal;
window.closeAddCardModal = closeAddCardModal;
window.saveNewCard = saveNewCard;
window.searchAddress = searchAddress;
window.showAddCardChecklist = showAddCardChecklist;
window.addCardChecklistItem = addCardChecklistItem;
window.toggleAddCardAddMenu = toggleAddCardAddMenu;
window.closeAddCardAddMenu = closeAddCardAddMenu;

// Card Detail
window.openCardDetailModal = openCardDetailModal;
window.closeCardDetailModal = closeCardDetailModal;
window.toggleCardOptionsMenu = toggleCardOptionsMenu;
window.closeCardOptionsMenu = closeCardOptionsMenu;
window.toggleNavbarOptionsMenu = toggleNavbarOptionsMenu;
window.closeNavbarOptionsMenu = closeNavbarOptionsMenu;
window.toggleDetailAddMenu = toggleDetailAddMenu;
window.closeDetailAddMenu = closeDetailAddMenu;
window.showDetailChecklist = showDetailChecklist;
window.editCardField = editCardField;
window.saveCardField = saveCardField;
window.deleteCard = deleteCard;
window.addChecklistItem = addChecklistItem;
window.searchDetailAddress = searchDetailAddress;

// Labels
window.toggleLabelSelection = toggleLabelSelection;
window.toggleDetailLabelSelection = toggleDetailLabelSelection;
window.handleAddCardLabelSearch = handleAddCardLabelSearch;
window.handleDetailLabelSearch = handleDetailLabelSearch;
window.quickCreateLabel = quickCreateLabel;
window.openLabelsManagementModal = openLabelsManagementModal;
window.closeLabelsManagementModal = closeLabelsManagementModal;
window.saveLabel = saveLabel;
window.editLabel = editLabel;
window.cancelEditLabel = cancelEditLabel;
window.deleteLabel = deleteLabel;
window.selectPaletteColor = selectPaletteColor;
window.updatePaletteFromInput = updatePaletteFromInput;
window.openLabelFilterModal = openLabelFilterModal;
window.closeLabelFilterModal = closeLabelFilterModal;
window.toggleFilterLabel = toggleFilterLabel;
window.clearAllFilters = clearAllFilters;

// Images
window.searchImages = searchImages;
window.searchAddCardImages = searchAddCardImages;
window.searchCoverImages = searchCoverImages;
window.selectCoverImage = selectCoverImage;
window.selectAddCardCoverImage = selectAddCardCoverImage;
window.removeCoverImage = removeCoverImage;
window.removeAddCardCoverImage = removeAddCardCoverImage;
window.removeCoverImageFromModal = removeCoverImageFromModal;
window.toggleUrlInput = toggleUrlInput;
window.applyImageUrl = applyImageUrl;
window.handleImageUpload = handleImageUpload;
window.openCoverImageModal = openCoverImageModal;
window.closeCoverImageModal = closeCoverImageModal;

// Links
window.showAddCardLinks = showAddCardLinks;
window.showDetailLinks = showDetailLinks;
window.openAddCardLinkForm = openAddCardLinkForm;
window.openDetailLinkForm = openDetailLinkForm;
window.openLinkModal = openLinkModal;
window.closeLinkModal = closeLinkModal;
window.saveLink = saveLink;
window.editLink = editLink;
window.deleteLink = deleteLink;

// Maps
window.switchView = switchView;
window.searchMapLocation = searchMapLocation;
window.clearMapMarkersOnly = clearMapMarkersOnly;
window.fitMapToMarkers = fitMapToMarkers;
window.openMapsChoiceModal = openMapsChoiceModal;
window.closeMapsChoiceModal = closeMapsChoiceModal;
window.openInGoogleMaps = openInGoogleMaps;
window.openInAppleMaps = openInAppleMaps;

// Calendar
window.renderCalendar = renderCalendar;
window.navigateMonth = navigateMonth;
window.goToToday = goToToday;

// Helpers
window.toggleTimeInput = toggleTimeInput;
