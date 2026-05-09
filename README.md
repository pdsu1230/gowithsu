# Đăng Sử Tour Booking

Ung dung booking tour leo nui theo MVP trong file dac ta ky thuat.

## Chuc nang

- Trang public xem danh sach tour tren homepage va booking nhieu thanh vien tren page rieng `/booking`.
- Trang admin quan ly tour, xem booking nhom theo ngay, xem thanh vien.
- Export Excel theo tung tour/ngay va tong hop booking trong tuan.
- SQLite nhung trong app, khoi tao schema va seed tour mac dinh luc chay lan dau.

## Chay du an

```bash
npm install
npm start
```

Ung dung mac dinh chay tai `http://localhost:3000`.

## Dang nhap admin

- Nut dang nhap admin nam tren navigation cua trang chu.
- Tai khoan mac dinh: `admin`
- Mat khau mac dinh: `dang123`
- Co the doi bang bien moi truong: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_AUTH_SECRET`

## Cau truc

- `server.js`: khoi tao Express app va static frontend.
- `database/db.js`: ket noi SQLite, tao schema, seed du lieu.
- `models/`: thao tac tours, bookings, booking_members.
- `controllers/`: xu ly API public va admin.
- `services/excel.service.js`: tao file Excel.
- `public/`: giao dien HTML/CSS/JS thuần.
