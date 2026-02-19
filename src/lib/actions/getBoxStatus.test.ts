import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBoxStatus } from '@/src/modules/inventory/actions/storageActions';
import * as firestore from 'firebase/firestore';

/**
 * Inventory Module - getBoxStatus Test
 * 
 * 単一のボックスの状態（"occupied" または "available"）を
 * 動的なボックス名（例: "棚A-1"）に基づいて正しく判定できるかテストします。
 */

// Firestore (Client SDK) のモック化
vi.mock('@/src/shared/lib/firebase', () => ({
    db: { type: 'firestore-mock' }
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
}));

describe('getBoxStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * テストケース 1: 任意のボックス名が使用中の場合
     */
    it('任意のボックス名（例: "棚A-1"）が引数として与えられたとき、PartItem が存在すれば "occupied" を返すこと', async () => {
        const boxName = '棚A-1';

        // PartItem が存在するモック設定
        (firestore.getDocs as any).mockResolvedValue({
            empty: false,
            docs: [{ data: () => ({ id: 'item-1', storage_case: boxName, status: 'PRINTED' }) }]
        });

        const result = await getBoxStatus(boxName);
        expect(result).toBe('occupied');
    });

    /**
     * テストケース 2: 効率的なクエリ発行の検証
     */
    it('与えられたボックス識別子に対して正しくクエリを発行していること', async () => {
        const boxName = '棚A-1';
        (firestore.getDocs as any).mockResolvedValue({ empty: true, docs: [] });

        await getBoxStatus(boxName);

        // 検証: where句を使ったクエリが正しく呼ばれていること
        expect(firestore.query).toHaveBeenCalled();
        expect(firestore.where).toHaveBeenCalledWith('storage_case', '==', boxName);
    });

    /**
     * テストケース 3: ボックスが空の場合
     */
    it('DBに対応するボックス名の PartItem が存在しない場合、"available" を返すこと', async () => {
        const boxName = '空の棚-999';

        // 空の結果を返すモック
        (firestore.getDocs as any).mockResolvedValue({
            empty: true,
            docs: []
        });

        const result = await getBoxStatus(boxName);
        expect(result).toBe('available');
    });
});
