const db = require('../database/db');

const BookingMemberModel = {
  createMany(bookingId, members) {
    members.forEach((member) => {
      db.run(
        `
          INSERT INTO booking_members (
            booking_id,
            name,
            dob,
            cccd,
            phone,
            address,
            medal,
            medal_name,
            medical_condition,
            medical_note,
            borrow_bag,
            borrow_headlamp,
            borrow_trekking_pole
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          bookingId,
          member.name,
          member.dob,
          member.cccd,
          member.phone,
          member.address,
          member.medal,
          member.medal_name,
          member.medical_condition,
          member.medical_note,
          member.borrow_bag,
          member.borrow_headlamp,
          member.borrow_trekking_pole
        ]
      );
    });
  },

  getByBookingId(bookingId) {
    return db.all(`
      SELECT *
      FROM booking_members
      WHERE booking_id = ?
      ORDER BY id ASC
    `, [bookingId]);
  },

  deleteById(memberId) {
    db.run('DELETE FROM booking_members WHERE id = ?', [memberId]);
  }
};

module.exports = BookingMemberModel;
