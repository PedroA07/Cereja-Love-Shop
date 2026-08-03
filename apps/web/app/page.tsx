import Link from 'next/link';
import { Button, IconDiscreetPackage, IconEighteenPlus, IconShieldHeart } from '@cereja/ui';
import { StoreHeader } from '@/components/store-header';
import { ProductGrid } from '@/components/product-grid';
import { fetchProducts } from '@/lib/catalog';

const features = [
  {
    icon: IconDiscreetPackage,
    title: 'Entrega sigilosa',
    text: 'Embalagem neutra, remetente discreto e cobrança com descritor neutro na fatura.',
  },
  {
    icon: IconShieldHeart,
    title: 'Sua privacidade primeiro',
    text: 'Dados sensíveis criptografados, sem perfilamento sem o seu consentimento (LGPD).',
  },
  {
    icon: IconEighteenPlus,
    title: 'Ambiente 18+',
    text: 'Espaço seguro e exclusivo para adultos, com verificação de idade em todas as etapas.',
  },
];

export default async function HomePage() {
  const featured = await fetchProducts({ page: 1 }).catch(() => null);

  return (
    <>
      <StoreHeader />

      <main>
        <section className="bg-creme/60">
          <div className="mx-auto max-w-6xl px-6 py-24 text-center">
            <h1 className="mx-auto max-w-2xl font-serif text-5xl leading-tight text-vinho">
              Prazer é liberdade. Liberdade é ser quem você é.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-ink/80">
              Lingerie, cosméticos e bem-estar íntimo com entrega sigilosa e embalagem discreta em
              todo o Brasil.
            </p>
            <div className="mt-8">
              <Link href="/produtos">
                <Button size="lg">Ver produtos</Button>
              </Link>
            </div>
          </div>
        </section>

        {featured && featured.items.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 py-16">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="font-serif text-3xl text-vinho">Destaques</h2>
              <Link href="/produtos" className="text-sm text-cereja hover:text-vinho">
                Ver todos
              </Link>
            </div>
            <ProductGrid products={featured.items.slice(0, 8)} />
          </section>
        )}

        <section className="mx-auto grid max-w-6xl gap-6 px-6 py-16 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-lg bg-offwhite p-6 shadow-card ring-1 ring-nude/30">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-creme text-vinho">
                <Icon size={24} />
              </span>
              <h3 className="mt-4 font-serif text-xl text-vinho">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="bg-vinho text-offwhite/80">
        <div className="mx-auto max-w-6xl px-6 py-10 text-center text-sm">
          <p className="font-serif text-lg text-offwhite">Cereja Love Shop</p>
          <p className="mt-2">Venda proibida para menores de 18 anos.</p>
        </div>
      </footer>
    </>
  );
}
