const { verifyToken, errorResponse } = require('../utils/helpers');
const { executeQuery } = require('../config/database');

// Middleware xác thực JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return errorResponse(res, 'Access token required', 401);
        }

        const decoded = verifyToken(token);
        
        // Kiểm tra user có tồn tại và active không
        const user = await executeQuery(
            'SELECT id, username, email, role, status FROM users WHERE id = ?',
            [decoded.id]
        );

        if (!user || user.length === 0) {
            return errorResponse(res, 'User not found', 404);
        }

        if (user[0].status === 'inactive') {
            return errorResponse(res, 'User account is inactive', 403);
        }

        req.user = user[0];
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return errorResponse(res, 'Invalid or expired token', 401);
    }
};

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return errorResponse(res, 'Admin access required', 403);
    }
    next();
};

// Middleware kiểm tra quyền user hoặc admin
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return errorResponse(res, 'Authentication required', 401);
    }
    next();
};

// Middleware kiểm tra quyền sở hữu resource hoặc admin
const requireOwnershipOrAdmin = (userIdField = 'user_id') => {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 'Authentication required', 401);
        }

        const resourceUserId = req.params[userIdField] || req.body[userIdField];
        
        if (req.user.role === 'admin' || req.user.id.toString() === resourceUserId.toString()) {
            next();
        } else {
            return errorResponse(res, 'Access denied', 403);
        }
    };
};

// Middleware optional auth (không bắt buộc đăng nhập)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = verifyToken(token);
            const user = await executeQuery(
                'SELECT id, username, email, role, status FROM users WHERE id = ? AND status = "active"',
                [decoded.id]
            );

            if (user && user.length > 0) {
                req.user = user[0];
            }
        }

        next();
    } catch (error) {
        // Nếu token không hợp lệ, vẫn cho phép tiếp tục (optional)
        next();
    }
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireAuth,
    requireOwnershipOrAdmin,
    optionalAuth
};