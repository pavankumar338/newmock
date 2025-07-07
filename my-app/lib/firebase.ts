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

// ==================== APPOINTMENTS ====================

export interface AppointmentData {
  id?: string;
  userId: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  type: string;
  reason: string;
  phone: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// Create a new appointment for a specific user
export const addAppointment = async (data: Omit<AppointmentData, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'appointments'), {
      ...data,
      status: data.status || 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('Appointment created successfully:', docRef.id);
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw new Error('Failed to create appointment');
  }
};

// Get all appointments for a specific user
export const getUserAppointments = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'appointments'), 
      where('userId', '==', userId)
      // Temporarily removed orderBy to avoid index requirement
      // orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    const appointments = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as AppointmentData[];
    
    // Sort in JavaScript instead
    return appointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw new Error('Failed to fetch appointments');
  }
};

// Get appointments with pagination
export const getUserAppointmentsPaginated = async (
  userId: string, 
  pageSize: number = 10, 
  lastDoc?: QueryDocumentSnapshot
) => {
  try {
    let q = query(
      collection(db, 'appointments'),
      where('userId', '==', userId)
      // Temporarily removed orderBy to avoid index requirement
      // orderBy('date', 'desc')
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const appointments = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as AppointmentData[];
    
    // Sort in JavaScript instead
    const sortedAppointments = appointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      appointments: sortedAppointments.slice(0, pageSize),
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: appointments.length > pageSize
    };
  } catch (error) {
    console.error('Error fetching paginated appointments:', error);
    throw new Error('Failed to fetch appointments');
  }
};

// Get appointments by status for a specific user
export const getUserAppointmentsByStatus = async (userId: string, status: string) => {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', userId),
      where('status', '==', status)
      // Temporarily removed orderBy to avoid index requirement
      // orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    const appointments = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as AppointmentData[];
    
    // Sort in JavaScript instead
    return appointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Error fetching appointments by status:', error);
    throw new Error('Failed to fetch appointments');
  }
};

// Get a specific appointment by ID
export const getAppointmentById = async (appointmentId: string) => {
  try {
    const docRef = doc(db, 'appointments', appointmentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as AppointmentData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching appointment:', error);
    throw new Error('Failed to fetch appointment');
  }
};

// Update an appointment
export const updateAppointment = async (id: string, data: Partial<AppointmentData>) => {
  try {
    await updateDoc(doc(db, 'appointments', id), { 
      ...data, 
      updatedAt: serverTimestamp() 
    });
    console.log('Appointment updated successfully:', id);
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw new Error('Failed to update appointment');
  }
};

// Delete an appointment
export const deleteAppointment = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'appointments', id));
    console.log('Appointment deleted successfully:', id);
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw new Error('Failed to delete appointment');
  }
};

// Cancel an appointment
export const cancelAppointment = async (id: string, reason?: string) => {
  try {
    await updateDoc(doc(db, 'appointments', id), {
      status: 'Cancelled',
      notes: reason ? `Cancelled: ${reason}` : 'Cancelled by user',
      updatedAt: serverTimestamp()
    });
    console.log('Appointment cancelled successfully:', id);
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    throw new Error('Failed to cancel appointment');
  }
};

// ==================== MEDICAL RECORDS ====================

export interface MedicalRecordData {
  id?: string;
  userId: string;
  type: string;
  date: string;
  status: string;
  fileUrl?: string;
  description?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const addMedicalRecord = async (data: Omit<MedicalRecordData, 'id' | 'createdAt' | 'updatedAt'>) => {
  const docRef = await addDoc(collection(db, 'medicalRecords'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: docRef.id, ...data };
};

export const getUserMedicalRecords = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'medicalRecords'), 
      where('userId', '==', userId)
      // Temporarily removed orderBy to avoid index requirement
      // orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as MedicalRecordData[];
    
    // Sort in JavaScript instead
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error fetching medical records:', error);
    throw new Error('Failed to fetch medical records');
  }
};

// ==================== USER PROFILES ====================

export interface UserProfileData {
  id?: string;
  userId: string;
  displayName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const createUserProfile = async (userId: string, data: Omit<UserProfileData, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'userProfiles'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('User profile created successfully:', docRef.id);
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error('Failed to create user profile');
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const q = query(collection(db, 'userProfiles'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as UserProfileData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile');
  }
};

export const updateUserProfile = async (id: string, data: Partial<UserProfileData>) => {
  try {
    await updateDoc(doc(db, 'userProfiles', id), { 
      ...data, 
      updatedAt: serverTimestamp() 
    });
    console.log('User profile updated successfully:', id);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
};

// ==================== UTILITY FUNCTIONS ====================

// Initialize user data when they first sign up
export const initializeUserData = async (user: User) => {
  try {
    // Check if user profile already exists
    const existingProfile = await getUserProfile(user.uid);
    
    if (!existingProfile) {
      // Create default user profile
      await createUserProfile(user.uid, {
        userId: user.uid,
        displayName: user.displayName || 'User',
        email: user.email || '',
        phone: user.phoneNumber || '',
      });
      console.log('User data initialized for:', user.uid);
    }
  } catch (error) {
    console.error('Error initializing user data:', error);
  }
};

// Get appointment statistics for a user
export const getUserAppointmentStats = async (userId: string) => {
  try {
    const appointments = await getUserAppointments(userId);
    
    const stats = {
      total: appointments.length,
      pending: appointments.filter(apt => apt.status === 'Pending').length,
      confirmed: appointments.filter(apt => apt.status === 'Confirmed').length,
      cancelled: appointments.filter(apt => apt.status === 'Cancelled').length,
      completed: appointments.filter(apt => apt.status === 'Completed').length,
    };
    
    return stats;
  } catch (error) {
    console.error('Error fetching appointment stats:', error);
    throw new Error('Failed to fetch appointment statistics');
  }
};
