'use server'

/**
 * Engineering Module - Project Actions
 * プロジェクトの作成と管理
 */

import { db } from '@/src/shared/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

/**
 * 新規プロジェクトを作成するサーバーアクション
 * 
 * @param name - プロジェクト名
 * @param description - 説明
 * @param deadline - 納期
 * @returns 作成されたプロジェクトのID
 */
export async function createProject(
    name: string,
    description: string,
    deadline: string
) {
    try {
        const docRef = await addDoc(collection(db, 'projects'), {
            name,
            description,
            deadline,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        });

        console.log(`[ProjectActions] Created new project with ID: ${docRef.id}`);

        // ダッシュボードを更新
        revalidatePath('/');

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Failed to create project:', error);
        return { success: false, error: 'プロジェクトの作成に失敗しました' };
    }
}
