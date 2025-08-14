import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && 
           process.env.CLOUDINARY_API_KEY && 
           process.env.CLOUDINARY_API_SECRET);
};

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported. Please upload JPG, PNG, GIF, WebP, MP4, WebM, MOV, or AVI files.`));
    }
  }
});

// Upload single file
router.post('/single', 
  authenticateToken,
  upload.single('file'),
  asyncHandler(async (req: AuthRequest, res) => {
    console.log('Upload request received');
    console.log('User:', req.user?.id);
    console.log('File:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // If Cloudinary is not configured, return demo URLs
    if (!isCloudinaryConfigured()) {
      console.log('Cloudinary not configured, using demo URLs');
      
      // Generate demo URLs based on file type
      let demoUrl: string;
      let thumbnailUrl: string | null = null;
      
      if (req.file.mimetype.startsWith('image/')) {
        demoUrl = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1';
      } else if (req.file.mimetype.startsWith('video/')) {
        demoUrl = 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4';
        thumbnailUrl = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1';
      } else {
        demoUrl = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1';
      }
      
      return res.json({
        success: true,
        data: {
          url: demoUrl,
          public_id: `demo_${Date.now()}`,
          resource_type: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
          format: req.file.mimetype.split('/')[1],
          width: 800,
          height: 600,
          bytes: req.file.size,
          thumbnail: thumbnailUrl,
          demo: true
        }
      });
    }

    try {
      console.log('Uploading to Cloudinary...');
      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: 'growthyari',
            public_id: `${req.user!.id}_${Date.now()}`,
            transformation: req.file!.mimetype.startsWith('image/') ? [
              { width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
            ] : req.file!.mimetype.startsWith('video/') ? [
              { width: 1280, height: 720, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
            ] : undefined,
            eager: req.file!.mimetype.startsWith('video/') ? [
              { 
                width: 400, 
                height: 300, 
                crop: 'fill', 
                gravity: 'center',
                quality: 'auto',
                format: 'jpg',
                start_offset: '1' // Capture frame at 1 second
              }
            ] : undefined
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        
        uploadStream.end(req.file!.buffer);
      });

      const uploadResult = result as any;
      console.log('Cloudinary upload successful:', uploadResult.secure_url);

      res.json({
        success: true,
        data: {
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          resource_type: uploadResult.resource_type,
          format: uploadResult.format,
          width: uploadResult.width,
          height: uploadResult.height,
          bytes: uploadResult.bytes,
          thumbnail: uploadResult.eager && uploadResult.eager[0] ? uploadResult.eager[0].secure_url : null
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload file'
      });
    }
  })
);

// Upload multiple files
router.post('/multiple',
  authenticateToken,
  upload.array('files', 5), // Max 5 files
  asyncHandler(async (req: AuthRequest, res) => {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    try {
      const uploadPromises = files.map((file, index) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'auto',
              folder: 'growthyari',
              public_id: `${req.user!.id}_${Date.now()}_${index}`,
              transformation: file.mimetype.startsWith('image/') ? [
                { width: 1200, height: 1200, crop: 'limit', quality: 'auto' }
              ] : undefined
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          
          uploadStream.end(file.buffer);
        });
      });

      const results = await Promise.all(uploadPromises);

      const uploadResults = results.map((result: any) => ({
        url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes
      }));

      res.json({
        success: true,
        data: { uploads: uploadResults }
      });
    } catch (error) {
      console.error('Multiple upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload files'
      });
    }
  })
);

// Delete file
router.delete('/:publicId', 
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const { publicId } = req.params;

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result === 'ok') {
        res.json({
          success: true,
          message: 'File deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete file'
      });
    }
  })
);

export { router as uploadRoutes };