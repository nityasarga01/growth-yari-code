import React, { useState } from 'react';
import { Camera, Video, FileText, X, Upload, Hash, Users, Loader } from 'lucide-react';
import { apiClient } from '../../config/api';

interface CreatePostProps {
  onClose: () => void;
  onCreatePost: (post: { type: 'video' | 'thought' | 'image'; content: string; caption?: string; tags: string[]; mediaUrl?: string; thumbnail?: string }) => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ onClose, onCreatePost }) => {
  const [postType, setPostType] = useState<'video' | 'thought' | 'image'>('thought');
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(null);
  const [uploadedThumbnail, setUploadedThumbnail] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setUploadError(null);
    
    if (file.type.startsWith('video/')) {
      setPostType('video');
    } else if (file.type.startsWith('image/')) {
      setPostType('image');
    }
    
    // Upload file immediately
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setUploadError(null);
      
      console.log('Uploading file:', file.name, file.type, file.size);
      
      const result = await apiClient.uploadFile(file);
      console.log('Upload result:', result);
      
      if (result.success && result.data) {
        setUploadedMediaUrl(result.data.url);
        
        // For videos, generate real thumbnail from video
        if (file.type.startsWith('video/')) {
          if (result.data.thumbnail) {
            setUploadedThumbnail(result.data.thumbnail);
          } else {
            // Generate thumbnail from video file
            const thumbnail = await generateVideoThumbnail(file);
            setUploadedThumbnail(thumbnail);
          }
        } else {
          setUploadedThumbnail(result.data.url);
        }
        
        console.log('File uploaded successfully:', result.data.url);
      } else {
        setUploadError(result.error || 'Upload failed');
        console.error('Upload failed:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (postType === 'thought' && content.trim()) {
      onCreatePost({
        type: postType,
        content: content,
        caption: undefined,
        tags
      });
    } else if ((postType === 'image' || postType === 'video') && uploadedMediaUrl) {
      onCreatePost({
        type: postType,
        content: caption || `Shared a ${postType}`,
        caption: caption,
        tags,
        mediaUrl: uploadedMediaUrl,
        thumbnail: uploadedThumbnail
      });
    } else if ((postType === 'image' || postType === 'video') && !uploadedMediaUrl) {
      setUploadError('Please wait for the file to upload or try uploading again');
      return;
    }
    onClose();
  };

  const createPreviewUrl = (file: File) => {
    return URL.createObjectURL(file);
  };

  // Generate thumbnail from video file
  const generateVideoThumbnail = async (videoFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      
      video.addEventListener('loadedmetadata', () => {
        // Set canvas dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Seek to 1 second or 10% of video duration, whichever is smaller
        const seekTime = Math.min(1, video.duration * 0.1);
        video.currentTime = seekTime;
      });
      
      video.addEventListener('seeked', () => {
        try {
          // Draw video frame to canvas
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to data URL
          const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          // Clean up
          URL.revokeObjectURL(video.src);
          
          resolve(thumbnailDataUrl);
        } catch (error) {
          console.error('Error generating thumbnail:', error);
          reject(error);
        }
      });
      
      video.addEventListener('error', (error) => {
        console.error('Video loading error:', error);
        reject(error);
      });
      
      // Load video
      video.src = URL.createObjectURL(videoFile);
    });
  };

  // Clean up object URLs when component unmounts
  React.useEffect(() => {
    return () => {
      if (selectedFile) {
        const previewUrl = createPreviewUrl(selectedFile);
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [selectedFile]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Create Post</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content Type Selection */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={() => setPostType('thought')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                postType === 'thought'
                  ? 'bg-brand-primary/10 text-brand-primary border-2 border-brand-primary/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>Thought</span>
            </button>
            <button
              onClick={() => setPostType('video')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                postType === 'video'
                  ? 'bg-brand-primary/10 text-brand-primary border-2 border-brand-primary/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Video className="h-5 w-5" />
              <span>Video</span>
            </button>
            <button
              onClick={() => setPostType('image')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                postType === 'image'
                  ? 'bg-brand-primary/10 text-brand-primary border-2 border-brand-primary/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Camera className="h-5 w-5" />
              <span>Image</span>
            </button>
          </div>
        </div>

        {/* Content Input */}
        <div className="p-6">
          {/* Upload Error */}
          {uploadError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{uploadError}</p>
            </div>
          )}
          
          {postType === 'thought' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share your thoughts
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind? Share insights, tips, or professional experiences..."
                rows={6}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary resize-none"
              />
            </div>
          ) : (
            <div>
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-4 sm:p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50'
                    : uploading
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {uploading ? (
                  <div className="space-y-4">
                    <Loader className="h-12 w-12 text-blue-600 mx-auto animate-spin" />
                    <div>
                      <p className="font-medium text-gray-900">Uploading...</p>
                      <p className="text-sm text-gray-500">Please wait while we upload your {postType}</p>
                    </div>
                  </div>
                ) : selectedFile && uploadedMediaUrl ? (
                  <div className="space-y-4">
                    {/* Preview of uploaded content */}
                    <div className="max-w-sm mx-auto">
                      {postType === 'image' ? (
                        <img
                          src={uploadedMediaUrl}
                          alt="Uploaded content"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={uploadedMediaUrl}
                          className="w-full h-32 object-cover rounded-lg"
                          controls
                          muted
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-green-700">✓ Upload successful</p>
                      <p className="text-sm text-gray-500">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadedMediaUrl(null);
                        setUploadedThumbnail(null);
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove and upload different file
                    </button>
                  </div>
                ) : selectedFile ? (
                  <div className="space-y-4">
                    {/* Preview while uploading */}
                    <div className="max-w-sm mx-auto">
                      {postType === 'image' ? (
                        <img
                          src={createPreviewUrl(selectedFile)}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg opacity-50"
                        />
                      ) : (
                        <video
                          src={createPreviewUrl(selectedFile)}
                          className="w-full h-32 object-cover rounded-lg opacity-50"
                          muted
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-center">
                      <Loader className="h-8 w-8 text-blue-600 animate-spin" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-700">Processing upload...</p>
                      <p className="text-sm text-gray-500">
                        {selectedFile.name} - {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        {postType === 'video' ? 'Upload Video' : 'Upload Image'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Drag and drop or click to select your {postType}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Max size: 10MB • Supported: {postType === 'video' ? 'MP4, WebM, MOV' : 'JPG, PNG, GIF, WebP'}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept={postType === 'video' ? 'video/*' : 'image/*'}
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary cursor-pointer transition-colors"
                    >
                      Select File
                    </label>
                  </div>
                )}
              </div>

              {/* Caption */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption for your post..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex items-center space-x-2 mb-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tags..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>
              <button
                onClick={addTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-brand-primary hover:text-brand-secondary"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                uploading ||
                (postType === 'thought' && !content.trim()) ||
                (postType !== 'thought' && !uploadedMediaUrl)
              }
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg hover:from-brand-primary/90 hover:to-brand-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {uploading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <span>Post</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};