'use client';

import React, { useState, useEffect } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface FileDownloadButtonProps {
    storagePath: string;
    fileName: string;
    label?: string;
    variant?: 'primary' | 'outline' | 'ghost';
    icon?: React.ReactNode;
}

export default function FileDownloadButton({
    storagePath,
    fileName,
    label,
    variant = 'outline',
    icon
}: FileDownloadButtonProps) {
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const fetchUrl = async () => {
            setIsLoading(true);
            setIsError(false);
            try {
                const fileRef = ref(storage, storagePath);
                const url = await getDownloadURL(fileRef);
                setDownloadUrl(url);
            } catch (error: any) {
                console.error(`Error fetching download URL for ${storagePath}:`, error);
                if (error.code === 'storage/object-not-found') {
                    setIsError(true);
                } else {
                    setIsError(true);
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (storagePath) {
            fetchUrl();
        }
    }, [storagePath]);

    const handleDownload = () => {
        if (!downloadUrl) return;

        // Use a hidden anchor tag to trigger download with fileName
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const baseStyles = "inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
        outline: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-100"
    };

    const defaultIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
    );

    if (isLoading) {
        return (
            <button disabled className={`${baseStyles} ${variants[variant]}`}>
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></span>
                {label || 'Loading...'}
            </button>
        );
    }

    if (isError) {
        return (
            <button disabled title="ファイルが登録されていません" className={`${baseStyles} ${variants[variant]} opacity-40`}>
                {icon || defaultIcon}
                {label ? `${label} (未登録)` : '未登録'}
            </button>
        );
    }

    return (
        <button
            onClick={handleDownload}
            className={`${baseStyles} ${variants[variant]}`}
        >
            {icon || defaultIcon}
            {label}
        </button>
    );
}
