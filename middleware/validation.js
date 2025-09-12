const { body, param, query, validationResult } = require('express-validator');
const { errorResponse, isValidEmail, isValidPassword } = require('../utils/helpers');

// Middleware xử lý lỗi validation
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.path,
            message: error.msg,
            value: error.value
        }));
        return errorResponse(res, 'Validation failed', 400, errorMessages);
    }
    next();
};

// Validation rules cho user registration
const validateUserRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .custom((password) => {
            if (!isValidPassword(password)) {
                throw new Error('Password must contain at least one letter and one number');
            }
            return true;
        }),
    
    body('full_name')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Full name must not exceed 100 characters'),
    
    body('phone')
        .optional()
        .trim()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Please provide a valid phone number'),
    
    handleValidationErrors
];

// Validation rules cho user login
const validateUserLogin = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    
    handleValidationErrors
];

// Validation rules cho update user
const validateUserUpdate = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('full_name')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Full name must not exceed 100 characters'),
    
    body('phone')
        .optional()
        .trim()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Please provide a valid phone number'),
    
    body('status')
        .optional()
        .isIn(['active', 'inactive'])
        .withMessage('Status must be either active or inactive'),
    
    handleValidationErrors
];

// Validation rules cho change password
const validatePasswordChange = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
        .custom((password) => {
            if (!isValidPassword(password)) {
                throw new Error('New password must contain at least one letter and one number');
            }
            return true;
        }),
    
    body('confirmPassword')
        .custom((confirmPassword, { req }) => {
            if (confirmPassword !== req.body.newPassword) {
                throw new Error('Password confirmation does not match new password');
            }
            return true;
        }),
    
    handleValidationErrors
];

// Validation rules cho product
const validateProduct = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Product name is required and must not exceed 200 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    
    body('price')
        .isNumeric()
        .withMessage('Price must be a number')
        .custom((price) => {
            if (parseFloat(price) < 0) {
                throw new Error('Price must be greater than or equal to 0');
            }
            return true;
        }),
    
    body('stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer'),
    
    body('category_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Category ID must be a positive integer'),
    
    body('status')
        .optional()
        .isIn(['active', 'inactive'])
        .withMessage('Status must be either active or inactive'),
    
    handleValidationErrors
];

// Validation rules cho pagination
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    handleValidationErrors
];

// Validation rules cho ID parameters
const validateIdParam = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID must be a positive integer'),
    
    handleValidationErrors
];

// Validation rules cho search
const validateSearch = [
    query('q')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters'),
    
    handleValidationErrors
];

// Validation rules cho order
const validateOrder = [
    body('items')
        .isArray({ min: 1 })
        .withMessage('Order must contain at least one item'),
    
    body('items.*.product_id')
        .isInt({ min: 1 })
        .withMessage('Product ID must be a positive integer'),
    
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer'),
    
    body('shipping_address')
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Shipping address is required and must be between 10 and 500 characters'),
    
    body('payment_method')
        .isIn(['cash', 'card', 'bank_transfer'])
        .withMessage('Payment method must be cash, card, or bank_transfer'),
    
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes must not exceed 500 characters'),
    
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateUserRegistration,
    validateUserLogin,
    validateUserUpdate,
    validatePasswordChange,
    validateProduct,
    validatePagination,
    validateIdParam,
    validateSearch,
    validateOrder
};