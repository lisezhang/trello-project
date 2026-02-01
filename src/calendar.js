// -------------------------
// Calendar - Monthly calendar view
// -------------------------

import { cards, lists, getLabelById, setCurrentListId } from './state.js';
import {
  escapeHtml,
  getMonthNameFR,
  getDaysInMonth,
  getFirstDayOfMonth,
  formatDateISO
} from './helpers.js';
import { getFilteredCards } from './labels.js';
import { openCardDetailModal } from './card-detail.js';
import { openAddCardModal } from './card-add.js';

// -------------------------
// Calendar State
// -------------------------
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// -------------------------
// Initialization
// -------------------------

/**
 * Initialize calendar module
 */
export function initCalendar() {
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();
}

// -------------------------
// Navigation
// -------------------------

/**
 * Navigate to previous/next month
 * @param {number} delta - -1 for previous, +1 for next
 */
export function navigateMonth(delta) {
  currentMonth += delta;

  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  } else if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }

  renderCalendar();
}

/**
 * Go to current month
 */
export function goToToday() {
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();
  renderCalendar();
}

// -------------------------
// Data Helpers
// -------------------------

/**
 * Get cards that have at least a start date or end date
 * @returns {Array} Cards with dates
 */
function getCardsWithDates() {
  return cards.filter(card => card.startDate || card.endDate);
}

/**
 * Get cards for a specific date
 * @param {string} dateISO - Date in YYYY-MM-DD format
 * @returns {Array} Cards that start on this date
 */
function getCardsStartingOnDate(dateISO) {
  return getFilteredCards(getCardsWithDates()).filter(card => {
    return card.startDate === dateISO;
  });
}

/**
 * Get the effective date range for a card
 * @param {Object} card - Card object
 * @returns {Object} { start: Date, end: Date }
 */
function getCardDateRange(card) {
  const start = card.startDate ? new Date(card.startDate) : null;
  const end = card.endDate ? new Date(card.endDate) : start;
  return { start, end: end || start };
}

/**
 * Check if a date is within a card's date range
 * @param {string} dateISO - Date in YYYY-MM-DD format
 * @param {Object} card - Card object
 * @returns {boolean}
 */
function isDateInCardRange(dateISO, card) {
  const date = new Date(dateISO);
  const { start, end } = getCardDateRange(card);
  if (!start) return false;
  return date >= start && date <= end;
}

/**
 * Get the color for a card's event bar
 * @param {Object} card - Card object
 * @returns {string} Color hex code
 */
function getCardColor(card) {
  if (card.labels && card.labels.length > 0) {
    const label = getLabelById(card.labels[0]);
    if (label) return label.color;
  }
  return '#667eea';
}

// -------------------------
// Rendering
// -------------------------

/**
 * Render the calendar grid
 */
export function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const titleEl = document.getElementById('calendarTitle');

  if (!grid || !titleEl) return;

  // Update title
  titleEl.textContent = `${getMonthNameFR(currentMonth)} ${currentYear}`;

  // Clear grid
  grid.innerHTML = '';

  const today = new Date();
  const todayISO = formatDateISO(today.getFullYear(), today.getMonth(), today.getDate());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOffset = getFirstDayOfMonth(currentYear, currentMonth);

  // Previous month days
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

  // Calculate total cells needed (6 rows max)
  const totalCells = 42;

  // Get filtered cards with dates for this view
  const cardsWithDates = getFilteredCards(getCardsWithDates());

  // Build day cells
  const dayCells = [];

  for (let i = 0; i < totalCells; i++) {
    let day, month, year, isOtherMonth;

    if (i < firstDayOffset) {
      // Previous month
      day = daysInPrevMonth - firstDayOffset + i + 1;
      month = prevMonth;
      year = prevYear;
      isOtherMonth = true;
    } else if (i >= firstDayOffset + daysInMonth) {
      // Next month
      day = i - firstDayOffset - daysInMonth + 1;
      month = currentMonth === 11 ? 0 : currentMonth + 1;
      year = currentMonth === 11 ? currentYear + 1 : currentYear;
      isOtherMonth = true;
    } else {
      // Current month
      day = i - firstDayOffset + 1;
      month = currentMonth;
      year = currentYear;
      isOtherMonth = false;
    }

    const dateISO = formatDateISO(year, month, day);
    const isToday = dateISO === todayISO;

    dayCells.push({
      day,
      month,
      year,
      dateISO,
      isOtherMonth,
      isToday,
      index: i
    });
  }

  // Render day cells
  dayCells.forEach(cell => {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    if (cell.isOtherMonth) dayEl.classList.add('other-month');
    if (cell.isToday) dayEl.classList.add('today');
    dayEl.dataset.date = cell.dateISO;

    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = cell.day;
    dayEl.appendChild(dayNumber);

    // Events container for single-day events
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-events';
    dayEl.appendChild(eventsContainer);

    // Click handler for empty area
    dayEl.addEventListener('click', (e) => handleDayClick(cell.dateISO, e));

    grid.appendChild(dayEl);
  });

  // Render event bars after grid is built
  renderEventBars(dayCells, cardsWithDates);
}

/**
 * Render multi-day event bars
 * @param {Array} dayCells - Array of day cell data
 * @param {Array} cardsWithDates - Filtered cards with dates
 */
function renderEventBars(dayCells, cardsWithDates) {
  const grid = document.getElementById('calendarGrid');
  if (!grid) return;

  // Track row assignments for overlapping events
  const rowAssignments = new Map(); // cardId -> row

  // Sort cards by start date, then by duration (longer first)
  const sortedCards = [...cardsWithDates].sort((a, b) => {
    const startA = a.startDate || a.endDate;
    const startB = b.startDate || b.endDate;
    if (startA !== startB) return startA.localeCompare(startB);

    // Longer events first
    const durationA = getDuration(a);
    const durationB = getDuration(b);
    return durationB - durationA;
  });

  sortedCards.forEach(card => {
    const { start, end } = getCardDateRange(card);
    if (!start) return;

    const color = getCardColor(card);
    const isSingleDay = start.getTime() === end.getTime();

    if (isSingleDay) {
      // Single day event - render in the day's events container
      const dateISO = formatDateISO(start.getFullYear(), start.getMonth(), start.getDate());
      const dayCell = grid.querySelector(`[data-date="${dateISO}"]`);
      if (dayCell) {
        const eventsContainer = dayCell.querySelector('.day-events');
        if (eventsContainer) {
          const eventEl = document.createElement('div');
          eventEl.className = 'calendar-event';
          eventEl.style.backgroundColor = color;
          eventEl.textContent = card.title;
          eventEl.title = card.title;
          eventEl.addEventListener('click', (e) => {
            e.stopPropagation();
            handleEventClick(card.id);
          });
          eventsContainer.appendChild(eventEl);
        }
      }
    } else {
      // Multi-day event - render as bar(s) spanning across weeks
      renderMultiDayEventBar(card, start, end, color, dayCells, grid, rowAssignments);
    }
  });
}

/**
 * Get duration in days for a card
 * @param {Object} card - Card object
 * @returns {number} Duration in days
 */
function getDuration(card) {
  const { start, end } = getCardDateRange(card);
  if (!start || !end) return 0;
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Render a multi-day event bar that may span multiple weeks
 * @param {Object} card - Card object
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @param {string} color - Event color
 * @param {Array} dayCells - Day cell data
 * @param {HTMLElement} grid - Grid container
 * @param {Map} rowAssignments - Row assignments for overlapping
 */
function renderMultiDayEventBar(card, start, end, color, dayCells, grid, rowAssignments) {
  // Find the visible range for this event within the calendar
  const firstCellDate = new Date(dayCells[0].dateISO);
  const lastCellDate = new Date(dayCells[dayCells.length - 1].dateISO);

  const visibleStart = start < firstCellDate ? firstCellDate : start;
  const visibleEnd = end > lastCellDate ? lastCellDate : end;

  // Process week by week
  let currentDate = new Date(visibleStart);

  while (currentDate <= visibleEnd) {
    // Find the week row (0-5)
    const currentISO = formatDateISO(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const cellIndex = dayCells.findIndex(c => c.dateISO === currentISO);

    if (cellIndex === -1) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    const weekRow = Math.floor(cellIndex / 7);
    const dayOfWeek = cellIndex % 7;

    // Calculate end of this week segment
    const weekEndIndex = (weekRow + 1) * 7 - 1;
    const segmentEndIndex = Math.min(
      weekEndIndex,
      dayCells.findIndex(c => c.dateISO === formatDateISO(visibleEnd.getFullYear(), visibleEnd.getMonth(), visibleEnd.getDate()))
    );

    if (segmentEndIndex === -1) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    const segmentEndDayOfWeek = segmentEndIndex % 7;

    // Determine bar type
    const isStart = currentDate.getTime() === start.getTime();
    const endDateForSegment = new Date(dayCells[segmentEndIndex].dateISO);
    const isEnd = endDateForSegment.getTime() === end.getTime();

    let barClass = 'bar-middle';
    if (isStart && isEnd) barClass = 'bar-single';
    else if (isStart) barClass = 'bar-start';
    else if (isEnd) barClass = 'bar-end';

    // Assign row for this bar
    const row = getRowForEvent(card.id, weekRow, rowAssignments);

    // Create the bar element
    const bar = document.createElement('div');
    bar.className = `calendar-event-bar ${barClass}`;
    bar.style.backgroundColor = color;
    bar.dataset.row = row;
    bar.dataset.cardId = card.id;
    bar.title = card.title;

    // Position using CSS
    const columnStart = dayOfWeek + 1;
    const columnEnd = segmentEndDayOfWeek + 2;
    bar.style.gridColumn = `${columnStart} / ${columnEnd}`;
    bar.style.gridRow = weekRow + 1;

    // Only show title on start segment
    if (isStart || barClass === 'bar-middle' && dayOfWeek === 0) {
      bar.textContent = card.title;
    }

    bar.addEventListener('click', (e) => {
      e.stopPropagation();
      handleEventClick(card.id);
    });

    grid.appendChild(bar);

    // Move to next week
    const nextWeekStart = new Date(dayCells[Math.min(segmentEndIndex + 1, dayCells.length - 1)].dateISO);
    if (nextWeekStart <= currentDate) break;
    currentDate = nextWeekStart;
  }
}

/**
 * Get row assignment for an event in a specific week
 * @param {number} cardId - Card ID
 * @param {number} weekRow - Week row index
 * @param {Map} rowAssignments - Existing assignments
 * @returns {number} Row index (0-3)
 */
function getRowForEvent(cardId, weekRow, rowAssignments) {
  const key = `${cardId}-${weekRow}`;
  if (rowAssignments.has(key)) {
    return rowAssignments.get(key);
  }

  // Find first available row for this week
  const usedRows = new Set();
  for (const [k, v] of rowAssignments) {
    if (k.endsWith(`-${weekRow}`)) {
      usedRows.add(v);
    }
  }

  let row = 0;
  while (usedRows.has(row) && row < 4) {
    row++;
  }

  rowAssignments.set(key, row);
  return row;
}

// -------------------------
// Event Handlers
// -------------------------

/**
 * Handle click on a day cell
 * @param {string} dateISO - Date in YYYY-MM-DD format
 * @param {Event} event - Click event
 */
function handleDayClick(dateISO, event) {
  // Don't open modal if clicking on an event
  if (event.target.closest('.calendar-event') || event.target.closest('.calendar-event-bar')) {
    return;
  }

  if (lists.length === 0) {
    alert('Veuillez créer une liste avant d\'ajouter une carte.');
    return;
  }

  // Use first list as default
  setCurrentListId(lists[0].id);
  openAddCardModal(dateISO);
}

/**
 * Handle click on an event
 * @param {number} cardId - Card ID
 */
function handleEventClick(cardId) {
  openCardDetailModal(cardId);
}
