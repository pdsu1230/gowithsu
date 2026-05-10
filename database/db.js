const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const databaseFilePath = process.env.SQLITE_PATH
  ? path.resolve(process.env.SQLITE_PATH)
  : path.join(__dirname, '..', 'database.sqlite');
let dbInstance = null;

function ensureDatabaseDirectory() {
  const directoryPath = path.dirname(databaseFilePath);
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function initDatabase() {
  if (dbInstance) {
    return;
  }

  ensureDatabaseDirectory();
  dbInstance = new Database(databaseFilePath);
  dbInstance.pragma('foreign_keys = ON');

  // Create tables
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS tours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'LEO NÚI',
      location TEXT,
      duration TEXT,
      difficulty TEXT,
      description TEXT,
      image_url TEXT,
      image_urls TEXT,
      best_time TEXT,
      max_altitude TEXT,
      fixed_guest_count INTEGER DEFAULT 12,
      trip_details TEXT,
      notes_text TEXT,
      quote_text TEXT,
      price TEXT,
      itinerary_days TEXT,
      itinerary_day1 TEXT,
      itinerary_day2 TEXT,
      itinerary_day3 TEXT,
      includes_text TEXT,
      excludes_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tour_id INTEGER NOT NULL,
      start_date DATE NOT NULL,
      contact_name TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS booking_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      dob DATE,
      cccd TEXT,
      phone TEXT,
      address TEXT,
      medal INTEGER DEFAULT 0,
      medal_name TEXT,
      medical_condition INTEGER DEFAULT 0,
      medical_note TEXT,
      borrow_bag INTEGER DEFAULT 0,
      borrow_headlamp INTEGER DEFAULT 0,
      borrow_trekking_pole INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    );
  `);

  seedDefaultTours();
}

function seedDefaultTours() {
  const countRow = dbInstance.prepare('SELECT COUNT(*) AS cnt FROM tours').get();
  if (countRow.cnt > 0) {
    return;
  }

  const tours = [
    {
      title: 'Tà Xùa',
      category: 'LEO NÚI',
      location: 'Sơn La',
      duration: '2 ngày',
      difficulty: 'Trung bình',
      description: 'Chinh phục sống lưng khủng long, săn mây và ngắm bình minh trên đỉnh Tà Xùa.',
      image_url: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1400&q=80',
      image_urls: JSON.stringify(['https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1400&q=80']),
      best_time: 'Tháng 10 đến tháng 4',
      max_altitude: '2.865m',
      fixed_guest_count: 12,
      trip_details: 'Tour phù hợp cho người đã có thể lực cơ bản',
      price: '2.490.000đ',
      itinerary_day1: 'Di chuyển từ Hà Nội đến điểm trekking',
      itinerary_day2: 'Dậy sớm săn mây, đón bình minh',
      itinerary_day3: '',
      includes_text: 'Xe đưa đón, hướng dẫn viên, porter',
      excludes_text: 'Chi tiêu cá nhân'
    },
    {
      title: 'Lảo Thẩn',
      category: 'LEO NÚI',
      location: 'Lào Cai',
      duration: '2 ngày',
      difficulty: 'Trung bình',
      description: 'Hành trình lý tưởng cho người mới bắt đầu trekking',
      image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80',
      image_urls: JSON.stringify(['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80']),
      best_time: 'Tháng 9 đến tháng 3',
      max_altitude: '2.860m',
      fixed_guest_count: 10,
      trip_details: 'Lảo Thẩn là lựa chọn phù hợp cho người mới',
      price: '2.290.000đ',
      itinerary_day1: 'Khởi hành từ Hà Nội',
      itinerary_day2: 'Leo đỉnh từ sáng sớm',
      itinerary_day3: '',
      includes_text: 'Xe, porter, ăn uống',
      excludes_text: 'Chi tiêu cá nhân'
    },
    {
      title: 'Tả Liên',
      category: 'LEO NÚI',
      location: 'Lai Châu',
      duration: '3 ngày',
      difficulty: 'Khó',
      description: 'Khám phá rừng nguyên sinh rêu phong',
      image_url: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1400&q=80',
      image_urls: JSON.stringify(['https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1400&q=80']),
      best_time: 'Tháng 10 đến tháng 3',
      max_altitude: '2.996m',
      fixed_guest_count: 8,
      trip_details: 'Hành trình dành cho nhóm đã quen trekking',
      price: '3.390.000đ',
      itinerary_day1: 'Di chuyển đến Lai Châu',
      itinerary_day2: 'Trekking sâu trong rừng',
      itinerary_day3: 'Chạm đỉnh, quay về',
      includes_text: 'Xe, porter, ăn, lều, bảo hiểm',
      excludes_text: 'Thuê thiết bị'
    }
  ];

  const insert = dbInstance.prepare(`
    INSERT INTO tours (
      title, category, location, duration, difficulty, description,
      image_url, image_urls, best_time, max_altitude, fixed_guest_count,
      trip_details, price, itinerary_day1, itinerary_day2, itinerary_day3,
      includes_text, excludes_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  tours.forEach((tour) => {
    insert.run(
      tour.title, tour.category, tour.location, tour.duration, tour.difficulty,
      tour.description, tour.image_url, tour.image_urls, tour.best_time,
      tour.max_altitude, tour.fixed_guest_count, tour.trip_details, tour.price,
      tour.itinerary_day1, tour.itinerary_day2, tour.itinerary_day3,
      tour.includes_text, tour.excludes_text
    );
  });
}

function getDb() {
  if (!dbInstance) {
    initDatabase();
  }
  return dbInstance;
}

function exec(sql) {
  const db = getDb();
  db.exec(sql);
}

function run(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  const info = stmt.run(...params);
  return {
    changes: info.changes,
    lastInsertRowid: info.lastInsertRowid
  };
}

function get(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.get(...params) || null;
}

function all(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

function transaction(fn) {
  const db = getDb();
  const txn = db.transaction(fn);
  return txn;
}

// Initialize on module load
initDatabase();

module.exports = {
  initDatabase,
  getDb,
  exec,
  run,
  get,
  all,
  transaction
};
