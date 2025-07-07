# Healthcare Mock Interview System

A comprehensive healthcare application that combines a healthcare management system with AI-powered mock interviews for healthcare professionals.

## Features

- **🏥 Healthcare Management**: Complete patient management system with appointments, medical records, and user profiles
- **🤖 AI Mock Interviews**: Practice interviews for healthcare roles using Google Gemini AI
- **🎤 Voice Recognition**: Speech-to-text functionality for natural interview responses
- **📹 Video Recording**: Record and playback interview sessions
- **🔐 Google Authentication**: Secure user authentication with Firebase
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

## Quick Start

1. **Clone the repository**
2. **Follow the setup guide**: See [SETUP.md](./SETUP.md) for detailed configuration instructions
3. **Install dependencies**: `npm install`
4. **Run the development server**: `npm run dev`
5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **AI**: Google Gemini AI
- **Icons**: Lucide React

## Project Structure

```
my-app/
├── app/                    # Next.js App Router
├── components/            # React components
├── contexts/              # React contexts
├── hooks/                 # Custom hooks
├── lib/                   # Utility libraries
└── public/                # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Gemini AI](https://ai.google.dev/gemini-api)

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
