import Link from "next/link";

export default function Success() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
        <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100 text-green-600 mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Pagamento Aprovado!</h1>
        <p className="text-slate-600 mb-8">
          Sua assinatura foi ativada com sucesso. Você já pode utilizar a MarIA no seu WhatsApp.
        </p>
        <Link 
          href="/" 
          className="w-full inline-block py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Voltar para a Home
        </Link>
      </div>
    </div>
  );
}
