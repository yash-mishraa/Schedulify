import { useEffect, useState } from 'react';
import Head from 'next/head';
import Dashboard from '../components/ui/Dashboard';
import { apiUtils } from '../lib/api';

export default function Home() {
  const [apiStatus, setApiStatus] = useState('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    try {
      await apiUtils.checkHealth();
      setApiStatus('connected');
    } catch (error) {
      console.error('API connection failed:', error);
      setApiStatus('disconnected');
      setError(error.message);
    }
  };

  return (
    <>
      <Head>
        <title>Schedulify - AI-Powered Timetable Generator</title>
        <meta 
          name="description" 
          content="Generate optimized, clash-free timetables for educational institutions using AI genetic algorithms. Real-time updates, custom constraints, and export options." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Schedulify - AI-Powered Timetable Generator" />
        <meta 
          property="og:description" 
          content="Generate optimized, clash-free timetables for educational institutions using AI genetic algorithms." 
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://schedulify.vercel.app" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Schedulify - AI-Powered Timetable Generator" />
        <meta 
          name="twitter:description" 
          content="Generate optimized, clash-free timetables using AI algorithms." 
        />
        
        {/* Additional Meta Tags */}
        <meta name="keywords" content="timetable, schedule, generator, AI, genetic algorithm, education, school, college, optimization" />
        <meta name="author" content="Schedulify Team" />
        <meta name="robots" content="index, follow" />
        
        {/* Favicon */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      <main>
        {/* API Status Indicator */}
        {apiStatus === 'checking' && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-700"></div>
              <span className="text-sm">Connecting to server...</span>
            </div>
          </div>
        )}

        {apiStatus === 'disconnected' && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded max-w-sm">
              <div className="text-sm">
                <strong>Server Offline:</strong> {error}
              </div>
              <button 
                onClick={checkApiConnection}
                className="text-xs underline mt-1"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {apiStatus === 'connected' && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
              <span className="text-sm">✓ Server Connected</span>
            </div>
          </div>
        )}

        {/* Main Application */}
        <Dashboard />
      </main>
    </>
  );
}
