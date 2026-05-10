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

## Deploy tren Render (giu du lieu SQLite)

Render Web Service dung filesystem tam, nen file SQLite se mat sau restart neu khong gan Persistent Disk.

Can hinh de khong bi reset DB:

1. Trong Render service, tao `Persistent Disk` va mount path la `/var/data`.
2. Them environment variable:
	- `SQLITE_PATH=/var/data/database.sqlite`
3. Redeploy service.

App da ho tro doc duong dan DB tu bien moi truong `SQLITE_PATH`. Neu khong set, app mac dinh dung file local `database.sqlite` trong source.

## Chuyen sang database rieng (PostgreSQL)

Da co san bo cong cu migrate tu SQLite sang PostgreSQL.

### 1. Cau hinh bien moi truong

Copy `.env.example` thanh `.env` va dien:

- `DATABASE_URL`
- `PG_SSL` (`true` cho Supabase/Render Postgres)

### 2. Kiem tra ket noi PostgreSQL

```bash
npm run pg:test
```

### 3. Migrate du lieu SQLite len PostgreSQL

```bash
# Giu du lieu cu tren PostgreSQL (insert bo sung)
npm run migrate:sqlite-to-pg

# Hoac xoa sach du lieu PostgreSQL truoc khi import lai
RESET_PG=true npm run migrate:sqlite-to-pg
```

Script migrate:

- Tao schema neu chua co
- Copy du lieu tu `tours`, `bookings`, `booking_members`
- Dong bo sequence ID sau khi import

### 4. Cutover app sang PostgreSQL

App hien tai da ho tro runtime theo thu tu:

1. Neu co `DATABASE_URL` (va `FORCE_SQLITE` khong phai `true`): dung PostgreSQL.
2. Neu PostgreSQL loi ket noi: tu dong fallback SQLite.
3. Neu khong co `DATABASE_URL`: dung SQLite.

Buoc nay nen lam sau khi verify du lieu tren DB cloud da dung.

Goi y cutover an toan:

1. Deploy branch rieng co data layer PostgreSQL.
2. Chay smoke test API public + admin.
3. Khi on dinh thi moi tat fallback SQLite.

## Storage rieng cho anh/file (buoc tiep theo)

Hien tai app dang luu anh local. De tach storage:

1. Tao bucket tren Supabase Storage (vd: `tour-images`).
2. Dung `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`.
3. Doi upload service de luu object key/public URL vao DB thay vi duong dan local.

Da co san fallback runtime cho upload:

- Neu day du `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`: upload len Supabase Storage.
- Neu thieu 1 trong cac bien tren: upload local vao thu muc `Images`/`UPLOAD_DIR` nhu hien tai.

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
