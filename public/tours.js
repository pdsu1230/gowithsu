const tourList = document.querySelector('#tour-list');
const filterBar = document.querySelector('#filter-bar');
const mobileFilterBar = document.querySelector('#mobile-filter-bar');
const toursEmpty = document.querySelector('#tours-empty');
const adminLoginDialog = document.querySelector('#admin-login-dialog');
const adminLoginForm = document.querySelector('#admin-login-form');
const adminLoginStatus = document.querySelector('#admin-login-status');
const adminLoginOpenButton = document.querySelector('#admin-login-open-btn');
const discoverTourLinks = document.querySelectorAll('[data-discover-tour-link]');

let allTours = [];
let activeFilter = 'all';

function syncFilterButtons() {
  document.querySelectorAll('[data-filter]').forEach((button) => {
    const isActive = button.dataset.filter === activeFilter;

    if (button.classList.contains('mobile-filter-btn')) {
      const icon = button.querySelector('.mobile-filter-icon');
      const label = button.querySelector('.mobile-filter-label');

      button.classList.toggle('text-primary', isActive);
      button.classList.toggle('text-slate-500', !isActive);
      button.classList.toggle('scale-[0.98]', isActive);

      if (icon) {
        icon.classList.toggle('bg-primary', isActive);
        icon.classList.toggle('text-white', isActive);
        icon.classList.toggle('shadow-lg', isActive);
        icon.classList.toggle('shadow-primary/20', isActive);
        icon.classList.toggle('bg-slate-100', !isActive);
        icon.classList.toggle('text-slate-500', !isActive);
      }

      if (label) {
        label.classList.toggle('font-bold', isActive);
      }

      return;
    }

    button.classList.toggle('active', isActive);
    button.classList.toggle('bg-primary', isActive);
    button.classList.toggle('text-on-primary', isActive);
    button.classList.toggle('text-primary', !isActive);
    button.classList.toggle('bg-transparent', !isActive);
  });
}

function applyActiveFilter() {
  const filteredTours = activeFilter === 'all'
    ? allTours
    : allTours.filter((tour) => normalizeCategoryKey(tour.category) === activeFilter);

  syncFilterButtons();
  renderTours(filteredTours);
}

function bindFilterBar(rootElement) {
  if (!rootElement) {
    return;
  }

  const shouldScrollToTopOnFilter = rootElement === mobileFilterBar;

  rootElement.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-filter]');
    if (!btn) return;

    activeFilter = btn.dataset.filter;
    applyActiveFilter();

     if (shouldScrollToTopOnFilter) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

function resolveInitialFilter(tours) {
  const params = new URLSearchParams(window.location.search);
  const rawFilter = String(params.get('category') || params.get('filter') || 'all').trim();

  if (!rawFilter || rawFilter.toLowerCase() === 'all') {
    return 'all';
  }

  const normalizedFilter = normalizeCategoryKey(rawFilter);
  const availableFilters = new Set(tours.map((tour) => normalizeCategoryKey(tour.category)).filter(Boolean));
  return availableFilters.has(normalizedFilter) ? normalizedFilter : 'all';
}

// --- Helpers (shared with script.js) ---

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
      if (Array.isArray(parsed) && parsed.length > 0) return String(parsed[0] || '').trim();
    } catch (_e) {
      const list = rawImageUrls.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean);
      if (list.length > 0) return list[0];
    }
  }
  return String(tour.image_url || '').trim();
}

function getTourImage(tour) {
  const primary = getFirstImageUrl(tour);
  if (primary) return primary;
  const title = String(tour.title || '').toLowerCase();
  if (title.includes('tà xùa')) return 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80';
  if (title.includes('tả liên') || title.includes('ta lien')) return 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';
  if (title.includes('lảo thẩn') || title.includes('lao than')) return 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80';
  if (title.includes('bạch mộc') || title.includes('bach moc')) return 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1200&q=80';
  if (normalizeCategoryKey(tour.category) === 'BIỂN') return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';
  if (normalizeCategoryKey(tour.category) === 'ROAD') return 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80';
  if (normalizeCategoryKey(tour.category) === 'HIKING') return 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80';
  return 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80';
}

// --- Render ---

function renderTours(tours) {
  if (!tourList) return;

  if (tours.length === 0) {
    tourList.innerHTML = '';
    toursEmpty && toursEmpty.classList.remove('hidden');
    return;
  }

  toursEmpty && toursEmpty.classList.add('hidden');
  tourList.innerHTML = tours
    .map(
      (tour) => `
        <article class="tour-card group flex h-full w-full max-w-[360px] mx-auto md:max-w-none min-h-[322px] md:min-h-[660px] flex-col bg-surface-container-lowest rounded-[26px] overflow-hidden border border-slate-200/70 transition-all duration-500 hover:translate-y-[-8px] hover:shadow-[0_20px_50px_-20px_rgba(20,54,0,0.15)] cursor-pointer" data-tour-url="/tour/${tour.id}" tabindex="0" role="link" aria-label="Xem chi tiết tour ${tour.title}">
          <div class="relative h-36 md:h-64 overflow-hidden">
            <img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="${getTourImage(tour)}" alt="Hình ảnh mô tả tour ${tour.title}" loading="lazy" />
            <div class="absolute top-4 right-4">
              <span class="${categoryChipClass(tour.category)} px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider shadow-lg">${getCategoryLabel(tour.category)}</span>
            </div>
          </div>
          <div class="flex flex-1 flex-col p-4 md:p-8">
            <div class="mb-2 flex min-h-5 items-center gap-1.5 md:mb-3 md:gap-2">
              <span class="material-symbols-outlined text-primary text-sm">location_on</span>
              <span class="text-secondary text-xs font-bold uppercase tracking-widest">${tour.location || 'Việt Nam'}</span>
            </div>
            <h3 class="mb-2 min-h-[44px] text-[1.55rem] leading-8 md:mb-3 md:min-h-[64px] md:text-2xl font-bold text-primary" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;"><a class="no-underline" href="/tour/${tour.id}">${tour.title}</a></h3>
            <p class="tour-card-description mb-4 text-[15px] leading-7 text-slate-600 md:mb-6 md:min-h-[52px] md:text-sm md:leading-6">${tour.description || '-'}</p>
            <div class="mb-4 flex items-center gap-1.5 md:hidden">
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
            <div class="mt-auto flex min-h-[48px] items-end justify-between md:min-h-[56px]">
              <div>
                <span class="text-secondary text-xs block mb-1">Giá từ</span>
                <span class="text-[1.12rem] font-black text-primary md:text-xl">${tour.price || 'Liên hệ'}</span>
              </div>
              <a href="/tour/${tour.id}" class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-on-primary transition-transform active:scale-90 md:h-auto md:w-auto md:rounded-lg md:p-3" aria-label="Xem chi tiết tour ${tour.title}">
                <span class="material-symbols-outlined">chevron_right</span>
              </a>
            </div>
          </div>
        </article>
      `
    )
    .join('');

  tourList.querySelectorAll('.tour-card').forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) return;
      window.location.href = card.dataset.tourUrl;
    });
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      window.location.href = card.dataset.tourUrl;
    });
  });
}

// --- Filters ---

function buildFilters(tours) {
  if (!filterBar) return;
  const desiredOrder = ['TREKKING', 'HIKING', 'BIỂN', 'ROAD'];
  const existing = new Set(tours.map((t) => normalizeCategoryKey(t.category)).filter(Boolean));
  const categories = desiredOrder.filter((cat) => existing.has(cat) || cat === 'HIKING');

  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn rounded-full border-2 border-primary px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-on-primary';
    btn.dataset.filter = cat;
    btn.textContent = getCategoryLabel(cat);
    filterBar.appendChild(btn);
  });
}

// --- Random discover ---

async function navigateToRandomTour() {
  try {
    const res = await fetch('/api/discover/random-tour');
    if (!res.ok) return;
    const tour = await res.json();
    if (tour && tour.href) window.location.href = tour.href;
  } catch (_e) { /* ignore */ }
}

discoverTourLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    navigateToRandomTour();
  });
});

// --- Admin auth ---

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
    } catch (_e) { /* fall through */ }
    adminLoginStatus && (adminLoginStatus.textContent = '');
    adminLoginDialog && adminLoginDialog.showModal();
  });
}

if (adminLoginDialog && adminLoginForm) {
  adminLoginDialog.addEventListener('click', (event) => {
    const formBounds = adminLoginForm.getBoundingClientRect();
    const inside =
      event.clientX >= formBounds.left && event.clientX <= formBounds.right &&
      event.clientY >= formBounds.top && event.clientY <= formBounds.bottom;
    if (!inside) adminLoginDialog.close();
  });

  adminLoginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    adminLoginStatus.textContent = 'Đang đăng nhập...';
    const usernameInput = document.querySelector('#admin-username') || document.querySelector('#admin_username');
    const passwordInput = document.querySelector('#admin-password') || document.querySelector('#admin_password');
    const payload = {
      username: String(usernameInput?.value || '').trim(),
      password: String(passwordInput?.value || '').trim()
    };
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

// --- Init ---

async function init() {
  const response = await fetch('/api/tours');
  allTours = await response.json();
  activeFilter = resolveInitialFilter(allTours);
  buildFilters(allTours);
  bindFilterBar(filterBar);
  bindFilterBar(mobileFilterBar);
  applyActiveFilter();
}

init().catch(() => {});
