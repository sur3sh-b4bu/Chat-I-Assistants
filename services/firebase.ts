import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AppUser, Chat, ChatMessage, MessageType } from '../types';
import { AI_CHAT_ID_PREFIX, AI_NAME } from '../constants';

const firebaseConfig = {
  apiKey: "AIzaSyBS5JqhmASM2OpYGcgXVzlZvjpgN-BjG64",
  authDomain: "chat-web-app-7bc20.firebaseapp.com",
  projectId: "chat-web-app-7bc20",
  storageBucket: "chat-web-app-7bc20.firebasestorage.app",
  messagingSenderId: "164431936128",
  appId: "1:164431936128:web:f490497673faa416cb0465",
  measurementId: "G-ZY4FW2WV31"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// --- Demo Mode Logic & Mock DB ---
let isDemoMode = false;
let demoUser: any = null;
const demoListeners: Set<(user: any) => void> = new Set();

// In-memory DB for Demo Mode
const mockDb = {
  chats: {} as Record<string, Chat>,
  messages: {} as Record<string, ChatMessage[]>
};

/**
 * Checks if an error is related to missing Firebase Configuration
 */
const isConfigError = (error: any) => {
    const code = error.code || '';
    const msg = error.message || '';
    return (
        code === 'auth/configuration-not-found' ||
        code === 'auth/operation-not-allowed' ||
        code === 'auth/admin-restricted-operation' ||
        msg.includes('configuration-not-found')
    );
};

/**
 * Wrapper for Auth State Changes that supports both Real Firebase Auth and Local Demo Mode.
 */
export const onAuthChange = (callback: (user: any) => void) => {
  const unsubscribeFirebase = onAuthStateChanged(auth, (user) => {
    if (!isDemoMode) {
      callback(user);
    }
  });

  demoListeners.add(callback);

  if (isDemoMode && demoUser) {
      callback(demoUser);
  }

  return () => {
    unsubscribeFirebase();
    demoListeners.delete(callback);
  };
};

export const loginDemoMode = async (name?: string, email?: string) => {
   isDemoMode = true;
   const uid = 'demo-' + (email ? email.replace(/[^a-zA-Z0-9]/g, '') : Math.floor(Math.random() * 100000));
   const displayName = name || 'Guest User';
   
   demoUser = {
     uid: uid,
     displayName: displayName,
     email: email || null,
     photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&background=00a884`,
     isAnonymous: !email
   };
   
   // Initialize AI Chat in Mock DB
   const aiChatId = `${AI_CHAT_ID_PREFIX}${demoUser.uid}`;
   
   // Only create if not exists
   if (!mockDb.chats[aiChatId]) {
        mockDb.chats[aiChatId] = {
            id: aiChatId,
            participants: [demoUser.uid],
            isAiChat: true,
            lastMessage: 'Tap here to chat with AI',
            lastMessageTimestamp: Date.now()
        };
        
        mockDb.messages[aiChatId] = [{
            id: 'init-msg',
            chatId: aiChatId,
            senderId: 'gemini-bot',
            type: MessageType.AI,
            content: `Hello ${displayName}! I'm ${AI_NAME}. Ask me anything!`,
            timestamp: Date.now(),
            status: 'seen'
        }];
   }

   // Notify listeners
   demoListeners.forEach(cb => cb(demoUser));
   
   return demoUser;
};

// --- Real Auth Functions ---

export const registerWithEmail = async (name: string, email: string, pass: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    const user = result.user;

    await updateProfile(user, {
        displayName: name,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    });

    // Save user profile to Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      displayName: name,
      email: user.email,
      photoURL: user.photoURL,
      lastSeen: serverTimestamp(),
      isAnonymous: false
    }, { merge: true });
    
    return user;
  } catch (error: any) {
    if (isConfigError(error)) {
        console.warn("Auth config missing. Falling back to Simulated Mode for:", email);
        return await loginDemoMode(name, email);
    }
    console.error("Registration failed", error.code, error.message);
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    const user = result.user;
    
    // Update last seen
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      lastSeen: serverTimestamp(),
      isAnonymous: false
    }, { merge: true });
    
    return user;
  } catch (error: any) {
    if (isConfigError(error)) {
        console.warn("Auth config missing. Falling back to Simulated Mode for:", email);
        // For simulation, we just log them in with the email provided
        // We assume the name is the part before @
        const simulatedName = email.split('@')[0];
        return await loginDemoMode(simulatedName, email);
    }
    console.error("Email login failed", error.code, error.message);
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Save user profile to Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastSeen: serverTimestamp(),
      isAnonymous: false
    }, { merge: true });
    
    return user;
  } catch (error: any) {
    console.error("Login failed", error.code, error.message);
    throw error;
  }
};

export const loginAnonymously = async () => {
  try {
    const result = await signInAnonymously(auth);
    const user = result.user;

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
        uid: user.uid,
        displayName: `Guest ${user.uid.slice(0, 4)}`,
        email: null,
        photoURL: 'https://ui-avatars.com/api/?name=Guest&background=random',
        lastSeen: serverTimestamp(),
        isAnonymous: true
    }, { merge: true });

    return user;
  } catch (error: any) {
    if (isConfigError(error)) {
        console.warn("Auth config missing. Falling back to Simulated Guest Mode.");
        return await loginDemoMode();
    }
    console.error("Guest login failed", error.code, error.message);
    throw error;
  }
};

export const logoutUser = async () => {
    if (isDemoMode) {
        isDemoMode = false;
        demoUser = null;
        demoListeners.forEach(cb => cb(null));
    } else {
        await signOut(auth);
    }
};

export const uploadFile = async (file: Blob | File, path: string): Promise<string> => {
  if (isDemoMode) {
      // Return a fake URL in demo mode to prevent storage errors
      console.log("Demo Mode: Simulating upload for", path);
      return URL.createObjectURL(file);
  }
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

export const getUserProfile = async (uid: string): Promise<AppUser | null> => {
  if (isDemoMode && demoUser && uid === demoUser.uid) {
      return demoUser;
  }
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() as AppUser : null;
  } catch (e) {
    console.warn("Error fetching user profile (might be demo mode):", e);
    return null;
  }
};

// --- Service Layer for Data (Handles Real vs Mock DB) ---

export const ensureAiChat = async (uid: string) => {
    if (isDemoMode) {
        // Mock DB is already initialized in loginDemoMode, just return id
        return `${AI_CHAT_ID_PREFIX}${uid}`;
    }

    const chatId = `${AI_CHAT_ID_PREFIX}${uid}`;
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
        await setDoc(chatRef, {
            id: chatId,
            participants: [uid], 
            isAiChat: true,
            lastMessage: 'Tap here to chat with AI',
            lastMessageTimestamp: Date.now()
        });
        // Add initial message
        await setDoc(doc(db, 'chats', chatId, 'messages', 'init'), {
            chatId: chatId,
            senderId: 'gemini-bot',
            type: 'ai',
            content: `Hello! I'm ${AI_NAME}. Ask me anything!`,
            timestamp: serverTimestamp(),
            status: 'sent'
        });
    }
    return chatId;
};

export const subscribeToChats = (userId: string, onUpdate: (chats: Chat[]) => void) => {
    if (isDemoMode) {
        // Polling for demo mode (simple simulation of reactivity)
        const fetch = () => {
            const chats = Object.values(mockDb.chats).filter(c => c.participants.includes(userId));
            // Sort Descending
            chats.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
            onUpdate(chats);
        };
        fetch();
        const interval = setInterval(fetch, 1000);
        return () => clearInterval(interval);
    }

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId)
    );

    return onSnapshot(q, (snapshot) => {
      const fetchedChats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      
      // Sort manually
      fetchedChats.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
      onUpdate(fetchedChats);
    }, (error) => {
        console.error("Firestore Chat Subscribe Error:", error);
    });
};

export const subscribeToMessages = (chatId: string, onUpdate: (msgs: ChatMessage[]) => void) => {
    if (isDemoMode) {
         const fetch = () => {
             const msgs = mockDb.messages[chatId] || [];
             msgs.sort((a, b) => a.timestamp - b.timestamp);
             onUpdate([...msgs]); // New reference
         };
         fetch();
         const interval = setInterval(fetch, 500);
         return () => clearInterval(interval);
    }

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now()
          };
      }) as ChatMessage[];
      onUpdate(msgs);
    });
};

export const sendChatMessage = async (chatId: string, message: Partial<ChatMessage>, userId: string) => {
    const fullMessage = {
        chatId,
        senderId: userId,
        type: message.type || MessageType.TEXT,
        content: message.content || '',
        timestamp: isDemoMode ? Date.now() : serverTimestamp(),
        status: 'sent' as const
    };

    if (isDemoMode) {
        // 1. Add Message
        if (!mockDb.messages[chatId]) mockDb.messages[chatId] = [];
        const newMsgId = 'msg-' + Date.now() + Math.random();
        mockDb.messages[chatId].push({
            ...fullMessage,
            id: newMsgId,
            timestamp: Date.now()
        } as ChatMessage);

        // 2. Update Chat
        if (mockDb.chats[chatId]) {
            mockDb.chats[chatId].lastMessage = (message.type === MessageType.TEXT) 
                ? message.content! 
                : `Sent a ${message.type}`;
            mockDb.chats[chatId].lastMessageTimestamp = Date.now();
        }
        return;
    }

    // Real Firestore
    await addDoc(collection(db, 'chats', chatId, 'messages'), fullMessage);
    await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: fullMessage.type === MessageType.TEXT ? fullMessage.content : `Sent a ${fullMessage.type}`,
        lastMessageTimestamp: Date.now()
    });
};