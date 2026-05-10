const path = require('path');
const Database = require('better-sqlite3');
const { getPool, initSchema } = require('../database/postgres');

function getSqlitePath() {
  if (process.env.SQLITE_PATH) {
    return path.resolve(process.env.SQLITE_PATH);
  }
  return path.join(__dirname, '..', 'database.sqlite');
}

function readSqliteData(sqlitePath) {
  const sqlite = new Database(sqlitePath, { readonly: true });

  const tours = sqlite.prepare('SELECT * FROM tours ORDER BY id ASC').all();
  const bookings = sqlite.prepare('SELECT * FROM bookings ORDER BY id ASC').all();
  const members = sqlite.prepare('SELECT * FROM booking_members ORDER BY id ASC').all();

  sqlite.close();

  return { tours, bookings, members };
}

async function resetTargetTables(client) {
  await client.query('TRUNCATE TABLE booking_members, bookings, tours RESTART IDENTITY CASCADE');
}

async function syncSequences(client) {
  await client.query(`
    SELECT setval(pg_get_serial_sequence('tours', 'id'), COALESCE((SELECT MAX(id) FROM tours), 1), (SELECT COUNT(*) > 0 FROM tours));
    SELECT setval(pg_get_serial_sequence('bookings', 'id'), COALESCE((SELECT MAX(id) FROM bookings), 1), (SELECT COUNT(*) > 0 FROM bookings));
    SELECT setval(pg_get_serial_sequence('booking_members', 'id'), COALESCE((SELECT MAX(id) FROM booking_members), 1), (SELECT COUNT(*) > 0 FROM booking_members));
  `);
}

async function insertTours(client, tours) {
  const sql = `
    INSERT INTO tours (
      id, title, category, location, duration, difficulty, description, image_url, image_urls,
      best_time, max_altitude, fixed_guest_count, trip_details, notes_text, quote_text,
      price, itinerary_days, itinerary_day1, itinerary_day2, itinerary_day3,
      includes_text, excludes_text, created_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,
      $10,$11,$12,$13,$14,$15,
      $16,$17,$18,$19,$20,
      $21,$22,$23
    )
    ON CONFLICT (id) DO NOTHING
  `;

  for (const row of tours) {
    await client.query(sql, [
      row.id,
      row.title,
      row.category,
      row.location,
      row.duration,
      row.difficulty,
      row.description,
      row.image_url,
      row.image_urls,
      row.best_time,
      row.max_altitude,
      row.fixed_guest_count,
      row.trip_details,
      row.notes_text,
      row.quote_text,
      row.price,
      row.itinerary_days,
      row.itinerary_day1,
      row.itinerary_day2,
      row.itinerary_day3,
      row.includes_text,
      row.excludes_text,
      row.created_at
    ]);
  }
}

async function insertBookings(client, bookings) {
  const sql = `
    INSERT INTO bookings (
      id, tour_id, start_date, contact_name, contact_phone, contact_email, status, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (id) DO NOTHING
  `;

  for (const row of bookings) {
    await client.query(sql, [
      row.id,
      row.tour_id,
      row.start_date,
      row.contact_name,
      row.contact_phone,
      row.contact_email,
      row.status,
      row.created_at
    ]);
  }
}

async function insertMembers(client, members) {
  const sql = `
    INSERT INTO booking_members (
      id, booking_id, name, dob, cccd, phone, address,
      medal, medal_name, medical_condition, medical_note,
      borrow_bag, borrow_headlamp, borrow_trekking_pole, created_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,
      $8,$9,$10,$11,
      $12,$13,$14,$15
    )
    ON CONFLICT (id) DO NOTHING
  `;

  for (const row of members) {
    await client.query(sql, [
      row.id,
      row.booking_id,
      row.name,
      row.dob,
      row.cccd,
      row.phone,
      row.address,
      row.medal,
      row.medal_name,
      row.medical_condition,
      row.medical_note,
      row.borrow_bag,
      row.borrow_headlamp,
      row.borrow_trekking_pole,
      row.created_at
    ]);
  }
}

async function main() {
  const sqlitePath = getSqlitePath();
  const { tours, bookings, members } = readSqliteData(sqlitePath);

  console.log(`Read from SQLite: tours=${tours.length}, bookings=${bookings.length}, members=${members.length}`);

  await initSchema();
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (process.env.RESET_PG === 'true') {
      await resetTargetTables(client);
      console.log('Target tables truncated (RESET_PG=true).');
    }

    await insertTours(client, tours);
    await insertBookings(client, bookings);
    await insertMembers(client, members);
    await syncSequences(client);

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error.message);
  process.exit(1);
});
