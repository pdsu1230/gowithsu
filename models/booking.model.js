const db = require('../database/db');

const BookingModel = {
  create(data) {
    return db.run(`
      INSERT INTO bookings (
        tour_id,
        start_date,
        contact_name,
        contact_phone,
        contact_email
      )
      VALUES (?, ?, ?, ?, ?)
    `, [data.tour_id, data.start_date, data.contact_name, data.contact_phone, data.contact_email]);
  },

  getAllWithSummary() {
    return db.all(`
      SELECT
        bookings.id,
        bookings.tour_id,
        bookings.start_date,
        bookings.contact_name,
        bookings.contact_phone,
        bookings.contact_email,
        bookings.status,
        bookings.created_at,
        tours.title AS tour_title,
        tours.category AS tour_category,
        COUNT(booking_members.id) AS member_count
      FROM bookings
      JOIN tours ON tours.id = bookings.tour_id
      LEFT JOIN booking_members ON booking_members.booking_id = bookings.id
      GROUP BY bookings.id
      ORDER BY bookings.start_date ASC, tours.title ASC, bookings.created_at ASC
    `);
  },

  getWeeklyOverview(startDate, endDate) {
    return db.all(`
      SELECT
        bookings.tour_id,
        tours.title AS tour_title,
        bookings.start_date,
        COUNT(booking_members.id) AS total_guests
      FROM bookings
      JOIN tours ON tours.id = bookings.tour_id
      LEFT JOIN booking_members ON booking_members.booking_id = bookings.id
      WHERE bookings.start_date BETWEEN ? AND ?
      GROUP BY bookings.tour_id, bookings.start_date
      ORDER BY bookings.start_date ASC, tours.title ASC
    `, [startDate, endDate]);
  },

  getUpcomingOverview(startDate, excludeTourId = null) {
    const params = [startDate];
    let excludeClause = '';

    if (excludeTourId) {
      excludeClause = 'AND bookings.tour_id != ?';
      params.push(excludeTourId);
    }

    return db.all(`
      SELECT
        bookings.tour_id,
        tours.title AS tour_title,
        bookings.start_date,
        COUNT(booking_members.id) AS total_guests
      FROM bookings
      JOIN tours ON tours.id = bookings.tour_id
      LEFT JOIN booking_members ON booking_members.booking_id = bookings.id
      WHERE bookings.start_date >= ?
        ${excludeClause}
      GROUP BY bookings.tour_id, bookings.start_date
      ORDER BY bookings.start_date ASC, total_guests DESC, tours.title ASC
    `, params);
  },

  getBookingsForTourDate(tourId, startDate) {
    return db.all(`
      SELECT
        bookings.id,
        bookings.start_date,
        bookings.contact_name,
        bookings.contact_phone,
        bookings.contact_email,
        tours.title AS tour_title,
        booking_members.name,
        booking_members.dob,
        booking_members.cccd,
        booking_members.phone,
        booking_members.address,
        booking_members.medal,
        booking_members.medal_name,
        booking_members.medical_note,
        booking_members.borrow_bag,
        booking_members.borrow_headlamp,
        booking_members.borrow_trekking_pole
      FROM bookings
      JOIN tours ON tours.id = bookings.tour_id
      JOIN booking_members ON booking_members.booking_id = bookings.id
      WHERE bookings.tour_id = ? AND bookings.start_date = ?
      ORDER BY booking_members.name COLLATE NOCASE ASC
    `, [tourId, startDate]);
  },

  updateStartDate(bookingId, newDate) {
    return db.run(
      `UPDATE bookings SET start_date = ? WHERE id = ?`,
      [newDate, bookingId]
    );
  },

  getById(bookingId) {
    return db.get(`SELECT * FROM bookings WHERE id = ?`, [bookingId]);
  }
};

module.exports = BookingModel;
