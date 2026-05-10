const tourList = document.querySelector('#tour-list');
const adminLoginDialog = document.querySelector('#admin-login-dialog');
const adminLoginForm = document.querySelector('#admin-login-form');
const adminLoginStatus = document.querySelector('#admin-login-status');
const adminLoginOpenButton = document.querySelector('#admin-login-open-btn');
const adminLoginCloseButton = document.querySelector('#admin-login-close-btn');
const discoverTourLinks = document.querySelectorAll('[data-discover-tour-link]');
const HERO_SLIDES_FALLBACK = [
  {
    src: '/images/hero/IMG_0226.png',
    alt: 'Khung cảnh núi cao hùng vĩ'
  },
  {
    src: '/images/hero/hero1.jpg',
    alt: 'Khoảnh khắc trekking nổi bật'
  }
];

function openAdminLoginDialog() {
  adminLoginStatus.textContent = '';
  adminLoginDialog.showModal();
}

function closeAdminLoginDialog() {
  adminLoginDialog.close();
}

function updateDiscoverLinks(discoverUrl) {
  discoverTourLinks.forEach((link) => {
    link.setAttribute('href', discoverUrl);
  });
}

function formatBadge(label, value) {
  if (label === 'Độ khó' && String(value || '').trim().toLowerCase() === 'trung bình') {
    return 'TB';
  }

  return value || 'Đang cập nhật';
}

function difficultyChip(d) {
  const v = String(d || '').toLowerCase();
  const label = (v.includes('trung') || v === 'trung b?nh') ? 'TB' : (d || 'Đang cập nhật');
  const cls = v === 'dễ' ? 'bg-green-100 text-green-700'
    : (v.includes('trung') || v === 'trung b?nh') ? 'bg-orange-100 text-orange-700'
    : v === 'khó' ? 'bg-red-100 text-red-700'
    : 'bg-slate-100 text-slate-600';
  return `<span class="rounded-full px-2 py-0.5 text-xs font-bold ${cls}">${label}</span>`;
}

function categoryChipClass(cat) {
  const v = normalizeCategoryKey(cat);
  if (v === 'BIỂN') return 'bg-sky-100 text-sky-700';
  if (v === 'ROAD') return 'bg-amber-100 text-amber-800';
  if (v === 'HIKING') return 'bg-teal-100 text-teal-700';
  return 'bg-green-100 text-green-700';
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

function getFirstImageUrl(tour) {
  const rawImageUrls = String(tour.image_urls || '').trim();

  if (rawImageUrls) {
    try {
      const parsed = JSON.parse(rawImageUrls);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return String(parsed[0] || '').trim();
      }
    } catch (_error) {
      const fallbackList = rawImageUrls
        .split(/\r?\n|,/) 
        .map((item) => item.trim())
        .filter(Boolean);

      if (fallbackList.length > 0) {
        return fallbackList[0];
      }
    }
  }

  return String(tour.image_url || '').trim();
}

function getTourImage(tour) {
  const primaryImage = getFirstImageUrl(tour);
  if (primaryImage) {
    return primaryImage;
  }

  const title = String(tour.title || '').toLowerCase();

  if (title.includes('tà xùa')) {
    return 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80';
  }

  if (title.includes('tả liên') || title.includes('ta lien')) {
    return 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';
  }

  if (title.includes('lảo thẩn') || title.includes('lao than')) {
    return 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80';
  }

  if (title.includes('bạch mộc') || title.includes('bach moc')) {
    return 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1200&q=80';
  }

  if (normalizeCategoryKey(tour.category) === 'BIỂN') {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';
  }

  if (normalizeCategoryKey(tour.category) === 'ROAD') {
    return 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80';
  }

  if (normalizeCategoryKey(tour.category) === 'HIKING') {
    return 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80';
  }

  return 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80';
}

async function loadHeroSlides() {
  try {
    const response = await fetch('/api/hero-images');
    if (!response.ok) {
      return HERO_SLIDES_FALLBACK;
    }

    const slides = await response.json();
    if (!Array.isArray(slides) || !slides.length) {
      return HERO_SLIDES_FALLBACK;
    }

    return slides
      .map((slide) => ({
        src: String(slide.src || '').trim(),
        alt: String(slide.alt || 'Hình ảnh nổi bật GoWithSu').trim()
      }))
      .filter((slide) => slide.src);
  } catch (_error) {
    return HERO_SLIDES_FALLBACK;
  }
}

async function initHeroSlider() {
  const slider = document.querySelector('#hero-slider');
  if (!slider) {
    return;
  }

  const dotContainer = document.querySelector('#hero-slider-dots');
  const slides = Array.from(slider.querySelectorAll('.hero-slide'));

  if (!slides.length) {
    return;
  }

  const uniqueSources = (await loadHeroSlides())
    .map((slide) => ({
      src: String(slide.src || '').trim(),
      alt: String(slide.alt || 'Hình ảnh nổi bật GoWithSu').trim()
    }))
    .filter((slide) => slide.src);

  if (!uniqueSources.length) {
    return;
  }

  while (slides.length < uniqueSources.length) {
    const clone = slides[0].cloneNode(true);
    clone.classList.remove('opacity-100');
    clone.classList.add('opacity-0');
    slider.appendChild(clone);
    slides.push(clone);
  }

  slides.forEach((slide, index) => {
    const heroSlide = uniqueSources[index];
    if (!heroSlide) {
      slide.remove();
      return;
    }

    slide.src = heroSlide.src;
    slide.alt = heroSlide.alt;
  });

  const activeSlides = Array.from(slider.querySelectorAll('.hero-slide'));
  if (dotContainer) {
    dotContainer.innerHTML = uniqueSources
      .map((_, index) => `
        <button
          type="button"
          class="hero-slider-dot h-2.5 rounded-full bg-white/45 transition-all duration-300 ${index === 0 ? 'w-8 bg-white' : 'w-2.5'}"
          aria-label="Chuyển đến ảnh hero ${index + 1}"
          data-slide-index="${index}"></button>`)
      .join('');
  }

  if (uniqueSources.length === 1) {
    return;
  }

  let activeIndex = 0;
  let intervalId = null;

  function renderSlide(nextIndex) {
    activeIndex = nextIndex;
    activeSlides.forEach((slide, index) => {
      slide.classList.toggle('opacity-100', index === nextIndex);
      slide.classList.toggle('opacity-0', index !== nextIndex);
    });

    if (!dotContainer) {
      return;
    }

    dotContainer.querySelectorAll('.hero-slider-dot').forEach((dot, index) => {
      dot.classList.toggle('w-8', index === nextIndex);
      dot.classList.toggle('w-2.5', index !== nextIndex);
      dot.classList.toggle('bg-white', index === nextIndex);
      dot.classList.toggle('bg-white/45', index !== nextIndex);
    });
  }

  function restartInterval() {
    if (intervalId) {
      window.clearInterval(intervalId);
    }

    intervalId = window.setInterval(() => {
      renderSlide((activeIndex + 1) % uniqueSources.length);
    }, 4500);
  }

  dotContainer?.querySelectorAll('.hero-slider-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      const nextIndex = Number(dot.dataset.slideIndex || 0);
      renderSlide(nextIndex);
      restartInterval();
    });
  });

  slider.addEventListener('mouseenter', () => {
    if (intervalId) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  });

  slider.addEventListener('mouseleave', restartInterval);

  renderSlide(0);
  restartInterval();
}

function renderTours(tours) {
  tourList.innerHTML = tours
    .map(
      (tour) => {
        const nextDateBadge = tour.next_date
          ? (() => {
              const d = new Date(tour.next_date + 'T00:00:00');
              const label = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
              return `<div class="absolute bottom-3 left-3 md:bottom-4 md:left-4"><span class="inline-flex items-center gap-1 bg-primary text-on-primary text-[9px] md:text-[10px] font-black px-2.5 md:px-3 py-1 md:py-1.5 rounded-full shadow-lg"><span class="material-symbols-outlined text-xs md:text-sm" style="font-variation-settings:'FILL' 1">event</span>Khởi hành ${label}</span></div>`;
            })()
          : '';
        return `
        <article class="tour-card tour-card--clickable group flex h-full w-full max-w-[360px] mx-auto md:max-w-none min-h-[350px] md:min-h-[660px] flex-col bg-surface-container-lowest rounded-xl overflow-hidden transition-all duration-500 hover:translate-y-[-8px] hover:shadow-[0_20px_50px_-20px_rgba(20,54,0,0.15)]" data-tour-url="/tour/${tour.id}" tabindex="0" role="link" aria-label="Xem chi tiết tour ${tour.title}">
          <div class="tour-card__media relative h-32 md:h-64 overflow-hidden">
            <img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="${getTourImage(tour)}" alt="Hình ảnh mô tả tour ${tour.title}" loading="lazy" />
            <div class="absolute top-4 right-4">
              <span class="tour-card__category-chip ${categoryChipClass(tour.category)} px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider shadow-lg">${getCategoryLabel(tour.category)}</span>
            </div>
            ${nextDateBadge}
          </div>
          <div class="flex flex-1 flex-col p-3 md:p-8">
            <div class="flex min-h-5 items-center gap-1.5 md:gap-2 mb-1.5 md:mb-3">
              <span class="material-symbols-outlined text-primary text-sm">location_on</span>
              <span class="text-secondary text-xs font-bold uppercase tracking-widest">${tour.location || 'Việt Nam'}</span>
            </div>
            <h3 class="mb-2 md:mb-3 min-h-[44px] md:min-h-[64px] text-base md:text-2xl font-bold text-primary" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;"><a class="tour-title-link no-underline" href="/tour/${tour.id}">${tour.title}</a></h3>
            <p class="mb-3 md:mb-6 text-sm leading-6 text-slate-600 line-clamp-2">${tour.description || '-'}</p>
            <div class="mb-3 flex items-center gap-1.5 md:hidden">
              <div>${difficultyChip(tour.difficulty)}</div>
              <span class="rounded-full bg-surface-container-low px-2 py-1 text-[10px] font-bold text-secondary">${formatBadge('Thời lượng', tour.duration)}</span>
            </div>
            <div class="mb-6 hidden md:flex min-h-[76px] justify-between items-center rounded-lg bg-surface-container-low px-4 py-4">
              <div class="text-center">
                <div class="text-[10px] text-secondary font-bold uppercase mb-1">Độ khó</div>
                <div>${difficultyChip(tour.difficulty)}</div>
              </div>
              <div class="w-[1px] h-8 bg-outline-variant/30"></div>
              <div class="text-center">
                <div class="text-[10px] text-secondary font-bold uppercase mb-1">Thời gian</div>
                <div class="text-primary font-black">${formatBadge('Thời lượng', tour.duration)}</div>
              </div>
              <div class="w-[1px] h-8 bg-outline-variant/30"></div>
              <div class="text-center">
                <div class="text-[10px] text-secondary font-bold uppercase mb-1">Độ cao</div>
                <div class="text-primary font-black">${tour.max_altitude || '-'}</div>
              </div>
            </div>
            <div class="mt-auto flex min-h-[44px] md:min-h-[56px] items-end justify-between">
              <div>
                <span class="text-secondary text-xs block mb-1">Giá từ</span>
                <span class="text-base md:text-xl font-black text-primary">${tour.price || 'Liên hệ'}</span>
              </div>
              <a href="/tour/${tour.id}" class="p-2 md:p-3 bg-primary text-on-primary rounded-lg transition-transform active:scale-90" aria-label="Xem chi tiết tour ${tour.title}">
                <span class="material-symbols-outlined">chevron_right</span>
              </a>
            </div>
          </div>
        </article>
      `;
      }
    )
    .join('');

  tourList.querySelectorAll('.tour-card--clickable').forEach((card) => {
    card.addEventListener('click', (event) => {
      const interactiveElement = event.target.closest('a, button');
      if (interactiveElement) {
        return;
      }

      window.location.href = card.dataset.tourUrl;
    });

    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      event.preventDefault();
      window.location.href = card.dataset.tourUrl;
    });
  });
}

async function loadUpcomingSchedule() {
  const container = document.querySelector('#upcoming-schedule');
  if (!container) return;

  const res = await fetch('/api/tours/upcoming-schedule');
  if (!res.ok) {
    container.innerHTML = '<div class="py-10 text-center text-slate-500 text-sm">Không có lịch nào.</div>';
    return;
  }

  const rows = await res.json();
  if (!rows.length) {
    container.innerHTML = '<div class="py-10 text-center text-slate-500 text-sm">Chưa có lịch khởi hành nào trong 2 tháng tới.</div>';
    return;
  }

  // Group by month
  const byMonth = {};
  rows.forEach((row) => {
    const d = new Date(row.start_date + 'T00:00:00');
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    if (!byMonth[key]) byMonth[key] = { label, rows: [] };
    byMonth[key].rows.push(row);
  });

  const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const months = Object.values(byMonth);
  container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-${Math.min(months.length, 3)} gap-6">
    ${months.map((month) => `
      <div class="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10">
        <!-- Month header -->
        <div class="bg-primary-fixed/15 px-5 py-4 border-b border-white/10">
          <span class="text-primary-fixed font-black text-sm uppercase tracking-widest">${month.label}</span>
          <span class="ml-2 text-xs text-slate-400">• ${month.rows.length} chuyến</span>
        </div>
        <!-- Rows -->
        <div class="divide-y divide-white/5">
          ${month.rows.map((row) => {
            const d = new Date(row.start_date + 'T00:00:00');
            const day = String(d.getDate()).padStart(2, '0');
            const weekday = WEEKDAYS[d.getDay()];
            const guestCount = Number(row.total_guests);
            const spotsLabel = guestCount === 0 ? 'Chưa có ai' : `${guestCount} người`;
            return `
            <a href="/tour/${row.tour_id}" class="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors group">
              <!-- Day badge -->
              <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-primary flex flex-col items-center justify-center shadow-lg shadow-primary/30">
                <span class="text-lg font-black text-on-primary leading-none">${day}</span>
                <span class="text-[9px] font-bold text-on-primary/70 uppercase tracking-wider">${weekday}</span>
              </div>
              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-white font-semibold text-sm truncate group-hover:text-primary-fixed transition-colors">${row.tour_title}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="material-symbols-outlined text-slate-500" style="font-size:12px;font-variation-settings:'FILL' 1">group</span>
                  <span class="text-xs text-slate-400">${spotsLabel}</span>
                </div>
              </div>
              <!-- Arrow -->
              <span class="material-symbols-outlined text-slate-600 group-hover:text-primary-fixed group-hover:translate-x-0.5 transition-all">chevron_right</span>
            </a>`;
          }).join('')}
        </div>
      </div>
    `).join('')}
  </div>`;
}

async function loadTours() {
  // Show 3 tours with upcoming schedules; fallback to first 3 if none
  let tours = [];
  try {
    const res = await fetch('/api/tours/featured-upcoming');
    if (res.ok) tours = await res.json();
  } catch (_e) { /* ignore */ }

  if (!tours.length) {
    const res = await fetch('/api/tours');
    const all = await res.json();
    tours = all.slice(0, 3);
  }

  renderTours(tours);
  initHeroSlider().catch(() => {});
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

async function navigateToRandomTour(excludeTourId = 0) {
  try {
    const url = excludeTourId
      ? `/api/discover/random-tour?excludeTourId=${excludeTourId}`
      : '/api/discover/random-tour';
    const response = await fetch(url);
    if (!response.ok) return;
    const tour = await response.json();
    if (tour && tour.href) {
      window.location.href = tour.href;
    }
  } catch (_error) {
    // ignore
  }
}

discoverTourLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const currentTourId = Number(window.location.pathname.split('/').pop()) || 0;
    navigateToRandomTour(currentTourId);
  });
});

if (adminLoginOpenButton && adminLoginDialog && adminLoginStatus) {
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

if (adminLoginCloseButton && adminLoginDialog) {
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
}

if (adminLoginForm) {
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
if (pageUrl.searchParams.get('adminLogin') === '1') {
  if (adminLoginDialog && adminLoginStatus) {
    openAdminLoginDialog();
    adminLoginStatus.textContent = 'Vui lòng đăng nhập để truy cập trang admin.';
  }
}

loadTours().catch(() => {
  tourList.innerHTML = '<p class="empty-state">Không tải được danh sách tour.</p>';
  initHeroSlider().catch(() => {});
});

loadDiscoverTour().catch(() => {});
loadUpcomingSchedule().catch(() => {});

// ---- Homepage navbar search ----
(function () {
  const searchInput = document.querySelector('#nav-search-input');
  const dropdown = document.querySelector('#nav-search-dropdown');
  const resultsEl = document.querySelector('#nav-search-results');
  const wrapper = document.querySelector('#nav-search-wrapper');
  if (!searchInput || !dropdown || !resultsEl) return;

  let cache = null;
  let timer = null;

  async function loadCache() {
    if (cache) return cache;
    const res = await fetch('/api/tours');
    cache = res.ok ? await res.json() : [];
    return cache;
  }

  function getImg(tour) {
    const raw = String(tour.image_urls || '').trim();
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr[0]) return String(arr[0]).trim();
      } catch (_) {
        const first = raw.split(/\r?\n|,/).map(s => s.trim()).find(Boolean);
        if (first) return first;
      }
    }
    return String(tour.image_url || '').trim() ||
      'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=80&q=60';
  }

  function fmtPrice(p) {
    const n = Number(String(p || '').replace(/\D/g, ''));
    return n ? n.toLocaleString('vi-VN') + '₫' : 'Liên hệ';
  }

  function show(html) {
    resultsEl.innerHTML = html;
    dropdown.style.display = 'block';
  }
  function hide() { dropdown.style.display = 'none'; }

  async function doSearch(q) {
    const tours = await loadCache();
    const ql = q.toLowerCase();
    const matched = tours.filter(t =>
      String(t.title || '').toLowerCase().includes(ql) ||
      String(t.location || '').toLowerCase().includes(ql) ||
      String(t.category || '').toLowerCase().includes(ql)
    );
    if (!matched.length) {
      show('<p class="px-4 py-3 text-sm text-slate-400">Không tìm thấy tour phù hợp.</p>');
      return;
    }
    show(matched.slice(0, 8).map(t => `
      <a href="/tour/${t.id}" class="flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-surface-container transition-colors group">
        <img src="${getImg(t)}" alt="${t.title}" class="h-12 w-16 rounded-lg object-cover flex-shrink-0" />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-on-surface truncate group-hover:text-primary">${t.title}</p>
          <p class="text-xs text-slate-400 mt-0.5">${[t.category, t.location].filter(Boolean).join(' · ')}</p>
        </div>
        <span class="text-xs font-bold text-primary flex-shrink-0 whitespace-nowrap">${fmtPrice(t.price)}</span>
      </a>`).join(''));
  }

  searchInput.addEventListener('focus', () => loadCache());
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();
    clearTimeout(timer);
    if (!q) { hide(); return; }
    timer = setTimeout(() => doSearch(q), 180);
  });
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') { hide(); searchInput.blur(); }
    if (e.key === 'Enter') {
      const first = resultsEl.querySelector('a');
      if (first) window.location.href = first.getAttribute('href');
    }
  });
  document.addEventListener('click', e => {
    if (wrapper && !wrapper.contains(e.target)) hide();
  });
})();
