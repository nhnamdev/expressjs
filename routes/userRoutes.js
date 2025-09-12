const express = require('express');
const router = express.Router();

// Import controllers
const {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
} = require('../controllers/userController');

// Import middleware
const { authenticateToken, requireAdmin, requireAuth } = require('../middleware/auth');
const { 
    validateUserRegistration,
    validateUserLogin,
    validateUserUpdate,
    validatePasswordChange,
    validateIdParam
} = require('../middleware/validation');
const { searchPagination } = require('../middleware/pagination');

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);

// Protected routes (require authentication)
router.use(authenticateToken);

// User profile routes
router.get('/profile', getProfile);
router.put('/profile', validateUserUpdate, updateProfile);
router.put('/change-password', validatePasswordChange, changePassword);

// Admin only routes
router.get('/', requireAdmin, searchPagination(10, 50), getUsers);
router.get('/:id', requireAdmin, validateIdParam, getUserById);
router.put('/:id', requireAdmin, validateIdParam, validateUserUpdate, updateUser);
router.delete('/:id', requireAdmin, validateIdParam, deleteUser);

module.exports = router;