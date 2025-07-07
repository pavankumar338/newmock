# Project Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Google Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

## Setup Instructions

### 1. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication with Google provider
4. Create a Firestore database
5. Get your project configuration from Project Settings > General > Your apps
6. Add the configuration values to your `.env.local` file

### 2. Google Gemini AI Setup
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add the API key to your `.env.local` file

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Development Server
```bash
npm run dev
```

## Features

- **Healthcare Management System**: Complete healthcare application with patient management
- **AI Mock Interviews**: Practice interviews for healthcare professionals using Google Gemini AI
- **Voice Recognition**: Speech-to-text functionality for interview responses
- **Video Recording**: Record and playback interview sessions
- **Google Authentication**: Secure user authentication
- **Responsive Design**: Works on desktop and mobile devices

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

- `app/` - Next.js App Router pages
- `components/` - React components
- `contexts/` - React contexts for state management
- `hooks/` - Custom React hooks
- `lib/` - Utility libraries (Firebase, Gemini AI)
- `public/` - Static assets 