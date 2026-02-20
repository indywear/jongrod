# Jongrod External API - Developer Guide

## Base URL
```
https://jongrod-tau.vercel.app
```

## API Documentation (Swagger)
```
https://jongrod-tau.vercel.app/api-doc
```

---

## Quick Start (3 ขั้นตอน)

### 1. ขอ API Key จากผู้ดูแลระบบ
ติดต่อผู้ดูแล Jongrod เพื่อรับ API Key (รูปแบบ: `jgr_xxxxxxxx...`)

API Key มี 3 ระดับ permission:
| Permission | สิทธิ์ |
|-----------|--------|
| `read` | ดึงข้อมูลรถ, สถานะรถ, รายละเอียดต่างๆ |
| `write` | สร้างการจอง |
| `login` | Login ผู้ใช้ผ่าน API (ได้ JWT token กลับ) |

### 2. ดึงข้อมูลรถ
```bash
curl -X GET "https://jongrod-tau.vercel.app/api/v1/cars" \
  -H "X-API-Key: jgr_your_api_key_here"
```

### 3. Login ผู้ใช้ (ถ้าต้องการ)
```bash
curl -X POST "https://jongrod-tau.vercel.app/api/v1/auth/login" \
  -H "X-API-Key: jgr_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "123456"}'
```

---

## Authentication

### API Key (ใช้กับทุก /api/v1/* endpoint)
ส่งผ่าน header:
```
X-API-Key: jgr_your_api_key_here
```

### JWT Token (ใช้กับ endpoint ที่ต้องระบุตัวตนผู้ใช้)
หลัง login สำเร็จ จะได้ JWT token กลับมา ใช้ส่งผ่าน header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```
Token หมดอายุใน **24 ชั่วโมง**

---

## Endpoints ทั้งหมด

### 1. รถ (Cars) — ต้องมี API Key + permission `read`

#### ดึงรายการรถทั้งหมด
```
GET /api/v1/cars
```
**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `rentalStatus` | string | กรองตามสถานะ: `AVAILABLE`, `RENTED`, `MAINTENANCE` (ไม่ส่ง = แสดงทั้งหมด) |
| `category` | string | `SEDAN`, `SUV`, `VAN`, `PICKUP`, `LUXURY`, `COMPACT`, `MOTORCYCLE` |
| `transmission` | string | `AUTO`, `MANUAL` |
| `fuelType` | string | `PETROL`, `DIESEL`, `HYBRID`, `EV` |
| `minPrice` | number | ราคาขั้นต่ำ/วัน |
| `maxPrice` | number | ราคาสูงสุด/วัน |
| `search` | string | ค้นหาตามยี่ห้อหรือรุ่น |
| `sort` | string | `price_asc`, `price_desc`, `newest` |
| `page` | integer | หน้า (default: 1) |
| `limit` | integer | จำนวนต่อหน้า (default: 20, max: 100) |

**ตัวอย่าง:**
```bash
# ดึงรถที่พร้อมให้เช่า
curl -H "X-API-Key: jgr_xxx" \
  "https://jongrod-tau.vercel.app/api/v1/cars?rentalStatus=AVAILABLE"

# ดึงรถ SUV ราคาไม่เกิน 2000 บาท/วัน
curl -H "X-API-Key: jgr_xxx" \
  "https://jongrod-tau.vercel.app/api/v1/cars?category=SUV&maxPrice=2000"

# ดึงรถทุกสถานะ (รวมที่ถูกเช่าอยู่)
curl -H "X-API-Key: jgr_xxx" \
  "https://jongrod-tau.vercel.app/api/v1/cars"
```

**Response:**
```json
{
  "cars": [
    {
      "id": "clxx...",
      "brand": "Toyota",
      "model": "Yaris",
      "year": 2024,
      "licensePlate": "กข 1234",
      "category": "SEDAN",
      "transmission": "AUTO",
      "fuelType": "PETROL",
      "seats": 5,
      "doors": 4,
      "pricePerDay": 1200,
      "rentalStatus": "AVAILABLE",
      "images": ["/uploads/cars/image1.jpg"],
      "partner": {
        "id": "clxx...",
        "name": "Partner ABC",
        "logoUrl": null,
        "phone": "0812345678"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**สถานะรถ (rentalStatus):**
| Status | ความหมาย |
|--------|----------|
| `AVAILABLE` | พร้อมให้เช่า (แสดงบนเว็บ) |
| `RENTED` | ถูกเช่าอยู่ (ซ่อนจากเว็บ) |
| `MAINTENANCE` | อยู่ระหว่างซ่อมบำรุง (ซ่อนจากเว็บ) |

---

#### ดึงรายละเอียดรถเฉพาะคัน
```
GET /api/v1/cars/{id}
```

**ตัวอย่าง:**
```bash
curl -H "X-API-Key: jgr_xxx" \
  "https://jongrod-tau.vercel.app/api/v1/cars/clxx123"
```

---

### 2. Login ผู้ใช้ — ต้องมี API Key + permission `login`

#### Login (ได้ JWT token)
```
POST /api/v1/auth/login
```

**สำคัญ:** Login ที่ API นี้ = Login ที่เว็บไซต์ Jongrod ใช้ email/password ชุดเดียวกัน

**Request:**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```
หรือ login ด้วยเบอร์โทร:
```json
{
  "phone": "0812345678",
  "password": "123456"
}
```

**Response (สำเร็จ):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 86400,
  "user": {
    "id": "clxx...",
    "email": "user@example.com",
    "phone": "0812345678",
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "role": "CUSTOMER",
    "avatarUrl": null,
    "partnerId": null
  }
}
```

**Response (ล้มเหลว):**
```json
{ "error": "Invalid credentials" }    // 401
{ "error": "Account is suspended" }   // 403
{ "error": "Rate limit exceeded..." } // 429
```

---

#### ดึงข้อมูล User ปัจจุบัน
```
GET /api/v1/auth/me
```
ใช้ JWT token จาก login:
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  "https://jongrod-tau.vercel.app/api/v1/auth/me"
```

---

### 3. การจอง (Bookings) — ต้องมี API Key + JWT Token

#### ดูรายการจองของ User
```
GET /api/v1/bookings
```
**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | กรองตามสถานะ: `NEW`, `CLAIMED`, `PICKUP`, `ACTIVE`, `RETURN`, `COMPLETED`, `CANCELLED` |
| `page` | integer | หน้า |
| `limit` | integer | จำนวนต่อหน้า |

```bash
curl -H "X-API-Key: jgr_xxx" \
     -H "Authorization: Bearer eyJ..." \
  "https://jongrod-tau.vercel.app/api/v1/bookings"
```

#### สร้างการจองใหม่ (ต้องมี permission `write`)
```
POST /api/v1/bookings
```
**Request:**
```json
{
  "carId": "clxx...",
  "customerName": "สมชาย ใจดี",
  "customerPhone": "0812345678",
  "customerEmail": "user@example.com",
  "pickupDatetime": "2026-03-01T10:00:00Z",
  "returnDatetime": "2026-03-05T10:00:00Z",
  "pickupLocation": "สนามบินสุวรรณภูมิ",
  "returnLocation": "สนามบินสุวรรณภูมิ"
}
```

**Response (สำเร็จ - 201):**
```json
{
  "booking": {
    "id": "clxx...",
    "bookingNumber": "JR-20260301-A1B2C3",
    "customerName": "สมชาย ใจดี",
    "leadStatus": "NEW",
    "totalPrice": 4800,
    "car": { ... },
    "partner": { ... }
  },
  "bookingNumber": "JR-20260301-A1B2C3"
}
```

**สถานะการจอง (leadStatus):**
| Status | ความหมาย |
|--------|----------|
| `NEW` | จองใหม่ รอพาร์ทเนอร์รับ |
| `CLAIMED` | พาร์ทเนอร์รับจองแล้ว |
| `PICKUP` | ลูกค้ารับรถแล้ว |
| `ACTIVE` | กำลังใช้รถอยู่ |
| `RETURN` | คืนรถแล้ว |
| `COMPLETED` | เสร็จสิ้น |
| `CANCELLED` | ยกเลิก |

---

### 4. ข้อมูล Partner (ถ้า API Key ผูกกับ Partner)

#### ดูรถของ Partner
```
GET /api/v1/partner/cars
```
แสดงรถทุกสถานะ (AVAILABLE/RENTED/MAINTENANCE) ของ Partner ที่ผูกกับ API Key

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `rentalStatus` | string | กรองตามสถานะ |
| `approvalStatus` | string | `PENDING`, `APPROVED`, `REJECTED` |
| `page` | integer | หน้า |
| `limit` | integer | จำนวนต่อหน้า |

#### ดู Booking Leads ของ Partner
```
GET /api/v1/partner/leads
```
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | กรองตามสถานะ booking |
| `page` | integer | หน้า |
| `limit` | integer | จำนวนต่อหน้า |

---

## Error Codes

| HTTP Status | ความหมาย |
|------------|----------|
| 200 | สำเร็จ |
| 201 | สร้างสำเร็จ |
| 400 | ข้อมูลไม่ถูกต้อง |
| 401 | API Key ไม่ถูกต้อง หรือ Token หมดอายุ |
| 403 | ไม่มีสิทธิ์ (permission ไม่พอ หรือบัญชีถูกระงับ) |
| 404 | ไม่พบข้อมูล |
| 409 | ข้อมูลซ้ำ หรือรถไม่ว่าง |
| 429 | เรียก API บ่อยเกินไป |
| 500 | ข้อผิดพลาดระบบ |

ทุก error response มีรูปแบบเดียวกัน:
```json
{ "error": "Error message here" }
```

---

## Rate Limiting
- Login: 10 ครั้ง/นาที ต่อ IP
- อื่นๆ: ไม่จำกัด (แต่ควรเรียกอย่างสมเหตุสมผล)

---

## Code Examples

### JavaScript/Node.js
```javascript
const API_KEY = "jgr_your_key_here";
const BASE_URL = "https://jongrod-tau.vercel.app";

// 1. ดึงรถ
const carsRes = await fetch(`${BASE_URL}/api/v1/cars?rentalStatus=AVAILABLE`, {
  headers: { "X-API-Key": API_KEY }
});
const { cars } = await carsRes.json();

// 2. Login
const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
  method: "POST",
  headers: {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ email: "user@example.com", password: "123456" })
});
const { token, user } = await loginRes.json();

// 3. ดูการจอง (ใช้ JWT token)
const bookingsRes = await fetch(`${BASE_URL}/api/v1/bookings`, {
  headers: {
    "X-API-Key": API_KEY,
    "Authorization": `Bearer ${token}`
  }
});
const { bookings } = await bookingsRes.json();
```

### Python
```python
import requests

API_KEY = "jgr_your_key_here"
BASE_URL = "https://jongrod-tau.vercel.app"
HEADERS = {"X-API-Key": API_KEY}

# 1. ดึงรถ
cars = requests.get(f"{BASE_URL}/api/v1/cars", headers=HEADERS).json()

# 2. Login
login = requests.post(f"{BASE_URL}/api/v1/auth/login",
    headers={**HEADERS, "Content-Type": "application/json"},
    json={"email": "user@example.com", "password": "123456"}
).json()
token = login["token"]

# 3. ดูการจอง
bookings = requests.get(f"{BASE_URL}/api/v1/bookings",
    headers={**HEADERS, "Authorization": f"Bearer {token}"}
).json()
```

### cURL
```bash
# ดึงรถ
curl -H "X-API-Key: jgr_xxx" \
  "https://jongrod-tau.vercel.app/api/v1/cars"

# Login
curl -X POST -H "X-API-Key: jgr_xxx" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}' \
  "https://jongrod-tau.vercel.app/api/v1/auth/login"

# ดูการจอง
curl -H "X-API-Key: jgr_xxx" \
  -H "Authorization: Bearer eyJ..." \
  "https://jongrod-tau.vercel.app/api/v1/bookings"
```

---

## Support
- Swagger UI: https://jongrod-tau.vercel.app/api-doc
- API Spec (JSON): https://jongrod-tau.vercel.app/api/doc
