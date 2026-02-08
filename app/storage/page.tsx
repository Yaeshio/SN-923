import { getStorageBoxStatus } from '@/app/actions/storageActions';
import StorageBoxGrid from './StorageBoxGrid';

export const dynamic = 'force-dynamic';

export default async function StoragePage() {
    const result = await getStorageBoxStatus(100);

    if (!result.success) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">保管ボックス管理</h1>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800">エラーが発生しました: {result.error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">保管ボックス管理</h1>
                    <p className="text-gray-600">
                        保管ボックスの使用状況を確認し、必要に応じて強制解放できます。
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span className="text-sm text-gray-700">使用中</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <span className="text-sm text-gray-700">空き</span>
                        </div>
                    </div>
                </div>

                <StorageBoxGrid boxes={result.boxes} />
            </div>
        </div>
    );
}
