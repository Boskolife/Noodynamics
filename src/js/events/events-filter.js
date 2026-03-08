/**
 * Events page: custom event type selector and calendar with filtering.
 */

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Single document click handler for events section; reused so we can remove before re-adding. */
let eventsDocClickHandler = null;

function getEventDates() {
  const items = document.querySelectorAll('.events__inner-item[data-event-date]');
  const dates = new Set();
  items.forEach((item) => {
    const date = item.getAttribute('data-event-date');
    if (date) dates.add(date);
  });
  return dates;
}

function filterEvents(typeFilter, dateFilter) {
  document.querySelectorAll('.events__inner[data-event-type]').forEach((section) => {
    const sectionType = section.getAttribute('data-event-type');
    const typeMatch = !typeFilter || typeFilter === 'all' || sectionType === typeFilter;
    section.style.display = typeMatch ? '' : 'none';
  });

  document.querySelectorAll('.events__inner-item[data-event-date]').forEach((item) => {
    const itemDate = item.getAttribute('data-event-date');
    const sectionType = item.closest('.events__inner')?.getAttribute('data-event-type');
    const typeMatch = !typeFilter || typeFilter === 'all' || sectionType === typeFilter;
    const dateMatch = !dateFilter || itemDate === dateFilter;
    item.style.display = typeMatch && dateMatch ? '' : 'none';
  });
}

function initEventSelector(container, eventDates, state) {
  const trigger = container.querySelector('.events__selector-trigger');
  const dropdown = container.querySelector('.events__selector-dropdown');
  const valueEl = container.querySelector('.events__selector-value');
  const options = container.querySelectorAll('.events__selector-option');
  if (!trigger || !dropdown || !valueEl) return;

  const closeDropdown = () => {
    trigger.setAttribute('aria-expanded', 'false');
    dropdown.hidden = true;
  };
  const openDropdown = () => {
    trigger.setAttribute('aria-expanded', 'true');
    dropdown.hidden = false;
  };
  const setValue = (value, label) => {
    state.typeFilter = value;
    valueEl.textContent = label;
    options.forEach((opt) => opt.setAttribute('aria-selected', opt.getAttribute('data-value') === value));
    filterEvents(state.typeFilter, state.dateFilter);
  };

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.hidden ? openDropdown() : closeDropdown();
  });
  options.forEach((option) => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const value = option.getAttribute('data-value');
      const label = option.textContent;
      setValue(value, label);
      closeDropdown();
    });
  });
}

function formatDateDisplay(date) {
  const dayName = DAY_NAMES[date.getDay()];
  const month = MONTH_NAMES_SHORT[date.getMonth()];
  const day = date.getDate();
  return `${dayName}, ${month} ${day}`;
}

function initCalendar(container, eventDates, state) {
  const dateTextEl = container.querySelector('.events__calendar-date-text');
  const dateBtn = container.querySelector('.events__calendar-date');
  const dropdown = container.querySelector('.events__calendar-dropdown');
  const daysEl = container.querySelector('.events__calendar-days');
  const prevBtn = container.querySelector('.events__calendar-nav--prev');
  const nextBtn = container.querySelector('.events__calendar-nav--next');
  const headerTitleEl = container.querySelector('.events__calendar-header-title');
  const headerPrevBtn = container.querySelector('.events__calendar-header-nav--prev');
  const headerNextBtn = container.querySelector('.events__calendar-header-nav--next');

  if (!dateTextEl || !dateBtn || !daysEl || !prevBtn || !nextBtn || !headerTitleEl || !headerPrevBtn || !headerNextBtn) return;

  let currentDate = new Date();
  if (state.dateFilter) {
    const [y, m, d] = state.dateFilter.split('-').map(Number);
    currentDate = new Date(y, m - 1, d);
  }

  const formatDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const updateDateDisplay = () => {
    const displayDate = state.dateFilter ? new Date(state.dateFilter + 'T12:00:00') : currentDate;
    dateTextEl.textContent = formatDateDisplay(displayDate);
  };

  const closeDropdown = () => {
    if (dropdown) dropdown.hidden = true;
    dateBtn.setAttribute('aria-expanded', 'false');
  };

  const toggleDropdown = () => {
    if (!dropdown) return;
    const willOpen = dropdown.hidden;
    dropdown.hidden = !willOpen;
    dateBtn.setAttribute('aria-expanded', String(willOpen));
  };

  dateBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown(); });

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    headerTitleEl.textContent = `${MONTH_NAMES[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();

    daysEl.innerHTML = '';

    for (let i = startOffset; i > 0; i--) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'events__calendar-day events__calendar-day--other events__calendar-day--empty';
      cell.textContent = prevMonthLastDay - i + 1;
      cell.disabled = true;
      daysEl.appendChild(cell);
    }

    const todayKey = formatDateKey(new Date());

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateKey = formatDateKey(date);
      const hasEvents = eventDates.has(dateKey);
      const isToday = dateKey === todayKey;
      const isSelected = state.dateFilter === dateKey;

      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'events__calendar-day';
      cell.textContent = d;
      cell.setAttribute('data-date', dateKey);
      if (isSelected) cell.classList.add('events__calendar-day--selected');
      else if (hasEvents) cell.classList.add('events__calendar-day--has-events');
      else if (isToday) cell.classList.add('events__calendar-day--today');

      cell.addEventListener('click', () => {
        document.querySelectorAll('.events__calendar-day--selected').forEach((el) => el.classList.remove('events__calendar-day--selected'));
        if (state.dateFilter === dateKey) {
          state.dateFilter = null;
          filterEvents(state.typeFilter, null);
        } else {
          state.dateFilter = dateKey;
          cell.classList.add('events__calendar-day--selected');
          filterEvents(state.typeFilter, dateKey);
        }
        currentDate = new Date(dateKey + 'T12:00:00');
        updateDateDisplay();
        closeDropdown();
      });
      daysEl.appendChild(cell);
    }
  };

  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentDate.setDate(currentDate.getDate() - 1);
    state.dateFilter = formatDateKey(currentDate);
    filterEvents(state.typeFilter, state.dateFilter);
    updateDateDisplay();
    renderCalendar();
  });
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentDate.setDate(currentDate.getDate() + 1);
    state.dateFilter = formatDateKey(currentDate);
    filterEvents(state.typeFilter, state.dateFilter);
    updateDateDisplay();
    renderCalendar();
  });

  updateDateDisplay();
  renderCalendar();

  headerPrevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });
  headerNextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
}

function handleEventsDocumentClick(e, selector, calendar) {
  if (selector && !selector.contains(e.target)) {
    const dropdown = selector.querySelector('.events__selector-dropdown');
    const trigger = selector.querySelector('.events__selector-trigger');
    if (dropdown?.hidden === false) {
      dropdown.hidden = true;
      trigger?.setAttribute('aria-expanded', 'false');
    }
  }
  if (calendar && !calendar.contains(e.target)) {
    const dropdown = calendar.querySelector('.events__calendar-dropdown');
    const dateBtn = calendar.querySelector('.events__calendar-date');
    if (dropdown?.hidden === false) {
      dropdown.hidden = true;
      dateBtn?.setAttribute('aria-expanded', 'false');
    }
  }
}

export function initEventsFilter() {
  const section = document.querySelector('.events');
  if (!section) return;

  const eventDates = getEventDates();
  const state = { typeFilter: 'all', dateFilter: null };
  const selector = section.querySelector('.events__selector');
  const calendar = section.querySelector('.events__calendar');

  if (selector) initEventSelector(selector, eventDates, state);
  if (calendar) initCalendar(calendar, eventDates, state);

  if (eventsDocClickHandler) {
    document.removeEventListener('click', eventsDocClickHandler);
  }
  eventsDocClickHandler = (e) => handleEventsDocumentClick(e, selector, calendar);
  document.addEventListener('click', eventsDocClickHandler);
}
