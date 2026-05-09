const tourForm = document.querySelector('#tour-form');
const tourStatus = document.querySelector('#tour-status');
const bookingStatus = document.querySelector('#booking-status');
const tourAdminList = document.querySelector('#tour-admin-list');
const bookingGroups = document.querySelector('#booking-groups');
const exportWeekButton = document.querySelector('#export-week-btn');
const memberDialog = document.querySelector('#member-dialog');
const memberDialogTitle = document.querySelector('#member-dialog-title');
const memberDialogBody = document.querySelector('#member-dialog-body');
const memberDialogClose = document.querySelector('#member-dialog-close');
const adminLogoutButton = document.querySelector('#admin-logout-btn');

function tourFormPayload() {
  return {
    title: document.querySelector('#tour_title').value.trim(),
    location: document.querySelector('#tour_location').value.trim(),
    duration: document.querySelector('#tour_duration').value.trim(),
    difficulty: document.querySelector('#tour_difficulty').value.trim(),
    description: document.querySelector('#tour_description').value.trim()
  };
}

function resetTourForm() {
  tourForm.reset();
  document.querySelector('#tour_form_id').value = '';
}

function fillTourForm(tour) {
  document.querySelector('#tour_form_id').value = tour.id;
  document.querySelector('#tour_title').value = tour.title || '';
  document.querySelector('#tour_location').value = tour.location || '';
  document.querySelector('#tour_duration').value = tour.duration || '';
  document.querySelector('#tour_difficulty').value = tour.difficulty || '';
  document.querySelector('#tour_description').value = tour.description || '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
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

async function loadTours() {
  const response = await fetch('/api/admin/tours');
  const tours = await response.json();

  tourAdminList.innerHTML = tours
    .map(
      (tour) => `
        <article class="list-card">
          <div>
            <h3>${tour.title}</h3>
            <p>${tour.location || ''} ${tour.duration ? `• ${tour.duration}` : ''} ${tour.difficulty ? `• ${tour.difficulty}` : ''}</p>
          </div>
          <div class="list-card__actions">
            <button class="btn btn-ghost tour-edit-btn" data-tour-id="${tour.id}" type="button">Sửa</button>
            <button class="btn btn-danger tour-delete-btn" data-tour-id="${tour.id}" type="button">Xóa</button>
          </div>
        </article>
      `
    )
    .join('');

  tourAdminList.querySelectorAll('.tour-edit-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const tour = tours.find((item) => item.id === Number(button.dataset.tourId));
      fillTourForm(tour);
    });
  });

  tourAdminList.querySelectorAll('.tour-delete-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const confirmed = window.confirm('Xóa tour này và toàn bộ booking liên quan?');
      if (!confirmed) {
        return;
      }

      const response = await fetch(`/api/admin/tours/${button.dataset.tourId}`, { method: 'DELETE' });
      const result = await response.json();
      tourStatus.textContent = result.message;
      await Promise.all([loadTours(), loadBookings()]);
      resetTourForm();
    });
  });
}

function buildMemberTable(members) {
  if (!members.length) {
    return '<p>Không có thành viên.</p>';
  }

  return `
    <table class="member-table">
      <thead>
        <tr>
          <th>Họ tên</th>
          <th>Ngày sinh</th>
          <th>CCCD</th>
          <th>SĐT</th>
          <th>Địa chỉ</th>
          <th>Medal</th>
          <th>Tên medal</th>
          <th>Bệnh nền</th>
          <th>Balo</th>
          <th>Đèn</th>
          <th>Gậy</th>
        </tr>
      </thead>
      <tbody>
        ${members
          .map(
            (member) => `
              <tr>
                <td>${member.name}</td>
                <td>${member.dob || ''}</td>
                <td>${member.cccd || ''}</td>
                <td>${member.phone || ''}</td>
                <td>${member.address || ''}</td>
                <td>${member.medal ? 'Có' : 'Không'}</td>
                <td>${member.medal_name || ''}</td>
                <td>${member.medical_note || ''}</td>
                <td>${member.borrow_bag ? 'Có' : 'Không'}</td>
                <td>${member.borrow_headlamp ? 'Có' : 'Không'}</td>
                <td>${member.borrow_trekking_pole ? 'Có' : 'Không'}</td>
              </tr>
            `
          )
          .join('')}
      </tbody>
    </table>
  `;
}

async function openMembers(bookingId, title) {
  const response = await fetch(`/api/admin/bookings/${bookingId}/members`);
  const members = await response.json();
  memberDialogTitle.textContent = title;
  memberDialogBody.innerHTML = buildMemberTable(members);
  memberDialog.showModal();
}

async function loadBookings() {
  const response = await fetch('/api/admin/bookings');
  const data = await response.json();
  const groupedEntries = Object.entries(data.grouped);

  bookingGroups.innerHTML = groupedEntries
    .map(([tourName, dates]) => {
      const dateBlocks = Object.entries(dates)
        .map(([date, items]) => {
          const tourId = items[0]?.tour_id;
          const guestCount = items.reduce((sum, item) => sum + item.member_count, 0);
          return `
            <section class="date-group">
              <div class="date-group__header">
                <div>
                  <h4>${date}</h4>
                  <p>${guestCount} khách, ${items.length} booking</p>
                </div>
                <button class="btn btn-secondary export-tour-btn" data-tour-id="${tourId}" data-date="${date}" type="button">Xuất Excel</button>
              </div>
              <div class="booking-list">
                ${items
                  .map(
                    (booking) => `
                      <article class="list-card list-card--booking">
                        <div>
                          <h5>${booking.contact_name}</h5>
                          <p>${booking.contact_phone}${booking.contact_email ? ` • ${booking.contact_email}` : ''}</p>
                          <p>${booking.member_count} thành viên</p>
                        </div>
                        <div class="list-card__actions">
                          <button class="btn btn-ghost booking-members-btn" data-booking-id="${booking.id}" data-booking-title="${tourName} - ${date}" type="button">Xem thành viên</button>
                        </div>
                      </article>
                    `
                  )
                  .join('')}
              </div>
            </section>
          `;
        })
        .join('');

      return `
        <article class="tour-group-card">
          <h3>${tourName}</h3>
          ${dateBlocks}
        </article>
      `;
    })
    .join('');

  bookingGroups.querySelectorAll('.booking-members-btn').forEach((button) => {
    button.addEventListener('click', () => openMembers(button.dataset.bookingId, button.dataset.bookingTitle));
  });

  bookingGroups.querySelectorAll('.export-tour-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      bookingStatus.textContent = 'Đang tạo file Excel...';
      try {
        await downloadFile(`/api/admin/export/tour/${button.dataset.tourId}/${button.dataset.date}`, 'tour.xlsx');
        bookingStatus.textContent = 'Đã tải file Excel.';
      } catch (error) {
        bookingStatus.textContent = error.message;
      }
    });
  });
}

tourForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const tourId = document.querySelector('#tour_form_id').value;
  const method = tourId ? 'PUT' : 'POST';
  const url = tourId ? `/api/admin/tours/${tourId}` : '/api/admin/tours';

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tourFormPayload())
  });

  const result = await response.json();
  tourStatus.textContent = result.message;

  if (response.ok) {
    resetTourForm();
    await Promise.all([loadTours(), loadBookings()]);
  }
});

document.querySelector('#tour-reset-btn').addEventListener('click', resetTourForm);

memberDialogClose.addEventListener('click', () => memberDialog.close());

adminLogoutButton.addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  window.location.href = '/';
});

exportWeekButton.addEventListener('click', async () => {
  bookingStatus.textContent = 'Đang tạo file Excel tuần này...';
  try {
    await downloadFile('/api/admin/export/week', 'Tour-tuan.xlsx');
    bookingStatus.textContent = 'Đã tải file tổng hợp tuần.';
  } catch (error) {
    bookingStatus.textContent = error.message;
  }
});

Promise.all([loadTours(), loadBookings()]).catch(() => {
  bookingStatus.textContent = 'Không tải được dữ liệu admin.';
});
