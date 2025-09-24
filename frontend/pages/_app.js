import '../styles/globals.css'
import { Toaster } from 'react-hot-toast'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #374151',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </>
  )
}
