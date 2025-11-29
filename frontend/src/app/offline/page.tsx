'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
    const router = useRouter();
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        // Check if online
        setIsOnline(navigator.onLine);

        // Listen for online/offline events
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        // Redirect to home when back online
        if (isOnline) {
            router.push('/');
        }
    }, [isOnline, router]);

    const handleRetry = () => {
        if (navigator.onLine) {
            router.push('/');
        } else {
            window.location.reload();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                {/* Logo */}
                <div className="mb-8">
                    <img
                        src="/imgs/streakupLogo.png"
                        alt="StreakUp Logo"
                        className="w-32 h-32 mx-auto"
                    />
                </div>

                {/* Offline Icon */}
                <div className="mb-6">
                    <svg
                        className="w-24 h-24 mx-auto text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                        />
                    </svg>
                </div>

                {/* Message */}
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    You're Offline
                </h1>
                <p className="text-gray-600 mb-8">
                    It looks like you've lost your internet connection. Don't worry, you can still view previously loaded pages!
                </p>

                {/* Status */}
                <div className="mb-8">
                    {isOnline ? (
                        <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Back Online!
                        </div>
                    ) : (
                        <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            No Connection
                        </div>
                    )}
                </div>

                {/* Retry Button */}
                <button
                    onClick={handleRetry}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                    {isOnline ? 'Go to Home' : 'Retry Connection'}
                </button>

                {/* Tips */}
                <div className="mt-8 text-left bg-white rounded-lg p-6 shadow-md">
                    <h3 className="font-semibold text-gray-900 mb-3">💡 Tips while offline:</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Previously visited pages are cached and available offline</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Check your WiFi or mobile data connection</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Try switching between WiFi and mobile data</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>The app will automatically reconnect when online</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
