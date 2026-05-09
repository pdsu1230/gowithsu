/**
 * Shared nav search.
 * Desktop: dropdown search in navbar.
 * Mobile: full-screen overlay search opened by search icon.
 */
(function () {
  const desktopInput = document.querySelector('#nav-search-input');
  const desktopResults = document.querySelector('#nav-search-results');
  const dropdown = document.querySelector('#nav-search-dropdown');
  const clearBtn = document.querySelector('#nav-search-clear');

  const mobileSearchBtn = document.querySelector('[data-mobile-search-open]');
  const mobileOverlay = document.querySelector('#nav-search-mobile-overlay');
  const mobileInput = document.querySelector('#nav-search-mobile-input');
  const mobileResults = document.querySelector('#nav-search-mobile-results');
  const mobileCloseBtn = document.querySelector('[data-mobile-search-close]');

  if (!desktopInput && !mobileInput) return;

  let toursCache = null;
  let desktopDebounceTimer = null;
  let mobileDebounceTimer = null;

  // --- Helpers ---

  function getFirstImageUrl(tour) {
    const raw = String(tour.image_urls || '').trim();
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return String(parsed[0] || '').trim();
      } catch (_e) {
        const list = raw.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean);
        if (list.length > 0) return list[0];
      }
    }
    return String(tour.image_url || '').trim();
  }

  function getTourImage(tour) {
    const img = getFirstImageUrl(tour);
    return img || 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=80&q=60';
  }

  function formatPrice(price) {
    const n = Number(String(price || '').replace(/\D/g, ''));
    if (!n) return 'Liên hệ';
    return n.toLocaleString('vi-VN') + '₫';
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

  // --- Fetch tours (cached) ---

  async function fetchTours() {
    if (toursCache) return toursCache;
    const res = await fetch('/api/tours');
    if (!res.ok) return [];
    toursCache = await res.json();
    return toursCache;
  }

  // --- Render results ---

  function buildResultMarkup(tours, query) {
    if (!query.trim()) return '';

    const q = query.toLowerCase();
    const matched = tours.filter((t) =>
      String(t.title || '').toLowerCase().includes(q) ||
      String(t.location || '').toLowerCase().includes(q) ||
      String(t.category || '').toLowerCase().includes(q) ||
      String(t.description || '').toLowerCase().includes(q)
    );

    if (matched.length === 0) {
      return '<p class="text-sm text-slate-400 px-3 py-3">Không tìm thấy tour phù hợp.</p>';
    }

    let html = matched
      .slice(0, 8)
      .map(
        (tour) => `
        <a href="/tour/${tour.id}" class="flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-surface-container transition-colors group">
          <img src="${getTourImage(tour)}" alt="${tour.title}" class="h-12 w-16 rounded-lg object-cover flex-shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-on-surface truncate group-hover:text-primary transition-colors">${tour.title}</p>
            <p class="text-xs text-slate-400 mt-0.5">${[getCategoryLabel(tour.category), tour.location].filter(Boolean).join(' · ')}</p>
          </div>
          <span class="text-xs font-bold text-primary flex-shrink-0">${formatPrice(tour.price)}</span>
        </a>`
      )
      .join('');

    if (matched.length > 8) {
      html += `<a href="/tours?q=${encodeURIComponent(query)}" class="block text-center text-xs font-semibold text-primary py-2 hover:underline">Xem tất cả ${matched.length} kết quả →</a>`;
    }

    return html;
  }

  function renderDesktopResults(tours, query) {
    if (!desktopResults) return;

    if (!query.trim()) {
      desktopResults.innerHTML = '';
      closeDropdown();
      return;
    }

    desktopResults.innerHTML = buildResultMarkup(tours, query);
    openDropdown();
  }

  function renderMobileResults(tours, query) {
    if (!mobileResults) return;

    if (!query.trim()) {
      mobileResults.innerHTML = `
        <div class="mobile-search-empty">
          <div class="mobile-search-empty-icon">
            <span class="material-symbols-outlined text-xl">travel_explore</span>
          </div>
          <div>
            <p class="mobile-search-empty-title">Tìm tour theo cách nhanh hơn</p>
            <p class="mobile-search-empty-copy">Nhập tên tour, địa điểm hoặc loại hành trình để xem kết quả ngay lập tức.</p>
          </div>
          <div class="mobile-search-empty-tags">
            <span class="mobile-search-empty-tag">Tà Xùa</span>
            <span class="mobile-search-empty-tag">Bạch Mộc</span>
            <span class="mobile-search-empty-tag">Biển</span>
            <span class="mobile-search-empty-tag">Road</span>
            <span class="mobile-search-empty-tag">Hiking</span>
          </div>
        </div>`;
      return;
    }

    mobileResults.innerHTML = buildResultMarkup(tours, query);
  }

  // =====================
  // DROPDOWN MODE
  // =====================
  function openDropdown() {
    if (!dropdown) return;
    dropdown.style.display = 'block';
  }

  function closeDropdown() {
    if (!dropdown) return;
    dropdown.style.display = 'none';
  }

  if (desktopInput && desktopResults && dropdown) {
    // Prefetch on focus
    desktopInput.addEventListener('focus', () => fetchTours().catch(() => {}));

    desktopInput.addEventListener('input', () => {
      const q = desktopInput.value.trim();
      if (clearBtn) clearBtn.classList.toggle('hidden', !q);
      clearTimeout(desktopDebounceTimer);
      if (!q) { closeDropdown(); return; }
      desktopDebounceTimer = setTimeout(async () => {
        const tours = await fetchTours();
        renderDesktopResults(tours, desktopInput.value);
      }, 180);
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        desktopInput.value = '';
        clearBtn.classList.add('hidden');
        closeDropdown();
        desktopInput.focus();
      });
    }

    desktopInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeDropdown(); desktopInput.blur(); }
      if (e.key === 'Enter') {
        const first = desktopResults.querySelector('a[href^="/tour/"]');
        if (first) window.location.href = first.getAttribute('href');
      }
    });

    // Close on click outside wrapper
    document.addEventListener('click', (e) => {
      const wrapper = document.querySelector('#nav-search-wrapper');
      if (wrapper && !wrapper.contains(e.target)) closeDropdown();
    });

  }

  if (!mobileSearchBtn || !mobileOverlay || !mobileInput || !mobileResults) return;

  function openMobileSearch() {
    mobileOverlay.classList.remove('hidden');
    mobileOverlay.classList.add('flex');
    document.body.style.overflow = 'hidden';
    mobileInput.value = '';
    renderMobileResults([], '');
    requestAnimationFrame(() => mobileInput.focus());
    fetchTours().catch(() => {});
  }

  function closeMobileSearch() {
    mobileOverlay.classList.add('hidden');
    mobileOverlay.classList.remove('flex');
    document.body.style.overflow = '';
  }

  mobileSearchBtn.addEventListener('click', () => {
    if (mobileOverlay.classList.contains('hidden')) {
      openMobileSearch();
      return;
    }

    closeMobileSearch();
  });

  if (mobileCloseBtn) {
    mobileCloseBtn.addEventListener('click', closeMobileSearch);
  }

  mobileInput.addEventListener('input', () => {
    clearTimeout(mobileDebounceTimer);
    mobileDebounceTimer = setTimeout(async () => {
      const tours = await fetchTours();
      renderMobileResults(tours, mobileInput.value);
    }, 180);
  });

  mobileInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileSearch();
    if (e.key === 'Enter') {
      const first = mobileResults.querySelector('a[href^="/tour/"]');
      if (first) window.location.href = first.getAttribute('href');
    }
  });

  mobileOverlay.addEventListener('click', (e) => {
    if (e.target === mobileOverlay) closeMobileSearch();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileSearch();
  });
})();
