# 💬 Real-Time Chat Application

A modern, full-featured real-time chat application built with Next.js, featuring instant messaging, file sharing, user management, and live typing indicators.

## 🚀 Features

### Core Chat Features
- **Real-Time Messaging**: Instant message delivery using WebSocket (Socket.io)
- **File Sharing**: Upload and share images, videos, audio files, via Cloudinary
- **Online Status**: View which users are currently online
- **Message History**: Paginated message loading with infinite scroll
- **Conversation Management**: Automatic conversation creation between users

### User Management
- **User Authentication**: Secure login/signup with NextAuth.js
- **Google OAuth**: Sign in with Google account
- **User CRUD Operations**: Create, read, update, and delete users
- **Profile Management**: Edit user details (name, email, mobile, password)
- **User List**: Browse all available users in the sidebar

### UI/UX Features
- **Responsive Design**: Mobile-first design that works on all devices
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- **Toast Notifications**: User-friendly success/error messages
- **Loading States**: Smooth loading indicators
- **Auto-scroll**: Automatic scroll to latest messages

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Socket.io Client** - Real-time communication
- **Sonner** - Toast notifications

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **NextAuth.js** - Authentication
- **MongoDB** - Database (via Mongoose)
- **Socket.io** - WebSocket server for real-time features
- **bcryptjs** - Password hashing
- **Cloudinary** - File storage and CDN

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Static type checking
