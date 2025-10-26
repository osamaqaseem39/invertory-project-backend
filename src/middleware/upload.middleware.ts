import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Determine base upload directory based on environment
const getUploadBaseDir = () => {
  // In serverless environments, use /tmp which is typically writable
  if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return '/tmp';
  }
  return process.cwd();
};

// Ensure upload directories exist
const uploadDirs = {
  receipts: path.join(getUploadBaseDir(), 'uploads', 'receipts'),
  products: path.join(getUploadBaseDir(), 'uploads', 'products'),
};

// Safely create upload directories
Object.values(uploadDirs).forEach((dir) => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (error) {
    console.warn(`Warning: Could not create upload directory ${dir}:`, error);
    // In serverless environments, we might need to use /tmp instead
    if (process.env.NODE_ENV === 'production' || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      console.warn('Running in serverless environment, upload directories may not be persistent');
    }
  }
});

// Configure storage for receipts
const receiptStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      // Ensure directory exists before using it
      if (!fs.existsSync(uploadDirs.receipts)) {
        fs.mkdirSync(uploadDirs.receipts, { recursive: true });
      }
      cb(null, uploadDirs.receipts);
    } catch (error) {
      console.error('Error setting receipt upload destination:', error);
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.id || 'anonymous';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${userId}_${timestamp}${ext}`;
    cb(null, filename);
  },
});

// Configure storage for product images
const productStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      // Ensure directory exists before using it
      if (!fs.existsSync(uploadDirs.products)) {
        fs.mkdirSync(uploadDirs.products, { recursive: true });
      }
      cb(null, uploadDirs.products);
    } catch (error) {
      console.error('Error setting product upload destination:', error);
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.id || 'anonymous';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `product_${userId}_${timestamp}${ext}`;
    cb(null, filename);
  },
});

// File filter
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'));
  }
};

// Create multer instances with fallback to memory storage for serverless environments
const createMulterInstance = (storage: multer.StorageEngine, limits: any, fileFilter: any) => {
  try {
    // Test if we can write to the storage directory
    if (storage === receiptStorage) {
      fs.accessSync(uploadDirs.receipts, fs.constants.W_OK);
    } else if (storage === productStorage) {
      fs.accessSync(uploadDirs.products, fs.constants.W_OK);
    }
    return multer({ storage, limits, fileFilter });
  } catch (error) {
    console.warn('File system storage not available, falling back to memory storage:', error);
    return multer({ 
      storage: multer.memoryStorage(), 
      limits, 
      fileFilter 
    });
  }
};

export const uploadReceipt = createMulterInstance(
  receiptStorage,
  {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter
);

export const uploadProductImage = createMulterInstance(
  productStorage,
  {
    fileSize: 5 * 1024 * 1024, // 5MB for product images
  },
  (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG and PNG are allowed for product images.'));
    }
  }
);

