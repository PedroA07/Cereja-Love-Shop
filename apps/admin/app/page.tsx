export default function AdminHome() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg bg-offwhite p-8 text-center shadow-card ring-1 ring-nude/30">
        <p className="font-serif text-2xl text-vinho">Cereja — Back-office</p>
        <p className="mt-3 text-sm text-ink/60">
          Painel administrativo em construção. Login com 2FA obrigatório chega no Milestone 7
          (auth de staff no M1).
        </p>
      </div>
    </main>
  );
}
