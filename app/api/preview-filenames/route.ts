import { NextRequest, NextResponse } from 'next/server';
import { parseFileNames } from '@/lib/utils/parseFileName';

export async function POST(request: NextRequest) {
    try {
        const { fileNames } = await request.json();

        if (!Array.isArray(fileNames)) {
            return NextResponse.json(
                { error: 'fileNames must be an array' },
                { status: 400 }
            );
        }

        const results = parseFileNames(fileNames);
        return NextResponse.json(results);
    } catch (error) {
        console.error('Error in preview-filenames API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
