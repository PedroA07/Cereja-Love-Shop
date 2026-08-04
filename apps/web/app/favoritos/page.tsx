import type { Metadata } from 'next';
import { StoreHeader } from '@/components/store-header';
import { FavoritesList } from './favorites-list';

export const metadata: Metadata = { title: 'Favoritos — Cereja Love Shop' };

export default function FavoritesPage() {
  return (
    <>
      <StoreHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="mb-8 font-serif text-4xl text-vinho">Meus favoritos</h1>
        <FavoritesList />
      </main>
    </>
  );
}
