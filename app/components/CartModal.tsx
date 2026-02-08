import { ProcessStatus } from '../types';
import { PROCESSES } from '../constants';

interface CartItem {
    id: number;
    part_number: string;
    status: ProcessStatus;
    count: number;
}

interface CartModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: CartItem[];
    onDownload: () => void;
}

export function CartModal({ isOpen, onClose, items, onDownload }: CartModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                                {items.length}
                            </span>
                            Selected Items
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">Ready for batch download</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-0 overflow-y-auto flex-1">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p>No items selected</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-50/50 sticky top-0 z-10">
                                <tr>
                                    <th className="text-left py-3 px-6 font-medium">Part Number</th>
                                    <th className="text-left py-3 px-6 font-medium">Current Status</th>
                                    <th className="text-right py-3 px-6 font-medium">Format</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item) => {
                                    const processName = PROCESSES.find(p => p.key === item.status)?.name || item.status;
                                    return (
                                        <tr key={item.id} className="group hover:bg-blue-50/30 transition-colors">
                                            <td className="py-3 px-6 font-bold text-gray-800">
                                                {item.part_number}
                                                <div className="text-[10px] text-gray-400 font-normal">ID: {item.id}</div>
                                            </td>
                                            <td className="py-3 px-6">
                                                <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                                                    {processName}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 text-right text-gray-500 font-mono text-xs">
                                                .stl
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="p-6 bg-gray-50 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 rounded-xl border border-gray-300 font-bold text-gray-600 hover:bg-white transition-colors"
                    >
                        戻る
                    </button>
                    <button
                        onClick={onDownload}
                        disabled={items.length === 0}
                        className="flex-1 px-6 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors shadow-lg disabled:bg-gray-300"
                    >
                        Zipで一括ダウンロード
                    </button>
                </div>
            </div>
        </div>
    );
}