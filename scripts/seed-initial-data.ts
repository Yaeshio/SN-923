import { db } from '../lib/firebase';
import {
    collection,
    doc,
    setDoc,
    getDocs,
    deleteDoc,
    getDoc,
    serverTimestamp
} from 'firebase/firestore';

/**
 * 初期データ投入（シーディング）スクリプト
 * 
 * 役割:
 * 1. projects コレクションへの初期プロジェクト投入
 * 2. boxes コレクションへの初期ボックス投入 (BOX-001 ～ BOX-050)
 * 
 * 実行方法:
 * npx tsx scripts/seed-initial-data.ts
 * 
 * オプション:
 * --clear  既存のデータを一旦削除してから投入します。
 */

// エミュレーター接続を確実にするための設定
(process.env as any).NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-bom3d-sn923";
(process.env as any).NODE_ENV = 'development';

async function clearCollection(name: string) {
    console.log(`[Clear] Cleaning collection: ${name}...`);
    const q = collection(db, name);
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
    console.log(`[Clear] ${snapshot.size} documents deleted from ${name}.`);
}

async function seed() {
    const args = process.argv.slice(2);
    const shouldClear = args.includes('--clear');

    console.log('--- Database Seeding Start ---');

    if (shouldClear) {
        await clearCollection('projects');
        await clearCollection('boxes');
    }

    // 1. projects
    console.log('Seeding projects...');
    const projectId = "proto-2024";
    const projectRef = doc(db, 'projects', projectId);
    const projectData = {
        name: "プロトタイプ開発2024",
        deadline: "2024-12-31",
        description: "Firebase移行後の初期データ",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
    };

    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists() || shouldClear) {
        await setDoc(projectRef, projectData);
        console.log(`✔️  Project "${projectData.name}" created (ID: ${projectId}).`);
    } else {
        console.log(`ℹ️  Project "${projectId}" already exists. Skipping.`);
    }

    // 2. boxes (新規追加)
    console.log('Seeding boxes (BOX-001 to BOX-050)...');
    let createdCount = 0;
    let skippedCount = 0;

    for (let i = 1; i <= 50; i++) {
        const boxId = `BOX-${String(i).padStart(3, '0')}`;
        const boxRef = doc(db, 'boxes', boxId);

        const boxData = {
            id: boxId,
            status: "AVAILABLE",
            updated_at: serverTimestamp()
        };

        if (!shouldClear) {
            const boxSnap = await getDoc(boxRef);
            if (boxSnap.exists()) {
                skippedCount++;
                continue;
            }
        }

        await setDoc(boxRef, boxData);
        createdCount++;
    }

    console.log(`✔️  Boxes: ${createdCount} created, ${skippedCount} skipped.`);
    console.log('--- Seeding Completed! ---');
    process.exit(0);
}

seed().catch((error) => {
    console.error('❌  Seeding failed:', error);
    process.exit(1);
});
