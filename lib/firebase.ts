// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
    // エミュレータであっても、初期化にはこれらのフィールド（特にapiKey）が必要です
    apiKey: "demo-key-for-emulator",
    authDomain: "demo-bom3d-sn923.firebaseapp.com",
    projectId: "demo-bom3d-sn923", // 'demo-' プレフィックス
    storageBucket: "demo-bom3d-sn923.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

// ローカル開発時のみエミュレータに接続
if (process.env.NODE_ENV === 'development') {
    const g = global as any;
    if (!g._firebase_emulators_connected) {
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectAuthEmulator(auth, "http://localhost:9099");
        g._firebase_emulators_connected = true;
        console.log("Connected to Firebase Emulators with demo config");
    }
}

export { db, auth };