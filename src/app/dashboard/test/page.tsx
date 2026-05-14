export default function TestPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Página de Teste</h1>
      <p className="text-zinc-400">Se você está vendo esta página, o dashboard está renderizando corretamente.</p>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-500">Teste 1</p>
          <p className="text-2xl font-bold text-emerald-400">OK</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-500">Teste 2</p>
          <p className="text-2xl font-bold text-purple-400">OK</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-500">Teste 3</p>
          <p className="text-2xl font-bold text-zinc-100">OK</p>
        </div>
      </div>
    </div>
  )
}
