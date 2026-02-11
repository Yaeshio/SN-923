import { Part, PartItem, Project, ProcessStatus, Unit } from '@/app/types';
import { db } from './firebase';
import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    addDoc,
    query,
    where,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';

// Firestoreのデータコンバーター（Date型の復元など）
const dateConverter = (data: any): any => {
    if (!data) return data;
    const result = { ...data };
    // completed_atなどのTimestampをDateに戻す
    Object.keys(result).forEach(key => {
        if (result[key] instanceof Timestamp) {
            result[key] = result[key].toDate();
        }
    });
    return result;
};

export const mockStore = {
    getProjects: async (): Promise<Project[]> => {
        const snapshot = await getDocs(collection(db, 'projects'));
        return snapshot.docs.map(doc => ({
            id: Number(doc.id),
            ...dateConverter(doc.data())
        })) as Project[];
    },

    getProject: async (id: number): Promise<Project | null> => {
        const docRef = doc(db, 'projects', String(id));
        const span = await getDoc(docRef);
        if (!span.exists()) return null;
        return { id: Number(span.id), ...dateConverter(span.data()) } as Project;
    },

    getUnitsByProject: async (projectId: number): Promise<Unit[]> => {
        const q = query(collection(db, 'units'), where('project_id', '==', projectId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Unit[];
    },

    addUnit: async (projectId: number, name: string): Promise<Unit> => {
        const docRef = await addDoc(collection(db, 'units'), {
            project_id: projectId,
            name: name,
            description: ''
        });
        return {
            id: docRef.id,
            project_id: projectId,
            name: name
        };
    },

    assignPartToUnit: async (partId: number, unitId: string | null): Promise<void> => {
        const docRef = doc(db, 'parts', String(partId));
        await updateDoc(docRef, {
            unit_id: unitId
        });
    },

    getParts: async (projectId?: number): Promise<Part[]> => {
        let q;
        if (projectId) {
            q = query(collection(db, 'parts'), where('project_id', '==', projectId));
        } else {
            q = collection(db, 'parts');
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: Number(doc.id),
            ...dateConverter(doc.data())
        })) as Part[];
    },

    getPartItems: async (projectId?: number): Promise<PartItem[]> => {
        // プロジェクトID指定がある場合、まず対象のPartを取得
        let targetPartIds: number[] | null = null;
        if (projectId) {
            const parts = await mockStore.getParts(projectId);
            targetPartIds = parts.map(p => p.id);
            if (targetPartIds.length === 0) return [];
        }

        const snapshot = await getDocs(collection(db, 'partItems'));
        const items = snapshot.docs.map(doc => ({
            id: Number(doc.id),
            ...dateConverter(doc.data())
        })) as PartItem[];

        if (targetPartIds) {
            return items.filter(item => targetPartIds!.includes(item.part_id));
        }
        return items;
    },

    getPartItem: async (id: number): Promise<(PartItem & { parts: Part }) | null> => {
        const itemRef = doc(db, 'partItems', String(id));
        const itemSnap = await getDoc(itemRef);

        if (!itemSnap.exists()) return null;
        const itemData = { id: Number(itemSnap.id), ...dateConverter(itemSnap.data()) } as PartItem;

        // 関連するPartを取得
        const partRef = doc(db, 'parts', String(itemData.part_id));
        const partSnap = await getDoc(partRef);

        if (!partSnap.exists()) {
            throw new Error(`Part not found for item ${id}`);
        }
        const partData = { id: Number(partSnap.id), ...dateConverter(partSnap.data()) } as Part;

        return { ...itemData, parts: partData };
    },

    updatePartItem: async (id: number, updates: Partial<PartItem>): Promise<void> => {
        const docRef = doc(db, 'partItems', String(id));
        await updateDoc(docRef, updates);
    },

    updatePartItemStatus: async (id: string | number, newStatus: string): Promise<void> => {
        const docRef = doc(db, 'partItems', String(id));
        await updateDoc(docRef, {
            status: newStatus as ProcessStatus,
            updated_at: serverTimestamp()
        });
    },

    addPartItem: async (item: Omit<PartItem, 'id'>): Promise<PartItem> => {
        // IDの自動採番（Max + 1）
        const snapshot = await getDocs(collection(db, 'partItems'));
        const ids = snapshot.docs.map(d => Number(d.id));
        const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;

        const newItem = { ...item, id: newId };
        const docRef = doc(db, 'partItems', String(newId));
        await setDoc(docRef, newItem);

        return newItem as PartItem;
    },

    // 互換性のためのダミーメソッド
    saveToLocalStorage: () => {
        console.warn('saveToLocalStorage is deprecated in Firestore mode');
    },

    loadFromLocalStorage: () => {
        console.warn('loadFromLocalStorage is deprecated in Firestore mode');
    }
};
