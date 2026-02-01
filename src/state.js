// -------------------------
// State - Global application state and persistence
// -------------------------

import {
  STORAGE_LISTS,
  STORAGE_CARDS,
  STORAGE_CUSTOM_LABELS
} from './constants.js';

// -------------------------
// Global State Variables
// -------------------------
export let lists = [];
export let cards = [];
export let customLabels = [];
export let activeFilters = [];

// Current context
export let currentListId = null;
export let currentCardId = null;

// -------------------------
// State Setters
// -------------------------
export function setLists(newLists) {
  lists = newLists;
}

export function setCards(newCards) {
  cards = newCards;
}

export function setCustomLabels(newLabels) {
  customLabels = newLabels;
}

export function setActiveFilters(newFilters) {
  activeFilters = newFilters;
}

export function setCurrentListId(id) {
  currentListId = id;
}

export function setCurrentCardId(id) {
  currentCardId = id;
}

// -------------------------
// Persistence Functions
// -------------------------

/**
 * Load data from localStorage
 */
export function loadData() {
  const savedLists = localStorage.getItem(STORAGE_LISTS);
  const savedCards = localStorage.getItem(STORAGE_CARDS);
  const savedLabels = localStorage.getItem(STORAGE_CUSTOM_LABELS);

  if (savedLists) lists = JSON.parse(savedLists);
  if (savedCards) cards = JSON.parse(savedCards);
  if (savedLabels) customLabels = JSON.parse(savedLabels);
}

/**
 * Save lists and cards to localStorage
 */
export function saveData() {
  localStorage.setItem(STORAGE_LISTS, JSON.stringify(lists));
  localStorage.setItem(STORAGE_CARDS, JSON.stringify(cards));
}

/**
 * Save custom labels to localStorage
 */
export function saveCustomLabels() {
  localStorage.setItem(STORAGE_CUSTOM_LABELS, JSON.stringify(customLabels));
}

/**
 * Get label by ID
 * @param {number} id - Label ID
 * @returns {Object|undefined} Label object or undefined
 */
export function getLabelById(id) {
  return customLabels.find(l => l.id === id);
}

/**
 * Initialize application state
 * Creates default lists if first launch
 */
export function initState() {
  loadData();

  // First launch: create default lists, no demo cards
  if (lists.length === 0) {
    lists = [
      { id: 1, title: 'Checklist' },
      { id: 2, title: 'Circuit' },
      { id: 3, title: 'Documents' },
      { id: 4, title: 'Hôtels' }
    ];
    cards = [];
    saveData();
  }
}
