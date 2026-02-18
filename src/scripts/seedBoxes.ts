/**
 * Boxコレクション シーディングスクリプト
 * 
 * 物理的な箱（Box）のマスターデータをFirestoreに投入します。
 * 
 * 役割:
 * - 既に存在する boxes コレクションの内容をクリアする
 * - BOX-01 から BOX-20 までの初期データを生成する
 * 
 * 実行方法:
 * npx tsx src/scripts/seedBoxes.ts
 */

import { db } from '../shared/lib/firebase';
import {
    collection,
    writeBatch,
    doc,
    getDocs,
    serverTimestamp,
    query
} from 'firebase/firestore';

// エミュレーター環境用の設定を強制適用
(process.env as any).NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-bom3d-sn923";
(process.env as any).NODE_ENV = 'development';

async function seedBoxes() {
    console.log('--- Box Database Seeding Start ---');

    try {
        const boxesRef = collection(db, 'boxes');

        // 1. 既存の全ボックスを削除（重複防止と定義変更への対応）
        console.log('Fetching existing boxes for clearing...');
        const snapshot = await getDocs(query(boxesRef));

        if (!snapshot.empty) {
            console.log(`Clearing ${snapshot.size} existing boxes...`);
            const clearBatch = writeBatch(db);
            snapshot.docs.forEach((d) => {
                clearBatch.delete(d.ref);
            });
            await clearBatch.commit();
            console.log('✔️  Existing boxes cleared successfully.');
        }

        // 2. 新規データ（BOX-01 〜 BOX-20）の投入
        console.log('Generating 20 new boxes (BOX-01 to BOX-20)...');
        const batch = writeBatch(db);
        const count = 20;

        for (let i = 1; i <= count; i++) {
            const boxId = `BOX-${String(i).padStart(2, '0')}`;
            const boxRef = doc(db, 'boxes', boxId);

            const boxData = {
                id: boxId,
                name: `棚A-${i}`, // 管理用の名称
                is_occupied: false,
                current_item_id: null,
                last_used_at: serverTimestamp()
            };

            batch.set(boxRef, boxData);
        }

        await batch.commit();
        console.log(`✔️  ${count} boxes have been successfully seeded.`);
        console.log('--- Seeding Completed Successfully! ---');

    } catch (error) {
        console.error('❌  Seeding failed with error:');
        console.error(error);
        process.exit(1);
    }

    process.exit(0);
}

// 実行
seedBoxes();
