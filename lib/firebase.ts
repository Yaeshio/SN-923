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

if (isEmulator) {
    const g = global as any;
    if (!g._firebase_emulators_connected) {
        // 環境変数からポートを取得、なければデフォルト
        // localhost よりも 127.0.0.1 のほうが安定するケースがあるため変更
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
        connectAuthEmulator(auth, "http://127.0.0.1:9099");
        connectStorageEmulator(storage, '127.0.0.1', 9199);
        g._firebase_emulators_connected = true;
        console.log(`Connected to Firebase Emulators: ${projectId}`);
    }
}

export { db, auth, storage };