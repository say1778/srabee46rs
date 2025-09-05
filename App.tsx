
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { fileToGenerativePart, applyBackgroundColor } from './utils/fileUtils';
import { removeImageBackground } from './services/geminiService';

// --- Icon Components ---
const UploadCloudIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/>
    </svg>
);

const WandIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 4V2"/><path d="M15 16v-2"/><path d="M11.4 20s.6-1.6.6-2c0-.4-.2-.8-.4-1.1l-1.5-1.5c-.3-.2-.6-.4-1-.4H7.5c-.6 0-1.1-.4-1.3-.9L2.3 4.6c0-.2.2-.4.4-.4h2.5c.3 0 .5.2.6.4L8 8.3c.2.3.4.6.4 1s-.2.8-.4 1.1l-1.5 1.5c-.3.2-.6.4-1 .4H3.5c-.6 0-1.1-.4-1.3-.9L-.7 1.6c0-.2.2-.4.4-.4h2.5c.3 0 .5.2.6.4l2.7 4.2c.2.3.4.6.4 1s-.2.8-.4 1.1l-1.5 1.5c-.3.2-.6.4-1 .4H.5c-.6 0-1.1-.4-1.3-.9L-3.7-3.4c0-.2.2-.4.4-.4h2.5c.3 0 .5.2.6.4l2.7 4.2c.2.3.4.6.4 1s-.2.8-.4 1.1l-1.5 1.5c-.3.2-.6.4-1 .4H-2.5c-.6 0-1.1-.4-1.3-.9l-3.9-6.2"/><path d="M9 4V2"/><path d="M9 16v-2"/><path d="m4.6 4.6 1.4 1.4"/><path d="m18 18 1.4 1.4"/><path d="m4.6 19.4 1.4-1.4"/><path d="m18 6 1.4-1.4"/><path d="M12 6V2"/><path d="M12 22v-4"/>
    </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
    </svg>
);

const LoaderIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
);

// --- UI Components ---

interface UploaderProps {
    onFileSelect: (file: File) => void;
    isDragging: boolean;
}

const Uploader: React.FC<UploaderProps> = ({ onFileSelect, isDragging }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    return (
        <div 
            className={`w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ${isDragging ? 'border-indigo-400 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}
            onClick={() => inputRef.current?.click()}
        >
            <input
                type="file"
                ref={inputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
            />
            <div className="flex flex-col items-center justify-center text-center space-y-4">
                <UploadCloudIcon className="w-16 h-16 text-gray-400" />
                <h2 className="text-xl font-bold text-gray-200">اسحب وأفلت صورة هنا</h2>
                <p className="text-gray-400">أو</p>
                <button className="px-6 py-2 bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-500 transition-colors">
                    اختر ملفًا
                </button>
                <p className="text-xs text-gray-500 mt-2">يدعم PNG, JPG, WEBP</p>
            </div>
        </div>
    );
};

interface ImageCardProps {
    label: string;
    imageUrl?: string | null;
    isLoading?: boolean;
    progress?: number;
    loadingMessage?: string;
}

const ImageCard: React.FC<ImageCardProps> = ({ label, imageUrl, isLoading = false, progress = 0, loadingMessage = 'جاري المعالجة...' }) => (
    <div className="w-full flex flex-col items-center space-y-3 bg-gray-800/50 p-4 rounded-2xl shadow-lg">
        <h3 className="font-bold text-lg text-gray-300">{label}</h3>
        <div className="w-full aspect-square bg-gray-900/50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-700 relative" style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 32 32\' size=\'32\' fill=\'rgb(55,65,81)\'%3e%3cpath d=\'M0 0 H16 V16 H0 Z M16 16 H32 V32 H16 Z\'/%3e%3c/svg%3e")' }}>
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 text-indigo-400 p-4 bg-gray-900/80">
                    <LoaderIcon className="w-12 h-12 animate-spin" />
                    <p className="font-semibold">{loadingMessage}</p>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div 
                            className="bg-indigo-500 h-2.5 rounded-full transition-all duration-150 ease-linear" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-sm font-mono">{Math.round(progress)}%</p>
                </div>
            )}
            {!isLoading && imageUrl && (
                <img src={imageUrl} alt={label} className="w-full h-full object-contain" />
            )}
            {!isLoading && !imageUrl && (
                 <div className="flex flex-col items-center space-y-2 text-gray-500">
                    <WandIcon className="w-12 h-12" />
                    <p>ستظهر النتيجة هنا</p>
                </div>
            )}
        </div>
    </div>
);


// --- Main App Component ---

export default function App() {
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
    const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
    const [backgroundColor, setBackgroundColor] = useState<string>(() => {
        try {
            const savedColor = localStorage.getItem('savedBackgroundColor');
            return savedColor || '#FFFFFF';
        } catch (error) {
            console.error("Could not read from localStorage", error);
            return '#FFFFFF';
        }
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [loadingMessage, setLoadingMessage] = useState<string>('جاري المعالجة...');
    const animationFrameRef = useRef<number | null>(null);

    const handleFileSelect = useCallback((file: File) => {
        setOriginalFile(file);
        setOriginalImageUrl(URL.createObjectURL(file));
        setProcessedImageUrl(null);
        setFinalImageUrl(null);
        setError(null);
        setProgress(0);
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('savedBackgroundColor', backgroundColor);
        } catch (error) {
            console.error("Could not write to localStorage", error);
        }
    }, [backgroundColor]);
    
    useEffect(() => {
        if (!processedImageUrl) {
            setFinalImageUrl(null);
            return;
        }

        applyBackgroundColor(processedImageUrl, backgroundColor)
            .then(url => setFinalImageUrl(url))
            .catch(err => {
                console.error("Failed to apply background color", err);
                setError(err instanceof Error ? err.message : "فشل تطبيق لون الخلفية.");
            });
    }, [processedImageUrl, backgroundColor]);
    
    useEffect(() => {
        if (isLoading) {
            let startTime = Date.now();
            // Estimate duration based on file size. Base: 4s, +2s per MB.
            const estimatedDuration = 4000 + ((originalFile?.size || 0) / (1024 * 1024)) * 2000;

            const animateProgress = () => {
                const elapsedTime = Date.now() - startTime;
                const progressRatio = Math.min(1, elapsedTime / estimatedDuration);
                
                 // Update message based on progress
                if (progressRatio < 0.2) {
                    setLoadingMessage('جاري تحضير الصورة...');
                } else if (progressRatio < 0.8) {
                    setLoadingMessage('جاري إزالة الخلفية...');
                } else {
                    setLoadingMessage('جاري وضع اللمسات الأخيرة...');
                }

                // Use an easing function for a smoother feel
                const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
                const easedProgress = easeOutCubic(progressRatio);
                
                // Animate up to 95% while waiting for the API
                const currentProgress = easedProgress * 95;

                setProgress(currentProgress);

                if (progressRatio < 1) {
                    animationFrameRef.current = requestAnimationFrame(animateProgress);
                }
            };
            
            animationFrameRef.current = requestAnimationFrame(animateProgress);

        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
             // If processing was successful, show 100% briefly before resetting
            if (processedImageUrl) {
                setProgress(100);
                setLoadingMessage('اكتمل بنجاح!');
                setTimeout(() => {
                    // Only reset if we are not loading something new
                    if (!isLoading) {
                        setProgress(0);
                        setLoadingMessage('جاري المعالجة...');
                    }
                }, 1500);
            } else {
                // If there was an error or it was reset, reset progress immediately
                setProgress(0);
                setLoadingMessage('جاري المعالجة...');
            }
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isLoading, originalFile, processedImageUrl]);


    const handleRemoveBackground = async () => {
        if (!originalFile) return;

        setIsLoading(true);
        setError(null);
        setProcessedImageUrl(null);
        setFinalImageUrl(null);

        try {
            const imagePart = await fileToGenerativePart(originalFile);
            const resultUrl = await removeImageBackground(imagePart);
            setProcessedImageUrl(resultUrl);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        const urlToDownload = finalImageUrl || processedImageUrl;
        if (!urlToDownload) return;
        const link = document.createElement('a');
        link.href = urlToDownload;
        
        const originalFileName = originalFile?.name.split('.').slice(0, -1).join('.') || 'image';
        link.download = `${originalFileName}_colored_bg.png`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setOriginalFile(null);
        setOriginalImageUrl(null);
        setProcessedImageUrl(null);
        setFinalImageUrl(null);
        setError(null);
        setIsLoading(false);
        setBackgroundColor('#FFFFFF');
    };
    
    const setupDragHandlers = (activate: boolean) => {
        const dragEnter = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
        const dragLeave = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
        const dragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
        const drop = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            if (e.dataTransfer?.files?.[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
                e.dataTransfer.clearData();
            }
        };

        if(activate){
            window.addEventListener('dragenter', dragEnter);
            window.addEventListener('dragleave', dragLeave);
            window.addEventListener('dragover', dragOver);
            window.addEventListener('drop', drop);
        } else {
            window.removeEventListener('dragenter', dragEnter);
            window.removeEventListener('dragleave', dragLeave);
            window.removeEventListener('dragover', dragOver);
            window.removeEventListener('drop', drop);
        }
    };

    useEffect(() => {
        if (!originalFile) {
            setupDragHandlers(true);
        } else {
            setupDragHandlers(false);
        }

        return () => setupDragHandlers(false);
    }, [originalFile, handleFileSelect]);


    return (
        <div className="min-h-screen w-full bg-gray-900 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
            <header className="w-full max-w-5xl mx-auto text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
                    RS لتغيير خلفية الصور
                </h1>
                <p className="mt-2 text-lg text-gray-400">
                    مدعوم بالذكاء الاصطناعي من Gemini
                </p>
            </header>

            <main className="w-full max-w-5xl mx-auto flex-grow flex flex-col items-center justify-center">
                {!originalFile ? (
                    <Uploader onFileSelect={handleFileSelect} isDragging={isDragging} />
                ) : (
                    <div className="w-full flex flex-col items-center space-y-6">
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ImageCard label="الصورة الأصلية" imageUrl={originalImageUrl} />
                            <ImageCard label="النتيجة" imageUrl={finalImageUrl || processedImageUrl} isLoading={isLoading} progress={progress} loadingMessage={loadingMessage}/>
                        </div>

                        {error && <div className="w-full bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center">{error}</div>}

                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <button
                                onClick={handleRemoveBackground}
                                disabled={isLoading || !!processedImageUrl}
                                className="px-8 py-3 bg-indigo-600 rounded-lg font-bold text-lg flex items-center gap-2 transition-all duration-200 enabled:hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <WandIcon className="w-6 h-6" />
                                إزالة الخلفية
                            </button>
                             <button
                                onClick={handleDownload}
                                disabled={!processedImageUrl || isLoading}
                                className="px-8 py-3 bg-green-600 rounded-lg font-bold text-lg flex items-center gap-2 transition-all duration-200 enabled:hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <DownloadIcon className="w-6 h-6" />
                                تحميل
                            </button>
                             <button
                                onClick={handleReset}
                                className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                            >
                                اختيار صورة جديدة
                            </button>
                        </div>
                        {processedImageUrl && !isLoading && (
                            <div className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg border border-gray-700 mt-4">
                                <label htmlFor="color-picker" className="font-semibold text-gray-300 text-md pl-2">
                                    اختر لون الخلفية:
                                </label>
                                <input
                                    id="color-picker"
                                    type="color"
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    className="w-10 h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
                                    title="اختر لونًا"
                                />
                            </div>
                        )}
                    </div>
                )}
            </main>
             <footer className="w-full max-w-5xl mx-auto text-center mt-8 py-4">
                <p className="text-gray-500 text-sm">تطبيق تم إنشاؤه بواسطة الذكاء الاصطناعي</p>
            </footer>
        </div>
    );
}
