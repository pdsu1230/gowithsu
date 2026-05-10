const db = require('../database/client');

const TourModel = {
  async getAll() {
    const rows = await db.all('SELECT * FROM tours ORDER BY created_at DESC, id DESC');
    return rows;
  },

  async getAllWithGuestStats() {
    const rows = await db.all(`
      SELECT
        tours.*,
        COUNT(booking_members.id) AS booked_guest_count
      FROM tours
      LEFT JOIN bookings ON bookings.tour_id = tours.id
      LEFT JOIN booking_members ON booking_members.booking_id = bookings.id
      GROUP BY tours.id
      ORDER BY tours.created_at DESC, tours.id DESC
    `);
    return rows;
  },

  async getById(id) {
    const row = await db.get('SELECT * FROM tours WHERE id = ?', [id]);
    return row;
  },

  async create(data) {
    const result = await db.run(`
      INSERT INTO tours (
        title,
        category,
        location,
        duration,
        difficulty,
        description,
        image_url,
        image_urls,
        best_time,
        max_altitude,
        fixed_guest_count,
        trip_details,
        notes_text,
        quote_text,
        price,
        itinerary_days,
        itinerary_day1,
        itinerary_day2,
        itinerary_day3,
        includes_text,
        excludes_text
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.title,
      data.category,
      data.location,
      data.duration,
      data.difficulty,
      data.description,
      data.image_url,
      data.image_urls,
      data.best_time,
      data.max_altitude,
      data.fixed_guest_count,
      data.trip_details,
      data.notes_text,
      data.quote_text,
      data.price,
      data.itinerary_days,
      data.itinerary_day1,
      data.itinerary_day2,
      data.itinerary_day3,
      data.includes_text,
      data.excludes_text
    ]);
    return result;
  },

  async update(id, data) {
    const result = await db.run(`
      UPDATE tours
      SET
        title = ?,
        category = ?,
        location = ?,
        duration = ?,
        difficulty = ?,
        description = ?,
        image_url = ?,
        image_urls = ?,
        best_time = ?,
        max_altitude = ?,
        fixed_guest_count = ?,
        trip_details = ?,
        notes_text = ?,
        quote_text = ?,
        price = ?,
        itinerary_days = ?,
        itinerary_day1 = ?,
        itinerary_day2 = ?,
        itinerary_day3 = ?,
        includes_text = ?,
        excludes_text = ?
      WHERE id = ?
    `, [
      data.title,
      data.category,
      data.location,
      data.duration,
      data.difficulty,
      data.description,
      data.image_url,
      data.image_urls,
      data.best_time,
      data.max_altitude,
      data.fixed_guest_count,
      data.trip_details,
      data.notes_text,
      data.quote_text,
      data.price,
      data.itinerary_days,
      data.itinerary_day1,
      data.itinerary_day2,
      data.itinerary_day3,
      data.includes_text,
      data.excludes_text,
      id
    ]);
    return result;
  },

  async remove(id) {
    const result = await db.run('DELETE FROM tours WHERE id = ?', [id]);
    return result;
  }
};

module.exports = TourModel;
