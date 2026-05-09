const historyList = document.querySelector('#history-list');
const historyStats = document.querySelector('#history-stats');
const historySearch = document.querySelector('#history-search');
const adminLogoutBtn = document.querySelector('#admin-logout-btn');

let allGroups = [];

// --- Logout ---
if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener('click', async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/';
  });
}

// --- Helpers ---
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatMonthYear(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
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

function categoryChipClass(cat) {
  const v = normalizeCategoryValue(cat);
  if (v === 'BIỂN') return 'bg-sky-100 text-sky-700 border-sky-200';
  if (v === 'HIKING') return 'bg-teal-100 text-teal-700 border-teal-200';
  if (v === 'ROAD TRIP') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-green-100 text-green-700 border-green-200';
}

// --- Member table ---
function buildMemberTable(members) {
  if (!members.length) {
    return '<p class="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm font-medium text-slate-600">Không có thành viên.</p>';
  }
  return `
    <div class="overflow-x-auto">
      <table class="member-table min-w-[900px] w-full border-collapse text-sm">
        <thead class="bg-primary/10 text-slate-700">
          <tr>
            <th class="whitespace-nowrap px-3 py-3 text-left font-semibold">Họ tên</th>
            <th class="whitespace-nowrap px-3 py-3 text-left font-semibold">Ngày sinh</th>
            <th class="whitespace-nowrap px-3 py-3 text-left font-semibold">CCCD</th>
            <th class="whitespace-nowrap px-3 py-3 text-left font-semibold">SĐT</th>
            <th class="whitespace-nowrap px-3 py-3 text-left font-semibold">Địa chỉ</th>
            <th class="whitespace-nowrap px-3 py-3 text-left font-semibold">Medal</th>
            <th class="whitespace-nowrap px-3 py-3 text-left font-semibold">Tên medal</th>
            <th class="whitespace-nowrap px-3 py-3 text-left font-semibold">Bệnh nền</th>
            <th class="whitespace-nowrap px-3 py-3 text-left font-semibold">Balo</th>
            <th class="whitespace-nowrap px-3 py-3 text-left font-semibold">Đèn</th>
            <th class="whitespace-nowrap px-3 py-3 text-left font-semibold">Gậy</th>
          </tr>
        </thead>
        <tbody class="bg-white text-slate-700">
          ${members.map((m) => `
            <tr class="border-t border-primary/10">
              <td class="whitespace-nowrap px-3 py-3 align-middle">${m.name}</td>
              <td class="whitespace-nowrap px-3 py-3 align-middle">${m.dob || ''}</td>
              <td class="whitespace-nowrap px-3 py-3 align-middle">${m.cccd || ''}</td>
              <td class="whitespace-nowrap px-3 py-3 align-middle">${m.phone || ''}</td>
              <td class="whitespace-nowrap px-3 py-3 align-middle">${m.address || ''}</td>
              <td class="whitespace-nowrap px-3 py-3 align-middle">${m.medal ? 'Có' : 'Không'}</td>
              <td class="whitespace-nowrap px-3 py-3 align-middle">${m.medal_name || ''}</td>
              <td class="whitespace-nowrap px-3 py-3 align-middle">${m.medical_note || ''}</td>
              <td class="whitespace-nowrap px-3 py-3 align-middle">${m.borrow_bag ? 'Có' : 'Không'}</td>
              <td class="whitespace-nowrap px-3 py-3 align-middle">${m.borrow_headlamp ? 'Có' : 'Không'}</td>
              <td class="whitespace-nowrap px-3 py-3 align-middle">${m.borrow_trekking_pole ? 'Có' : 'Không'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function loadMembersInline(bookingIds, panel) {
  panel.innerHTML = '<p class="px-4 py-3 text-sm text-secondary">Đang tải danh sách thành viên...</p>';
  const allMembers = [];
  for (const id of bookingIds) {
    const res = await fetch(`/api/admin/bookings/${id}/members`);
    const members = await res.json();
    allMembers.push(...members);
  }
  panel.innerHTML = buildMemberTable(allMembers);
}

// --- Render stats ---
function renderStats(groups) {
  const totalTrips = groups.length;
  const totalMembers = groups.reduce((s, g) => s + g.total_members, 0);
  const uniqueTours = new Set(groups.map((g) => g.tour_id)).size;

  historyStats.innerHTML = [
    { icon: 'hiking', label: 'Tổng chuyến', value: totalTrips },
    { icon: 'group', label: 'Tổng thành viên', value: totalMembers },
    { icon: 'landscape', label: 'Tour đã thực hiện', value: uniqueTours }
  ].map(({ icon, label, value }) => `
    <div class="flex items-center gap-4 rounded-2xl bg-white px-6 py-5 shadow-sm">
      <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-fixed">
        <span class="material-symbols-outlined text-primary" style="font-variation-settings:'FILL' 1">${icon}</span>
      </div>
      <div>
        <p class="text-2xl font-black text-primary">${value}</p>
        <p class="text-xs font-bold uppercase tracking-widest text-slate-400">${label}</p>
      </div>
    </div>
  `).join('');
}

// --- Render list ---
function renderGroups(groups) {
  if (!groups.length) {
    historyList.innerHTML = `
      <div class="flex flex-col items-center justify-center py-24 text-slate-400">
        <span class="material-symbols-outlined text-5xl mb-3">history</span>
        <p class="text-base font-semibold">Không có chuyến đi nào trong lịch sử.</p>
      </div>`;
    return;
  }

  // Group by month
  const byMonth = {};
  groups.forEach((g) => {
    const key = g.start_date.slice(0, 7);
    const label = formatMonthYear(g.start_date);
    if (!byMonth[key]) byMonth[key] = { label, groups: [] };
    byMonth[key].groups.push(g);
  });

  historyList.innerHTML = Object.values(byMonth).map(({ label, groups: mGroups }) => `
    <div class="mb-8">
      <!-- Month divider -->
      <div class="mb-3 flex items-center gap-3">
        <span class="text-xs font-black uppercase tracking-widest text-slate-400">${label}</span>
        <div class="flex-1 h-px bg-slate-100"></div>
        <span class="text-xs text-slate-300">${mGroups.length} chuyến</span>
      </div>

      <div class="space-y-3">
        ${mGroups.map((g) => {
          const d = new Date(g.start_date + 'T00:00:00');
          const dayNum = String(d.getDate()).padStart(2, '0');
          const weekday = ['CN','T2','T3','T4','T5','T6','T7'][d.getDay()];
          const monthStr = `Th${d.getMonth() + 1}`;

          return `
          <article class="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div class="flex items-center gap-5 px-6 py-5">
              <!-- Date badge -->
              <div class="flex-shrink-0 w-14 h-14 rounded-xl bg-slate-100 flex flex-col items-center justify-center">
                <span class="text-xl font-black text-slate-700 leading-none">${dayNum}</span>
                <span class="text-[10px] font-bold text-slate-400 uppercase">${weekday} · ${monthStr}</span>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-on-surface truncate">${g.tour_title}</span>
                  ${g.tour_category ? `<span class="rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${categoryChipClass(g.tour_category)}">${getCategoryLabel(g.tour_category)}</span>` : ''}
                </div>
                <div class="flex items-center gap-4 mt-1.5">
                  <span class="flex items-center gap-1 text-xs text-slate-400">
                    <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">group</span>
                    ${g.total_members} thành viên
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2 flex-shrink-0">
                <a href="/api/admin/export/tour/${g.tour_id}/${g.start_date}" class="inline-flex h-9 items-center gap-1.5 rounded-xl border border-primary/15 bg-primary/5 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/10">
                  <span class="material-symbols-outlined text-sm">table_chart</span>
                  Excel
                </a>
                <button class="toggle-members-btn inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:bg-slate-100"
                  data-booking-ids="${g.bookings.map((b) => b.id).join(',')}" data-loaded="false" type="button" aria-expanded="false">
                  <span class="material-symbols-outlined toggle-icon text-xl transition-transform duration-300">expand_more</span>
                </button>
              </div>
            </div>
            <div class="member-panel hidden px-5 py-4"></div>
          </article>`;
        }).join('')}
      </div>
    </div>
  `).join('');

  // Attach toggle handlers
  historyList.querySelectorAll('.toggle-members-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const article = btn.closest('article');
      const panel = article.querySelector('.member-panel');
      const icon = btn.querySelector('.toggle-icon');
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        panel.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
        btn.setAttribute('aria-expanded', 'false');
      } else {
        panel.classList.remove('hidden');
        icon.style.transform = 'rotate(180deg)';
        btn.setAttribute('aria-expanded', 'true');
        if (btn.dataset.loaded === 'false') {
          btn.dataset.loaded = 'true';
          const ids = btn.dataset.bookingIds.split(',').map(Number).filter(Boolean);
          await loadMembersInline(ids, panel);
        }
      }
    });
  });
}

// --- Search ---
function applySearch(query) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? allGroups.filter((g) => g.tour_title.toLowerCase().includes(q))
    : allGroups;
  renderGroups(filtered);
}

if (historySearch) {
  let debounce;
  historySearch.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => applySearch(historySearch.value), 200);
  });
}

// --- Init ---
async function init() {
  try {
    const res = await fetch('/api/admin/bookings/history');
    if (!res.ok) throw new Error('Unauthorized');
    allGroups = await res.json();
    renderStats(allGroups);
    renderGroups(allGroups);
  } catch (_e) {
    historyList.innerHTML = `
      <div class="flex flex-col items-center justify-center py-24 text-slate-400">
        <span class="material-symbols-outlined text-5xl mb-3">error</span>
        <p class="text-base font-semibold">Không tải được dữ liệu. Vui lòng đăng nhập lại.</p>
      </div>`;
  }
}

init();
