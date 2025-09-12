const { executeQuery } = require('../config/database');
const { 
    hashPassword, 
    comparePassword, 
    generateToken, 
    successResponse, 
    errorResponse, 
    asyncHandler,
    sanitizeInput
} = require('../utils/helpers');

// Đăng ký user mới
const register = asyncHandler(async (req, res) => {
    const { username, email, password, full_name, phone } = req.body;

    // Kiểm tra user đã tồn tại
    const existingUser = await executeQuery(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
    );

    if (existingUser.length > 0) {
        return errorResponse(res, 'Username or email already exists', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Tạo user mới
    const result = await executeQuery(
        'INSERT INTO users (username, email, password, full_name, phone) VALUES (?, ?, ?, ?, ?)',
        [username, email, hashedPassword, full_name || null, phone || null]
    );

    // Tạo token
    const token = generateToken({ id: result.insertId, username, email, role: 'user' });

    successResponse(res, 'User registered successfully', {
        user: {
            id: result.insertId,
            username,
            email,
            full_name: full_name || null,
            phone: phone || null,
            role: 'user'
        },
        token
    }, 201);
});

// Đăng nhập
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Tìm user
    const users = await executeQuery(
        'SELECT id, username, email, password, full_name, phone, role, status FROM users WHERE email = ?',
        [email]
    );

    if (users.length === 0) {
        return errorResponse(res, 'Invalid email or password', 401);
    }

    const user = users[0];

    // Kiểm tra account status
    if (user.status === 'inactive') {
        return errorResponse(res, 'Account is inactive', 403);
    }

    // Kiểm tra password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
        return errorResponse(res, 'Invalid email or password', 401);
    }

    // Tạo token
    const token = generateToken({ 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
    });

    successResponse(res, 'Login successful', {
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            phone: user.phone,
            role: user.role
        },
        token
    });
});

// Lấy profile user hiện tại
const getProfile = asyncHandler(async (req, res) => {
    const user = await executeQuery(
        'SELECT id, username, email, full_name, phone, role, status, created_at FROM users WHERE id = ?',
        [req.user.id]
    );

    if (user.length === 0) {
        return errorResponse(res, 'User not found', 404);
    }

    successResponse(res, 'Profile retrieved successfully', user[0]);
});

// Cập nhật profile
const updateProfile = asyncHandler(async (req, res) => {
    const { username, email, full_name, phone } = req.body;
    const userId = req.user.id;

    // Kiểm tra username/email đã tồn tại (ngoại trừ user hiện tại)
    if (username || email) {
        const existingUser = await executeQuery(
            'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
            [username || '', email || '', userId]
        );

        if (existingUser.length > 0) {
            return errorResponse(res, 'Username or email already exists', 409);
        }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (username) {
        updateFields.push('username = ?');
        updateValues.push(sanitizeInput(username));
    }
    if (email) {
        updateFields.push('email = ?');
        updateValues.push(email);
    }
    if (full_name !== undefined) {
        updateFields.push('full_name = ?');
        updateValues.push(sanitizeInput(full_name) || null);
    }
    if (phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(sanitizeInput(phone) || null);
    }

    if (updateFields.length === 0) {
        return errorResponse(res, 'No fields to update', 400);
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(userId);

    await executeQuery(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
    );

    // Lấy thông tin user đã update
    const updatedUser = await executeQuery(
        'SELECT id, username, email, full_name, phone, role, status FROM users WHERE id = ?',
        [userId]
    );

    successResponse(res, 'Profile updated successfully', updatedUser[0]);
});

// Đổi mật khẩu
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Lấy password hiện tại
    const user = await executeQuery(
        'SELECT password FROM users WHERE id = ?',
        [userId]
    );

    if (user.length === 0) {
        return errorResponse(res, 'User not found', 404);
    }

    // Kiểm tra password hiện tại
    const isCurrentPasswordValid = await comparePassword(currentPassword, user[0].password);
    if (!isCurrentPasswordValid) {
        return errorResponse(res, 'Current password is incorrect', 400);
    }

    // Hash password mới
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await executeQuery(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
        [hashedNewPassword, userId]
    );

    successResponse(res, 'Password changed successfully');
});

// Lấy danh sách users (admin only)
const getUsers = asyncHandler(async (req, res) => {
    const { page, limit, offset, search } = req.pagination;

    let query = 'SELECT id, username, email, full_name, phone, role, status, created_at FROM users';
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    let queryParams = [];

    if (search) {
        const searchCondition = ' WHERE username LIKE ? OR email LIKE ? OR full_name LIKE ?';
        query += searchCondition;
        countQuery += searchCondition;
        queryParams = [`%${search}%`, `%${search}%`, `%${search}%`];
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    // Lấy total count
    const totalResult = await executeQuery(countQuery, queryParams);
    const total = totalResult[0].total;

    // Lấy data
    const users = await executeQuery(query, [...queryParams, limit, offset]);

    const paginatedResult = req.paginatedResponse(users, total);
    successResponse(res, 'Users retrieved successfully', paginatedResult);
});

// Lấy thông tin user theo ID (admin only)
const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await executeQuery(
        'SELECT id, username, email, full_name, phone, role, status, created_at, updated_at FROM users WHERE id = ?',
        [id]
    );

    if (user.length === 0) {
        return errorResponse(res, 'User not found', 404);
    }

    successResponse(res, 'User retrieved successfully', user[0]);
});

// Cập nhật user (admin only)
const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { username, email, full_name, phone, role, status } = req.body;

    // Kiểm tra user tồn tại
    const existingUser = await executeQuery(
        'SELECT id FROM users WHERE id = ?',
        [id]
    );

    if (existingUser.length === 0) {
        return errorResponse(res, 'User not found', 404);
    }

    // Kiểm tra username/email đã tồn tại (ngoại trừ user hiện tại)
    if (username || email) {
        const duplicateUser = await executeQuery(
            'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
            [username || '', email || '', id]
        );

        if (duplicateUser.length > 0) {
            return errorResponse(res, 'Username or email already exists', 409);
        }
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    if (username) {
        updateFields.push('username = ?');
        updateValues.push(sanitizeInput(username));
    }
    if (email) {
        updateFields.push('email = ?');
        updateValues.push(email);
    }
    if (full_name !== undefined) {
        updateFields.push('full_name = ?');
        updateValues.push(sanitizeInput(full_name) || null);
    }
    if (phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(sanitizeInput(phone) || null);
    }
    if (role) {
        updateFields.push('role = ?');
        updateValues.push(role);
    }
    if (status) {
        updateFields.push('status = ?');
        updateValues.push(status);
    }

    if (updateFields.length === 0) {
        return errorResponse(res, 'No fields to update', 400);
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    await executeQuery(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
    );

    // Lấy thông tin user đã update
    const updatedUser = await executeQuery(
        'SELECT id, username, email, full_name, phone, role, status FROM users WHERE id = ?',
        [id]
    );

    successResponse(res, 'User updated successfully', updatedUser[0]);
});

// Xóa user (admin only)
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Không cho phép xóa chính mình
    if (parseInt(id) === req.user.id) {
        return errorResponse(res, 'Cannot delete your own account', 400);
    }

    // Kiểm tra user tồn tại
    const user = await executeQuery(
        'SELECT id FROM users WHERE id = ?',
        [id]
    );

    if (user.length === 0) {
        return errorResponse(res, 'User not found', 404);
    }

    // Xóa user (soft delete bằng cách set status = inactive)
    await executeQuery(
        'UPDATE users SET status = "inactive", updated_at = NOW() WHERE id = ?',
        [id]
    );

    successResponse(res, 'User deleted successfully');
});

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
};