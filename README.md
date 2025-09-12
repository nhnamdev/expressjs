# Express.js API Project

Một API RESTful hoàn chỉnh được xây dựng với Node.js và Express.js, có tích hợp authentication, validation, pagination và security features.

## 🚀 Tính năng

- ✅ JWT Authentication & Authorization
- ✅ User Registration & Login
- ✅ Password Hashing với bcrypt
- ✅ Input Validation
- ✅ Pagination & Search
- ✅ Rate Limiting
- ✅ CORS Protection
- ✅ Security Headers (Helmet)
- ✅ Error Handling
- ✅ Database Connection Pooling
- ✅ Environment Configuration

## 📦 Cài đặt

1. Clone repository:
```bash
git clone https://github.com/nhnamdev/expressjs.git
cd expressjs
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Cấu hình database:
- Tạo database MySQL
- Import file `database.sql` để tạo tables
- Cập nhật thông tin database trong file `.env`

4. Cấu hình environment variables:
```bash
cp .env.example .env
# Chỉnh sửa file .env với thông tin của bạn
```

5. Chạy server:
```bash
npm start
# hoặc cho development
npm run dev
```

## 🔧 Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=expressjs_db

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## 📊 Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password` - Hashed password
- `full_name` - Full name
- `phone` - Phone number
- `role` - User role (user/admin)
- `status` - Account status (active/inactive)
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

### Categories Table
- `id` - Primary key
- `name` - Category name
- `description` - Category description
- `status` - Category status

### Products Table
- `id` - Primary key
- `name` - Product name
- `description` - Product description
- `price` - Product price
- `stock` - Stock quantity
- `category_id` - Foreign key to categories
- `image_url` - Product image URL
- `status` - Product status

### Orders & Order Items Tables
- Complete order management system
- Foreign key relationships
- Order status tracking

## 🛠 API Endpoints

### Authentication
- `POST /api/users/register` - Đăng ký user mới
- `POST /api/users/login` - Đăng nhập

### User Profile
- `GET /api/users/profile` - Lấy thông tin profile
- `PUT /api/users/profile` - Cập nhật profile
- `PUT /api/users/change-password` - Đổi mật khẩu

### User Management (Admin only)
- `GET /api/users` - Lấy danh sách users (có pagination & search)
- `GET /api/users/:id` - Lấy thông tin user theo ID
- `PUT /api/users/:id` - Cập nhật user
- `DELETE /api/users/:id` - Xóa user (soft delete)

### System
- `GET /` - API information
- `GET /health` - Health check

## 🔐 Authentication

API sử dụng JWT tokens để authentication. Sau khi đăng nhập thành công, bạn sẽ nhận được một token.

Để sử dụng các protected routes, thêm header:
```
Authorization: Bearer <your_jwt_token>
```

## 📱 Example Usage

### Đăng ký user mới
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123",
    "full_name": "John Doe"
  }'
```

### Đăng nhập
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Lấy profile (cần authentication)
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <your_token>"
```

## 🏗 Project Structure

```
├── config/
│   └── database.js          # Database configuration
├── controllers/
│   └── userController.js    # User business logic
├── middleware/
│   ├── auth.js             # Authentication middleware
│   ├── validation.js       # Input validation
│   └── pagination.js       # Pagination middleware
├── routes/
│   └── userRoutes.js       # User API routes
├── utils/
│   └── helpers.js          # Utility functions
├── .env                    # Environment variables
├── .gitignore             # Git ignore file
├── database.sql           # Database schema
├── index.js               # Main application file
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🔒 Security Features

- **Helmet**: Thiết lập security headers
- **CORS**: Cấu hình Cross-Origin Resource Sharing
- **Rate Limiting**: Giới hạn số requests
- **JWT Authentication**: Xác thực bảo mật
- **Password Hashing**: Mã hóa mật khẩu với bcrypt
- **Input Validation**: Validate và sanitize input
- **SQL Injection Protection**: Sử dụng prepared statements

## 📝 Scripts

```bash
npm start          # Chạy server production
npm run dev        # Chạy server development (với nodemon)
npm test           # Chạy tests
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

- **nhnamdev** - [GitHub](https://github.com/nhnamdev)

## 🙏 Acknowledgments

- Express.js team
- Node.js community
- All contributors and supporters
