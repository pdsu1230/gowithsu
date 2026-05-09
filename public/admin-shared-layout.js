(function () {
  const LOGO_PATH = '/Images/gowithsulogo.svg';

  function getActiveKey() {
    const path = window.location.pathname;
    if (path === '/admin/overview') return 'overview';
    if (path === '/admin/tours') return 'tours';
    if (path === '/admin/bookings') return 'bookings';
    if (path === '/admin/history') return 'history';
    return '';
  }

  function navItemClass(active) {
    return active
      ? 'flex items-center gap-4 rounded-l-xl border-r-4 border-[#2A4D14] bg-emerald-50/30 px-6 py-4 text-[#2A4D14] transition-all duration-200'
      : 'flex items-center gap-4 rounded-xl px-6 py-4 text-slate-400 transition-all duration-200 hover:bg-slate-50 hover:text-[#2A4D14]';
  }

  function navIcon(name, active) {
    const fillStyle = active ? " style=\"font-variation-settings:'FILL' 1;\"" : '';
    return `<span class=\"material-symbols-outlined\"${fillStyle}>${name}</span>`;
  }

  function sidebarTemplate(activeKey) {
    const isToursPage = activeKey === 'tours';

    return `
<aside class="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-none bg-white font-['Be_Vietnam_Pro'] text-sm font-medium">
  <div class="flex flex-col gap-2 p-8">
    <div class="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container">
      <span class="material-symbols-outlined text-3xl text-white">landscape</span>
    </div>
    <h1 class="flex items-center gap-2 h-10"><img src="${LOGO_PATH}" alt="GoWithSu Logo" class="h-8 w-auto"/></h1>
    <p class="text-xs font-bold uppercase tracking-widest text-slate-500">Quản lý</p>
  </div>

  <nav class="flex-1 space-y-1 px-4">
    <a class="${navItemClass(false)}" href="/">
      ${navIcon('home', false)}
      Trang chủ
    </a>
    <a class="${navItemClass(activeKey === 'overview')}" href="/admin/overview">
      ${navIcon('dashboard', activeKey === 'overview')}
      Tổng quan
    </a>
    <a class="${navItemClass(activeKey === 'tours')}" href="/admin/tours">
      ${navIcon('landscape', activeKey === 'tours')}
      Chuyến đi
    </a>
    <a class="${navItemClass(activeKey === 'bookings')}" href="/admin/bookings">
      ${navIcon('event_available', activeKey === 'bookings')}
      Đặt chỗ
    </a>
    <a class="${navItemClass(activeKey === 'history')}" href="/admin/history">
      ${navIcon('history', activeKey === 'history')}
      Lịch sử
    </a>
  </nav>

  <div class="space-y-6 p-6">
    ${isToursPage ? `
    <button id="tour-create-btn" class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-on-primary shadow-lg shadow-primary/20 transition-transform hover:scale-[0.98]" type="button">
      <span class="material-symbols-outlined">add_circle</span>
      Tạo hành trình mới
    </button>` : ''}
    <div class="flex flex-col gap-2 border-t border-slate-100 pt-6">
      <button id="admin-logout-btn" class="flex items-center gap-4 px-6 py-2 text-left text-slate-400 transition-colors hover:text-error" type="button">
        <span class="material-symbols-outlined">logout</span>
        Đăng xuất
      </button>
    </div>
  </div>
</aside>`;
  }

  function footerTemplate() {
    return `
<footer class="p-10 text-center text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
  © 2026 GoWithSu • Hệ thống Quản lý
</footer>`;
  }

  function render() {
    const activeKey = getActiveKey();
    const sidebarMount = document.querySelector('#admin-sidebar-mount');
    const footerMount = document.querySelector('#admin-footer-mount');
    const sidebar = document.querySelector('aside');
    const footer = document.querySelector('main footer');

    if (sidebarMount) {
      sidebarMount.outerHTML = sidebarTemplate(activeKey);
    } else if (sidebar) {
      sidebar.outerHTML = sidebarTemplate(activeKey);
    } else {
      document.body.insertAdjacentHTML('afterbegin', sidebarTemplate(activeKey));
    }

    if (footerMount) {
      footerMount.outerHTML = footerTemplate();
    } else if (footer) {
      footer.outerHTML = footerTemplate();
    }
  }

  window.GWSAdminSharedLayout = {
    render,
    templates: {
      sidebarTemplate,
      footerTemplate
    }
  };

  render();
})();
