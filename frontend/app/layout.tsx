import { CanvasRuntime } from '@drupal-canvas/headless-next/CanvasRuntime';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DraftIndicator } from '../components/draft-indicator';
import './globals.css';
import '../styles/alpina/main.scss';

export const metadata: Metadata = {
  title: 'Canvas Headless — Next.js',
  description: 'A minimal Drupal Canvas headless frontend.',
  other: { google: 'notranslate' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" translate="no" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <CanvasRuntime>
          <DraftIndicator />
          {children}
        </CanvasRuntime>
      </body>
    </html>
  );
}
