const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported`));
    }
  }
});

// Upload single file
router.post('/single', 
  authenticateToken,
  upload.single('file'),
  async (req, res) => {
    try {
      console.log('Upload request received');
      console.log('User:', req.user?.id || req.user?._id);
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

      // Check if Cloudinary is configured
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.log('Cloudinary not configured, creating data URL');
        
        // Create data URL from file buffer
        const base64Data = req.file.buffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;
        
        console.log('File processed as data URL');
        
        return res.json({
          success: true,
          data: {
            url: dataUrl,
            public_id: `upload_${Date.now()}`,
            resource_type: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
            format: req.file.mimetype.split('/')[1],
            width: 800,
            height: 600,
            bytes: req.file.size,
            thumbnail: req.file.mimetype.startsWith('video/') ? null : dataUrl, // No thumbnail for videos in data URL mode
            originalName: req.file.originalname,
            isDataUrl: true
          }
        });
      }
      
      // If Cloudinary is configured, upload there
      const cloudinary = require('cloudinary').v2;
      
      try {
        console.log('Uploading to Cloudinary...');
        
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'auto',
              folder: 'growthyari',
              public_id: `${req.user.id || req.user._id}_${Date.now()}`,
              transformation: req.file.mimetype.startsWith('image/') ? [
                { width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
              ] : req.file.mimetype.startsWith('video/') ? [
                { width: 1280, height: 720, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
              ] : undefined,
              eager: req.file.mimetype.startsWith('video/') ? [
                { 
                  width: 400, 
                  height: 300, 
                  crop: 'fill', 
                  gravity: 'center',
                  quality: 'auto',
                  format: 'jpg',
                  start_offset: '1'
                }
              ] : undefined
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          
          uploadStream.end(req.file.buffer);
        });

        const uploadResult = result;
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
            thumbnail: uploadResult.eager && uploadResult.eager[0] ? uploadResult.eager[0].secure_url : null,
            originalName: req.file.originalname
          }
        });
      } catch (cloudinaryError) {
        console.error('Cloudinary upload failed, falling back to data URL:', cloudinaryError);
        
        // Fallback to data URL if Cloudinary fails
        const base64Data = req.file.buffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;
        
        res.json({
          success: true,
          data: {
            url: dataUrl,
            public_id: `upload_${Date.now()}`,
            resource_type: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
            format: req.file.mimetype.split('/')[1],
            width: 800,
            height: 600,
            bytes: req.file.size,
            thumbnail: req.file.mimetype.startsWith('video/') ? null : dataUrl,
            originalName: req.file.originalname,
            isDataUrl: true,
            fallback: true
          }
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload file'
      });
    }
  }
);

module.exports = router;