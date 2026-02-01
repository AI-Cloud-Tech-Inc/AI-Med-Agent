import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI-Med-Agent | Autonomous Governance Dashboard',
  description: 'Autonomous AWS Organizations management and governance platform',
  metadataBase: new URL('https://ai-med-agent.example.com'),
  icons: {
    icon: '🏛️',
    apple: '🏛️',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AI-Med-Agent',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Viewport and Mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AI-Med-Agent" />
        
        {/* Browser & OS Compatibility */}
        <meta name="theme-color" content="#0f172a" />
        <meta name="msapplication-TileColor" content="#0f172a" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="application-name" content="AI-Med-Agent" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Security & Compatibility */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="robots" content="index, follow" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Touch Icons */}
        <link rel="apple-touch-icon" href="/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body className="bg-primary text-white antialiased">
        {children}
        {/* Service Worker Registration */}
        <script dangerouslySetInnerHTML={{__html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js').catch(() => {}); }` }} />
      </body>
    </html>
  );
}
