'use client'

import { useState, useTransition } from 'react'
import { ModelViewer } from './ModelViewer'
import { PROCESSES } from '@/app/constants'
import { updateProcess } from '@/app/actions/updateProcess'
import { reportDefect } from '@/app/actions/reportDefect'

interface PreviewModalProps {
    isOpen: boolean
    onClose: () => void
    partNumber: string
    itemId?: number
    status?: string
    projectId?: number
}

export function PreviewModal({
    isOpen,
    onClose,
    partNumber,
    itemId,
    status,
    projectId
}: PreviewModalProps) {
    const [isPending, startTransition] = useTransition()
    const [defectReason, setDefectReason] = useState('')

    if (!isOpen) return null

    // 現在の工程より「前」の工程を抽出（差し戻し用）
    const currentIndex = PROCESSES.findIndex(p => p.key === status)
    const previousProcesses = PROCESSES.slice(0, currentIndex)

    const handleUpdateStatus = (statusKey: string) => {
        if (!itemId || !projectId) return
        startTransition(async () => {
            await updateProcess(itemId, statusKey, projectId)
            onClose()
        })
    }

    const handleReportDefect = () => {
        if (!itemId || !defectReason) return
        startTransition(async () => {
            await reportDefect(itemId, defectReason)
            setDefectReason('')
            onClose()
        })
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

                {/* ヘッダー */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900">{partNumber}</h3>
                        <p className="text-sm text-gray-500 font-bold">ITEM ID: {itemId} / CURRENT: {status}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-2xl font-bold"
                    >
                        &times;
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* 左側：3Dプレビュー */}
                    <div className="flex-[2] bg-gray-100 relative min-h-[300px]">
                        <ModelViewer url={`/models/${partNumber}.stl`} />
                        <div className="absolute bottom-4 left-4 bg-white/80 px-3 py-1 rounded text-xs font-bold text-gray-500">
                            3D PREVIEW MODE
                        </div>
                    </div>

                    {/* 右側：操作パネル */}
                    <div className="flex-1 border-l bg-white p-6 overflow-y-auto space-y-8">

                        {/* 1. 工程の差し戻し */}
                        <section>
                            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">工程を差し戻す (手戻り)</h4>
                            <div className="grid grid-cols-1 gap-2">
                                {previousProcesses.length > 0 ? (
                                    previousProcesses.map((proc) => (
                                        <button
                                            key={proc.key}
                                            onClick={() => handleUpdateStatus(proc.key)}
                                            disabled={isPending}
                                            className="text-left px-4 py-3 border-2 border-orange-100 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group"
                                        >
                                            <span className="text-xs font-bold text-orange-400 block uppercase">{proc.key}へ戻す</span>
                                            <span className="font-bold text-gray-700 group-hover:text-orange-700">{proc.name}</span>
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-400 italic">差し戻せる前の工程はありません</p>
                                )}
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* 2. 不良報告 */}
                        <section className="p-5 border-2 border-red-100 rounded-2xl bg-red-50/30">
                            <h4 className="text-lg font-black text-red-700 mb-2">不良を報告する</h4>
                            <p className="text-xs text-red-600 mb-4 leading-relaxed font-medium">
                                個体に欠陥がある場合、不良として確定させます。実行すると自動的に再製作ジョブが生成されます。
                            </p>
                            <div className="space-y-3">
                                <textarea
                                    value={defectReason}
                                    onChange={(e) => setDefectReason(e.target.value)}
                                    placeholder="不良の理由を入力してください..."
                                    className="w-full p-3 border-2 border-red-100 rounded-xl text-sm focus:border-red-500 outline-none resize-none h-24 font-medium"
                                />
                                <button
                                    onClick={handleReportDefect}
                                    disabled={isPending || !defectReason}
                                    className={`w-full py-4 rounded-xl font-black transition-all shadow-md ${isPending || !defectReason
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-red-600 text-white hover:bg-red-700 active:scale-95'
                                        }`}
                                >
                                    {isPending ? '処理中...' : '不良確定 & 再製作依頼'}
                                </button>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    )
}