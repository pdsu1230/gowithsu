# Tour Booking Web App - Technical Specification

## Tổng Quan Hệ Thống

Web app booking tour leo núi dành cho:

- Khách hàng Việt Nam
- Công ty tour riêng
- Không phải marketplace
- Không tích hợp thanh toán online
- 5–10 tour cố định

---

# Công Nghệ Sử Dụng

- NodeJS
- SQLite (in-app database)
- HTML đơn giản
- Không dùng framework frontend

---

# Tính Năng Chính

## User

### 1. Xem danh sách tour

- Tà Xùa
- Lảo Thẩn
- Tả Liên

### 2. Booking tour

- Không cần đăng nhập
- Chọn ngày khởi hành
- Booking nhiều người

---

# Form Booking

## Thông tin người đại diện

- Họ và tên
- Số điện thoại
- Email (optional)
- Ngày khởi hành

---

# Thành viên Booking

1 Booking = nhiều người

## Thông tin mỗi thành viên

- Họ và tên
- Ngày tháng năm sinh
- CCCD
- Số điện thoại
- Địa chỉ

### Dịch vụ

- Khắc medal (Có/Không)
- Tên khắc medal
- Tiểu sử bệnh nền

### Mượn thiết bị

- Mượn balo 20L
- Mượn đèn đội đầu
- Mượn gậy trekking

---

# Admin Dashboard

## Chức năng

- Quản lý tour
- Xem danh sách booking
- Gom nhóm theo ngày
- Xem danh sách thành viên

Ví dụ:

Tà Xùa

- 18/04/2026
- 25/04/2026

---

# Export Excel

## 1. Export từng tour

Tên file:

TaXua-18-04-2026.xlsx

Cột Excel

| STT | Họ tên | Ngày sinh | CCCD | SĐT | Địa chỉ | Medal | Tên Medal | Bệnh nền | Balo | Đèn | Gậy |

---

## 2. Export tất cả tour trong tuần

Tên file

Tour-tuan.xlsx

### Sheet 1

Tổng hợp

| Tour | Ngày | Tổng khách |

### Sheet 2

Tà Xùa - 18/04

### Sheet 3

Lảo Thẩn - 20/04

---

# Database Schema

## tours

```sql
CREATE TABLE tours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  location TEXT,
  duration TEXT,
  difficulty TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## bookings

```sql
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tour_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tour_id) REFERENCES tours(id)
);
```

---

## booking_members

```sql
CREATE TABLE booking_members (
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
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);
```

---

# Project Structure

```
project/
  database/
    db.js

  models/
    tour.model.js
    booking.model.js
    bookingMember.model.js

  routes/
  controllers/
  views/
```

---

# Database Connection

## database/db.js

```js
const Database = require('better-sqlite3');
const db = new Database('database.db');
module.exports = db;
```

---

# Tour Model

```js
const db = require('../database/db');

const TourModel = {

  getAll() {
    return db.prepare(`SELECT * FROM tours ORDER BY created_at DESC`).all();
  },

  getById(id) {
    return db.prepare(`SELECT * FROM tours WHERE id = ?`).get(id);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO tours (title, location, duration, difficulty, description)
      VALUES (?, ?, ?, ?, ?)
    `);

    return stmt.run(
      data.title,
      data.location,
      data.duration,
      data.difficulty,
      data.description
    );
  }

};

module.exports = TourModel;
```

---

# Booking Model

```js
const db = require('../database/db');

const BookingModel = {

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO bookings (
        tour_id,
        start_date,
        contact_name,
        contact_phone,
        contact_email
      )
      VALUES (?, ?, ?, ?, ?)
    `);

    return stmt.run(
      data.tour_id,
      data.start_date,
      data.contact_name,
      data.contact_phone,
      data.contact_email
    );
  }

};

module.exports = BookingModel;
```

---

# Booking Member Model

```js
const db = require('../database/db');

const BookingMemberModel = {

  create(data) {
    const stmt = db.prepare(`
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
    `);

    return stmt.run(
      data.booking_id,
      data.name,
      data.dob,
      data.cccd,
      data.phone,
      data.address,
      data.medal,
      data.medal_name,
      data.medical_condition,
      data.medical_note,
      data.borrow_bag,
      data.borrow_headlamp,
      data.borrow_trekking_pole
    );
  }

};

module.exports = BookingMemberModel;
```

---

# API Design

## Booking

```
POST /booking
```

## Admin

```
GET /admin/tours
GET /admin/bookings
```

---

# Export Excel

## Export từng tour

```
GET /admin/export/tour/:tourId/:date
```

## Export tuần

```
GET /admin/export/week
```

---

# MVP Hoàn Chỉnh

## User

- Xem tour
- Booking nhiều người
- Không cần login

## Admin

- Dashboard
- Quản lý booking
- Gom tour theo ngày
- Export Excel

---

# Tương Lai (Optional)

- Export PDF
- Email xác nhận
- Google Sheets
- Admin login

---

# Kết Luận

Đây là kiến trúc đơn giản, dễ build, dễ mở rộng và phù hợp cho hệ thống tour leo núi quy mô nhỏ.

