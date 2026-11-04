'use client';

import { Toaster } from 'react-hot-toast';

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={10}
      toastOptions={{
        duration: 3800,
        style: {
          background: '#ffffff',
          color: '#0f172a',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 12px 32px -12px rgba(15, 23, 42, 0.35)',
          fontSize: '13.5px',
          fontWeight: 500,
          maxWidth: '420px',
          padding: '12px 14px',
        },
        success: { iconTheme: { primary: '#059669', secondary: '#ecfdf5' } },
        error: { iconTheme: { primary: '#e11d48', secondary: '#fff1f2' } },
      }}
    />
  );
}
