const db = require('../database/client');

const BookingMemberModel = {
  async createMany(bookingId, members) {
    for (const member of members) {
      await db.run(
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
          toLocalIsoDate(new Date(member.dob), false),
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
    }
  },

  async getByBookingId(bookingId) {
    return db.all(`
      SELECT *
      FROM booking_members
      WHERE booking_id = ?
      ORDER BY id ASC
    `, [bookingId]);
  },

  async deleteById(memberId) {
    return db.run('DELETE FROM booking_members WHERE id = ?', [memberId]);
  }
};

module.exports = BookingMemberModel;

function toLocalIsoDate(date, includeTime = true) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = includeTime ? String(date.getHours()).padStart(2, '0') : '';
  const minutes = includeTime ? String(date.getMinutes()).padStart(2, '0') : '';
  const seconds = includeTime ? String(date.getSeconds()).padStart(2, '0') : '';
  return `${year}-${month}-${day}${hours}${minutes}${seconds}`;
}