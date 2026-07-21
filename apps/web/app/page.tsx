import { CherryMark, IconDiscreetPackage, IconEighteenPlus, IconShieldHeart } from '@cereja/ui';
import { AgeGate } from '@/features/age-gate/age-gate';
import { AuthNav } from '@/features/auth/auth-nav';

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

export default function HomePage() {
  return (
    <AgeGate>
      <header className="border-b border-nude/40 bg-offwhite">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="flex items-center gap-2 font-serif text-2xl font-semibold text-cereja">
            <CherryMark size={28} className="text-cereja" />
            Cereja Love Shop
          </span>
          <nav className="hidden gap-8 text-sm text-ink/80 lg:flex">
            <span className="cursor-not-allowed opacity-60">Lingerie</span>
            <span className="cursor-not-allowed opacity-60">Cosméticos</span>
            <span className="cursor-not-allowed opacity-60">Bem-estar</span>
          </nav>
          <AuthNav />
        </div>
      </header>

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
            <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-nude bg-offwhite px-5 py-2 text-sm text-ink/70">
              <CherryMark size={18} className="text-cereja" />
              Loja em construção — Milestone 0 (fundação) concluído
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 py-16 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-lg bg-offwhite p-6 shadow-card ring-1 ring-nude/30">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-creme text-vinho">
                <Icon size={24} />
              </span>
              <h2 className="mt-4 font-serif text-xl text-vinho">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="bg-vinho text-offwhite/80">
        <div className="mx-auto max-w-6xl px-6 py-10 text-center text-sm">
          <p className="flex items-center justify-center gap-2 font-serif text-lg text-offwhite">
            <CherryMark size={22} className="text-creme" />
            Cereja Love Shop
          </p>
          <p className="mt-2">Venda proibida para menores de 18 anos.</p>
        </div>
      </footer>
    </AgeGate>
  );
}
