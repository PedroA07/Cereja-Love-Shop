import { AgeGate } from '@/features/age-gate/age-gate';

export default function HomePage() {
  return (
    <AgeGate>
      <header className="border-b border-nude/40 bg-offwhite">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-serif text-2xl font-semibold text-cereja">Cereja Love Shop</span>
          <nav className="hidden gap-8 text-sm text-ink/80 sm:flex">
            <span className="cursor-not-allowed opacity-60">Lingerie</span>
            <span className="cursor-not-allowed opacity-60">Cosméticos</span>
            <span className="cursor-not-allowed opacity-60">Bem-estar</span>
          </nav>
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
            <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-nude bg-offwhite px-5 py-2 text-sm text-ink/60">
              <span aria-hidden>🍒</span> Loja em construção — Milestone 0 (fundação) concluído
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 py-16 sm:grid-cols-3">
          {[
            {
              title: 'Entrega sigilosa',
              text: 'Embalagem neutra, remetente discreto e cobrança com descritor neutro na fatura.',
            },
            {
              title: 'Sua privacidade primeiro',
              text: 'Dados sensíveis criptografados, sem perfilamento sem o seu consentimento (LGPD).',
            },
            {
              title: 'Ambiente 18+',
              text: 'Espaço seguro e exclusivo para adultos, com verificação de idade em todas as etapas.',
            },
          ].map((card) => (
            <div key={card.title} className="rounded-lg bg-offwhite p-6 shadow-card ring-1 ring-nude/30">
              <h2 className="font-serif text-xl text-vinho">{card.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">{card.text}</p>
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
    </AgeGate>
  );
}
