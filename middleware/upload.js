/**
 * Multer Upload Middleware
 * Handles file uploads with memory storage for Cloudinary
 */

const multer = require('multer');

// Use memory storage to get file buffer for Cloudinary
const storage = multer.memoryStorage();

// File filter - only accept images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only image and PDF files are allowed'), false);
    }
};

// Single file upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    }
});

// Multiple files upload
const uploadMultiple = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size per file
    }
});

module.exports = {
    uploadSingle: upload.single('photo'),
    uploadReceipt: upload.single('receipt'),
    uploadMultiple: uploadMultiple.array('documents', 10) // Max 10 files
};
