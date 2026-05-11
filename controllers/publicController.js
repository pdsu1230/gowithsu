const TourModel = require('../models/tour.model');
const BookingModel = require('../models/booking.model');
const BookingMemberModel = require('../models/bookingMember.model');
const db = require('../database/client');

function normalizeMember(member) {
  return {
    name: String(member.name || '').trim(),
    dob: member.dob || null,
    cccd: String(member.cccd || '').trim(),
    phone: String(member.phone || '').trim(),
    address: String(member.address || '').trim(),
    medal: member.medal ? 1 : 0,
    medal_name: member.medal ? String(member.medal_name || '').trim() : '',
    medical_condition: member.medical_note ? 1 : 0,
    medical_note: String(member.medical_note || '').trim(),
    borrow_bag: member.borrow_bag ? 1 : 0,
    borrow_headlamp: member.borrow_headlamp ? 1 : 0,
    borrow_trekking_pole: member.borrow_trekking_pole ? 1 : 0
  };
}

function toLocalIsoDate(date, includeTime = false) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return includeTime
    ? `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
    : `${year}-${month}-${day}`;
}

function getWeekendRange(today = new Date()) {
  const currentDay = today.getDay();
  const saturday = new Date(today);
  const sunday = new Date(today);

  if (currentDay === 0) {
    saturday.setDate(today.getDate() - 1);
  } else {
    saturday.setDate(today.getDate() + (6 - currentDay));
  }

  sunday.setDate(saturday.getDate() + 1);

  return {
    startDate: toLocalIsoDate(saturday, true),
    endDate: toLocalIsoDate(sunday, true)
  };
}

async function getFeaturedWeekendTour() {
  const { startDate, endDate } = getWeekendRange();
  const weekendTours = (await BookingModel.getWeeklyOverview(startDate, endDate))
    .slice()
    .sort((left, right) => {
      return (
        right.total_guests - left.total_guests ||
        new Date(left.start_date) - new Date(right.start_date) ||
        String(left.tour_title || '').localeCompare(String(right.tour_title || ''), 'vi')
      );
    });

  if (weekendTours.length > 0) {
    const featuredTour = await TourModel.getById(Number(weekendTours[0].tour_id));
    if (featuredTour) {
      return {
        tour: featuredTour,
        scheduledDate: weekendTours[0].start_date,
        source: 'weekend'
      };
    }
  }

  const fallbackTour = (await TourModel.getAll())[0] || null;
  return {
    tour: fallbackTour,
    scheduledDate: null,
    source: 'fallback'
  };
}

async function getSuggestedUpcomingTour(excludeTourId) {
  const today = toLocalIsoDate(new Date(), false);
  const upcomingTours = (await BookingModel.getUpcomingOverview(today, excludeTourId))
    .slice()
    .sort((left, right) => {
      return (
        new Date(left.start_date) - new Date(right.start_date) ||
        right.total_guests - left.total_guests ||
        String(left.tour_title || '').localeCompare(String(right.tour_title || ''), 'vi')
      );
    });

  if (upcomingTours.length > 0) {
    const suggestedTour = await TourModel.getById(Number(upcomingTours[0].tour_id));
    if (suggestedTour) {
      return {
        tour: suggestedTour,
        scheduledDate: upcomingTours[0].start_date,
        source: 'upcoming'
      };
    }
  }

  const fallbackTour = (await TourModel.getAll()).find((tour) => Number(tour.id) !== Number(excludeTourId)) || null;
  return {
    tour: fallbackTour,
    scheduledDate: null,
    source: 'fallback'
  };
}

const PublicController = {
  async getTours(req, res) {
    res.json(await TourModel.getAll());
  },

  async getDiscoverTour(req, res) {
    const featured = await getFeaturedWeekendTour();

    if (!featured.tour) {
      return res.status(404).json({ message: 'Chưa có tour để khám phá.' });
    }

    return res.json({
      id: featured.tour.id,
      title: featured.tour.title,
      href: `/tour/${featured.tour.id}`,
      scheduledDate: featured.scheduledDate,
      source: featured.source
    });
  },

  async getRandomTour(req, res) {
    const excludeTourId = Number(req.query.excludeTourId || 0);
    const today = toLocalIsoDate(new Date(), false);

    // Priority 1: upcoming tours sorted by date
    const upcomingTours = (await BookingModel.getUpcomingOverview(today, excludeTourId))
      .slice()
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    if (upcomingTours.length > 0) {
      // Pick randomly among the upcoming ones (weighted toward sooner dates)
      const pick = upcomingTours[Math.floor(Math.random() * Math.min(upcomingTours.length, 5))];
      const tour = await TourModel.getById(Number(pick.tour_id));
      if (tour) {
        return res.json({ id: tour.id, title: tour.title, href: `/tour/${tour.id}`, scheduledDate: pick.start_date, source: 'upcoming' });
      }
    }

    // Fallback: pick any tour randomly except current
    const allTours = (await TourModel.getAll()).filter((t) => Number(t.id) !== excludeTourId);
    if (allTours.length === 0) {
      return res.status(404).json({ message: 'Không có tour nào.' });
    }
    const tour = allTours[Math.floor(Math.random() * allTours.length)];
    return res.json({ id: tour.id, title: tour.title, href: `/tour/${tour.id}`, scheduledDate: null, source: 'random' });
  },

  async getSuggestedTour(req, res) {
    const excludeTourId = Number(req.query.excludeTourId || 0);
    const suggested = await getSuggestedUpcomingTour(excludeTourId);

    if (!suggested.tour) {
      return res.status(404).json({ message: 'Chưa có tour gợi ý phù hợp.' });
    }

    return res.json({
      id: suggested.tour.id,
      title: suggested.tour.title,
      href: `/tour/${suggested.tour.id}`,
      scheduledDate: suggested.scheduledDate,
      source: suggested.source,
      image_url: suggested.tour.image_url || null,
      image_urls: suggested.tour.image_urls || null,
      category: suggested.tour.category || null
    });
  },

  async getTourById(req, res) {
    const tour = await TourModel.getById(Number(req.params.id));
    if (!tour) {
      return res.status(404).json({ message: 'Không tìm thấy tour.' });
    }

    return res.json(tour);
  },

  async getUpcomingSchedule(req, res) {
    const today = new Date();
    const startDate = toLocalIsoDate(today);
    const endDate = toLocalIsoDate(new Date(today.getFullYear(), today.getMonth() + 2, 0));

    const rows = await db.all(`
      SELECT
        bookings.tour_id,
        tours.title AS tour_title,
        bookings.start_date,
        COUNT(booking_members.id) AS total_guests
      FROM bookings
      JOIN tours ON tours.id = bookings.tour_id
      LEFT JOIN booking_members ON booking_members.booking_id = bookings.id
      WHERE bookings.start_date BETWEEN ? AND ?
      GROUP BY bookings.tour_id, tours.title, bookings.start_date
      ORDER BY bookings.start_date ASC, tours.title ASC
    `, [startDate, endDate]);

    return res.json(rows);
  },

  async getFeaturedUpcomingTours(req, res) {
    const today = toLocalIsoDate(new Date());

    // Get distinct tour_ids with soonest upcoming booking, pick 3 unique tours
    const upcoming = await db.all(`
      SELECT
        bookings.tour_id,
        MIN(bookings.start_date) AS next_date
      FROM bookings
      JOIN tours ON tours.id = bookings.tour_id
      WHERE bookings.start_date >= ?
      GROUP BY bookings.tour_id
      ORDER BY next_date ASC
      LIMIT 3
    `, [today]);

    const tours = [];
    for (const row of upcoming) {
      const tour = await TourModel.getById(Number(row.tour_id));
      if (tour) {
        tours.push({ ...tour, next_date: row.next_date });
      }
    }

    return res.json(tours);
  },

  async createBooking(req, res) {
    const {
      tour_id,
      start_date,
      members
    } = req.body;

    if (!tour_id || !start_date) {
      return res.status(400).json({ message: 'Tour và ngày khởi hành là bắt buộc.' });
    }

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'Cần ít nhất 1 thành viên booking.' });
    }

    const normalizedMembers = members.map(normalizeMember);
    const hasInvalidMember = normalizedMembers.some((member) => !member.name);

    if (hasInvalidMember) {
      return res.status(400).json({ message: 'Mỗi thành viên đều phải có họ tên.' });
    }

    const firstMember = normalizedMembers[0];
    const normalizedContactName = firstMember.name;
    const normalizedContactPhone = firstMember.phone;
    const normalizedContactEmail = '';

    const tour = await TourModel.getById(Number(tour_id));
    if (!tour) {
      return res.status(404).json({ message: 'Tour không tồn tại.' });
    }

    const bookingResult = await BookingModel.create({
      tour_id: Number(tour_id),
      start_date,
      contact_name: normalizedContactName,
      contact_phone: normalizedContactPhone,
      contact_email: normalizedContactEmail
    });

    await BookingMemberModel.createMany(bookingResult.lastInsertRowid, normalizedMembers);

    return res.status(201).json({
      message: 'Booking thành công. Chúng tôi sẽ liên hệ với bạn sớm.',
      bookingId: bookingResult.lastInsertRowid
    });
  }
};

module.exports = PublicController;
