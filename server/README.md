# GrowthYari Backend API

A comprehensive backend API for the GrowthYari social media platform built with Node.js, Express, TypeScript, and Supabase.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Profile management, search, and statistics
- **Social Features**: Posts, likes, comments, connections, and connection requests
- **Professional Sessions**: Session booking, management, and payments
- **YariConnect**: Real-time video chat matching system
- **Real-time Communication**: Socket.IO for live features
- **File Upload**: Cloudinary integration for media files
- **Payments**: Stripe integration for session payments
- **Notifications**: Real-time notification system
- **Email**: Automated email notifications
- **Search**: Global search across users, posts, and sessions

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT
- **Real-time**: Socket.IO
- **File Storage**: Cloudinary
- **Payments**: Stripe
- **Email**: Nodemailer
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate limiting

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Cloudinary account (for file uploads)
- Stripe account (for payments)
- SMTP email service

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your environment variables in `.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File Upload Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Payment Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

4. Set up the database:
   - Create a new Supabase project
   - Run the migration file in the Supabase SQL editor
   - The migration will create all necessary tables and policies

5. Build and start the server:
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### User Endpoints

- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id/stats` - Get user statistics
- `GET /api/users` - Search users
- `GET /api/users/:id/posts` - Get user's posts

### Post Endpoints

- `GET /api/posts/feed` - Get feed posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get single post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comments` - Add comment
- `GET /api/posts/:id/comments` - Get post comments
- `DELETE /api/posts/:id` - Delete post

### Session Endpoints

- `GET /api/sessions` - Get user's sessions
- `POST /api/sessions/book` - Book a session
- `GET /api/sessions/:id` - Get session details
- `PATCH /api/sessions/:id/status` - Update session status
- `PATCH /api/sessions/:id/notes` - Add session notes
- `GET /api/sessions/experts/:expertId/slots` - Get available slots

### Connection Endpoints

- `GET /api/connections` - Get user's connections
- `POST /api/connections/request` - Send connection request
- `GET /api/connections/requests` - Get connection requests
- `PATCH /api/connections/requests/:id` - Respond to request
- `DELETE /api/connections/:id` - Remove connection

### YariConnect Endpoints

- `GET /api/yari-connect/professionals` - Get available professionals
- `POST /api/yari-connect/sessions/start` - Start YariConnect session
- `PATCH /api/yari-connect/sessions/:id/end` - End session
- `GET /api/yari-connect/sessions` - Get session history
- `GET /api/yari-connect/stats` - Get YariConnect statistics

### Payment Endpoints

- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/webhook` - Stripe webhook
- `GET /api/payments/history` - Get payment history
- `GET /api/payments/earnings` - Get earnings summary

### Upload Endpoints

- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files
- `DELETE /api/upload/:publicId` - Delete file

### Notification Endpoints

- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/unread-count` - Get unread count
- `DELETE /api/notifications/:id` - Delete notification

### Search Endpoints

- `GET /api/search` - Global search
- `GET /api/search/suggestions` - Search suggestions
- `GET /api/search/trending` - Trending searches

## Socket.IO Events

### YariConnect Events
- `yari-connect:join-queue` - Join matching queue
- `yari-connect:leave-queue` - Leave matching queue
- `yari-connect:call-user` - Initiate video call
- `yari-connect:answer-call` - Answer video call
- `yari-connect:ice-candidate` - WebRTC ICE candidate
- `yari-connect:end-call` - End video call

### Chat Events
- `chat:send-message` - Send chat message
- `chat:new-message` - Receive new message
- `chat:typing` - Typing indicator
- `chat:user-typing` - User typing notification

### Session Events
- `session:join` - Join session room
- `session:leave` - Leave session room
- `session:update-status` - Update session status
- `session:status-updated` - Session status updated

### Notification Events
- `notification:new` - New notification
- `notification:mark-read` - Mark notification as read

## Database Schema

The database includes the following main tables:

- `users` - User profiles and authentication
- `posts` - User posts (video reels, thoughts, images)
- `post_likes` - Post likes tracking
- `post_comments` - Post comments
- `sessions` - Professional sessions/consultations
- `connections` - User connections
- `connection_requests` - Connection requests
- `yari_connect_sessions` - YariConnect video chat sessions
- `payments` - Payment transactions
- `notifications` - User notifications
- `chat_messages` - Chat messages between users

All tables have Row Level Security (RLS) enabled with appropriate policies.

## Security Features

- JWT authentication with secure token handling
- Row Level Security (RLS) on all database tables
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Helmet for security headers
- Password hashing with bcrypt

## Error Handling

The API includes comprehensive error handling with:
- Centralized error handling middleware
- Proper HTTP status codes
- Detailed error messages in development
- Sanitized error messages in production
- Request validation with express-validator

## Development

### Running in Development Mode

```bash
npm run dev
```

This will start the server with nodemon for auto-reloading.

### Building for Production

```bash
npm run build
```

### Testing

```bash
npm test
```

## Deployment

The API can be deployed to any Node.js hosting platform:

1. Set up environment variables on your hosting platform
2. Build the application: `npm run build`
3. Start the server: `npm start`

Popular deployment options:
- Heroku
- Railway
- Render
- DigitalOcean App Platform
- AWS Elastic Beanstalk

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.