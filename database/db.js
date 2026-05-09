const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const databaseFilePath = path.join(__dirname, '..', 'database.sqlite');

let SQL;
let db;
let inTransaction = false;

function getDb() {
  if (!db) {
    throw new Error('Database has not been initialized yet.');
  }

  return db;
}

function normalizeValue(value) {
  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value);
  }

  return value;
}

function mapStatementRows(statement) {
  const rows = [];
  while (statement.step()) {
    const rawRow = statement.getAsObject();
    const normalizedRow = Object.fromEntries(
      Object.entries(rawRow).map(([key, value]) => [key, normalizeValue(value)])
    );
    rows.push(normalizedRow);
  }
  statement.free();
  return rows;
}

function persistDatabase() {
  const data = getDb().export();
  fs.writeFileSync(databaseFilePath, Buffer.from(data));
}

function shouldPersist(sql) {
  return /^\s*(insert|update|delete|create|drop|alter|replace|begin|commit|rollback)/i.test(sql);
}

function exec(sql) {
  getDb().exec(sql);
  if (!inTransaction && shouldPersist(sql)) {
    persistDatabase();
  }
}

function run(sql, params = []) {
  const statement = getDb().prepare(sql);
  statement.run(params);
  statement.free();

  const result = {
    changes: getDb().getRowsModified(),
    lastInsertRowid: get('SELECT last_insert_rowid() AS id')?.id || null
  };

  if (!inTransaction && shouldPersist(sql)) {
    persistDatabase();
  }

  return result;
}

function get(sql, params = []) {
  const statement = getDb().prepare(sql, params);
  const rows = mapStatementRows(statement);
  return rows[0] || null;
}

function all(sql, params = []) {
  const statement = getDb().prepare(sql, params);
  return mapStatementRows(statement);
}

function transaction(callback) {
  getDb().exec('BEGIN TRANSACTION;');
  inTransaction = true;

  try {
    const result = callback();
    getDb().exec('COMMIT;');
    inTransaction = false;
    persistDatabase();
    return result;
  } catch (error) {
    inTransaction = false;
    try {
      getDb().exec('ROLLBACK;');
    } catch (rollbackError) {
      console.error('Rollback failed', rollbackError);
    }
    throw error;
  }
}

function seedToursIfNeeded() {
  const countTours = get('SELECT COUNT(*) AS count FROM tours');

  if (countTours && countTours.count > 0) {
    return;
  }

  transaction(() => {
    [
      {
        title: 'Tà Xùa',
        category: 'LEO NÚI',
        location: 'Sơn La',
        duration: '2 ngày',
        difficulty: 'Trung bình',
        description: 'Chinh phục sống lưng khủng long, săn mây và ngắm bình minh trên đỉnh Tà Xùa.',
        image_url: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1400&q=80',
        image_urls: JSON.stringify([
          'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1400&q=80'
        ]),
        best_time: 'Tháng 10 đến tháng 4',
        max_altitude: '2.865m',
        fixed_guest_count: 12,
        trip_details: 'Tour phù hợp cho người đã có thể lực cơ bản, muốn trải nghiệm săn mây và trekking cung núi đặc trưng miền Bắc với lịch trình gọn, nhịp đi chắc và điểm cắm trại đẹp.',
        price: '2.490.000đ',
        itinerary_day1: 'Di chuyển từ Hà Nội đến điểm trekking, nhận briefing an toàn, bắt đầu leo qua sống lưng núi và cắm trại.',
        itinerary_day2: 'Dậy sớm săn mây, đón bình minh, quay về lán nghỉ, ăn trưa và kết thúc hành trình.',
        includes_text: 'Xe đưa đón, hướng dẫn viên, porter hỗ trợ chung, bữa ăn theo chương trình, lều trại cơ bản.',
        excludes_text: 'Chi tiêu cá nhân, đồ uống ngoài chương trình, thuê thiết bị cá nhân chuyên dụng.'
      },
      {
        title: 'Lảo Thẩn',
        category: 'LEO NÚI',
        location: 'Lào Cai',
        duration: '2 ngày',
        difficulty: 'Trung bình',
        description: 'Hành trình lý tưởng cho người mới bắt đầu trekking với cung đường đẹp và dễ tiếp cận.',
        image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80',
        image_urls: JSON.stringify([
          'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80'
        ]),
        best_time: 'Tháng 9 đến tháng 3',
        max_altitude: '2.860m',
        fixed_guest_count: 10,
        trip_details: 'Lảo Thẩn là lựa chọn phù hợp cho người mới làm quen trekking với quãng leo vừa phải, cảnh quan thoáng và cơ hội ngắm mây cao nếu thời tiết thuận lợi.',
        price: '2.290.000đ',
        itinerary_day1: 'Khởi hành từ Hà Nội, di chuyển lên Lào Cai, bắt đầu trekking qua các triền cỏ và điểm nghỉ giữa đường.',
        itinerary_day2: 'Leo đỉnh từ sáng sớm, chụp hình biển mây, quay xuống bản và lên xe về lại Hà Nội.',
        includes_text: 'Xe cabin hoặc xe ghế ngồi, porter hỗ trợ tải đồ chung, ăn uống cơ bản, hướng dẫn viên địa phương.',
        excludes_text: 'Thuê đồ cá nhân, chi phí phát sinh vì thời tiết, tip porter và hướng dẫn viên.'
      },
      {
        title: 'Tả Liên',
        category: 'LEO NÚI',
        location: 'Lai Châu',
        duration: '3 ngày',
        difficulty: 'Khó',
        description: 'Khám phá rừng nguyên sinh rêu phong, đồi thông xanh thẳm và cung trekking đầy thử thách.',
        image_url: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1400&q=80',
        image_urls: JSON.stringify([
          'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1400&q=80'
        ]),
        best_time: 'Tháng 10 đến tháng 3',
        max_altitude: '2.996m',
        fixed_guest_count: 8,
        trip_details: 'Hành trình dành cho nhóm đã quen trekking nhiều giờ mỗi ngày, nổi bật bởi rừng già phủ rêu và địa hình thay đổi liên tục.',
        price: '3.390.000đ',
        itinerary_day1: 'Di chuyển đến Lai Châu, gặp porter, bắt đầu leo vào rừng và nghỉ đêm tại lán.',
        itinerary_day2: 'Trekking sâu trong rừng nguyên sinh, băng qua các đoạn dốc dài, nghỉ đêm ở cao độ lớn hơn.',
        itinerary_day3: 'Chạm đỉnh vào sáng sớm, quay về điểm đón và lên xe kết thúc chuyến đi.',
        includes_text: 'Xe khứ hồi, porter địa phương, ăn chính theo lịch trình, ngủ lán hoặc lều, bảo hiểm cơ bản.',
        excludes_text: 'Thuê thiết bị riêng, chi phí rescue cá nhân, tip và các dịch vụ ngoài chương trình.'
      }
    ].forEach((tour) => {
      run(
        `
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
            price,
            itinerary_day1,
            itinerary_day2,
            itinerary_day3,
            includes_text,
            excludes_text
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          tour.title,
          tour.category,
          tour.location,
          tour.duration,
          tour.difficulty,
          tour.description,
          tour.image_url,
          tour.image_urls || '',
          tour.best_time,
          tour.max_altitude,
          tour.fixed_guest_count || 12,
          tour.trip_details,
          tour.price,
          tour.itinerary_day1 || '',
          tour.itinerary_day2 || '',
          tour.itinerary_day3 || '',
          tour.includes_text || '',
          tour.excludes_text || ''
        ]
      );
    });
  });
}

function ensureTourCategoryColumn() {
  const columns = all('PRAGMA table_info(tours)');
  const hasCategory = columns.some((column) => column.name === 'category');

  if (!hasCategory) {
    exec("ALTER TABLE tours ADD COLUMN category TEXT DEFAULT 'LEO NÚI'");
  }

  run(
    `
      UPDATE tours
      SET category = 'LEO NÚI'
      WHERE category IS NULL OR TRIM(category) = ''
    `
  );

  run(
    `
      UPDATE tours
      SET category = 'LEO NÚI'
      WHERE category = 'Núi'
    `
  );

  run(
    `
      UPDATE tours
      SET category = 'BIỂN'
      WHERE category = 'Biển'
    `
  );

  run(
    `
      UPDATE tours
      SET category = 'ROAD TRIP'
      WHERE category = 'Road'
    `
  );
}

function ensureTourDetailColumns() {
  const columns = all('PRAGMA table_info(tours)');
  const columnNames = columns.map((column) => column.name);

  if (!columnNames.includes('itinerary_days')) {
    exec("ALTER TABLE tours ADD COLUMN itinerary_days TEXT DEFAULT ''");
  }

  if (!columnNames.includes('itinerary_day1')) {
    exec("ALTER TABLE tours ADD COLUMN itinerary_day1 TEXT DEFAULT ''");
  }

  if (!columnNames.includes('itinerary_day2')) {
    exec("ALTER TABLE tours ADD COLUMN itinerary_day2 TEXT DEFAULT ''");
  }

  if (!columnNames.includes('itinerary_day3')) {
    exec("ALTER TABLE tours ADD COLUMN itinerary_day3 TEXT DEFAULT ''");
  }

  if (!columnNames.includes('includes_text')) {
    exec("ALTER TABLE tours ADD COLUMN includes_text TEXT DEFAULT ''");
  }

  if (!columnNames.includes('excludes_text')) {
    exec("ALTER TABLE tours ADD COLUMN excludes_text TEXT DEFAULT ''");
  }

  if (!columnNames.includes('image_url')) {
    exec("ALTER TABLE tours ADD COLUMN image_url TEXT DEFAULT ''");
  }

  if (!columnNames.includes('image_urls')) {
    exec("ALTER TABLE tours ADD COLUMN image_urls TEXT DEFAULT ''");
  }

  if (!columnNames.includes('best_time')) {
    exec("ALTER TABLE tours ADD COLUMN best_time TEXT DEFAULT ''");
  }

  if (!columnNames.includes('max_altitude')) {
    exec("ALTER TABLE tours ADD COLUMN max_altitude TEXT DEFAULT ''");
  }

  if (!columnNames.includes('fixed_guest_count')) {
    exec('ALTER TABLE tours ADD COLUMN fixed_guest_count INTEGER DEFAULT 12');
  }

  if (!columnNames.includes('trip_details')) {
    exec("ALTER TABLE tours ADD COLUMN trip_details TEXT DEFAULT ''");
  }

  if (!columnNames.includes('price')) {
    exec("ALTER TABLE tours ADD COLUMN price TEXT DEFAULT ''");
  }

  run(`
    UPDATE tours
    SET fixed_guest_count = 12
    WHERE fixed_guest_count IS NULL OR fixed_guest_count <= 0
  `);

  const tours = all(`
    SELECT id, itinerary_days, itinerary_day1, itinerary_day2, itinerary_day3
    FROM tours
  `);

  transaction(() => {
    tours.forEach((tour) => {
      const rawItineraryDays = String(tour.itinerary_days || '').trim();

      // Check if itinerary_days is already valid (non-empty and not corrupted)
      let isValid = false;
      if (rawItineraryDays) {
        try {
          const parsed = JSON.parse(rawItineraryDays);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Only treat literal string "[object Object]" as corrupted legacy data.
            // Legitimate itinerary items are objects like { title, content } and must be preserved.
            const hasCorrupted = parsed.some((item) => (
              typeof item === 'string' && item.includes('[object Object]')
            ));
            isValid = !hasCorrupted;
          }
        } catch (_e) {}
      }

      if (isValid) {
        return;
      }

      const fallbackDays = [tour.itinerary_day1, tour.itinerary_day2, tour.itinerary_day3]
        .map((item) => String(item || '').trim());

      while (fallbackDays.length > 1 && !fallbackDays[fallbackDays.length - 1]) {
        fallbackDays.pop();
      }

      const normalizedDays = fallbackDays.map((content) => ({ title: '', content }));

      run(
        `UPDATE tours SET itinerary_days = ? WHERE id = ?`,
        [JSON.stringify(normalizedDays), tour.id]
      );
    });
  });
}

function migrateTourDurationsToDayOnly() {
  transaction(() => {
    run(
      `
        UPDATE tours
        SET duration = '2 ngày'
        WHERE duration = '2 ngày 1 đêm'
      `
    );

    run(
      `
        UPDATE tours
        SET duration = '3 ngày'
        WHERE duration = '3 ngày 2 đêm'
      `
    );
  });
}

function migrateDefaultToursToAccentedVietnamese() {
  const updates = [
    {
      oldTitle: 'Ta Xua',
      title: 'Tà Xùa',
      category: 'LEO NÚI',
      location: 'Sơn La',
      duration: '2 ngày',
      difficulty: 'Trung bình',
      description: 'Chinh phục sống lưng khủng long, săn mây và ngắm bình minh trên đỉnh Tà Xùa.'
    },
    {
      oldTitle: 'Lao Than',
      title: 'Lảo Thẩn',
      category: 'LEO NÚI',
      location: 'Lào Cai',
      duration: '2 ngày',
      difficulty: 'Trung bình',
      description: 'Hành trình lý tưởng cho người mới bắt đầu trekking với cung đường đẹp và dễ tiếp cận.'
    },
    {
      oldTitle: 'Ta Lien',
      title: 'Tả Liên',
      category: 'LEO NÚI',
      location: 'Lai Châu',
      duration: '3 ngày',
      difficulty: 'Khó',
      description: 'Khám phá rừng nguyên sinh rêu phong, đồi thông xanh thẳm và cung trekking đầy thử thách.'
    }
  ];

  transaction(() => {
    updates.forEach((tour) => {
      run(
        `
          UPDATE tours
          SET title = ?, category = ?, location = ?, duration = ?, difficulty = ?, description = ?
          WHERE title = ?
        `,
        [tour.title, tour.category, tour.location, tour.duration, tour.difficulty, tour.description, tour.oldTitle]
      );
    });
  });
}

async function initDatabase() {
  if (db) {
    return db;
  }

  SQL = await initSqlJs();
  db = fs.existsSync(databaseFilePath)
    ? new SQL.Database(fs.readFileSync(databaseFilePath))
    : new SQL.Database();

  exec('PRAGMA foreign_keys = ON;');
  exec(`
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

  ensureTourCategoryColumn();
  ensureTourDetailColumns();
  seedToursIfNeeded();
  migrateTourDurationsToDayOnly();
  migrateDefaultToursToAccentedVietnamese();
  persistDatabase();

  return db;
}

module.exports = {
  initDatabase,
  getDb,
  exec,
  run,
  get,
  all,
  transaction
};
