function badge(label, value) {
  return `<span class="tour-badge inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-2 text-sm font-medium text-slate-700"><strong class="font-bold text-primary">${label}:</strong> ${value || 'Đang cập nhật'}</span>`;
}

const discoverTourLinks = document.querySelectorAll('[data-discover-tour-link]');
const suggestedTourLink = document.querySelector('#tour-detail-more-link');
const suggestedTourImage = document.querySelector('#tour-detail-suggested-image');
const suggestedTourTitle = document.querySelector('#tour-detail-suggested-title');
const suggestedTourDate = document.querySelector('#tour-detail-suggested-date');
const adminLoginDialog = document.querySelector('#admin-login-dialog');
const adminLoginForm = document.querySelector('#admin-login-form');
const adminLoginStatus = document.querySelector('#admin-login-status');
const adminLoginOpenButton = document.querySelector('#admin-login-open-btn');
const adminLoginCloseButton = document.querySelector('#admin-login-close-btn');

function openAdminLoginDialog() {
  if (!adminLoginDialog || !adminLoginStatus) {
    return;
  }

  adminLoginStatus.textContent = '';
  adminLoginDialog.showModal();
}

function closeAdminLoginDialog() {
  if (!adminLoginDialog) {
    return;
  }

  adminLoginDialog.close();
}

function formatDateDisplay(value) {
  if (!value) {
    return '';
  }

  const normalized = new Date(`${value}T00:00:00`);
  if (Number.isNaN(normalized.getTime())) {
    return '';
  }

  return normalized.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function updateDiscoverLinks(discoverUrl) {
  discoverTourLinks.forEach((link) => {
    link.setAttribute('href', discoverUrl);
  });
}

function updateSuggestedTourLink(suggestedTour) {
  if (!suggestedTourLink) {
    return;
  }

  suggestedTourLink.setAttribute('href', suggestedTour.href || '/#tour-list-section');

  const displayDate = formatDateDisplay(suggestedTour.scheduledDate);

  if (suggestedTourTitle) {
    suggestedTourTitle.textContent = suggestedTour.title || 'Xem tour';
  }

  if (suggestedTourDate) {
    suggestedTourDate.textContent = displayDate ? `Khởi hành ${displayDate}` : '';
  }

  if (suggestedTourImage) {
    const imageUrl = (() => {
      const rawUrls = String(suggestedTour.image_urls || '').trim();
      if (rawUrls) {
        const parsed = parseImageUrls(rawUrls);
        if (parsed.length > 0) return parsed[0];
      }
      return getFallbackTourImage(suggestedTour);
    })();
    suggestedTourImage.src = imageUrl;
    suggestedTourImage.alt = `Hình ảnh tour ${suggestedTour.title || ''}`.trim();
  }
}

async function loadDiscoverTour() {
  // Wire up click handler to navigate to a random tour each time
  discoverTourLinks.forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      const currentTourId = Number(window.location.pathname.split('/').pop()) || 0;
      try {
        const url = currentTourId
          ? `/api/discover/random-tour?excludeTourId=${currentTourId}`
          : '/api/discover/random-tour';
        const res = await fetch(url);
        if (!res.ok) return;
        const tour = await res.json();
        if (tour && tour.href) window.location.href = tour.href;
      } catch (_error) { /* ignore */ }
    });
  });
}

async function loadSuggestedTour(currentTourId) {
  if (!suggestedTourLink || !currentTourId) {
    return;
  }

  const response = await fetch(`/api/discover/suggested-tour?excludeTourId=${currentTourId}`);
  if (!response.ok) {
    return;
  }

  const suggestedTour = await response.json();
  if (suggestedTour && suggestedTour.href) {
    updateSuggestedTourLink(suggestedTour);
  }
}

if (adminLoginOpenButton) {
  adminLoginOpenButton.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/admin/session');
      if (res.ok) {
        const data = await res.json();
        if (data && data.authenticated) {
          window.location.href = '/admin/overview';
          return;
        }
      }
    } catch (_error) {
      // Fall through to show login dialog
    }
    openAdminLoginDialog();
  });
}

if (adminLoginCloseButton) {
  adminLoginCloseButton.addEventListener('click', closeAdminLoginDialog);
}

if (adminLoginDialog && adminLoginForm) {
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
}

const pageUrl = new URL(window.location.href);
if (pageUrl.searchParams.get('adminLogin') === '1' && adminLoginDialog) {
  openAdminLoginDialog();
  adminLoginStatus.textContent = 'Vui lòng đăng nhập để truy cập trang admin.';
}

function formatPriceVnd(value) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return '';
  }

  const digitsOnly = normalized.replace(/\D/g, '');
  if (!digitsOnly) {
    return '';
  }

  const amount = Number.parseInt(digitsOnly, 10);
  if (Number.isNaN(amount)) {
    return '';
  }

  return `${amount.toLocaleString('vi-VN')} VNĐ`;
}

function parseImageUrls(rawValue) {
  const raw = String(rawValue || '').trim();
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item || '').trim())
        .filter(Boolean);
    }
  } catch (_error) {
    // Keep backward compatibility with plain text values.
  }

  return raw
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getFallbackTourImage(tour) {
  const legacyImage = String(tour.image_url || '').trim();
  if (legacyImage) {
    return legacyImage;
  }

  const title = String(tour.title || '').toLowerCase();

  if (title.includes('tà xùa')) {
    return 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80';
  }

  if (title.includes('tả liên') || title.includes('ta lien')) {
    return 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80';
  }

  if (title.includes('lảo thẩn') || title.includes('lao than')) {
    return 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80';
  }

  if (title.includes('bạch mộc') || title.includes('bach moc')) {
    return 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1400&q=80';
  }

  if (normalizeCategoryKey(tour.category) === 'BIỂN') {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80';
  }

  if (normalizeCategoryKey(tour.category) === 'ROAD') {
    return 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80';
  }

  if (normalizeCategoryKey(tour.category) === 'HIKING') {
    return 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1400&q=80';
  }

  return 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1400&q=80';
}

function getTourImageUrls(tour) {
  const rawImageUrls = String(tour.image_urls || '').trim();
  const parsedImageUrls = parseImageUrls(rawImageUrls);

  if (parsedImageUrls.length > 0) {
    return parsedImageUrls;
  }

  return [getFallbackTourImage(tour)];
}

function normalizeCategoryKey(cat) {
  const v = String(cat || '').trim().toUpperCase();
  if (v === 'BIỂN') return 'BIỂN';
  if (v === 'ROAD TRIP' || v === 'ROAD') return 'ROAD';
  if (v === 'HIKING') return 'HIKING';
  if (v === 'LEO NÚI' || v === 'TREKKING') return 'TREKKING';
  return v || 'TREKKING';
}

function getCategoryLabel(cat) {
  const v = normalizeCategoryKey(cat);
  if (v === 'BIỂN') return 'Biển';
  if (v === 'ROAD') return 'Road';
  if (v === 'HIKING') return 'Hiking';
  return 'Trekking';
}

function renderTourGallery(tour) {
  const mainImageElement = document.querySelector('#tour-detail-image');
  const galleryElement = document.querySelector('#tour-detail-gallery');
  const imageUrls = getTourImageUrls(tour);
  const primaryImage = imageUrls[0] || getFallbackTourImage(tour);

  if (mainImageElement) {
    mainImageElement.src = primaryImage;
    mainImageElement.alt = `Hình ảnh mô tả tour ${tour.title || ''}`.trim();
  }

  if (!galleryElement) {
    return;
  }

  if (imageUrls.length <= 1) {
    galleryElement.innerHTML = '';
    galleryElement.hidden = true;
    galleryElement.style.display = '';
    return;
  }

  galleryElement.hidden = false;
  galleryElement.style.display = 'grid';
  galleryElement.innerHTML = imageUrls
    .map((url, index) => `
      <button
        type="button"
        class="tour-detail-thumb block overflow-hidden rounded-xl border-2 border-transparent bg-white/85 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30${index === 0 ? ' is-active' : ''}"
        data-tour-thumb-index="${index}"
        aria-label="Xem ảnh ${index + 1}"
      >
        <img class="aspect-square w-full object-cover" src="${url}" alt="Ảnh ${index + 1} của tour ${tour.title || ''}" loading="lazy" />
      </button>
    `)
    .join('');

  galleryElement.querySelectorAll('.tour-detail-thumb').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.getAttribute('data-tour-thumb-index'));
      const nextImage = imageUrls[index] || primaryImage;

      mainImageElement.src = nextImage;
      mainImageElement.alt = `Hình ảnh ${index + 1} của tour ${tour.title || ''}`.trim();

      galleryElement
        .querySelectorAll('.tour-detail-thumb')
        .forEach((item) => item.classList.remove('is-active'));
      button.classList.add('is-active');
    });
  });
}

const defaultDetailContentByTitle = {
  'Bạch Mộc Lương Tử': {
    description: 'Cung trekking nổi bật của Tây Bắc với độ cao lớn, biển mây đẹp và trải nghiệm chinh phục giàu cảm xúc.',
    best_time: 'Tháng 9 đến tháng 4',
    max_altitude: '3.046m',
    trip_details: 'Bạch Mộc Lương Tử là cung trekking giàu trải nghiệm với độ cao lớn, cảnh quan thay đổi liên tục và các điểm ngắm biển mây rất đẹp. Tour phù hợp với người có sức bền tốt và muốn chinh phục một trong những đỉnh núi nổi bật nhất Tây Bắc.',
    price: '3.790.000 VNĐ',
    itinerary_day1: 'Di chuyển đến điểm trekking, gặp porter và đội ngũ hỗ trợ, bắt đầu leo qua rừng trúc và các đoạn dốc đầu tiên để lên lán nghỉ.',
    itinerary_day2: 'Xuất phát sớm chinh phục đỉnh, ngắm bình minh và biển mây, quay lại lán, thu dọn và xuống núi.',
    includes_text: 'Xe đưa đón, porter hỗ trợ đồ chung, hướng dẫn viên, ăn uống theo lịch trình, chỗ nghỉ cơ bản trên núi.',
    excludes_text: 'Đồ cá nhân, tip porter, thuê thiết bị riêng, chi phí phát sinh ngoài chương trình.'
  },
  'Tà Xùa': {
    description: 'Chinh phục sống lưng khủng long, săn mây và ngắm bình minh trên đỉnh Tà Xùa.',
    best_time: 'Tháng 10 đến tháng 4',
    max_altitude: '2.865m',
    trip_details: 'Tour phù hợp cho người đã có thể lực cơ bản, muốn trải nghiệm săn mây và trekking cung núi đặc trưng miền Bắc với lịch trình gọn, nhịp đi chắc và điểm cắm trại đẹp.',
    price: '2.490.000 VNĐ'
  },
  'Lảo Thẩn': {
    description: 'Hành trình lý tưởng cho người mới bắt đầu trekking với cung đường đẹp và dễ tiếp cận.',
    best_time: 'Tháng 9 đến tháng 3',
    max_altitude: '2.860m',
    trip_details: 'Lảo Thẩn là lựa chọn phù hợp cho người mới làm quen trekking với quãng leo vừa phải, cảnh quan thoáng và cơ hội ngắm mây cao nếu thời tiết thuận lợi.',
    price: '2.290.000 VNĐ'
  },
  'Tả Liên': {
    description: 'Khám phá rừng nguyên sinh rêu phong, đồi thông xanh thẳm và cung trekking đầy thử thách.',
    best_time: 'Tháng 10 đến tháng 3',
    max_altitude: '2.996m',
    trip_details: 'Hành trình dành cho nhóm đã quen trekking nhiều giờ mỗi ngày, nổi bật bởi rừng già phủ rêu và địa hình thay đổi liên tục.',
    price: '3.390.000 VNĐ'
  }
};

function getDetailValue(tour, key, fallback) {
  const value = String(tour[key] || '').trim();
  if (value) {
    return value;
  }

  const defaultContent = defaultDetailContentByTitle[tour.title] || {};
  return defaultContent[key] || fallback;
}

function renderItinerary(tour) {
  const itineraryContainer = document.querySelector('#tour-detail-itinerary');
  let dynamicDays = [];

  try {
    const parsed = JSON.parse(String(tour.itinerary_days || '[]'));
    if (Array.isArray(parsed)) {
      dynamicDays = parsed.map((item, index) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          return {
            dayLabel: `NGÀY ${String(index + 1).padStart(2, '0')}`,
            title: String(item.title || '').trim(),
            value: String(item.content ?? item.value ?? '').trim()
          };
        }

        return {
          dayLabel: `NGÀY ${String(index + 1).padStart(2, '0')}`,
          title: '',
          value: String(item || '').trim()
        };
      });
    }
  } catch (_error) {
    dynamicDays = [];
  }

  const fallbackDays = [
    { dayLabel: 'NGÀY 01', title: '', value: getDetailValue(tour, 'itinerary_day1', '') },
    { dayLabel: 'NGÀY 02', title: '', value: getDetailValue(tour, 'itinerary_day2', '') },
    { dayLabel: 'NGÀY 03', title: '', value: getDetailValue(tour, 'itinerary_day3', '') }
  ];
  const resolvedDays = dynamicDays.length > 0 ? dynamicDays : fallbackDays;
  const days = resolvedDays.filter((item) => item.value);

  itineraryContainer.innerHTML = days.length
    ? days.map((item, index) => `
        <div class="relative pl-7 md:pl-10 ${index < days.length - 1 ? 'pb-7 md:pb-10' : 'pb-2'}">
          <div class="absolute -left-[8px] md:-left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-white"></div>
          <div class="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
            <span class="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-container">${item.dayLabel}</span>
            ${item.title ? `<h3 class="mb-3 mt-4 text-xl font-bold text-on-surface">${item.title}</h3>` : '<div class="mt-4"></div>'}
            <p class="whitespace-pre-line leading-relaxed text-on-surface-variant">${item.value}</p>
          </div>
        </div>
      `).join('')
    : `
        <div class="relative pb-2 pl-7 md:pl-10">
          <div class="absolute -left-[8px] md:-left-[9px] top-0 h-4 w-4 rounded-full bg-primary ring-4 ring-white"></div>
          <div class="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
            <span class="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-container">NGÀY 01</span>
            <p class="mt-4 leading-relaxed text-on-surface-variant">Đang cập nhật hành trình chi tiết.</p>
          </div>
        </div>
      `;
}

function resolveFixedGuestCount(tour) {
  const parsed = Number.parseInt(String(tour.fixed_guest_count || '').trim(), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 12;
  }

  return parsed;
}

function normalizePriceAmount(value) {
  const digitsOnly = String(value || '').replace(/\D/g, '');
  if (!digitsOnly) {
    return 0;
  }

  const amount = Number.parseInt(digitsOnly, 10);
  if (Number.isNaN(amount)) {
    return 0;
  }

  return amount;
}

function getTomorrowDateInputValue() {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function setupSidebarBookingForm(tour, unitPriceAmount) {
  const bookingLink = document.querySelector('#tour-detail-booking-link');
  const mobileBookingLink = document.querySelector('#tour-detail-mobile-link');
  const mobilePriceElement = document.querySelector('#tour-detail-mobile-price');
  const startDateInput = document.querySelector('#tour-detail-start-date');
  const decreaseButton = document.querySelector('#tour-detail-guest-decrease');
  const increaseButton = document.querySelector('#tour-detail-guest-increase');
  const guestCountElement = document.querySelector('#tour-detail-guest-count');
  const guestLabelElement = document.querySelector('#tour-detail-sidebar-guest-label');
  const unitPriceElement = document.querySelector('#tour-detail-sidebar-unit-price');
  const totalPriceElement = document.querySelector('#tour-detail-sidebar-total-price');

  if (!bookingLink) {
    return;
  }

  let guestCount = 1;

  const refresh = () => {
    if (guestCountElement) {
      guestCountElement.textContent = String(guestCount).padStart(2, '0');
    }

    if (guestLabelElement) {
      guestLabelElement.textContent = String(guestCount);
    }

    const totalAmount = unitPriceAmount > 0 ? unitPriceAmount * guestCount : 0;
    const unitPriceDisplay = unitPriceAmount > 0 ? `${unitPriceAmount.toLocaleString('vi-VN')} VNĐ` : 'Liên hệ';
    const totalPriceDisplay = totalAmount > 0 ? `${totalAmount.toLocaleString('vi-VN')} VNĐ` : unitPriceDisplay;

    if (unitPriceElement) {
      unitPriceElement.textContent = unitPriceDisplay;
    }

    if (totalPriceElement) {
      totalPriceElement.textContent = totalPriceDisplay;
    }

    if (mobilePriceElement) {
      mobilePriceElement.textContent = totalPriceDisplay;
    }

    const params = new URLSearchParams();
    params.set('tourId', String(tour.id));
    params.set('tourTitle', String(tour.title || '').trim());
    params.set('guestCount', String(guestCount));

    if (startDateInput && startDateInput.value) {
      params.set('startDate', startDateInput.value);
    }

    const nextBookingHref = `/booking?${params.toString()}`;
    bookingLink.href = nextBookingHref;

    if (mobileBookingLink) {
      mobileBookingLink.href = nextBookingHref;
    }
  };

  if (startDateInput) {
    const tomorrow = getTomorrowDateInputValue();
    startDateInput.min = tomorrow;
    startDateInput.value = tomorrow;
    startDateInput.addEventListener('change', refresh);
  }

  if (decreaseButton) {
    decreaseButton.addEventListener('click', () => {
      guestCount = Math.max(1, guestCount - 1);
      refresh();
    });
  }

  if (increaseButton) {
    increaseButton.addEventListener('click', () => {
      guestCount = Math.min(20, guestCount + 1);
      refresh();
    });
  }

  refresh();
}

async function loadTourDetail() {
  const pathParts = window.location.pathname.split('/');
  const tourId = Number(pathParts[pathParts.length - 1]);

  if (!tourId) {
    window.location.href = '/';
    return;
  }

  const response = await fetch(`/api/tours/${tourId}`);
  if (!response.ok) {
    window.location.href = '/';
    return;
  }

  const tour = await response.json();

  document.title = `GoWithSu | ${tour.title}`;
  (() => {
    const catEl = document.querySelector('#tour-detail-category');
    const v = normalizeCategoryKey(tour.category);
    const cls = v === 'BIỂN' ? 'bg-sky-100 text-sky-700'
      : v === 'ROAD' ? 'bg-amber-100 text-amber-800'
      : v === 'HIKING' ? 'bg-teal-100 text-teal-700'
      : 'bg-green-100 text-green-700';
    catEl.textContent = getCategoryLabel(v);
    catEl.className = `absolute left-4 top-4 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${cls}`;
  })();
  document.querySelector('#tour-detail-title').textContent = tour.title || 'Chi tiết tour';
  document.querySelector('#tour-detail-summary').textContent = getDetailValue(tour, 'description', 'Đang cập nhật mô tả tour.');
  renderTourGallery(tour);
  document.querySelector('#tour-detail-booking-link').href = `/booking?tourId=${tour.id}`;

  (() => {
    const diffEl = document.querySelector('#tour-detail-difficulty');
    const v = String(tour.difficulty || '').toLowerCase();
    const label = (v.includes('trung') || v === 'trung b?nh') ? 'TB' : (tour.difficulty || 'Đang cập nhật');
    const cls = v === 'dễ' ? 'text-green-600' : (v.includes('trung') || v === 'trung b?nh') ? 'text-orange-500' : v === 'khó' ? 'text-red-600' : 'text-on-surface';
    diffEl.textContent = label;
    diffEl.className = `truncate text-sm font-bold ${cls}`;
  })();
  document.querySelector('#tour-detail-location') && (document.querySelector('#tour-detail-location').textContent = tour.location || 'Đang cập nhật');
  document.querySelector('#tour-detail-duration').textContent = tour.duration || 'Đang cập nhật';
  document.querySelector('#tour-detail-best-time').textContent = getDetailValue(tour, 'best_time', 'Đang cập nhật');
  document.querySelector('#tour-detail-max-altitude').textContent = getDetailValue(tour, 'max_altitude', 'Đang cập nhật');
  const fixedGuestCount = resolveFixedGuestCount(tour);
  document.querySelector('#tour-detail-fixed-guests').textContent = `${fixedGuestCount} khách`;
  const resolvedPrice = getDetailValue(tour, 'price', '');
  const priceDisplay = formatPriceVnd(resolvedPrice) || 'Liên hệ';
  document.querySelector('#tour-detail-price').textContent = priceDisplay;
  document.querySelector('#tour-detail-price-note').textContent = `Giá áp dụng cho đoàn đủ ${fixedGuestCount} khách. Có thể thay đổi tùy theo số lượng khách thực tế.`;
  document.querySelector('#tour-detail-trip-details').textContent = getDetailValue(
    tour,
    'trip_details',
    tour.description || 'Đang cập nhật chi tiết chuyến đi.'
  );
  setupSidebarBookingForm(tour, normalizePriceAmount(resolvedPrice));
  renderItinerary(tour);
  document.querySelector('#tour-detail-includes').textContent = getDetailValue(tour, 'includes_text', 'Đang cập nhật.');
  document.querySelector('#tour-detail-excludes').textContent = getDetailValue(tour, 'excludes_text', 'Đang cập nhật.');

  const notesValue = getDetailValue(tour, 'notes_text', 'Đang cập nhật.');
  const quoteValue = getDetailValue(tour, 'quote_text', 'Đang cập nhật.');
  const notesElement = document.querySelector('#tour-detail-notes');
  const quoteElement = document.querySelector('#tour-detail-quote');

  if (notesElement) {
    notesElement.textContent = notesValue;
  }

  if (quoteElement) {
    quoteElement.textContent = quoteValue;
  }

  await loadSuggestedTour(tour.id);
}

loadTourDetail().catch(() => {
  window.location.href = '/';
});

loadDiscoverTour().catch(() => {});
