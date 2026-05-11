let allGroups = [];
let searchTimer = null;
const bookingStatus = document.querySelector('#booking-status');
const bookingGroups = document.querySelector('#booking-groups');
const bookingSearchInput = document.querySelector('#booking-search');
const exportWeekButton = document.querySelector('#export-week-btn');
const adminLogoutButton = document.querySelector('#admin-logout-btn');
const deleteMemberConfirmDialog = document.querySelector('#delete-member-confirm-dialog');
const deleteMemberConfirmName = document.querySelector('#delete-member-confirm-name');
const deleteMemberConfirmCancelButton = document.querySelector('#delete-member-confirm-cancel');
const deleteMemberConfirmSubmitButton = document.querySelector('#delete-member-confirm-submit');
let deleteMemberConfirmResolver = null;

function showToast(message) {
  const existing = document.querySelector('#admin-bookings-toast');
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'admin-bookings-toast';
  toast.textContent = String(message || '').trim() || 'Đã tải thành công';
  toast.style.cssText = [
    'position:fixed',
    'bottom:24px',
    'left:50%',
    'transform:translateX(-50%)',
    'background:#143600',
    'color:#ffffff',
    'padding:10px 18px',
    'border-radius:999px',
    'font-size:13px',
    'font-weight:700',
    'box-shadow:0 8px 24px rgba(20,54,0,0.25)',
    'z-index:9999',
    'opacity:0',
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
  }, 2200);
}

function toLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
  const dateOnly = normalizeDateOnly(value);
  if (!dateOnly) {
    return '--/--/----';
  }

  const [year, month, day] = dateOnly.split('-');
  return `${day}/${month}/${year}`;
}

function normalizeDateOnly(value) {
  if (!value) {
    return '';
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toLocalIsoDate(value);
  }

  const text = String(value).trim();
  if (!text) {
    return '';
  }

  const matchedIso = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (matchedIso) {
    return matchedIso[1];
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return toLocalIsoDate(parsed);
}

function normalizeBookingDateOnly(value) {
  if (!value) {
    return '';
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toLocalIsoDate(value);
  }

  const text = String(value).trim();
  if (!text) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return toLocalIsoDate(parsed);
  }

  const matchedIso = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return matchedIso ? matchedIso[1] : '';
}

function parseDateParts(value) {
  const dateOnly = normalizeBookingDateOnly(value);
  if (!dateOnly) {
    return null;
  }

  const parsed = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return {
    dateOnly,
    date: parsed,
    day: String(parsed.getDate()).padStart(2, '0'),
    month: String(parsed.getMonth() + 1).padStart(2, '0'),
    year: String(parsed.getFullYear())
  };
}

function closeDeleteMemberConfirmDialog(confirmed) {
  if (deleteMemberConfirmDialog && deleteMemberConfirmDialog.open) {
    deleteMemberConfirmDialog.close();
  }

  if (deleteMemberConfirmResolver) {
    deleteMemberConfirmResolver(confirmed);
    deleteMemberConfirmResolver = null;
  }
}

function askDeleteMemberConfirmation(memberName) {
  const normalizedName = String(memberName || '').trim();

  if (
    !deleteMemberConfirmDialog ||
    !deleteMemberConfirmName ||
    !deleteMemberConfirmCancelButton ||
    !deleteMemberConfirmSubmitButton
  ) {
    return Promise.resolve(confirm(`Xóa thành viên "${normalizedName}" khỏi booking này?`));
  }

  deleteMemberConfirmName.textContent = normalizedName || 'thành viên này';
  deleteMemberConfirmDialog.showModal();

  return new Promise((resolve) => {
    deleteMemberConfirmResolver = resolve;
  });
}

async function downloadFile(url, fallbackName) {
  const response = await fetch(url);
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message || 'Không thể tải file.');
  }
  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const disposition = response.headers.get('Content-Disposition') || '';
  const matchedName = disposition.match(/filename="([^"]+)"/i);
  anchor.href = downloadUrl;
  anchor.download = matchedName ? matchedName[1] : fallbackName;
  anchor.click();
  URL.revokeObjectURL(downloadUrl);
}

function buildMemberTable(members) {
  if (!members.length) {
    return '<p class="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm font-medium text-slate-600">Không có thành viên.</p>';
  }

  return `
    <div class="overflow-x-auto">
      <table class="member-table min-w-[1100px] w-full border-collapse text-sm">
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
          <th class="whitespace-nowrap px-3 py-3 text-left font-semibold">Ngày khởi hành</th>
          <th class="whitespace-nowrap px-3 py-3 text-left font-semibold"></th>
        </tr>
      </thead>
      <tbody class="bg-white text-slate-700">
        ${members
          .map(
            (member) => {
              const startDateValue = normalizeBookingDateOnly(member.start_date);
              const dobValue = formatDisplayDate(member.dob);
              return `
              <tr class="border-t border-primary/10">
                <td class="whitespace-nowrap px-3 py-3 align-middle">${member.name}</td>
                <td class="whitespace-nowrap px-3 py-3 align-middle">${dobValue}</td>
                <td class="whitespace-nowrap px-3 py-3 align-middle">${member.cccd || ''}</td>
                <td class="whitespace-nowrap px-3 py-3 align-middle">${member.phone || ''}</td>
                <td class="whitespace-nowrap px-3 py-3 align-middle">${member.address || ''}</td>
                <td class="whitespace-nowrap px-3 py-3 align-middle">${member.medal ? 'Có' : 'Không'}</td>
                <td class="whitespace-nowrap px-3 py-3 align-middle">${member.medal_name || ''}</td>
                <td class="whitespace-nowrap px-3 py-3 align-middle">${member.medical_note || ''}</td>
                <td class="whitespace-nowrap px-3 py-3 align-middle">${member.borrow_bag ? 'Có' : 'Không'}</td>
                <td class="whitespace-nowrap px-3 py-3 align-middle">${member.borrow_headlamp ? 'Có' : 'Không'}</td>
                <td class="whitespace-nowrap px-3 py-3 align-middle">${member.borrow_trekking_pole ? 'Có' : 'Không'}</td>
                <td class="date-edit-cell whitespace-nowrap px-3 py-3 align-middle" data-booking-id="${member.booking_id}">
                  <div class="flex items-center gap-2">
                    <input class="date-edit-input w-36 rounded-lg border border-primary/20 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/20" type="date" value="${startDateValue}" />
                    <button class="date-save-btn inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/15 bg-primary/5 text-primary transition-colors hover:bg-primary/10" type="button" aria-label="Lưu ngày" title="Lưu ngày"><span class="material-symbols-outlined text-base">save</span></button>
                  </div>
                </td>
                <td class="whitespace-nowrap px-3 py-3 align-middle">
                  <button class="member-delete-btn inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 transition-colors hover:bg-red-100" type="button" data-member-id="${member.id}" aria-label="Xóa thành viên" title="Xóa thành viên"><span class="material-symbols-outlined text-base">person_remove</span></button>
                </td>
              </tr>
            `;
            }
          )
          .join('')}
      </tbody>
    </table>
    </div>
  `;
}

function attachDateSaveHandlers(container) {
  container.querySelectorAll('.date-edit-cell').forEach((cell) => {
    const input = cell.querySelector('.date-edit-input');
    const btn = cell.querySelector('.date-save-btn');
    btn.addEventListener('click', async () => {
      const newDate = input.value;
      if (!newDate) return;
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">refresh</span>';
      try {
        const res = await fetch(`/api/admin/bookings/${cell.dataset.bookingId}/date`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start_date: newDate })
        });
        if (res.ok) {
          btn.innerHTML = '<span class="material-symbols-outlined text-base">check_circle</span>';
          bookingStatus.textContent = '';
          showToast('Cập nhật thành công');
          loadBookings();
        } else {
          const data = await res.json();
          btn.innerHTML = '<span class="material-symbols-outlined text-base">save</span>';
          bookingStatus.textContent = data.message || 'Lỗi khi lưu.';
        }
      } catch {
        btn.innerHTML = '<span class="material-symbols-outlined text-base">save</span>';
      } finally {
        btn.disabled = false;
      }
    });
  });

  container.querySelectorAll('.member-delete-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const memberId = btn.dataset.memberId;
      const row = btn.closest('tr');
      const memberName = row ? row.querySelector('td')?.textContent?.trim() : '';
      const shouldDelete = await askDeleteMemberConfirmation(memberName);
      if (!shouldDelete) return;
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">refresh</span>';
      try {
        const res = await fetch(`/api/admin/members/${memberId}`, { method: 'DELETE' });
        if (res.ok) {
          row?.remove();
          bookingStatus.textContent = `Đã xóa thành viên ${memberName}.`;
        } else {
          const data = await res.json();
          btn.innerHTML = '<span class="material-symbols-outlined text-base">person_remove</span>';
          bookingStatus.textContent = data.message || 'Lỗi khi xóa.';
          btn.disabled = false;
        }
      } catch {
        btn.innerHTML = '<span class="material-symbols-outlined text-base">person_remove</span>';
        btn.disabled = false;
      }
    });
  });
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
  attachDateSaveHandlers(panel);
}

function renderStats(flat) {
  const statGroupsEl = document.querySelector('#stat-groups');
  const statMembersEl = document.querySelector('#stat-members');
  const statToursEl = document.querySelector('#stat-tours');
  if (!statGroupsEl) return;

  const totalMembers = flat.reduce((s, g) => {
    return s + g.items.reduce((ss, i) => {
      const memberCount = Number(i.member_count || 0);
      if (Number.isNaN(memberCount)) {
        console.warn('Dữ liệu member_count không hợp lệ:', i);
        return ss;
      }
      return ss + memberCount;
    }, 0);
  }, 0);

  const uniqueTours = new Set(flat.map((g) => g.tourId)).size;

  statGroupsEl.textContent = flat.length;
  statMembersEl.textContent = totalMembers;
  statToursEl.textContent = uniqueTours;
}

function renderGroups(groups) {
  if (!groups.length) {
    bookingGroups.innerHTML = `
      <div class="flex flex-col items-center gap-3 py-24 text-center">
        <span class="material-symbols-outlined text-5xl text-slate-300">event_busy</span>
        <p class="text-base font-semibold text-slate-400">Không tìm thấy chuyến đi nào.</p>
      </div>
    `;
    return;
  }

  bookingGroups.innerHTML = groups
    .map(({ tourName, tourId, date, items }) => {
      const guestCount = items.reduce((sum, item) => sum + item.member_count, 0);
      const parsedDateParts = parseDateParts(date);
      const day = parsedDateParts?.day || '--';
      const month = parsedDateParts?.month || '--';
      const year = parsedDateParts?.year || '----';
      const exportDate = parsedDateParts?.dateOnly || normalizeBookingDateOnly(date) || '';
      const bookingIds = items.map((b) => b.id).join(',');
      return `
        <article class="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm transition-shadow hover:shadow-md">
          <div class="flex items-stretch">
            <div class="flex w-20 shrink-0 flex-col items-center justify-center border-r border-primary/10 bg-primary/5 px-3 py-5">
              <span class="text-3xl font-black leading-none text-primary">${day}</span>
              <span class="mt-0.5 text-xs font-bold uppercase tracking-wider text-secondary">Th.${month}</span>
              <span class="mt-0.5 text-xs text-slate-400">${year}</span>
            </div>
            <div class="flex flex-1 items-center gap-4 px-5 py-4 min-w-0">
              <div class="flex-1 min-w-0">
                <h3 class="truncate text-base font-extrabold tracking-tight text-primary">${tourName}</h3>
                <div class="mt-1.5 flex items-center gap-4 text-sm text-secondary">
                  <span class="flex items-center gap-1.5"><span class="material-symbols-outlined" style="font-size:15px">group</span>${guestCount} thành viên</span>
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <button class="export-tour-btn inline-flex h-9 items-center gap-1.5 rounded-xl border border-primary/15 bg-primary/5 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                  data-tour-id="${tourId}" data-date="${exportDate}" type="button" title="Xuất Excel">
                  <span class="material-symbols-outlined text-sm">table_chart</span>
                  Excel
                </button>
                <button class="toggle-members-btn inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:bg-slate-100"
                  data-booking-ids="${bookingIds}" data-loaded="false" type="button" aria-expanded="false">
                  <span class="material-symbols-outlined toggle-icon text-xl transition-transform duration-300">expand_more</span>
                </button>
              </div>
            </div>
          </div>
          <div class="member-panel hidden px-5 py-4"></div>
        </article>
      `;
    })
    .join('');

  bookingGroups.querySelectorAll('.toggle-members-btn').forEach((btn) => {
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
          const ids = btn.dataset.bookingIds.split(',');
          await loadMembersInline(ids, panel);
        }
      }
    });
  });

  bookingGroups.querySelectorAll('.export-tour-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      bookingStatus.textContent = 'Đang tạo file Excel...';
      try {
        await downloadFile(`/api/admin/export/tour/${btn.dataset.tourId}/${btn.dataset.date}`, 'tour.xlsx');
        bookingStatus.textContent = '';
        showToast('Đã tải thành công');
      } catch (error) {
        bookingStatus.textContent = error.message;
      }
    });
  });
}

async function loadBookings() {
  const response = await fetch('/api/admin/bookings');
  const data = await response.json();

  const flat = [];
  for (const [tourName, dates] of Object.entries(data.grouped)) {
    for (const [date, items] of Object.entries(dates)) {
      flat.push({ tourName, tourId: items[0]?.tour_id, date, items });
    }
  }
  flat.sort((a, b) => {
    const left = parseDateParts(a.date)?.date;
    const right = parseDateParts(b.date)?.date;
    if (left && right) {
      return left - right;
    }
    return String(a.date || '').localeCompare(String(b.date || ''));
  });

  const today = toLocalIsoDate(new Date());
  const upcoming = flat.filter((g) => {
    const dateOnly = normalizeBookingDateOnly(g.date);
    return Boolean(dateOnly) && dateOnly >= today;
  });

  const upcomingWithMembers = upcoming.filter((group) => {
    const totalMembers = group.items.reduce((sum, item) => {
      const memberCount = Number(item.member_count || 0);
      return sum + (Number.isNaN(memberCount) ? 0 : memberCount);
    }, 0);

    return totalMembers > 0;
  });

  allGroups = upcomingWithMembers;
  renderStats(upcomingWithMembers);
  renderGroups(upcomingWithMembers);
}

adminLogoutButton.addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  window.location.href = '/';
});

exportWeekButton.addEventListener('click', async () => {
  bookingStatus.textContent = 'Đang tạo file Excel tuần này...';
  try {
    await downloadFile('/api/admin/export/week', 'Tour-tuan.xlsx');
    bookingStatus.textContent = '';
    showToast('Đã tải thành công');
  } catch (error) {
    bookingStatus.textContent = error.message;
  }
});

if (bookingSearchInput) {
  bookingSearchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const q = bookingSearchInput.value.trim().toLowerCase();
      renderGroups(q ? allGroups.filter((g) => g.tourName.toLowerCase().includes(q)) : allGroups);
    }, 200);
  });
}

if (deleteMemberConfirmCancelButton) {
  deleteMemberConfirmCancelButton.addEventListener('click', () => {
    closeDeleteMemberConfirmDialog(false);
  });
}

if (deleteMemberConfirmSubmitButton) {
  deleteMemberConfirmSubmitButton.addEventListener('click', () => {
    closeDeleteMemberConfirmDialog(true);
  });
}

if (deleteMemberConfirmDialog) {
  deleteMemberConfirmDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDeleteMemberConfirmDialog(false);
  });

  deleteMemberConfirmDialog.addEventListener('click', (event) => {
    const rect = deleteMemberConfirmDialog.getBoundingClientRect();
    const clickedInside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!clickedInside) {
      closeDeleteMemberConfirmDialog(false);
    }
  });
}

loadBookings().catch(() => {
  bookingStatus.textContent = 'Không tải được dữ liệu booking.';
});


