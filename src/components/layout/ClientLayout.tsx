"use client";

import { AuthProvider } from '@/contexts/AuthContext';
import MobileNav from '@/components/layout/MobileNav';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <MobileNav />
    </AuthProvider>
  );
}
