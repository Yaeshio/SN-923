import { initializeApp, getApps } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-bom3d-sn923";

const firebaseConfig = {
    apiKey: "fake-api-key", // Emulator用ダミー
    authDomain: `${projectId}.firebaseapp.com`,
    projectId: projectId,
    storageBucket: `${projectId}.appspot.com`,
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

const isEmulator = process.env.NODE_ENV === 'development' || projectId.startsWith('demo-');

console.log(`[Firebase] Initializing with Project ID: ${projectId}, IsEmulator: ${isEmulator}`);

if (isEmulator) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = globalThis as any;
    if (!g._firebase_emulators_connected) {
        // localhost よりも 127.0.0.1 のほうが安定するケースがあるため変更
        console.log(`[Firebase] Connecting to Firestore Emulator: ${projectId}`);
        try {
            connectFirestoreEmulator(db, '127.0.0.1', 8080);
            connectAuthEmulator(auth, "http://127.0.0.1:9099");
            connectStorageEmulator(storage, '127.0.0.1', 9199);
            g._firebase_emulators_connected = true;
            console.log(`[Firebase] Successfully connected to Firebase Emulators: ${projectId}`);
        } catch (error) {
            console.error('[Firebase] Failed to connect to emulators:', error);
        }
    } else {
        console.log('[Firebase] Emulators already connected, skipping initialization.');
    }
}

export { db, auth, storage };
