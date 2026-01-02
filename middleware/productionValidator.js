/**
 * Production-Ready Input Validation
 * Prevents XSS, SQL injection, and validates input data
 */

const { body, param, query, validationResult } = require('express-validator');
const { validationError } = require('./productionErrorHandler');

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Sanitize all string inputs
    for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
            req.body[key] = req.body[key].trim();
            // Basic XSS prevention
            req.body[key] = req.body[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            req.body[key] = req.body[key].replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
            req.body[key] = req.body[key].replace(/javascript:/gi, '');
            req.body[key] = req.body[key].replace(/on\w+\s*=/gi, '');
        }
    }

    // Sanitize query parameters
    for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
            req.query[key] = req.query[key].trim().replace(/[<>]/g, '');
        }
    }

    next();
};

// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.path || error.param,
            message: error.msg,
            value: error.value
        }));

        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errorMessages,
            timestamp: new Date().toISOString()
        });
    }
    next();
};

// User validation rules
const userValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

    body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),

    body('role')
        .optional()
        .isIn(['admin', 'sitemanager'])
        .withMessage('Role must be either admin or sitemanager'),

    handleValidationErrors
];

// Project validation rules
const projectValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Project name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z0-9\s\-_]+$/)
        .withMessage('Project name can only contain letters, numbers, spaces, hyphens, and underscores'),

    body('location')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Location must be between 2 and 200 characters'),

    body('budget')
        .isNumeric()
        .withMessage('Budget must be a number')
        .isFloat({ min: 0 })
        .withMessage('Budget must be a positive number'),

    body('startDate')
        .isISO8601()
        .withMessage('Please provide a valid start date'),

    body('endDate')
        .isISO8601()
        .withMessage('Please provide a valid end date')
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.startDate)) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),

    body('status')
        .optional()
        .isIn(['planning', 'running', 'completed', 'on_hold', 'cancelled'])
        .withMessage('Status must be one of: planning, running, completed, on_hold, cancelled'),

    handleValidationErrors
];

// Attendance validation rules
const attendanceValidation = [
    body('date')
        .isISO8601()
        .withMessage('Please provide a valid date')
        .custom((value) => {
            const date = new Date(value);
            const today = new Date();
            if (date > today) {
                throw new Error('Attendance date cannot be in the future');
            }
            return true;
        }),

    body('projectId')
        .isMongoId()
        .withMessage('Please provide a valid project ID'),

    body('photo')
        .notEmpty()
        .withMessage('Photo is required')
        .isBase64()
        .withMessage('Photo must be a valid base64 string'),

    body('remarks')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Remarks must be less than 500 characters'),

    handleValidationErrors
];

// Labour validation rules
const labourValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces'),

    body('phone')
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),

    body('dailyWage')
        .isNumeric()
        .withMessage('Daily wage must be a number')
        .isFloat({ min: 0 })
        .withMessage('Daily wage must be a positive number'),

    body('designation')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Designation must be between 2 and 50 characters'),

    body('assignedSite')
        .isMongoId()
        .withMessage('Please provide a valid site ID'),

    handleValidationErrors
];

// Expense validation rules
const expenseValidation = [
    body('projectId')
        .isMongoId()
        .withMessage('Please provide a valid project ID'),

    body('vendorId')
        .isMongoId()
        .withMessage('Please provide a valid vendor ID'),

    body('amount')
        .isNumeric()
        .withMessage('Amount must be a number')
        .isFloat({ min: 0 })
        .withMessage('Amount must be a positive number'),

    body('category')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Category must be between 2 and 50 characters'),

    body('description')
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('Description must be between 5 and 500 characters'),

    body('date')
        .isISO8601()
        .withMessage('Please provide a valid date'),

    handleValidationErrors
];

// Machine validation rules
const machineValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Machine name must be between 2 and 100 characters'),

    body('type')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Machine type must be between 2 and 50 characters'),

    body('projectId')
        .isMongoId()
        .withMessage('Please provide a valid project ID'),

    body('status')
        .optional()
        .isIn(['working', 'maintenance', 'broken', 'available'])
        .withMessage('Status must be one of: working, maintenance, broken, available'),

    handleValidationErrors
];

// Stock validation rules
const stockValidation = [
    body('projectId')
        .isMongoId()
        .withMessage('Please provide a valid project ID'),

    body('vendorId')
        .isMongoId()
        .withMessage('Please provide a valid vendor ID'),

    body('materialName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Material name must be between 2 and 100 characters'),

    body('quantity')
        .isNumeric()
        .withMessage('Quantity must be a number')
        .isFloat({ min: 0 })
        .withMessage('Quantity must be a positive number'),

    body('unit')
        .trim()
        .isIn(['kg', 'ltr', 'bags', 'pcs', 'meter', 'box', 'ton'])
        .withMessage('Unit must be one of: kg, ltr, bags, pcs, meter, box, ton'),

    body('unitPrice')
        .isNumeric()
        .withMessage('Unit price must be a number')
        .isFloat({ min: 0 })
        .withMessage('Unit price must be a positive number'),

    handleValidationErrors
];

// ID parameter validation
const idValidation = [
    param('id')
        .isMongoId()
        .withMessage('Please provide a valid ID'),

    handleValidationErrors
];

// Date query validation
const dateQueryValidation = [
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid start date'),

    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid end date')
        .custom((value, { req }) => {
            if (req.query.startDate && new Date(value) <= new Date(req.query.startDate)) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),

    handleValidationErrors
];

module.exports = {
    sanitizeInput,
    handleValidationErrors,
    userValidation,
    projectValidation,
    attendanceValidation,
    labourValidation,
    expenseValidation,
    machineValidation,
    stockValidation,
    idValidation,
    dateQueryValidation
};
