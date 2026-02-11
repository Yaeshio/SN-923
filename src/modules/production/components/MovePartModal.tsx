import React from 'react';
import { Unit } from '@/app/types';
import { X, FolderOutput, Folder } from 'lucide-react';

interface MovePartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMove: (unitId: string | null) => void;
    units: Unit[];
    currentUnitId?: string | null;
    partNumber: string;
}

export function MovePartModal({
    isOpen,
    onClose,
    onMove,
    units,
    currentUnitId,
    partNumber
}: MovePartModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-gray-50 border-b border-gray-100 p-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">ユニット移動</h3>
                        <p className="text-xs text-gray-500 mt-0.5">部品: <span className="font-mono text-blue-600">{partNumber}</span></p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-2 max-h-[60vh] overflow-y-auto">
                    <div className="grid gap-1">
                        {/* 未分類へ移動 */}
                        <button
                            onClick={() => onMove(null)}
                            disabled={!currentUnitId}
                            className={`
                                flex items-center gap-3 w-full p-3 rounded-lg text-left transition-all border
                                ${!currentUnitId
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 cursor-default'
                                    : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200 text-gray-600'
                                }
                            `}
                        >
                            <div className={`p-2 rounded-md ${!currentUnitId ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                <FolderOutput size={18} />
                            </div>
                            <div className="flex-1">
                                <span className="text-sm font-bold block">未分類 (No Unit)</span>
                                <span className="text-[10px] text-gray-400">ユニットから除外する</span>
                            </div>
                            {!currentUnitId && <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">CURRENT</span>}
                        </button>

                        <div className="h-px bg-gray-100 my-1 mx-2" />

                        {/* 各ユニットへ移動 */}
                        {units.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-xs italic">
                                作成されたユニットはありません
                            </div>
                        ) : (
                            units.map((unit) => {
                                const isCurrent = unit.id === currentUnitId;
                                return (
                                    <button
                                        key={unit.id}
                                        onClick={() => onMove(unit.id)}
                                        disabled={isCurrent}
                                        className={`
                                            flex items-center gap-3 w-full p-3 rounded-lg text-left transition-all border
                                            ${isCurrent
                                                ? 'bg-blue-50 border-blue-200 text-blue-700 cursor-default'
                                                : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200 text-gray-700'
                                            }
                                        `}
                                    >
                                        <div className={`p-2 rounded-md ${isCurrent ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <Folder size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-bold block truncate">{unit.name}</span>
                                            {unit.description && <span className="text-[10px] text-gray-400 truncate block">{unit.description}</span>}
                                        </div>
                                        {isCurrent && <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">CURRENT</span>}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
