import { Part, PartItem, Process, Project } from '@/app/types';
import { parts as initialParts, partItems as initialPartItems, projects as initialProjects } from '@/app/data';

// サーバーサイドでのメモリストア（シングルトン）
// Next.jsのHMR（Hot Module Replacement）でリセットされないように global を使用
declare global {
    var __mock_store: {
        projects: Project[];
        parts: Part[];
        partItems: PartItem[];
    } | undefined;
}

if (!global.__mock_store) {
    global.__mock_store = {
        projects: [...initialProjects],
        parts: [...initialParts],
        partItems: [...initialPartItems],
    };
}

const store = global.__mock_store!;

export const mockStore = {
    getProjects: async (): Promise<Project[]> => {
        return store.projects;
    },

    getProject: async (id: number): Promise<Project | null> => {
        return store.projects.find(p => p.id === id) || null;
    },

    getParts: async (projectId?: number): Promise<Part[]> => {
        if (projectId) {
            return store.parts.filter(p => p.project_id === projectId);
        }
        return store.parts;
    },

    getPartItems: async (projectId?: number): Promise<PartItem[]> => {
        if (projectId) {
            const projectParts = store.parts.filter(p => p.project_id === projectId);
            const partIds = projectParts.map(p => p.id);
            return store.partItems.filter(i => partIds.includes(i.part_id));
        }
        return store.partItems;
    },

    getPartItem: async (id: number): Promise<(PartItem & { parts: Part }) | null> => {
        const item = store.partItems.find((i) => i.id === id);
        if (!item) return null;
        const part = store.parts.find((p) => p.id === item.part_id);
        return { ...item, parts: part! };
    },

    updatePartItem: async (id: number, updates: Partial<PartItem>): Promise<void> => {
        const index = store.partItems.findIndex((i) => i.id === id);
        if (index !== -1) {
            store.partItems[index] = { ...store.partItems[index], ...updates };
        }
    },

    addPartItem: async (item: Omit<PartItem, 'id'>): Promise<PartItem> => {
        const newId = Math.max(0, ...store.partItems.map((i) => i.id)) + 1;
        const newItem = { ...item, id: newId };
        store.partItems.push(newItem);
        return newItem;
    },

    // localStorage への保存・読み込み（ブラウザ側で呼び出す場合を想定）
    // サーバーアクション内では動作しませんが、クライアントコンポーネント用として用意
    saveToLocalStorage: () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('mock_projects', JSON.stringify(store.projects));
            localStorage.setItem('mock_parts', JSON.stringify(store.parts));
            localStorage.setItem('mock_partItems', JSON.stringify(store.partItems));
        }
    },

    loadFromLocalStorage: () => {
        if (typeof window !== 'undefined') {
            const savedProjects = localStorage.getItem('mock_projects');
            const savedParts = localStorage.getItem('mock_parts');
            const savedItems = localStorage.getItem('mock_partItems');
            if (savedProjects) store.projects = JSON.parse(savedProjects);
            if (savedParts) store.parts = JSON.parse(savedParts);
            if (savedItems) store.partItems = JSON.parse(savedItems);
        }
    }
};
