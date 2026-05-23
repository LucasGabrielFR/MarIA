"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Invoice {
  id: string;
  amount: number;
  status: string;
  tier: string;
  provider: string;
  expires_at: string;
  created_at: string;
}

interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  subscription_tier: string;
  subscription_expires_at: string | null;
  asaas_subscription_id: string | null;
}

export default function Login() {
  const [step, setStep] = useState<"phone" | "code" | "dashboard">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [showPlanChange, setShowPlanChange] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("basic");
  const [selectedCycle, setSelectedCycle] = useState("monthly");
  const [planChangeLoading, setPlanChangeLoading] = useState(false);

  // Auto-login on mount if session is stored
  useEffect(() => {
    const savedToken = localStorage.getItem("maria_customer_session");
    const savedPhone = localStorage.getItem("maria_customer_phone");
    if (savedToken && savedPhone) {
      setSessionToken(savedToken);
      setPhone(savedPhone);
      setStep("dashboard");
      fetchDashboardData(savedToken);
    }
  }, []);

  const fetchDashboardData = async (token: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/customer/subscription/status", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Erro ao carregar dados da assinatura.");
      }
      setUser(data.user);
      setInvoices(data.invoices || []);
    } catch (err: any) {
      setError(err.message);
      // If unauthorized / forbidden, clear storage and log out
      if (err.message.includes("Sessão") || err.message.includes("expirada") || err.message.includes("não encontrada")) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const digits = input.replace(/\D/g, "").slice(0, 11);
    
    let formatted = "";
    if (digits.length > 0) {
      if (digits.length <= 2) {
        formatted = `(${digits}`;
      } else if (digits.length <= 6) {
        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      } else if (digits.length <= 10) {
        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
      } else {
        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
      }
    }
    setPhone(formatted);
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/customer/auth/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao solicitar código.");
      }

      setSuccess("Código de verificação enviado por WhatsApp!");
      setStep("code");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError("Por favor, digite um código de 6 dígitos.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/customer/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Código inválido ou expirado.");
      }

      setSessionToken(data.sessionToken);
      setUser(data.user);
      setInvoices(data.invoices || []);
      
      localStorage.setItem("maria_customer_session", data.sessionToken);
      localStorage.setItem("maria_customer_phone", phone);
      
      setStep("dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    setError("");
    try {
      const response = await fetch("/api/customer/subscription/cancel", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sessionToken}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Erro ao cancelar assinatura.");
      }
      setUser(data.user);
      setInvoices([]);
      setSuccess("Assinatura cancelada com sucesso.");
      setShowCancelConfirm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleChangePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanChangeLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/customer/subscription/change-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ planId: selectedPlan, cycle: selectedCycle })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Erro ao alterar o plano.");
      }
      setUser(data.user);
      setInvoices(data.invoices || []);
      setSuccess(`Plano alterado para ${selectedPlan === "premium" ? "Premium" : "Básico"} (${selectedCycle === "annual" ? "Anual" : "Mensal"}) com sucesso!`);
      setShowPlanChange(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPlanChangeLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("maria_customer_session");
    localStorage.removeItem("maria_customer_phone");
    setSessionToken("");
    setUser(null);
    setInvoices([]);
    setStep("phone");
    setCode("");
    setError("");
    setSuccess("");
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
  };

  const formatDate = (isoString: string | null | undefined) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
      <Link href="/" className="absolute top-6 left-6 font-extrabold text-2xl text-[#0047AB] tracking-tight hover:scale-105 transition-transform duration-300">
        MarIA
      </Link>

      {/* ESTADO 1: INFORMAR TELEFONE */}
      {step === "phone" && (
        <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200 text-center animate-scale-up">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Área do Assinante</h1>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed font-light">
            Confirme o número do WhatsApp da sua conta para receber um código de acesso seguro.
          </p>

          <form onSubmit={handleRequestCode} className="flex flex-col gap-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-semibold border border-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-xs font-semibold border border-green-200">
                {success}
              </div>
            )}

            <div className="text-left">
              <label htmlFor="phone" className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5 pl-1">
                Número do WhatsApp
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(48) 99999-9999"
                className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#0047AB] focus:border-transparent outline-none transition text-slate-800 placeholder-slate-400 font-semibold"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !phone || phone.length < 14}
              className="w-full py-4 bg-[#0047AB] text-white rounded-full font-bold text-lg hover:bg-[#003580] transition-all hover:shadow-[0_8px_30px_rgba(0,71,171,0.2)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando código...
                </>
              ) : (
                "Receber código por WhatsApp"
              )}
            </button>
          </form>
        </div>
      )}

      {/* ESTADO 2: INFORMAR CÓDIGO */}
      {step === "code" && (
        <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200 text-center animate-scale-up">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Verificação em Duas Etapas</h1>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed font-light">
            Enviamos um código de segurança de 6 dígitos no seu WhatsApp <strong>{phone}</strong>. Digite-o abaixo para entrar.
          </p>

          <form onSubmit={handleVerifyCode} className="flex flex-col gap-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-semibold border border-red-200 animate-shake">
                {error}
              </div>
            )}

            <div className="text-left">
              <label htmlFor="code" className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5 pl-1">
                Código de 6 dígitos
              </label>
              <input
                id="code"
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#0047AB] focus:border-transparent outline-none transition text-center tracking-widest text-2xl font-extrabold text-slate-800 placeholder-slate-300 font-mono"
                required
                disabled={loading}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-4 bg-[#0047AB] text-white rounded-full font-bold text-lg hover:bg-[#003580] transition-all hover:shadow-[0_8px_30px_rgba(0,71,171,0.2)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando...
                </>
              ) : (
                "Entrar e Gerenciar Conta"
              )}
            </button>
            
            <button
              type="button"
              onClick={() => {
                setError("");
                setStep("phone");
                setCode("");
              }}
              className="text-xs text-slate-400 hover:text-[#0047AB] hover:underline transition-colors mt-2"
            >
              Alterar número de telefone
            </button>
          </form>
        </div>
      )}

      {/* ESTADO 3: DASHBOARD DO CLIENTE */}
      {step === "dashboard" && user && (
        <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col p-6 md:p-10 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0047AB] to-[#D4AF37] text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Olá, {user.name}!</h2>
                <p className="text-slate-400 text-xs font-semibold tracking-wider font-mono">Assinante {phone}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-full font-bold text-xs tracking-wider uppercase transition-all cursor-pointer border border-transparent hover:border-red-200"
            >
              Sair da Conta
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-semibold border border-red-200 mb-6">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-xs font-semibold border border-green-200 mb-6">
              {success}
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {/* Plano */}
            <div className="p-6 rounded-[2rem] border border-slate-100 bg-[#fafafc] flex flex-col">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Seu Plano</span>
              <span className={`text-2xl font-extrabold tracking-tight capitalize ${
                user.subscription_tier === "premium" ? "text-[#D4AF37]" :
                user.subscription_tier === "basic" ? "text-[#0047AB]" : "text-slate-500"
              }`}>
                {user.subscription_tier === "premium" ? "🌟 Premium" :
                 user.subscription_tier === "basic" ? "💬 Básico" : "🕊️ Gratuito"}
              </span>
              <div className="mt-4 flex gap-2">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  user.subscription_tier !== "free" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
                }`}>
                  {user.subscription_tier !== "free" ? "Ativo" : "Limitação"}
                </span>
              </div>
            </div>

            {/* Vencimento */}
            <div className="p-6 rounded-[2rem] border border-slate-100 bg-[#fafafc] flex flex-col">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Renovação / Vencimento</span>
              <span className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {user.subscription_expires_at ? formatDate(user.subscription_expires_at) : "Sem expiração"}
              </span>
              <span className="text-slate-400 text-xs font-light mt-2 leading-relaxed">
                {user.subscription_tier !== "free" ? "Cobrado recorrentemente pelo cartão de crédito." : "Faça upgrade para acessar todas as rotinas."}
              </span>
            </div>

            {/* Gestão Direta */}
            <div className="p-6 rounded-[2rem] border border-slate-100 bg-[#fafafc] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Portal Asaas</span>
                <p className="text-slate-500 text-xs font-light leading-relaxed">
                  Gerencie sua assinatura, cancele a cobrança recorrente ou realize upgrades de forma 100% segura.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {user.subscription_tier !== "free" ? (
                  <>
                    <button
                      onClick={() => {
                        setSelectedPlan(user.subscription_tier);
                        setSelectedCycle(invoices[0]?.amount > 100 ? "annual" : "monthly");
                        setShowPlanChange(true);
                      }}
                      className="px-4 py-2 bg-[#0047AB] text-white hover:bg-[#003580] rounded-full font-bold text-xs transition-colors cursor-pointer"
                    >
                      Alterar Plano
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="px-4 py-2 bg-white text-red-500 border border-red-200 hover:bg-red-50 rounded-full font-bold text-xs transition-colors cursor-pointer"
                    >
                      Cancelar Assinatura
                    </button>
                  </>
                ) : (
                  <Link
                    href="/#pricing"
                    className="px-5 py-2.5 bg-[#0047AB] text-white hover:bg-[#003580] rounded-full font-bold text-xs transition-all text-center"
                  >
                    Ver Planos e Assinar
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Histórico de Faturas */}
          <div className="border-t border-slate-100 pt-8">
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mb-5">Vencimentos Anteriores e Pagamentos</h3>
            {invoices && invoices.length > 0 ? (
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.01)] bg-[#fafafc]">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100/60 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4 pl-6">Plano</th>
                      <th className="p-4">Valor</th>
                      <th className="p-4">Data do Pagamento</th>
                      <th className="p-4 pr-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6 font-bold text-slate-800 capitalize">
                          {inv.tier === "premium" ? "🌟 Premium" : "💬 Básico"}
                        </td>
                        <td className="p-4 text-slate-600 font-semibold">{formatPrice(inv.amount)}</td>
                        <td className="p-4 text-slate-500 font-medium">{formatDate(inv.created_at)}</td>
                        <td className="p-4 pr-6 text-right">
                          <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            inv.status === "paid" ? "bg-green-100 text-green-700" :
                            inv.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-slate-200 text-slate-600"
                          }`}>
                            {inv.status === "paid" ? "Pago" : inv.status === "pending" ? "Pendente" : "Cancelado"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-3xl bg-[#fafafc]">
                <span className="text-3xl block mb-2 opacity-50">📑</span>
                <p className="text-slate-400 text-sm font-light">Nenhum histórico de pagamentos registrado nesta conta.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE CANCELAMENTO */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden relative p-8 md:p-10 flex flex-col items-center text-center animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-3xl mb-6 shadow-sm">
              ⚠️
            </div>
            <h4 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Cancelar Assinatura?</h4>
            <p className="text-slate-500 font-light text-sm leading-relaxed mb-6">
              Esta ação excluirá sua cobrança recorrente no Asaas imediatamente e revogará seu acesso às rotinas exclusivas e conselhos completos da MarIA.
            </p>
            <div className="flex gap-4 w-full">
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                className="flex-1 py-3.5 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition disabled:opacity-50 cursor-pointer"
              >
                {cancelLoading ? "Cancelando..." : "Sim, Cancelar"}
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelLoading}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold transition cursor-pointer"
              >
                Manter Ativa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ALTERAÇÃO DE PLANO */}
      {showPlanChange && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden relative p-8 md:p-10 flex flex-col items-center animate-scale-up">
            
            <button 
              onClick={() => setShowPlanChange(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-2 rounded-full transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h4 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight text-center">Alterar Meu Plano</h4>
            
            <form onSubmit={handleChangePlan} className="w-full flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 pl-1">
                  Selecione o Plano
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("basic")}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      selectedPlan === "basic" ? "border-2 border-[#0047AB] bg-[#0047AB]/5" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-extrabold text-slate-800 text-sm">💬 Básico</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-1">300 msg/mês</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("premium")}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      selectedPlan === "premium" ? "border-2 border-[#D4AF37] bg-[#D4AF37]/5" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-extrabold text-slate-800 text-sm">🌟 Premium</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-1">600 msg/mês</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 pl-1">
                  Ciclo de Faturamento
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedCycle("monthly")}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      selectedCycle === "monthly" ? "border-2 border-slate-800 bg-slate-50" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-extrabold text-slate-800 text-sm">Mensal</span>
                    <span className="text-[10px] text-[#0047AB] font-bold mt-1">
                      {selectedPlan === "premium" ? "R$ 29,90" : "R$ 14,99"} / mês
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCycle("annual")}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      selectedCycle === "annual" ? "border-2 border-slate-800 bg-slate-50" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                      Anual
                      <span className="bg-[#D4AF37] text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Desconto</span>
                    </span>
                    <span className="text-[10px] text-green-700 font-bold mt-1">
                      {selectedPlan === "premium" ? "R$ 26,90" : "R$ 12,90"} / mês
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-4 flex gap-4 w-full">
                <button
                  type="submit"
                  disabled={planChangeLoading}
                  className="flex-1 py-4 bg-[#0047AB] text-white rounded-full font-bold hover:bg-[#003580] transition disabled:opacity-50 cursor-pointer text-center text-sm"
                >
                  {planChangeLoading ? "Alterando..." : "Confirmar Alteração"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPlanChange(false)}
                  disabled={planChangeLoading}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold transition cursor-pointer text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

