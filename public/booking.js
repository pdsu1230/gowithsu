const tourSelect = document.querySelector('#tour_id');
const membersContainer = document.querySelector('#members-container');
const memberTemplate = document.querySelector('#member-template');
const addMemberButton = document.querySelector('#add-member-btn');
const bookingForm = document.querySelector('#booking-form');
const formStatus = document.querySelector('#form-status');
const adminLoginDialog = document.querySelector('#admin-login-dialog');
const adminLoginForm = document.querySelector('#admin-login-form');
const adminLoginStatus = document.querySelector('#admin-login-status');
const adminLoginOpenButton = document.querySelector('#admin-login-open-btn');
const adminLoginCloseButton = document.querySelector('#admin-login-close-btn');
const bookingSuccessDialog = document.querySelector('#booking-success-dialog');
const bookingSuccessMessage = document.querySelector('#booking-success-message');
const bookingSuccessCloseButton = document.querySelector('#booking-success-close-btn');
const bookingSuccessConfirmButton = document.querySelector('#booking-success-confirm-btn');
const discoverTourLinks = document.querySelectorAll('[data-discover-tour-link]');
const pageUrl = new URL(window.location.href);
const startDateInput = document.querySelector('#start_date');

function resolveInitialGuestCount() {
  const rawGuestCount = pageUrl.searchParams.get('guestCount');
  const parsedGuestCount = Number.parseInt(String(rawGuestCount || '').trim(), 10);

  if (Number.isNaN(parsedGuestCount) || parsedGuestCount <= 0) {
    return 1;
  }

  return Math.min(parsedGuestCount, 20);
}

function initMembersFromQuery() {
  const initialGuestCount = resolveInitialGuestCount();

  for (let index = 0; index < initialGuestCount; index += 1) {
    addMember();
  }
}

function initStartDateFromQuery() {
  if (!startDateInput) {
    return;
  }

  const rawStartDate = String(
    pageUrl.searchParams.get('startDate') || pageUrl.searchParams.get('start_date') || ''
  ).trim();
  if (!rawStartDate) {
    return;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawStartDate)) {
    startDateInput.value = rawStartDate;
  }
}

function openAdminLoginDialog() {
  adminLoginStatus.textContent = '';
  adminLoginDialog.showModal();
}

function closeAdminLoginDialog() {
  adminLoginDialog.close();
}

function openBookingSuccessDialog(message) {
  bookingSuccessMessage.textContent = message;
  bookingSuccessDialog.showModal();
}

function closeBookingSuccessDialog() {
  bookingSuccessDialog.close();
}

function confirmBookingSuccessDialog() {
  closeBookingSuccessDialog();
  window.location.href = '/';
}

function updateDiscoverLinks(discoverUrl) {
  discoverTourLinks.forEach((link) => {
    link.setAttribute('href', discoverUrl);
  });
}

function normalizeCategoryValue(rawValue) {
  const value = String(rawValue || '').trim().toUpperCase();
  if (value === 'BIỂN') return 'BIỂN';
  if (value === 'ROAD' || value === 'ROAD TRIP') return 'ROAD';
  if (value === 'HIKING') return 'HIKING';
  if (value === 'LEO NÚI' || value === 'TREKKING') return 'TREKKING';
  return 'TREKKING';
}

function getCategoryLabel(rawValue) {
  const value = normalizeCategoryValue(rawValue);
  if (value === 'BIỂN') return 'BIỂN';
  if (value === 'ROAD') return 'ROAD';
  if (value === 'HIKING') return 'HIKING';
  return 'TREKKING';
}

async function loadDiscoverTour() {
  const response = await fetch('/api/discover/featured-tour');
  if (!response.ok) {
    return;
  }

  const discoverTour = await response.json();
  if (discoverTour && discoverTour.href) {
    updateDiscoverLinks(discoverTour.href);
  }
}

function updateMemberOrder() {
  membersContainer.querySelectorAll('[data-member-card]').forEach((card, index) => {
    card.querySelector('.member-order').textContent = index + 1;
  });
}

function getMemberCards() {
  return Array.from(membersContainer.querySelectorAll('[data-member-card]'));
}

function updateMemberActions() {
  const cards = getMemberCards();

  cards.forEach((card, index) => {
    const removeButton = card.querySelector('.remove-member-btn');
    const canRemove = index >= 1;

    removeButton.style.display = canRemove ? '' : 'none';
    removeButton.disabled = !canRemove;
  });
}
function syncMedalNameVisibility(card) {
  const medalCheckbox = card.querySelector('[name="medal"]');
  const medalNameField = card.querySelector('.medal-name-field');
  const medalNameInput = card.querySelector('[name="medal_name"]');

  const isChecked = medalCheckbox.checked;
  medalNameField.classList.toggle('medal-name-field--inactive', !isChecked);
  medalNameInput.disabled = !isChecked;

  if (!isChecked) {
    medalNameInput.value = '';
  }
}

function addMember(defaults = {}) {
  const fragment = memberTemplate.content.cloneNode(true);
  const card = fragment.querySelector('[data-member-card]');

  card.querySelectorAll('input, textarea').forEach((field) => {
    const value = defaults[field.name];
    if (field.type === 'checkbox') {
      field.checked = Boolean(value);
    } else {
      field.value = value || '';
    }
  });

  const medalCheckbox = card.querySelector('[name="medal"]');
  medalCheckbox.addEventListener('change', () => {
    syncMedalNameVisibility(card);
  });

  syncMedalNameVisibility(card);

  card.querySelector('.remove-member-btn').addEventListener('click', () => {
    card.remove();
    updateMemberOrder();
    updateMemberActions();
  });

  membersContainer.appendChild(fragment);
  updateMemberOrder();
  updateMemberActions();
}

function collectMembers() {
  return Array.from(membersContainer.querySelectorAll('[data-member-card]')).map((card) => {
    const getValue = (name) => card.querySelector(`[name="${name}"]`);
    return {
      name: getValue('name').value.trim(),
      dob: getValue('dob').value,
      cccd: getValue('cccd').value.trim(),
      phone: getValue('phone').value.trim(),
      address: getValue('address').value.trim(),
      medal: getValue('medal').checked,
      medal_name: getValue('medal_name').value.trim(),
      medical_note: getValue('medical_note').value.trim(),
      borrow_bag: getValue('borrow_bag').checked,
      borrow_headlamp: getValue('borrow_headlamp').checked,
      borrow_trekking_pole: getValue('borrow_trekking_pole').checked
    };
  });
}

async function loadTours() {
  const response = await fetch('/api/tours');
  const tours = await response.json();
  const selectedTourId = Number(pageUrl.searchParams.get('tourId'));
  const selectedTourTitle = String(pageUrl.searchParams.get('tourTitle') || '').trim().toLowerCase();

  tourSelect.innerHTML = tours
    .map((tour) => `<option value="${tour.id}">${tour.title} (${getCategoryLabel(tour.category)})</option>`)
    .join('');

  if (selectedTourId && tours.some((tour) => tour.id === selectedTourId)) {
    tourSelect.value = String(selectedTourId);
    return;
  }

  if (selectedTourTitle) {
    const matchedTour = tours.find((tour) => String(tour.title || '').trim().toLowerCase() === selectedTourTitle);
    if (matchedTour) {
      tourSelect.value = String(matchedTour.id);
    }
  }
}

bookingForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  formStatus.textContent = 'Đang gửi booking...';

  const members = collectMembers();

  const payload = {
    tour_id: Number(tourSelect.value),
    start_date: document.querySelector('#start_date').value,
    members
  };

  const response = await fetch('/api/booking', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  if (!response.ok) {
    formStatus.textContent = result.message || 'Không gửi được booking.';
    return;
  }

  formStatus.textContent = '';
  bookingForm.reset();
  membersContainer.innerHTML = '';
  addMember();

  if (payload.tour_id) {
    tourSelect.value = String(payload.tour_id);
  }

  openBookingSuccessDialog('Booking thành công, Chúng tôi sẽ liên hệ với bạn sớm.');
});

addMemberButton.addEventListener('click', () => addMember());
adminLoginOpenButton.addEventListener('click', openAdminLoginDialog);
adminLoginCloseButton.addEventListener('click', closeAdminLoginDialog);

adminLoginDialog.addEventListener('click', (event) => {
  const dialogBounds = adminLoginForm.getBoundingClientRect();
  const clickedInsideDialog =
    event.clientX >= dialogBounds.left &&
    event.clientX <= dialogBounds.right &&
    event.clientY >= dialogBounds.top &&
    event.clientY <= dialogBounds.bottom;

  if (!clickedInsideDialog) {
    closeAdminLoginDialog();
  }
});

bookingSuccessCloseButton.addEventListener('click', closeBookingSuccessDialog);
bookingSuccessConfirmButton.addEventListener('click', confirmBookingSuccessDialog);

bookingSuccessDialog.addEventListener('click', (event) => {
  if (event.target === bookingSuccessDialog) {
    closeBookingSuccessDialog();
  }
});

loadDiscoverTour().catch(() => {});

adminLoginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  adminLoginStatus.textContent = 'Đang đăng nhập...';

  const usernameInput = document.querySelector('#admin_username') || document.querySelector('#admin-username');
  const passwordInput = document.querySelector('#admin_password') || document.querySelector('#admin-password');
  const payload = {
    username: String(usernameInput?.value || '').trim(),
    password: String(passwordInput?.value || '').trim()
  };

  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  if (!response.ok) {
    adminLoginStatus.textContent = result.message || 'Không đăng nhập được.';
    return;
  }

  window.location.href = result.redirectTo || '/admin';
});

if (pageUrl.searchParams.get('adminLogin') === '1') {
  openAdminLoginDialog();
  adminLoginStatus.textContent = 'Vui lòng đăng nhập để truy cập trang admin.';
}

loadTours().catch(() => {
  formStatus.textContent = 'Không tải được danh sách tour.';
});

initStartDateFromQuery();
initMembersFromQuery();