/**
 * BoxService ユニットテスト
 * 
 * 物理的な箱（Box）の管理機能に関するユニットテスト。
 * TDDに基づき、実装本体がない状態で「失敗するテスト」として定義します。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
// まだ BoxService は実装されていないため、インポートエラーは許容されます
// @ts-ignore
import { BoxService } from '../boxService';
import { db } from '@/src/shared/lib/firebase';
import * as firestore from 'firebase/firestore';

// Firebase Firestoreのモック化
vi.mock('@/src/shared/lib/firebase', () => ({
    db: {
        type: 'firestore-mock'
    }
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    getDocs: vi.fn(),
    doc: vi.fn(),
    runTransaction: vi.fn(),
    serverTimestamp: vi.fn(() => 'mock-timestamp'),
}));

describe('BoxService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('findAndOccupyEmptyBox', () => {
        const partItemId = 'PART-ITEM-001';

        it('【正常系】空きボックスが存在する場合、正しく1つ確保され、ステータスが更新されること', async () => {
            const mockBoxId = 'BOX-001';
            const mockBoxData = { id: mockBoxId, name: '棚A-1', is_occupied: false, current_item_id: null };

            // 1. getDocs で空きボックスの一覧（1件）を取得するモック
            (firestore.getDocs as any).mockResolvedValueOnce({
                empty: false,
                docs: [{
                    id: mockBoxId,
                    data: () => mockBoxData,
                    ref: { id: mockBoxId }
                }]
            });

            // 2. runTransaction のモック
            (firestore.runTransaction as any).mockImplementationOnce(async (dbInst: any, updateFn: any) => {
                const transaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        id: mockBoxId,
                        data: () => mockBoxData
                    }),
                    update: vi.fn()
                };
                return await updateFn(transaction);
            });

            const result = await BoxService.findAndOccupyEmptyBox(partItemId);

            // 検証:
            // - 返り値が期待したボックス情報であること
            expect(result.id).toBe(mockBoxId);
            // - トランザクションが実行されていること
            expect(firestore.runTransaction).toHaveBeenCalled();
            // - クエリで is_occupied: false を条件にしていること
            expect(firestore.where).toHaveBeenCalledWith('is_occupied', '==', false);
        });

        it('【異常系】ボックスがすべて使用中の場合、"No available boxes" エラーを投げること', async () => {
            // 空きボックスが見つからない状態をシミュレート
            (firestore.getDocs as any).mockResolvedValueOnce({
                empty: true,
                docs: []
            });

            await expect(BoxService.findAndOccupyEmptyBox(partItemId))
                .rejects.toThrow('No available boxes');
        });

        it('【境界値】同時に複数の割り当てが走っても二重割り当てされないよう、トランザクションを使用していること', async () => {
            (firestore.getDocs as any).mockResolvedValueOnce({
                empty: false,
                docs: [{ id: 'BOX-001', data: () => ({ is_occupied: false }), ref: { id: 'BOX-001' } }]
            });

            await BoxService.findAndOccupyEmptyBox(partItemId);

            // トランザクションの呼び出しを確認
            expect(firestore.runTransaction).toHaveBeenCalled();
        });
    });

    describe('releaseBox', () => {
        const boxId = 'BOX-001';

        it('【正常系】部品の工程完了時、ボックスが正しく解放され、再利用可能になること', async () => {
            // 実行
            await BoxService.releaseBox(boxId);

            // 検証:
            // - トランザクション（またはアトミックな更新）が実行されていること
            expect(firestore.runTransaction).toHaveBeenCalled();

            // トランザクション内部で update が呼ばれ、is_occupied が false、item_id が null になっていることを想定
            // (具体的な検証は実装の詳細に依存するが、ここでは関数の存在を確認)
            expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'boxes', boxId);
        });
    });
});
