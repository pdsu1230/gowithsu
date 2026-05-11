const tourForm = document.querySelector('#tour-form');
const tourStatus = document.querySelector('#tour-status');
const tourAdminList = document.querySelector('#tour-admin-list');
const tourCreateButton = document.querySelector('#tour-create-btn');
const tourEditDialog = document.querySelector('#tour-edit-dialog');
const tourDialogClose = document.querySelector('#tour-dialog-close');
const tourDeleteConfirmDialog = document.querySelector('#tour-delete-confirm-dialog');
const tourDeleteConfirmMessage = document.querySelector('#tour-delete-confirm-message');
const tourDeleteCancelButton = document.querySelector('#tour-delete-cancel-btn');
const tourDeleteConfirmButton = document.querySelector('#tour-delete-confirm-btn');
const adminLogoutButton = document.querySelector('#admin-logout-btn');
const tourImagesInput = document.querySelector('#tour_images');
const tourImagesNameInput = document.querySelector('#tour_images_names');
const tourImagesUploadButton = document.querySelector('#tour_images_upload_btn');
const addItineraryDayButton = document.querySelector('#add-itinerary-day-btn');
const removeItineraryDayButton = document.querySelector('#remove-itinerary-day-btn');
const itineraryDay1TitleInput = document.querySelector('#tour_itinerary_day1_title');
const itineraryDay1Input = document.querySelector('#tour_itinerary_day1');
const itineraryExtraContainer = document.querySelector('#tour_itinerary_extra_container');
const tourDurationSelect = document.querySelector('#tour_duration');
const tourPriceInput = document.querySelector('#tour_price');
const tourTripDetailsInput = document.querySelector('#tour_trip_details');
const tourNotesInput = document.querySelector('#tour_notes_text');
const tourQuoteInput = document.querySelector('#tour_quote_text');
const tourIncludesInput = document.querySelector('#tour_includes_text');
const tourExcludesInput = document.querySelector('#tour_excludes_text');

let uploadedImageUrls = [];
let pendingImageFiles = [];
let visibleItineraryDays = 1;
const MAX_VISIBLE_ITINERARY_DAYS = 10;
const MAX_UPLOAD_IMAGE_SIZE_MB = 8;

let deleteDialogResolver = null;

function showToast(message) {
  const existing = document.querySelector('#admin-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'admin-toast';
  toast.textContent = message;
  toast.style.cssText = [
    'position:fixed', 'bottom:32px', 'left:50%', 'transform:translateX(-50%)',
    'background:#143600', 'color:#fff', 'font-size:14px', 'font-weight:700',
    'padding:12px 28px', 'border-radius:999px',
    'box-shadow:0 8px 30px rgba(20,54,0,0.25)',
    'z-index:9999', 'opacity:0',
    'transition:opacity 0.2s ease, transform 0.2s ease',
    'pointer-events:none'
  ].join(';');

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(-6px)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => toast.remove(), 220);
  }, 2500);
}

function confirmTourDelete(tourTitle = '') {
  if (!tourDeleteConfirmDialog || typeof tourDeleteConfirmDialog.showModal !== 'function') {
    return Promise.resolve(window.confirm('Xóa tour này và toàn bộ booking liên quan?'));
  }

  if (tourDeleteConfirmMessage) {
    const title = String(tourTitle || '').trim();
    tourDeleteConfirmMessage.textContent = title
      ? `Bạn chắc chắn muốn xóa tour "${title}" và toàn bộ booking liên quan?`
      : 'Bạn chắc chắn muốn xóa tour này và toàn bộ booking liên quan?';
  }

  return new Promise((resolve) => {
    deleteDialogResolver = resolve;
    tourDeleteConfirmDialog.showModal();
  });
}

function resolveDeleteDialog(confirmed) {
  if (deleteDialogResolver) {
    deleteDialogResolver(Boolean(confirmed));
    deleteDialogResolver = null;
  }

  if (tourDeleteConfirmDialog?.open) {
    tourDeleteConfirmDialog.close();
  }
}

if (tourDeleteCancelButton) {
  tourDeleteCancelButton.addEventListener('click', () => resolveDeleteDialog(false));
}

if (tourDeleteConfirmButton) {
  tourDeleteConfirmButton.addEventListener('click', () => resolveDeleteDialog(true));
}

if (tourDeleteConfirmDialog) {
  tourDeleteConfirmDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    resolveDeleteDialog(false);
  });

  tourDeleteConfirmDialog.addEventListener('click', (event) => {
    const bounds = tourDeleteConfirmDialog.getBoundingClientRect();
    const clickedInside =
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom;

    if (!clickedInside) {
      resolveDeleteDialog(false);
    }
  });
}

function defaultItineraryTitle(dayNumber) {
  return `NGÀY ${String(dayNumber).padStart(2, '0')}`;
}

function normalizeItineraryDay(item, index) {
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    const title = String(item.title || '').trim();
    const content = String(item.content ?? item.value ?? '').trim();
    return { title, content };
  }

  return {
    title: '',
    content: String(item || '').trim()
  };
}

function parseItineraryDays(rawValue) {
  const raw = String(rawValue || '').trim();
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item, index) => normalizeItineraryDay(item, index));
    }
  } catch (_error) {
    // Keep backward compatibility with plain text values.
  }

  return [];
}

function readCurrentItineraryValues() {
  const values = [
    {
      title: String(itineraryDay1TitleInput?.value || '').trim(),
      content: String(itineraryDay1Input?.value || '').trim()
    }
  ];

  for (let day = 2; day <= visibleItineraryDays; day += 1) {
    const titleInput = itineraryExtraContainer.querySelector(`textarea[data-itinerary-day-title="${day}"]`);
    const contentInput = itineraryExtraContainer.querySelector(`textarea[data-itinerary-day-content="${day}"]`);

    values.push({
      title: String(titleInput?.value || '').trim(),
      content: String(contentInput?.value || '').trim()
    });
  }

  return values;
}

function renderItineraryExtraDays(dayValues = []) {
  itineraryExtraContainer.innerHTML = '';

  for (let day = 2; day <= visibleItineraryDays; day += 1) {
    const dayValue = normalizeItineraryDay(dayValues[day - 1], day - 1);
    const label = document.createElement('label');
    label.className = 'flex flex-col gap-2 text-sm font-semibold text-slate-700';

    const labelText = document.createElement('span');
    labelText.className = 'text-xs font-bold uppercase tracking-widest text-slate-400';
    labelText.textContent = defaultItineraryTitle(day);

    const titleInput = document.createElement('textarea');
    titleInput.id = `tour_itinerary_day_title_${day}`;
    titleInput.rows = 1;
    titleInput.placeholder = 'VÍ DỤ: CHẶNG CHÍNH CỦA NGÀY NÀY';
    titleInput.dataset.itineraryDayTitle = String(day);
    titleInput.value = dayValue.title;
    titleInput.className = 'resize-none rounded-xl bg-surface-container-lowest px-4 py-2.5 text-sm uppercase leading-5 shadow-sm transition-all focus:ring-2 focus:ring-primary/20';

    const textarea = document.createElement('textarea');
    textarea.id = `tour_itinerary_day_${day}`;
    textarea.rows = 3;
    textarea.placeholder = 'Ví dụ: 05:30 ăn sáng, 08:00 xuất phát...';
    textarea.dataset.itineraryDayContent = String(day);
    textarea.value = dayValue.content;
    textarea.className = 'resize-none rounded-xl bg-surface-container-lowest p-4 text-sm shadow-sm transition-all focus:ring-2 focus:ring-primary/20';

    label.appendChild(labelText);
    label.appendChild(titleInput);
    label.appendChild(textarea);
    itineraryExtraContainer.appendChild(label);
  }
}

function updateItineraryUi(dayValues = null) {
  visibleItineraryDays = Math.min(Math.max(1, visibleItineraryDays), MAX_VISIBLE_ITINERARY_DAYS);
  const values = dayValues || readCurrentItineraryValues();
  renderItineraryExtraDays(values);

  addItineraryDayButton.hidden = false;
  addItineraryDayButton.disabled = visibleItineraryDays >= MAX_VISIBLE_ITINERARY_DAYS;
  removeItineraryDayButton.hidden = false;
  removeItineraryDayButton.disabled = visibleItineraryDays <= 1;
}

function collectItineraryDaysForPayload() {
  const days = readCurrentItineraryValues().map((item, index) => ({
    title: String(item.title || '').trim(),
    content: String(item.content || '').trim()
  }));

  while (days.length > 1 && !days[days.length - 1].content) {
    days.pop();
  }

  return days;
}

function normalizeDifficulty(rawValue) {
  const value = String(rawValue || '').trim();
  // Handle corrupted encodings (e.g., 'Trung b?nh' -> 'Trung Bình')
  if (value === 'Trung b?nh' || value.toLowerCase() === 'trung bình') {
    return 'Trung Bình';
  }
  return value;
}

function difficultyChipClass(d) {
  const v = String(d || '').toLowerCase();
  if (v === 'dễ') return 'bg-green-100 text-green-700';
  if (v.includes('trung') || v === 'tb') return 'bg-orange-100 text-orange-700';
  if (v === 'khó') return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-600';
}

function categoryChipClass(cat) {
  const v = normalizeCategoryValue(cat);
  if (v === 'BIỂN') return 'bg-sky-100 text-sky-700 border-sky-200';
  if (v === 'HIKING') return 'bg-teal-100 text-teal-700 border-teal-200';
  if (v === 'ROAD TRIP') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-green-100 text-green-700 border-green-200';
}

function normalizeCategoryValue(rawValue) {
  const value = String(rawValue || '').trim().toUpperCase();
  if (!value) return 'TREKKING';
  if (value === 'LEO NÚI' || value === 'TREKKING') return 'TREKKING';
  if (value === 'BIỂN') return 'BIỂN';
  if (value === 'ROAD' || value === 'ROAD TRIP') return 'ROAD TRIP';
  if (value === 'HIKING') return 'HIKING';
  return value;
}

function getCategoryLabel(rawValue) {
  const value = normalizeCategoryValue(rawValue);
  if (value === 'TREKKING') return 'Trekking';
  if (value === 'BIỂN') return 'Biển';
  if (value === 'HIKING') return 'Hiking';
  if (value === 'ROAD TRIP') return 'Road Trip';
  return value;
}

function getRadioValue(name, fallback = '') {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || fallback;
}

function setRadioValue(name, value, fallback = '') {
  const targetValue = name === 'tour_category'
    ? normalizeCategoryValue(value || fallback)
    : (value || fallback);
  const radio = document.querySelector(`input[name="${name}"][value="${targetValue}"]`);
  if (radio) {
    radio.checked = true;
  }
}

function parseImageUrls(rawValue) {
  const raw = String(rawValue || '').trim();
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => String(item || '').trim());
    }
  } catch (_error) {
    // Keep backward compatibility with plain text values.
  }

  return raw
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractFileNameFromPath(value) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return '';
  }

  const parts = normalized.split('/');
  return parts[parts.length - 1] || normalized;
}

function getTourImageUrls(tour) {
  const urls = parseImageUrls(tour.image_urls);
  if (urls.length > 0) {
    return urls;
  }

  const fallback = String(tour.image_url || '').trim();
  return fallback ? [fallback] : [];
}

function updateImageNameInput() {
  if (pendingImageFiles.length > 0) {
    tourImagesNameInput.value = pendingImageFiles.map((file) => file.name).join(', ');
    return;
  }

  if (uploadedImageUrls.length > 0) {
    tourImagesNameInput.value = uploadedImageUrls.map((url) => extractFileNameFromPath(url)).join(', ');
    return;
  }

  tourImagesNameInput.value = '';
}

const tourImagesPreview = document.querySelector('#tour_images_preview');

function renderImagePreview() {
  if (!tourImagesPreview) return;

  // Build unified list: pending files (local blob) + already-uploaded URLs
  const items = [
    ...pendingImageFiles.map((file, idx) => ({ type: 'pending', src: URL.createObjectURL(file), idx })),
    ...uploadedImageUrls.map((url, idx) => ({ type: 'uploaded', src: url, idx }))
  ];

  if (!items.length) {
    tourImagesPreview.classList.add('hidden');
    tourImagesPreview.innerHTML = '';
    return;
  }

  tourImagesPreview.classList.remove('hidden');
  tourImagesPreview.innerHTML = items.map(({ type, src, idx }) => `
    <div class="relative group rounded-xl overflow-hidden aspect-square bg-slate-100">
      <img src="${src}" alt="" class="w-full h-full object-cover" loading="lazy" />
      ${idx === 0 && type === (pendingImageFiles.length > 0 ? 'pending' : 'uploaded') ? `<span class="absolute bottom-1 left-1 rounded-full bg-primary/80 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">Đại diện</span>` : ''}
      <button
        type="button"
        class="delete-img-btn absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        data-type="${type}" data-idx="${idx}" aria-label="Xóa ảnh">
        <span class="material-symbols-outlined" style="font-size:14px">close</span>
      </button>
    </div>
  `).join('');

  tourImagesPreview.querySelectorAll('.delete-img-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const idx = Number(btn.dataset.idx);
      if (type === 'pending') {
        pendingImageFiles.splice(idx, 1);
        // Reset file input to allow re-selecting same file
        tourImagesInput.value = '';
      } else {
        uploadedImageUrls.splice(idx, 1);
      }
      updateImageNameInput();
      renderImagePreview();
    });
  });
}

function formatPriceVnd(value) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return '';
  }

  const digitsOnly = normalized.replace(/\D/g, '' );
  if (!digitsOnly) {
    return '';
  }

  const amount = Number.parseInt(digitsOnly, 10);
  if (Number.isNaN(amount)) {
    return '';
  }

  return `${amount.toLocaleString('vi-VN')} VNĐ`;
}

async function uploadPendingImages() {
  if (pendingImageFiles.length === 0) {
    return [];
  }

  const formData = new FormData();
  pendingImageFiles.forEach((file) => {
    formData.append('images', file);
  });

  const response = await fetch('/api/admin/upload-images', {
    method: 'POST',
    body: formData
  });

  let result;
  try {
    result = await response.json();
  } catch (_error) {
    result = { message: 'Máy chủ upload trả về dữ liệu không hợp lệ.' };
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Phiên đăng nhập admin đã hết hạn. Vui lòng đăng nhập lại.');
    }
    throw new Error(result.message || 'Upload ảnh thất bại.');
  }

  pendingImageFiles = [];
  tourImagesInput.value = '';

  return Array.isArray(result.urls) ? result.urls : [];
}

function tourFormPayload() {
  const itineraryDays = collectItineraryDaysForPayload();
  const fixedGuestCount = Number.parseInt(document.querySelector('#tour_fixed_guest_count').value, 10);
  console.log('Fixed guest count input value:', document.querySelector('#tour_fixed_guest_count').value, 'Parsed value:', fixedGuestCount);
  return {
    title: document.querySelector('#tour_title').value.trim(),
    location: (document.querySelector('#tour_location')?.value || '').trim(),
    category: normalizeCategoryValue(getRadioValue('tour_category', 'TREKKING')),
    duration: document.querySelector('#tour_duration').value.trim(),
    difficulty: getRadioValue('tour_difficulty', 'Dễ'),
    description: document.querySelector('#tour_description').value.trim(),
    image_url: uploadedImageUrls[0] || '',
    image_urls: JSON.stringify(uploadedImageUrls),
    best_time: document.querySelector('#tour_best_time').value.trim(),
    max_altitude: document.querySelector('#tour_max_altitude').value.trim(),
    fixed_guest_count: Number.isNaN(fixedGuestCount) ? 12 : Math.min(Math.max(fixedGuestCount, 1), 200),
    trip_details: document.querySelector('#tour_trip_details').value.trim(),
    notes_text: document.querySelector('#tour_notes_text').value.trim(),
    quote_text: document.querySelector('#tour_quote_text').value.trim(),
    price: formatPriceVnd(tourPriceInput.value),
    itinerary_days: JSON.stringify(itineraryDays),
    itinerary_day1: itineraryDays[0]?.content || '',
    itinerary_day2: itineraryDays[1]?.content || '',
    itinerary_day3: itineraryDays[2]?.content || '',
    includes_text: document.querySelector('#tour_includes_text').value.trim(),
    excludes_text: document.querySelector('#tour_excludes_text').value.trim()
  };
}

function resetTourForm() {
  tourForm.reset();
  document.querySelector('#tour_form_id').value = '';
  if (tourNotesInput) tourNotesInput.value = '';
  if (tourQuoteInput) tourQuoteInput.value = '';
  uploadedImageUrls = [];
  pendingImageFiles = [];
  visibleItineraryDays = 1;
  itineraryDay1TitleInput.value = '';
  itineraryDay1Input.value = '';
  setRadioValue('tour_category', 'TREKKING', 'TREKKING');
  setRadioValue('tour_difficulty', 'Dễ', 'Dễ');
  delete tourIncludesInput.dataset.autoPrefixSeeded;
  delete tourExcludesInput.dataset.autoPrefixSeeded;
  if (tourTripDetailsInput) {
    delete tourTripDetailsInput.dataset.autoPrefixSeeded;
  }
  if (tourNotesInput) {
    delete tourNotesInput.dataset.autoPrefixSeeded;
  }
  updateImageNameInput();
  renderImagePreview();
  updateItineraryUi([{ title: '', content: '' }]);
}

function fillTourForm(tour) {
  const normalizedDifficulty = normalizeDifficulty(tour.difficulty);
  document.querySelector('#tour_form_id').value = tour.id;
  document.querySelector('#tour_title').value = tour.title || '';
  if (document.querySelector('#tour_location')) document.querySelector('#tour_location').value = tour.location || '';
  setRadioValue('tour_category', normalizeCategoryValue(tour.category), 'TREKKING');
  document.querySelector('#tour_duration').value = tour.duration || '1 ngày';
  setRadioValue('tour_difficulty', normalizedDifficulty, 'Dễ');
  document.querySelector('#tour_description').value = tour.description || '';
  uploadedImageUrls = getTourImageUrls(tour);
  pendingImageFiles = [];
  updateImageNameInput();
  renderImagePreview();
  document.querySelector('#tour_best_time').value = tour.best_time || '';
  document.querySelector('#tour_max_altitude').value = tour.max_altitude || '';
  document.querySelector('#tour_fixed_guest_count').value = Number.parseInt(tour.fixed_guest_count, 10) || 12;
  document.querySelector('#tour_trip_details').value = tour.trip_details || '';
  if (tourNotesInput) tourNotesInput.value = tour.notes_text || '';
  if (tourQuoteInput) tourQuoteInput.value = tour.quote_text || '';
  tourPriceInput.value = formatPriceVnd(tour.price || '');
  const dynamicItineraryDays = parseItineraryDays(tour.itinerary_days);
  const legacyItineraryDays = [tour.itinerary_day1 || '', tour.itinerary_day2 || '', tour.itinerary_day3 || '']
    .map((item, index) => normalizeItineraryDay(item, index));
  const resolvedItineraryDays = dynamicItineraryDays.length > 0 ? dynamicItineraryDays : legacyItineraryDays;

  while (resolvedItineraryDays.length > 1 && !String(resolvedItineraryDays[resolvedItineraryDays.length - 1].content || '').trim()) {
    resolvedItineraryDays.pop();
  }

  visibleItineraryDays = Math.max(1, resolvedItineraryDays.length);
  itineraryDay1TitleInput.value = resolvedItineraryDays[0]?.title || '';
  itineraryDay1Input.value = resolvedItineraryDays[0]?.content || '';
  updateItineraryUi(resolvedItineraryDays);
  document.querySelector('#tour_includes_text').value = tour.includes_text || '';
  document.querySelector('#tour_excludes_text').value = tour.excludes_text || '';
  delete tourIncludesInput.dataset.autoPrefixSeeded;
  delete tourExcludesInput.dataset.autoPrefixSeeded;
  if (tourTripDetailsInput) {
    delete tourTripDetailsInput.dataset.autoPrefixSeeded;
  }
  if (tourNotesInput) {
    delete tourNotesInput.dataset.autoPrefixSeeded;
  }
  tourEditDialog.showModal();
}

addItineraryDayButton.addEventListener('click', () => {
  visibleItineraryDays = Math.min(MAX_VISIBLE_ITINERARY_DAYS, visibleItineraryDays + 1);
  updateItineraryUi();
});

removeItineraryDayButton.addEventListener('click', () => {
  if (visibleItineraryDays <= 1) {
    return;
  }

  visibleItineraryDays = Math.max(1, visibleItineraryDays - 1);
  updateItineraryUi();
});

tourImagesInput.addEventListener('change', async () => {
  const files = Array.from(tourImagesInput.files || []);

  if (!files.length) {
    return;
  }

  const hasInvalidType = files.some((file) => !String(file.type || '').startsWith('image/'));
  if (hasInvalidType) {
    tourStatus.textContent = 'Chỉ hỗ trợ file ảnh (jpg, png, webp...).';
    tourImagesInput.value = '';
    return;
  }

  const oversizeFile = files.find((file) => file.size > MAX_UPLOAD_IMAGE_SIZE_MB * 1024 * 1024);
  if (oversizeFile) {
    tourStatus.textContent = `Ảnh "${oversizeFile.name}" vượt quá ${MAX_UPLOAD_IMAGE_SIZE_MB}MB.`;
    tourImagesInput.value = '';
    return;
  }

  tourStatus.textContent = '';

  pendingImageFiles = files;
  updateImageNameInput();
  renderImagePreview();
});

tourImagesUploadButton.addEventListener('click', () => {
  tourImagesInput.click();
});

tourPriceInput.addEventListener('blur', () => {
  tourPriceInput.value = formatPriceVnd(tourPriceInput.value);
});

function addAutoPrefixOnEnter(inputElement, prefix, applyFirstLine = false) {
  if (!inputElement) {
    return;
  }

  function normalizePrefixedLines(rawValue) {
    return String(rawValue || '')
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return '';
        }

        if (trimmed.startsWith(prefix)) {
          return trimmed;
        }

        return `${prefix} ${trimmed}`;
      })
      .join('\n');
  }

  const prefixedValue = `${prefix} `;

  if (applyFirstLine) {
    inputElement.addEventListener('focus', () => {
      if (inputElement.dataset.autoPrefixSeeded === 'true') {
        return;
      }

      if (String(inputElement.value || '').trim()) {
        return;
      }

      inputElement.value = prefixedValue;
      inputElement.selectionStart = inputElement.value.length;
      inputElement.selectionEnd = inputElement.value.length;
      inputElement.dataset.autoPrefixSeeded = 'true';
    });
  }

  inputElement.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();

    const start = inputElement.selectionStart;
    const end = inputElement.selectionEnd;
    const currentValue = inputElement.value;
    const before = currentValue.slice(0, start);
    const after = currentValue.slice(end);
    const currentLineStart = before.lastIndexOf('\n') + 1;
    const currentLine = before.slice(currentLineStart);
    const shouldKeepPrefix = currentLine.trimStart().startsWith(prefix);
    const insertion = shouldKeepPrefix ? `\n${prefix} ` : '\n';

    inputElement.value = `${before}${insertion}${after}`;

    const nextCaret = start + insertion.length;
    inputElement.selectionStart = nextCaret;
    inputElement.selectionEnd = nextCaret;
  });

  inputElement.addEventListener('paste', (event) => {
    const clipboardText = event.clipboardData?.getData('text');
    if (typeof clipboardText !== 'string') {
      return;
    }

    event.preventDefault();

    const start = inputElement.selectionStart;
    const end = inputElement.selectionEnd;
    const currentValue = inputElement.value;
    const before = currentValue.slice(0, start);
    const after = currentValue.slice(end);
    const normalizedPastedText = normalizePrefixedLines(clipboardText);
    const nextValue = `${before}${normalizedPastedText}${after}`;

    inputElement.value = nextValue;

    const nextCaret = before.length + normalizedPastedText.length;
    inputElement.selectionStart = nextCaret;
    inputElement.selectionEnd = nextCaret;
  });
}

addAutoPrefixOnEnter(tourIncludesInput, '✓', true);
addAutoPrefixOnEnter(tourExcludesInput, '✕', true);
addAutoPrefixOnEnter(tourTripDetailsInput, '●', true);
addAutoPrefixOnEnter(tourNotesInput, '●', true);

let allTours = [];

const tourSearchInput = document.querySelector('#tour-search');
if (tourSearchInput) {
  let debounce;
  tourSearchInput.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const q = tourSearchInput.value.trim().toLowerCase();
      const filtered = q
        ? allTours.filter((t) =>
            (t.title || '').toLowerCase().includes(q) ||
            (t.location || '').toLowerCase().includes(q) ||
            (t.category || '').toLowerCase().includes(q)
          )
        : allTours;
      renderTourList(filtered);
    }, 200);
  });
}

function renderTourList(tours) {
  if (!tours.length) {
    tourAdminList.innerHTML = `
      <div class="col-span-full flex flex-col items-center gap-3 py-20 text-center">
        <span class="material-symbols-outlined text-5xl text-slate-300">landscape</span>
        <p class="text-base font-semibold text-slate-400">Không tìm thấy tour nào.</p>
      </div>
    `;
    return;
  }

  tourAdminList.innerHTML = tours
    .map((tour) => {
      let fixedGuestCount = Number.parseInt(tour.fixed_guest_count, 10);
      let bookedGuestCount = Number.parseInt(tour.booked_guest_count, 10);

      if (Number.isNaN(fixedGuestCount)) {
        console.warn('fixed_guest_count không hợp lệ:', tour.fixed_guest_count);
        fixedGuestCount = 12; // Giá trị mặc định
      }

      if (Number.isNaN(bookedGuestCount)) {
        console.warn('booked_guest_count không hợp lệ:', tour.booked_guest_count);
        bookedGuestCount = 0; // Giá trị mặc định
      }

      const primaryImage = getTourImageUrls(tour)[0] || '';
      const priceLabel = formatPriceVnd(tour.price || '') || 'Liên hệ';
      const normalizedDifficulty = normalizeDifficulty(tour.difficulty);

      return `
        <article class="list-card rounded-2xl border border-primary/10 bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md">
          <div class="list-card__image h-52 overflow-hidden bg-surface-container-low flex-shrink-0">
            ${primaryImage
              ? `<img class="h-full w-full object-cover" src="${primaryImage}" alt="Ảnh tour ${tour.title}" loading="lazy" />`
              : `<div class="flex h-full w-full items-center justify-center text-slate-300"><span class="material-symbols-outlined text-5xl">image</span></div>`}
          </div>
          <div class="list-card__content flex min-w-0 flex-1 flex-col gap-3 p-5">
            <div class="flex flex-wrap gap-1.5">
              <span class="rounded-full border px-2.5 py-0.5 text-xs font-bold ${categoryChipClass(tour.category)}">${getCategoryLabel(tour.category)}</span>
              ${tour.duration ? `<span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">${tour.duration}</span>` : ''}
              ${normalizedDifficulty ? `<span class="rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyChipClass(normalizedDifficulty)}">${normalizedDifficulty}</span>` : ''}
            </div>
            <div class="min-w-0">
              <h3 class="list-card__title text-base font-extrabold tracking-tight text-slate-900">${tour.title}</h3>
              ${tour.location ? `<p class="mt-1 flex items-center gap-0.5 text-xs text-slate-400"><span class="material-symbols-outlined" style="font-size:13px;vertical-align:middle">location_on</span>${tour.location}</p>` : ''}
            </div>
            <div class="mt-auto flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
              <div>
                <p class="text-base font-black text-primary">${priceLabel}</p>
              </div>
              <div class="flex gap-2">
                <button class="tour-edit-btn inline-flex items-center gap-1.5 rounded-xl border border-primary/10 bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                  data-tour-id="${tour.id}" type="button" aria-label="Sửa tour">Sửa</button>
                <button class="tour-delete-btn inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                  data-tour-id="${tour.id}" type="button" aria-label="Xóa tour">Xóa</button>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderTourStats(tours) {
  const statTourCount = document.querySelector('#stat-tour-count');
  const statTotalCapacity = document.querySelector('#stat-total-capacity');
  const statTotalBooked = document.querySelector('#stat-total-booked');

  if (!statTourCount || !statTotalCapacity || !statTotalBooked) {
    return;
  }

  const totalCapacity = tours.reduce((sum, tour) => {
    const fixedGuestCount = Number.parseInt(tour.fixed_guest_count, 10);
    return sum + (Number.isNaN(fixedGuestCount) ? 0 : fixedGuestCount);
  }, 0);

  const totalBooked = tours.reduce((sum, tour) => {
    const bookedGuestCount = Number.parseInt(tour.booked_guest_count, 10);
    return sum + (Number.isNaN(bookedGuestCount) ? 0 : bookedGuestCount);
  }, 0);

  statTourCount.textContent = String(tours.length);
  statTotalCapacity.textContent = String(totalCapacity);
  statTotalBooked.textContent = String(totalBooked);
}

async function loadTours() {
  const response = await fetch('/api/admin/tours');
  let tours = [];

  try {
    tours = await response.json();
  } catch (_error) {
    tours = [];
  }

  if (!response.ok) {
    throw new Error(tours.message || 'Không tải được danh sách tour.');
  }

  allTours = Array.isArray(tours) ? tours : [];
  renderTourStats(allTours);
  renderTourList(allTours);
}

async function deleteTour(tourId) {
  const targetTour = allTours.find((item) => item.id === Number(tourId));
  const confirmed = await confirmTourDelete(targetTour?.title || '');

  if (!confirmed) {
    return;
  }

  const response = await fetch(`/api/admin/tours/${tourId}`, { method: 'DELETE' });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Không thể xóa tour.');
  }

  showToast(result.message || 'Đã xóa tour.');
  tourStatus.textContent = result.message || 'Đã xóa tour.';
  await loadTours();
}

tourAdminList.addEventListener('click', async (event) => {
  const editButton = event.target.closest('.tour-edit-btn');
  if (editButton) {
    const tourId = Number(editButton.dataset.tourId);
    const targetTour = allTours.find((item) => item.id === tourId);
    if (targetTour) {
      fillTourForm(targetTour);
    }
    return;
  }

  const deleteButton = event.target.closest('.tour-delete-btn');
  if (!deleteButton) {
    return;
  }

  try {
    await deleteTour(deleteButton.dataset.tourId);
  } catch (error) {
    tourStatus.textContent = error.message || 'Xóa tour thất bại.';
  }
});

tourForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const tourId = document.querySelector('#tour_form_id').value;
  const isUpdate = Boolean(tourId);
  const method = tourId ? 'PUT' : 'POST';
  const url = tourId ? `/api/admin/tours/${tourId}` : '/api/admin/tours';

  try {
    if (pendingImageFiles.length > 0) {
      const uploadedUrls = await uploadPendingImages();
      uploadedImageUrls = [...uploadedImageUrls, ...uploadedUrls];
      updateImageNameInput();
      renderImagePreview();
    }

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tourFormPayload())
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Không thể lưu tour.');
    }

    if (isUpdate) {
      tourStatus.textContent = '';
    } else {
      tourStatus.textContent = result.message || 'Đã lưu tour.';
    }
    showToast(result.message || 'Đã lưu tour.');
    resetTourForm();
    if (tourEditDialog?.open) {
      tourEditDialog.close();
    }
    await loadTours();
  } catch (error) {
    tourStatus.textContent = error.message || 'Không thể lưu tour.';
  }
});

if (tourCreateButton) {
  tourCreateButton.addEventListener('click', () => {
    resetTourForm();
    tourEditDialog.showModal();
  });
}

if (tourDialogClose) {
  tourDialogClose.addEventListener('click', () => {
    if (tourEditDialog?.open) {
      tourEditDialog.close();
    }
  });
}

const tourDialogCancelButton = document.querySelector('#tour-dialog-cancel');
if (tourDialogCancelButton) {
  tourDialogCancelButton.addEventListener('click', () => {
    resetTourForm();
    if (tourEditDialog?.open) {
      tourEditDialog.close();
    }
  });
}

if (tourEditDialog) {
  tourEditDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    tourEditDialog.close();
  });
}

if (adminLogoutButton) {
  adminLogoutButton.addEventListener('click', async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/';
  });
}

loadTours().catch((error) => {
  tourStatus.textContent = error.message || 'Không tải được danh sách tour.';
  renderTourStats([]);
  renderTourList([]);
});

