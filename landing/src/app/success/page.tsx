"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Success() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activationCode, setActivationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedSessionId = localStorage.getItem("maria_checkout_session_id");
    if (!savedSessionId) return;

    setSessionId(savedSessionId);
    setLoading(true);

    let pollInterval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payment/asaas/status/${savedSessionId}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.confirmed && data.code) {
          setActivationCode(data.code);
          setLoading(false);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error("Erro no polling de ativação:", err);
      }
    };

    checkStatus();
    pollInterval = setInterval(checkStatus, 3000);

    return () => clearInterval(pollInterval);
  }, []);

  const handleClearSession = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("maria_checkout_session_id");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
        
        {/* Ícone de Sucesso */}
        <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100 text-green-600 mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-4">Pagamento Aprovado!</h1>
        <p className="text-slate-600 mb-6">
          Sua assinatura foi ativada com sucesso. Você já pode utilizar a MarIA no seu WhatsApp.
        </p>

        {/* Estado: Carregando código de ativação */}
        {loading && !activationCode && (
          <div className="bg-[#fafafc] border border-slate-200/80 rounded-2xl p-6 w-full flex flex-col items-center mb-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
            <div className="relative w-10 h-10 flex items-center justify-center mb-3">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-[#0047AB] border-r-transparent animate-spin"></div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Buscando seu código de ativação...</p>
          </div>
        )}

        {/* Estado: Código de ativação recuperado */}
        {activationCode && (
          <div className="w-full flex flex-col items-center">
            {/* Caixa do Código */}
            <div className="bg-[#fafafc] border border-slate-200/80 rounded-2xl p-5 w-full flex flex-col items-center mb-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1.5">Seu Código de Ativação</span>
              <span className="text-3xl font-extrabold font-mono text-[#0047AB] tracking-wider select-all">
                {activationCode}
              </span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(activationCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={`mt-3 text-xs font-bold transition-all px-4 py-1.5 rounded-full flex items-center gap-1.5 ${copied ? "bg-green-500 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"}`}
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                    Copiado!
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                    Copiar Código
                  </>
                )}
              </button>
            </div>

            {/* Aviso */}
            <div className="bg-[#22C55E]/5 border border-[#22C55E]/10 rounded-2xl p-4 text-center w-full mb-6">
              <p className="text-xs text-slate-600 font-light leading-relaxed">
                Clique no botão abaixo para ir direto ao WhatsApp e ativar a sua conta agora mesmo!
              </p>
            </div>

            {/* Botão de Redirecionamento WhatsApp */}
            <a 
              href={`https://wa.me/5562981949980?text=Quero%20ativar%20minha%20MarIA:%20${activationCode}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClearSession}
              className="w-full py-4 px-6 bg-[#22C55E] text-white rounded-full font-bold text-lg hover:bg-[#1eb052] shadow-[0_8px_30px_rgba(34,197,94,0.3)] hover:shadow-[0_12px_40px_rgba(34,197,94,0.5)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 group relative overflow-hidden text-center mb-6"
            >
              <span className="absolute inset-0 rounded-full bg-[#22C55E] opacity-30 animate-ping pointer-events-none"></span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="white" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Ativar no WhatsApp
            </a>
          </div>
        )}

        <Link 
          href="/" 
          onClick={handleClearSession}
          className="w-full inline-block py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Voltar para a Home
        </Link>
      </div>
    </div>
  );
}
