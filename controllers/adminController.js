const TourModel = require('../models/tour.model');
const BookingModel = require('../models/booking.model');
const BookingMemberModel = require('../models/bookingMember.model');
const {
  formatDateDisplay,
  buildTourWorkbook,
  buildWeeklyWorkbook,
  workbookToBuffer
} = require('../services/excel.service');

function normalizeImageUrlList(rawValue) {
  const raw = String(rawValue || '').trim();
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item || '').trim()).filter(Boolean);
    }
  } catch (_error) {
    return raw
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeDurationLabel(value) {
  const normalized = String(value || '').trim();
  const matchedDays = normalized.match(/(\d+)\s*ngày/i);

  if (matchedDays) {
    return `${matchedDays[1]} ngày`;
  }

  return normalized;
}

function normalizePriceLabel(value) {
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

function normalizeGuestCount(value, fallback = 12) {
  const amount = Number.parseInt(String(value || '').replace(/\D/g, ''), 10);
  if (Number.isNaN(amount) || amount <= 0) {
    return fallback;
  }

  return Math.min(amount, 200);
}

function normalizeItineraryDayItem(item) {
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    return {
      title: String(item.title || '').trim(),
      content: String(item.content ?? item.value ?? '').trim()
    };
  }

  return {
    title: '',
    content: String(item || '').trim()
  };
}

function normalizeItineraryDays(rawValue) {
  if (Array.isArray(rawValue)) {
    return rawValue.map((item) => normalizeItineraryDayItem(item));
  }

  const raw = String(rawValue || '').trim();
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => normalizeItineraryDayItem(item));
    }
  } catch (_error) {
    // Keep backward compatibility with plain text payload values.
  }

  return [];
}

function normalizeCategoryValue(rawValue) {
  const value = String(rawValue || '').trim().toUpperCase();

  if (!value) {
    return 'TREKKING';
  }

  if (value === 'LEO NÚI' || value === 'TREKKING') {
    return 'TREKKING';
  }

  if (value === 'BIỂN') {
    return 'BIỂN';
  }

  if (value === 'ROAD' || value === 'ROAD TRIP') {
    return 'ROAD TRIP';
  }

  if (value === 'HIKING') {
    return 'HIKING';
  }

  return 'TREKKING';
}

function sanitizeTourPayload(payload) {
  const category = normalizeCategoryValue(payload.category);
  const parsedImageUrls = (() => {
    const rawImageUrls = payload.image_urls;

    if (Array.isArray(rawImageUrls)) {
      return rawImageUrls.map((item) => String(item || '').trim()).filter(Boolean);
    }

    if (typeof rawImageUrls === 'string') {
      return normalizeImageUrlList(rawImageUrls);
    }

    return [];
  })();

  const fallbackImageUrl = String(payload.image_url || '').trim();
  const imageUrls = parsedImageUrls.length > 0
    ? parsedImageUrls
    : (fallbackImageUrl ? [fallbackImageUrl] : []);
  const imageUrl = imageUrls[0] || '';
  const normalizedItineraryDays = normalizeItineraryDays(payload.itinerary_days);
  const fallbackItineraryDays = [
    String(payload.itinerary_day1 || '').trim(),
    String(payload.itinerary_day2 || '').trim(),
    String(payload.itinerary_day3 || '').trim()
  ].map((content) => ({ title: '', content }));
  const itineraryDays = (normalizedItineraryDays.length > 0 ? normalizedItineraryDays : fallbackItineraryDays);

  while (itineraryDays.length > 1 && !itineraryDays[itineraryDays.length - 1].content) {
    itineraryDays.pop();
  }

  return {
    title: String(payload.title || '').trim(),
    category,
    location: String(payload.location || '').trim(),
    duration: normalizeDurationLabel(payload.duration),
    difficulty: String(payload.difficulty || '').trim(),
    description: String(payload.description || '').trim(),
    image_url: imageUrl,
    image_urls: JSON.stringify(imageUrls),
    best_time: String(payload.best_time || '').trim(),
    max_altitude: String(payload.max_altitude || '').trim(),
    fixed_guest_count: normalizeGuestCount(payload.fixed_guest_count),
    trip_details: String(payload.trip_details || '').trim(),
    notes_text: String(payload.notes_text || '').trim(),
    quote_text: String(payload.quote_text || '').trim(),
    price: normalizePriceLabel(payload.price),
    itinerary_days: JSON.stringify(itineraryDays),
    itinerary_day1: itineraryDays[0]?.content || '',
    itinerary_day2: itineraryDays[1]?.content || '',
    itinerary_day3: itineraryDays[2]?.content || '',
    includes_text: String(payload.includes_text || '').trim(),
    excludes_text: String(payload.excludes_text || '').trim()
  };
}

function groupBookings(bookings) {
  const grouped = {};

  bookings.forEach((booking) => {
    if (!grouped[booking.tour_title]) {
      grouped[booking.tour_title] = {};
    }

    if (!grouped[booking.tour_title][booking.start_date]) {
      grouped[booking.tour_title][booking.start_date] = [];
    }

    grouped[booking.tour_title][booking.start_date].push(booking);
  });

  return grouped;
}

function toLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekRange(today = new Date()) {
  const currentDay = today.getDay() || 7;
  const start = new Date(today);
  start.setDate(today.getDate() - currentDay + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    startDate: toLocalIsoDate(start),
    endDate: toLocalIsoDate(end)
  };
}

function toAsciiFileName(value, fallback = 'tour-export') {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || fallback;
}

const AdminController = {
  uploadImages(req, res) {
    const files = Array.isArray(req.files) ? req.files : [];

    if (files.length === 0) {
      return res.status(400).json({ message: 'Không có file ảnh nào được upload.' });
    }

    const urls = files.map((file) => `/Images/${file.filename}`);
    return res.json({
      message: 'Upload ảnh thành công.',
      urls,
      fileNames: files.map((file) => file.originalname)
    });
  },

  getTours(req, res) {
    res.json(TourModel.getAllWithGuestStats());
  },

  createTour(req, res) {
    const payload = sanitizeTourPayload(req.body);

    if (!payload.title) {
      return res.status(400).json({ message: 'Tên tour là bắt buộc.' });
    }

    const result = TourModel.create(payload);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Đã tạo tour mới.' });
  },

  updateTour(req, res) {
    const payload = sanitizeTourPayload(req.body);
    const result = TourModel.update(Number(req.params.id), payload);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tour.' });
    }

    res.json({ message: 'Đã cập nhật tour.' });
  },

  deleteTour(req, res) {
    const result = TourModel.remove(Number(req.params.id));

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tour.' });
    }

    res.json({ message: 'Đã xóa tour.' });
  },

  getBookings(req, res) {
    const bookings = BookingModel.getAllWithSummary();
    res.json({
      grouped: groupBookings(bookings),
      list: bookings
    });
  },

  getHistoryBookings(req, res) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const bookings = BookingModel.getAllWithSummary().filter((b) => b.start_date < todayStr);
    // Group by tour + date descending
    const grouped = {};
    bookings.forEach((b) => {
      const key = `${b.tour_id}_${b.start_date}`;
      if (!grouped[key]) {
        grouped[key] = {
          tour_id: b.tour_id,
          tour_title: b.tour_title,
          tour_category: b.tour_category,
          start_date: b.start_date,
          bookings: [],
          total_members: 0
        };
      }
      grouped[key].bookings.push(b);
      grouped[key].total_members += Number(b.member_count || 0);
    });
    const result = Object.values(grouped).sort((a, b) => b.start_date.localeCompare(a.start_date));
    res.json(result);
  },

  getBookingMembers(req, res) {
    const bookingId = Number(req.params.bookingId);
    const members = BookingMemberModel.getByBookingId(bookingId);
    const booking = BookingModel.getById(bookingId);
    const startDate = booking ? booking.start_date : null;
    res.json(members.map((m) => ({ ...m, start_date: startDate, booking_id: bookingId })));
  },

  deleteMember(req, res) {
    const memberId = Number(req.params.memberId);
    if (!memberId) {
      return res.status(400).json({ message: 'ID thành viên không hợp lệ.' });
    }
    BookingMemberModel.deleteById(memberId);
    return res.json({ message: 'Đã xóa thành viên.' });
  },

  updateBookingDate(req, res) {
    const bookingId = Number(req.params.bookingId);
    const { start_date } = req.body;
    if (!start_date || !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
      return res.status(400).json({ message: 'Ngày khởi hành không hợp lệ.' });
    }
    BookingModel.updateStartDate(bookingId, start_date);
    res.json({ message: 'Đã cập nhật ngày khởi hành.' });
  },

  exportTour(req, res) {
    const tourId = Number(req.params.tourId);
    const startDate = req.params.date;
    const rows = BookingModel.getBookingsForTourDate(tourId, startDate);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không có dữ liệu để xuất.' });
    }

    const workbook = buildTourWorkbook(rows);
    const rawFileName = `${rows[0].tour_title}-${formatDateDisplay(startDate)}`;
    const asciiFileName = `${toAsciiFileName(rawFileName, 'tour-export')}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${asciiFileName}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(workbookToBuffer(workbook));
  },

  exportWeek(req, res) {
    const { startDate, endDate } = getWeekRange();
    const overviewRows = BookingModel.getWeeklyOverview(startDate, endDate);

    if (overviewRows.length === 0) {
      return res.status(404).json({ message: 'Không có dữ liệu booking trong tuần này.' });
    }

    const groupedRows = {};
    overviewRows.forEach((row) => {
      const detailRows = BookingModel.getBookingsForTourDate(row.tour_id || 0, row.start_date);
      const sheetName = `${row.tour_title} - ${formatDateDisplay(row.start_date).slice(0, 5)}`;
      groupedRows[sheetName] = detailRows;
    });

    const workbook = buildWeeklyWorkbook(overviewRows, groupedRows);
    res.setHeader('Content-Disposition', 'attachment; filename="Tour-tuan.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(workbookToBuffer(workbook));
  },

  getOverviewStats(req, res) {
    const db = require('../database/db');
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Tours that have at least one completed trip (start_date < today)
    const completedToursRow = db.get(`
      SELECT COUNT(DISTINCT tour_id) AS cnt
      FROM bookings
      WHERE start_date < ?
    `, [todayStr]);
    const totalCompletedTours = completedToursRow ? completedToursRow.cnt : 0;

    // Total guests from past bookings
    const guestTotalRow = db.get(`
      SELECT COUNT(bm.id) AS cnt
      FROM booking_members bm
      JOIN bookings b ON b.id = bm.booking_id
      WHERE b.start_date < ?
    `, [todayStr]);
    const totalGuests = guestTotalRow ? guestTotalRow.cnt : 0;

    // Monthly past guests
    const pastRows = db.all(`
      SELECT
        strftime('%Y-%m', b.start_date) AS month,
        COUNT(bm.id) AS guests
      FROM booking_members bm
      JOIN bookings b ON b.id = bm.booking_id
      WHERE b.start_date < ?
      GROUP BY month
      ORDER BY month ASC
    `, [todayStr]);

    // Monthly upcoming/current guests
    const upcomingRows = db.all(`
      SELECT
        strftime('%Y-%m', b.start_date) AS month,
        COUNT(bm.id) AS guests
      FROM booking_members bm
      JOIN bookings b ON b.id = bm.booking_id
      WHERE b.start_date >= ?
      GROUP BY month
      ORDER BY month ASC
    `, [todayStr]);

    res.json({ totalCompletedTours, totalGuests, past: pastRows, upcoming: upcomingRows });
  }
};

module.exports = AdminController;
