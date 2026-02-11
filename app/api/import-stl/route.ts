import { NextRequest, NextResponse } from 'next/server';
import { importMultipleStl } from '@/src/modules/engineering/actions/importStl';
import { ProcessStatus } from '@/src/shared/types';

export async function POST(request: NextRequest) {
    try {
        const { projectId, defaultStatus, filesData } = await request.json();

        if (!projectId || !filesData || !Array.isArray(filesData)) {
            return NextResponse.json(
                { error: 'Invalid request parameters' },
                { status: 400 }
            );
        }

        // Uint8Array を ArrayBuffer に変換
        const convertedFilesData = filesData.map((fd: any) => ({
            name: fd.name,
            buffer: new Uint8Array(fd.buffer).buffer
        }));

        const results = await importMultipleStl(
            convertedFilesData,
            projectId,
            (defaultStatus as ProcessStatus) || 'CUTTING'
        );

        return NextResponse.json(results);
    } catch (error) {
        console.error('Error in import-stl API:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
