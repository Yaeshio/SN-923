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

const isEmulator = process.env.NODE_ENV === 'development' || projectId.startsWith('demo-');

console.log(`[Firebase] Initializing with Project ID: ${projectId}, IsEmulator: ${isEmulator}`);

let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

if (isEmulator) {
    if (typeof window === 'undefined') {
        // Node / Server Context
        if (!process.env.FIRESTORE_EMULATOR_HOST) {
            process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
            process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
            process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
        }
    }

    // インスタンスごとに一度だけ接続を試みる
    const g = globalThis as any;

    // Firestore
    if (!(db as any)._emulator_connected) {
        try {
            connectFirestoreEmulator(db, '127.0.0.1', 8080);
            (db as any)._emulator_connected = true;
            console.log(`[Firebase] Connected Firestore to Emulator (127.0.0.1:8080)`);
        } catch (e: any) {
            if (e.code === 'failed-precondition') {
                (db as any)._emulator_connected = true;
            }
        }
    }

    // Auth
    if (!(auth as any)._emulator_connected) {
        try {
            connectAuthEmulator(auth, "http://127.0.0.1:9099");
            (auth as any)._emulator_connected = true;
            console.log(`[Firebase] Connected Auth to Emulator (127.0.0.1:9099)`);
        } catch (e) { }
    }

    // Storage
    if (!(storage as any)._emulator_connected) {
        try {
            connectStorageEmulator(storage, '127.0.0.1', 9199);
            (storage as any)._emulator_connected = true;
            console.log(`[Firebase] Connected Storage to Emulator (127.0.0.1:9199)`);
        } catch (e) { }
    }
}

export { db, auth, storage };


