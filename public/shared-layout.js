(function () {
  const LOGO_PATH = '/images/gowithsulogo.svg';

  function getPageKey() {
    const path = window.location.pathname;

    if (path === '/' || path === '/index.html') return 'home';
    if (path === '/tours' || path === '/tours.html') return 'tours';
    if (path === '/booking' || path === '/booking.html') return 'booking';
    if (path.startsWith('/tour/') || path === '/tour-detail.html') return 'tour-detail';
    if (path === '/about.html') return 'about';
    if (path === '/safety-guide.html') return 'safety-guide';

    return 'default';
  }

  function linkClass(active) {
    return active
      ? 'border-b-2 border-emerald-800 text-emerald-800 font-semibold transition-all duration-300 ease-out'
      : 'text-slate-600 transition-all duration-300 ease-out hover:text-emerald-900';
  }

  function getNavConfig(pageKey) {
    const isHomeLike = pageKey === 'home' || pageKey === 'safety-guide';

    return {
      toursHref: isHomeLike ? '/#tour-list-section' : '/tours',
      discoverHref: isHomeLike ? '/#tour-list-section' : '/',
      toursActive: pageKey === 'home' || pageKey === 'tours' || pageKey === 'safety-guide',
      discoverActive: pageKey === 'tour-detail',
      aboutActive: pageKey === 'about'
    };
  }

  function navbarTemplate(pageKey) {
    const cfg = getNavConfig(pageKey);

    return `
<nav class="fixed top-0 z-50 w-full bg-white/70 shadow-sm shadow-emerald-900/5 backdrop-blur-xl" data-mobile-nav-root>
  <div class="max-w-full flex items-center justify-between px-4 md:px-8 py-3 md:py-4">
    <a class="flex items-center gap-2 h-9 md:h-10" href="/">
      <img src="${LOGO_PATH}" alt="GoWithSu Logo" class="h-8 md:h-9 w-auto"/>
    </a>
    <div class="hidden items-center gap-8 md:flex">
      <a class="${linkClass(cfg.toursActive)}" href="${cfg.toursHref}">Hành trình</a>
      <a class="${linkClass(cfg.discoverActive)}" href="${cfg.discoverHref}" data-discover-tour-link>Khám phá</a>
      <a class="${linkClass(cfg.aboutActive)}" href="/about.html">About me</a>
      <button class="text-slate-600 hover:text-emerald-900 transition-all duration-300 ease-out" id="admin-login-open-btn" type="button">Quản lý</button>
    </div>
    <div class="flex items-center gap-3">
      <button class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-white text-slate-600 md:hidden"
        type="button" aria-label="Tìm kiếm tour" data-mobile-search-open>
        <span class="material-symbols-outlined text-lg">search</span>
      </button>
      <button
        class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-white text-slate-600 md:hidden"
        type="button" aria-label="Mở menu" aria-expanded="false" data-mobile-nav-toggle>
        <span class="material-symbols-outlined text-lg">menu</span>
      </button>
      <div class="relative hidden md:block" id="nav-search-wrapper">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">search</span>
        <input id="nav-search-input" type="text" placeholder="Tìm kiếm tour..." autocomplete="off"
          class="w-64 rounded-full border-none bg-white py-2 pl-10 pr-4 text-sm transition-all focus:ring-2 focus:ring-primary/10" />
        <div id="nav-search-dropdown"
          class="absolute right-0 top-full mt-2 w-[420px] z-50 rounded-2xl border border-outline-variant bg-white shadow-xl overflow-hidden"
          style="display:none">
          <div id="nav-search-results" class="max-h-80 overflow-y-auto p-2 space-y-0.5"></div>
        </div>
      </div>
      <a class="hidden md:inline-flex rounded-full bg-primary px-3 md:px-6 py-2 md:py-2.5 text-xs md:text-base font-semibold text-on-primary shadow-lg shadow-primary/10 transition-transform active:scale-90" href="/booking">Đặt tour ngay</a>
    </div>
  </div>
  <div class="hidden border-t border-slate-200/70 bg-white/95 px-4 py-4 shadow-lg backdrop-blur-xl md:hidden" data-mobile-nav-panel>
    <div class="flex flex-col gap-2">
      <a class="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900" href="${cfg.toursHref}" data-mobile-nav-close>Hành trình</a>
      <a class="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100" href="${cfg.discoverHref}" data-discover-tour-link data-mobile-nav-close>Khám phá</a>
      <a class="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100" href="/about.html" data-mobile-nav-close>About me</a>
    </div>
  </div>
</nav>`;
  }

  function mobileSearchTemplate() {
    return `
<div id="nav-search-mobile-overlay" class="mobile-search-overlay fixed inset-0 z-[70] hidden items-start justify-center bg-slate-950/40 px-3 pt-3 pb-5 md:hidden">
  <div class="mobile-search-sheet flex h-full w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-2xl shadow-slate-900/25">
    <div class="flex items-center gap-3 border-b border-slate-100 px-3 py-3">
      <div class="relative flex-1">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-slate-400">search</span>
        <input id="nav-search-mobile-input" type="text" placeholder="Tìm kiếm tour, địa điểm..." autocomplete="off"
          class="mobile-search-bar w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10" />
      </div>
      <button class="mobile-search-close inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600" type="button" aria-label="Đóng tìm kiếm" data-mobile-search-close>
        <span class="material-symbols-outlined text-xl">close</span>
      </button>
    </div>
    <div class="mobile-search-results min-h-0 flex-1 overflow-y-auto px-3 py-3">
      <div id="nav-search-mobile-results" class="space-y-1"></div>
    </div>
  </div>
</div>`;
  }

  function footerTemplate() {
    return `
<footer class="w-full pt-12 md:pt-18 pb-6 md:pb-8 bg-slate-50 dark:bg-slate-950 font-['Be_Vietnam_Pro'] text-sm leading-relaxed tonal-shift bg-surface-container-low">
  <div class="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-14">
    <div class="col-span-2 md:col-span-1">
      <div class="mb-6">
        <img src="${LOGO_PATH}" alt="GoWithSu Logo" class="h-9 md:h-10 w-auto" />
      </div>
      <p class="text-slate-500 dark:text-slate-400 mb-6 text-sm md:text-[15px] leading-6 md:leading-7">Cá nhân tổ chức những chuyến đi phượt, biển và trekking.</p>
    </div>
    <div class="col-span-1">
      <h4 class="font-bold text-emerald-900 dark:text-emerald-50 mb-4 md:mb-5 uppercase tracking-[0.14em] text-xs md:text-[13px]">Khám phá</h4>
      <ul class="space-y-2.5 md:space-y-3">
        <li><a class="text-slate-500 dark:text-slate-400 text-sm md:text-[15px] leading-6 md:leading-7 hover:text-emerald-600 transition-colors" href="/tours?category=TREKKING">Đỉnh núi</a></li>
        <li><a class="text-slate-500 dark:text-slate-400 text-sm md:text-[15px] leading-6 md:leading-7 hover:text-emerald-600 transition-colors" href="/tours?category=BIỂN">Biển - Đảo</a></li>
        <li><a class="text-slate-500 dark:text-slate-400 text-sm md:text-[15px] leading-6 md:leading-7 hover:text-emerald-600 transition-colors" href="/tours?category=ROAD">Cung đường</a></li>
        <li><a class="text-slate-500 dark:text-slate-400 text-sm md:text-[15px] leading-6 md:leading-7 hover:text-emerald-600 transition-colors" href="/tours?category=HIKING">Hiking</a></li>
      </ul>
    </div>
    <div class="col-span-1">
      <h4 class="font-bold text-emerald-900 dark:text-emerald-50 mb-4 md:mb-5 uppercase tracking-[0.14em] text-xs md:text-[13px]">Thông tin</h4>
      <ul class="space-y-2.5 md:space-y-3">
        <li><a class="text-slate-500 dark:text-slate-400 text-sm md:text-[15px] leading-6 md:leading-7 hover:text-emerald-600 transition-colors" href="/safety-guide.html">Hướng dẫn an toàn</a></li>
      </ul>
    </div>
    <div class="col-span-2 md:col-span-1">
      <h4 class="font-bold text-emerald-900 dark:text-emerald-50 mb-4 md:mb-5 uppercase tracking-[0.14em] text-xs md:text-[13px]">Liên hệ</h4>
      <div class="space-y-2.5 md:space-y-3">
        <a class="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm md:text-[15px] leading-6 md:leading-7 transition-colors hover:text-emerald-600" href="mailto:gowithsutour@gmail.com" aria-label="Email GoWithSu" title="Email GoWithSu">
          <span class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-emerald-400 hover:text-emerald-700">
            <span class="material-symbols-outlined text-[19px]">mail</span>
          </span>
          <span class="whitespace-nowrap">gowithsutour@gmail.com</span>
        </a>
        <a class="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm md:text-[15px] leading-6 md:leading-7 transition-colors hover:text-emerald-600" href="tel:0336692307" aria-label="Hotline GoWithSu" title="Hotline GoWithSu">
          <span class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-emerald-400 hover:text-emerald-700">
            <span class="material-symbols-outlined text-[19px]">call</span>
          </span>
          <span class="whitespace-nowrap">033 669 2307</span>
        </a>
      </div>
    </div>
  </div>
  <div class="max-w-7xl mx-auto px-4 md:px-8 mt-10 md:mt-16 pt-6 md:pt-8 pb-24 md:pb-0 border-t border-slate-200 dark:border-slate-800 text-center">
    <p class="text-slate-500 dark:text-slate-400 text-sm md:text-[15px]">© 2026 GoWithSu. Hành trình từ tâm.</p>
  </div>
</footer>`;
  }

  function adminDialogTemplate() {
    return `
<dialog id="admin-login-dialog" class="w-full max-w-[580px] rounded-2xl border-none p-0 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm">
  <form id="admin-login-form" class="overflow-hidden rounded-2xl bg-white">
    <div class="bg-primary px-8 py-6">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-[78px] items-center justify-center rounded-xl bg-white px-3 shadow-sm">
            <img src="${LOGO_PATH}" alt="GoWithSu Logo" class="h-8 w-auto"/>
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.15em] text-white/60">GoWithSu Admin</p>
            <h3 class="text-xl font-extrabold text-white">Đăng nhập quản trị</h3>
          </div>
        </div>
        <button id="admin-login-close-btn" class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20" type="button" aria-label="Đóng">
          <span class="material-symbols-outlined text-xl">close</span>
        </button>
      </div>
    </div>
    <div class="grid gap-5 px-8 py-7">
      <label class="grid gap-1.5">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Tên đăng nhập</span>
        <input id="admin_username" name="username" type="text" placeholder="admin" required autocomplete="username" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/10" />
      </label>
      <label class="grid gap-1.5">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Mật khẩu</span>
        <input id="admin_password" name="password" type="password" placeholder="••••••••" required autocomplete="current-password" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/10" />
      </label>
      <div class="flex items-center justify-between gap-3 pt-1">
        <button type="submit" class="rounded-xl bg-primary px-7 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:shadow-primary/30 active:scale-95">Đăng nhập</button>
        <p id="admin-login-status" class="min-h-5 text-sm font-semibold text-primary" aria-live="polite"></p>
      </div>
    </div>
  </form>
</dialog>`;
  }

  function render() {
    const pageKey = getPageKey();
    const navMount = document.querySelector('#shared-navbar-mount');
    const mobileSearchMount = document.querySelector('#shared-mobile-search-mount');
    const footerMount = document.querySelector('#shared-footer-mount');
    const dialogMount = document.querySelector('#shared-admin-dialog-mount');
    const nav = document.querySelector('nav[data-mobile-nav-root]');
    const mobileSearch = document.querySelector('#nav-search-mobile-overlay');
    const footer = document.querySelector('footer');
    const dialog = document.querySelector('#admin-login-dialog');

    if (navMount) {
      navMount.outerHTML = navbarTemplate(pageKey);
    } else if (nav) {
      nav.outerHTML = navbarTemplate(pageKey);
    } else {
      document.body.insertAdjacentHTML('afterbegin', navbarTemplate(pageKey));
    }

    if (mobileSearchMount) {
      mobileSearchMount.outerHTML = mobileSearchTemplate();
    } else if (mobileSearch) {
      mobileSearch.outerHTML = mobileSearchTemplate();
    } else {
      const renderedNav = document.querySelector('nav[data-mobile-nav-root]');
      if (renderedNav) {
        renderedNav.insertAdjacentHTML('afterend', mobileSearchTemplate());
      }
    }

    if (footerMount) {
      footerMount.outerHTML = footerTemplate();
    } else if (footer) {
      footer.outerHTML = footerTemplate();
    } else {
      document.body.insertAdjacentHTML('beforeend', footerTemplate());
    }

    if (dialogMount) {
      dialogMount.outerHTML = adminDialogTemplate();
    } else if (dialog) {
      dialog.outerHTML = adminDialogTemplate();
    } else {
      document.body.insertAdjacentHTML('beforeend', adminDialogTemplate());
    }
  }

  window.GWSSharedLayout = {
    render,
    templates: {
      navbarTemplate,
      mobileSearchTemplate,
      footerTemplate,
      adminDialogTemplate
    }
  };

  render();
})();
