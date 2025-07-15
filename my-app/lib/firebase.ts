// File: lib/firebase.ts
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  getRedirectResult,
  User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  QueryDocumentSnapshot,
  startAfter,
  getDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const signInWithGoogleRedirect = async () => {
  await signInWithRedirect(auth, googleProvider);
};

export const getGoogleRedirectResult = async () => {
  return await getRedirectResult(auth);
};

export const signOutUser = async () => {
  await signOut(auth);
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// ==================== PRACTICE SESSIONS ====================

export interface PracticeSessionData {
  id?: string;
  userId: string;
  role: string;
  level: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  totalQuestions: number;
  averageRating: number;
  performanceSummary: {
    totalRating: number;
    strongAnswers: number;
    needImprovement: number;
    categories: {
      Communication: number;
      TechnicalKnowledge: number;
      ProblemSolving: number;
      Collaboration: number;
      Experience: number;
    };
  };
  questionFeedback: Array<{
    question: string;
    userAnswer: string;
    expectedAnswer: string;
    rating: number;
    feedback: string;
    category: string;
  }>;
  overallFeedback: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const createPracticeSession = async (sessionData: Omit<PracticeSessionData, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'practiceSessions'), {
      ...sessionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Practice session created successfully:', docRef.id);
    return { id: docRef.id, ...sessionData };
  } catch (error) {
    console.error('Error creating practice session:', error);
    throw new Error('Failed to create practice session');
  }
};

export const getUserPracticeSessions = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'practiceSessions'),
      where('userId', '==', userId),
      // orderBy('startTime', 'desc') // Temporarily removed to avoid index requirement
    );
    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as PracticeSessionData[];
    
    // Sort in JavaScript instead
    return sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  } catch (error) {
    console.error('Error fetching practice sessions:', error);
    throw new Error('Failed to fetch practice sessions');
  }
};

export const getPracticeSessionById = async (sessionId: string) => {
  try {
    const docRef = doc(db, 'practiceSessions', sessionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as PracticeSessionData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching practice session:', error);
    throw new Error('Failed to fetch practice session');
  }
};

export const updatePracticeSession = async (id: string, data: Partial<PracticeSessionData>) => {
  try {
    await updateDoc(doc(db, 'practiceSessions', id), { 
      ...data, 
      updatedAt: serverTimestamp() 
    });
    console.log('Practice session updated successfully:', id);
  } catch (error) {
    console.error('Error updating practice session:', error);
    throw new Error('Failed to update practice session');
  }
};

export const deletePracticeSession = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'practiceSessions', id));
    console.log('Practice session deleted successfully:', id);
  } catch (error) {
    console.error('Error deleting practice session:', error);
    throw new Error('Failed to delete practice session');
  }
};

export const getUserPracticeStats = async (userId: string) => {
  try {
    const sessions = await getUserPracticeSessions(userId);
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalPracticeTime: 0,
        averageRating: 0,
        totalQuestions: 0,
        rolesPracticed: new Set(),
        categories: {
          Communication: 0,
          TechnicalKnowledge: 0,
          ProblemSolving: 0,
          Collaboration: 0,
          Experience: 0
        }
      };
    }
    
    const totalSessions = sessions.length;
    const totalPracticeTime = sessions.reduce((sum, session) => sum + session.duration, 0);
    const totalRating = sessions.reduce((sum, session) => sum + session.averageRating, 0);
    const averageRating = totalRating / totalSessions;
    const totalQuestions = sessions.reduce((sum, session) => sum + session.totalQuestions, 0);
    const rolesPracticed = new Set(sessions.map(session => session.role));
    
    // Aggregate category ratings
    const categories = {
      Communication: 0,
      TechnicalKnowledge: 0,
      ProblemSolving: 0,
      Collaboration: 0,
      Experience: 0
    };
    
    sessions.forEach(session => {
      Object.keys(session.performanceSummary.categories).forEach(category => {
        if (categories.hasOwnProperty(category)) {
          categories[category as keyof typeof categories] += session.performanceSummary.categories[category as keyof typeof session.performanceSummary.categories];
        }
      });
    });
    
    return {
      totalSessions,
      totalPracticeTime,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalQuestions,
      rolesPracticed: Array.from(rolesPracticed),
      categories
    };
  } catch (error) {
    console.error('Error fetching practice stats:', error);
    throw new Error('Failed to fetch practice statistics');
  }
};

// Save only performance summary and average rating for a user
export const createPracticeSummary = async (data: {
  userId: string;
  performanceSummary: {
    totalRating: number;
    strongAnswers: number;
    needImprovement: number;
    categories: {
      Communication: number;
      TechnicalKnowledge: number;
      ProblemSolving: number;
      Collaboration: number;
      Experience: number;
    };
  };
  averageRating: number;
  createdAt: Date;
}) => {
  try {
    const docRef = await addDoc(collection(db, 'practiceSessions'), {
      ...data
    });
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error('Error creating practice summary:', error);
    throw new Error('Failed to create practice summary');
  }
};

// ==================== UTILITY FUNCTIONS ====================

// Initialize user data when they first sign up
export const initializeUserData = async (user: User) => {
  try {
    // Check if user profile already exists
    // const existingProfile = await getUserProfile(user.uid); // This line is removed
    
    // if (!existingProfile) { // This line is removed
    //   // Create default user profile // This line is removed
    //   await createUserProfile(user.uid, { // This line is removed
    //     userId: user.uid, // This line is removed
    //     displayName: user.displayName || 'User', // This line is removed
    //     email: user.email || '', // This line is removed
    //     phone: user.phoneNumber || '', // This line is removed
    //   }); // This line is removed
    //   console.log('User data initialized for:', user.uid); // This line is removed
    // } // This line is removed
  } catch (error) {
    console.error('Error initializing user data:', error);
  }
};
