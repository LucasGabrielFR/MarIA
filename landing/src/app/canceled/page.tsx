import Link from "next/link";

export default function Canceled() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
        <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-red-100 text-red-600 mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Pagamento Cancelado</h1>
        <p className="text-slate-600 mb-8">
          O processo de assinatura foi cancelado e nenhuma cobrança foi realizada. Se tiver dúvidas, estamos à disposição.
        </p>
        <Link 
          href="/" 
          className="w-full inline-block py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
        >
          Voltar para a Home
        </Link>
      </div>
    </div>
  );
}
