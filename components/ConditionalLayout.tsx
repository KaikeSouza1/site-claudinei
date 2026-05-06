// components/ConditionalLayout.tsx
'use client'

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export function ConditionalHeader() {
  const pathname = usePathname();
  // Se a rota começar com /admin ou for /login, retorna NADA (null)
  if (pathname.startsWith('/admin') || pathname === '/login') return null;
  return <Header />;
}

export function ConditionalFooter() {
  const pathname = usePathname();
  // Se a rota começar com /admin ou for /login, retorna NADA (null)
  if (pathname.startsWith('/admin') || pathname === '/login') return null;
  return <Footer />;
}