"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Icon,
  LandingHeader,
  LandingStory,
  LandingFooter,
} from "./landing-experience";

type Plan = {
  id: string;
  tier: string;
  cycle: string;
  price: number;
  name: string;
  messages_limit: number;
  description?: string;
  is_active?: boolean;
};

type AffiliatePromotion = {
  plan_tier: string;
  plan_cycle: string;
  discount_percentage?: number;
  promotional_price?: number;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

function parsePlanDescription(value?: string): {
  features: string[];
  highlight: string;
} {
  try {
    const parsed = JSON.parse(value || "{}");
    if (parsed && typeof parsed === "object") {
      return {
        features: Array.isArray(parsed.features)
          ? parsed.features.filter(
              (feature: unknown): feature is string =>
                typeof feature === "string",
            )
          : value
            ? [value]
            : [],
        highlight: typeof parsed.highlight === "string" ? parsed.highlight : "",
      };
    }
  } catch {
    /* Descrições simples continuam válidas. */
  }
  return { features: value ? [value] : [], highlight: "" };
}

export default function Home() {
  const [isAnnual, setIsAnnual] = useState(false);

  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((data: Plan[]) => setPlans(data))
      .catch((err) => console.error("Erro ao buscar planos:", err));
  }, []);

  const getDiscount = (tier: string, cycle: string) => {
    return promoDiscounts[`${tier}-${cycle}`];
  };

  const [promoDiscounts, setPromoDiscounts] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const ref = searchParams.get("ref");

    if (ref) {
      // Buscar promoções desse afiliado
      fetch(`/api/affiliates/code/${ref}/promotions`)
        .then((res) => res.json())
        .then(
          (data: { success: boolean; promotions?: AffiliatePromotion[] }) => {
            if (data.success && data.promotions) {
              const promoMap: Record<string, number> = {};
              data.promotions.forEach((p) => {
                promoMap[`${p.plan_tier}-${p.plan_cycle}`] =
                  p.discount_percentage || p.promotional_price || 0;
              });
              setPromoDiscounts(promoMap);
            }
          },
        )
        .catch((err) =>
          console.error("Erro ao buscar promoções do afiliado", err),
        );
    }
  }, []);

  // Novos estados para o fluxo de checkout e ativação
  const [showModal, setShowModal] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<
    "idle" | "loading" | "pending" | "success" | "error"
  >("idle");
  const [activationCode, setActivationCode] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [copied, setCopied] = useState(false);

  // Polling de ativação de pagamento
  useEffect(() => {
    if (subscribeStatus !== "pending" || !sessionId) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payment/asaas/status/${sessionId}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.confirmed && data.code) {
          setActivationCode(data.code);
          setSubscribeStatus("success");
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error("Erro no polling de ativação:", err);
      }
    };

    const pollInterval = setInterval(checkStatus, 3000);
    void checkStatus();

    return () => clearInterval(pollInterval);
  }, [subscribeStatus, sessionId]);

  useEffect(() => {
    if (!showModal) return;

    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const getFocusable = () =>
      dialog?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    getFocusable()?.[0]?.focus();

    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowModal(false);
        setSubscribeStatus("idle");
        localStorage.removeItem("maria_checkout_session_id");
        return;
      }

      const focusable = getFocusable();
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleDialogKeys);
    return () => {
      document.removeEventListener("keydown", handleDialogKeys);
      previousFocus?.focus();
    };
  }, [showModal]);

  // Recuperação de sessão pós-redirecionamento se retornar com ?checkout=success
  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    const isCheckoutSuccess = searchParams.get("checkout") === "success";
    const savedSessionId = localStorage.getItem("maria_checkout_session_id");

    if (!isCheckoutSuccess || !savedSessionId) return;
    const timeout = window.setTimeout(() => {
      setSessionId(savedSessionId);
      setSubscribeStatus("pending");
      setShowModal(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const handleSubscribe = async (planId: string, cycle: string) => {
    try {
      setSubscribeStatus("loading");
      setErrorMessage("");
      setShowModal(true);

      const response = await fetch("/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          cycle,
          affiliateCode: new URLSearchParams(window.location.search).get("ref"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar sessão de checkout");
      }

      setCheckoutUrl(data.url);
      setSessionId(data.sessionId);
      localStorage.setItem("maria_checkout_session_id", data.sessionId);
      setSubscribeStatus("pending");

      // Abre a URL do Asaas em uma nova aba
      window.open(data.url, "_blank");
    } catch (err: unknown) {
      console.error("Erro ao assinar:", err);
      setSubscribeStatus("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível gerar o link de pagamento. Tente novamente.",
      );
    }
  };

  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;
    const items = document.querySelectorAll<HTMLElement>("[data-reveal]");
    document.documentElement.classList.add("motion-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const faqs = [
    {
      q: "O aplicativo está disponível para Android e iPhone?",
      a: "Estamos preparando o lançamento da MarIA no Google Play e na App Store. Enquanto as publicações não forem concluídas, os selos desta página indicam “Em breve” e não iniciam um download. Você já pode conhecer a versão pelo navegador no botão “Conhecer o aplicativo”.",
    },
    {
      q: "O que encontro no aplicativo?",
      a: "Um Santuário para sua rotina de fé: conversa com a MarIA, Plano de Vida, Liturgia da Palavra, Santo do Dia, Terço Interativo, orações e novenas. Você reúne suas práticas e escolhe seus horários em um só lugar. Recursos e limites podem variar conforme o plano.",
    },
    {
      q: "Preciso criar uma conta para começar?",
      a: "Você pode conhecer a experiência pelo navegador. Para usar recursos pessoais, conversar com a assistente e manter sua rotina vinculada ao seu perfil, entre na sua conta. A disponibilidade de cada recurso é informada no aplicativo e no plano escolhido.",
    },
    {
      q: "Preciso ter WhatsApp para usar a MarIA?",
      a: "Não é necessário usar o WhatsApp como interface principal: o aplicativo reúne sua experiência de oração e a conversa com a MarIA. O WhatsApp é um canal opcional de entrega de mensagens agendadas; para recebê-las, é necessário vincular o número à sua conta.",
    },
    {
      q: "Onde configuro os horários e as mensagens do WhatsApp?",
      a: "A gestão da rotina fica no aplicativo. No Plano de Vida, você organiza as práticas, escolhe horários e os canais de lembrete disponíveis. O WhatsApp fica como canal de recebimento das mensagens que você agendou, sem precisar administrar sua rotina pela conversa.",
    },
    {
      q: "Como recebo os lembretes no celular? Posso desativá-los?",
      a: "Escolha os lembretes nas suas práticas e permita as notificações quando o celular solicitar. Você pode ajustar suas escolhas no aplicativo e nas configurações do aparelho. A entrega depende das permissões, da conexão quando necessária e das restrições de bateria do sistema; as opções podem variar por plataforma.",
    },
    {
      q: "A MarIA funciona sem internet?",
      a: "A conversa com a assistente e os serviços conectados precisam de internet. Não conte com todos os conteúdos e lembretes disponíveis offline: a disponibilidade depende do recurso e do que já foi carregado no aparelho.",
    },
    {
      q: "A MarIA substitui a direção espiritual ou o Sacramento da Confissão?",
      a: "De forma alguma. A MarIA é uma ferramenta de apoio devocional, catequético e de aconselhamento diário. Ela não substitui os sacramentos (como a Confissão e a Eucaristia) nem o acompanhamento de um sacerdote real, que são absolutamente insubstituíveis na vida da fé.",
    },
    {
      q: "De onde a MarIA tira as respostas teológicas?",
      a: "A MarIA foi concebida para apoiar a caminhada católica com referências à Sagrada Escritura e ao ensinamento da Igreja. Como toda ferramenta de inteligência artificial, pode cometer erros; suas respostas não substituem fontes oficiais nem a orientação de um sacerdote.",
    },
    {
      q: "A MarIA se apresenta como Nossa Senhora?",
      a: "A MarIA é uma assistente digital com linguagem acolhedora, inspirada nas virtudes marianas de ternura, escuta e esperança. Ela não é Nossa Senhora nem fala em nome dela.",
    },
    {
      q: "Funciona para qualquer perfil de católico?",
      a: "A MarIA reúne recursos para diferentes momentos da caminhada católica, como oração, liturgia e reflexão. A experiência e os recursos disponíveis podem variar conforme a conta e a configuração atual do serviço.",
    },
    {
      q: "Os meus dados e conversas estão protegidos?",
      a: "Consulte nossa Política de Privacidade para entender como os dados são tratados e quais são seus direitos. Evite compartilhar informações muito sensíveis em qualquer serviço digital.",
    },
    {
      q: "O aplicativo é gratuito? Como escolho ou cancelo um plano?",
      a: "Há uma opção gratuita para conhecer a MarIA e planos com recursos e limites próprios. Consulte os valores, o ciclo de cobrança e as condições na seção de planos antes de assinar. A área “Minha Conta” permite acompanhar e gerenciar sua assinatura, inclusive solicitar o cancelamento conforme as condições contratadas.",
    },
  ];

  return (
    <div className="sanctuary-page">
      <LandingHeader />
      <main id="conteudo">
        <LandingStory />

        <section id="pricing" className="maria-pricing section-spacing">
          <div className="maria-container">
            <div className="pricing-heading" data-reveal>
              <div>
                <p className="overline">ASSINATURA SIMPLES E TRANSPARENTE</p>
                <h2>
                  Uma companhia.
                  <br />
                  <em>Seu próximo passo.</em>
                </h2>
              </div>
              <div>
                <p>
                  Escolha como a MarIA pode acompanhar sua rotina de oração, com
                  recursos e condições apresentados em cada plano.
                </p>
                <div className="pricing-cycle" aria-label="Ciclo da assinatura">
                  <button
                    onClick={() => setIsAnnual(false)}
                    aria-pressed={!isAnnual}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => setIsAnnual(true)}
                    aria-pressed={isAnnual}
                  >
                    Anual <span>Desconto</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="pricing-cards">
              <article className="maria-plan">
                <span className="plan-label">PARA COMEÇAR</span>
                <h3>Gratuito</h3>
                <p>
                  Para experimentar e iniciar sua vida de oração com a MarIA.
                </p>
                <div className="plan-price">
                  <strong>R$ 0</strong>
                  <span>para conhecer</span>
                </div>
                <ul>
                  {[
                    "Reflexão da Liturgia Diária",
                    "História do Santo do Dia",
                    "Guia de oração do Terço e Rosário",
                    "20 mensagens iniciais para testar a IA",
                  ].map((feature) => (
                    <li key={feature}>
                      <Icon name="check" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/mobile/" className="plan-button">
                  Conhecer o aplicativo <Icon name="arrow" />
                </Link>
              </article>
              {plans
                .filter(
                  (plan) =>
                    plan.is_active !== false &&
                    plan.cycle === (isAnnual ? "annual" : "monthly"),
                )
                .map((plan, index) => {
                  const discount = getDiscount(plan.tier, plan.cycle);
                  const discountedPrice = discount
                    ? plan.price - (plan.price * discount) / 100
                    : plan.price;
                  const monthlyPrice = isAnnual
                    ? discountedPrice / 12
                    : discountedPrice;
                  const highlighted = plan.tier === "basic" || index === 0;
                  const description = parsePlanDescription(plan.description);
                  return (
                    <article
                      key={plan.id}
                      className={
                        highlighted ? "maria-plan featured-plan" : "maria-plan"
                      }
                    >
                      <span className="plan-label">
                        {highlighted
                          ? "UM PASSO A MAIS NA CAMINHADA"
                          : "PARA APROFUNDAR SUA ROTINA"}
                        {discount > 0 && <b>{discount}% OFF</b>}
                      </span>
                      <h3>{plan.name}</h3>
                      <p>Limite de {plan.messages_limit} mensagens de IA.</p>
                      <div className="plan-price">
                        {discount > 0 && (
                          <s>
                            {formatCurrency(
                              isAnnual ? plan.price / 12 : plan.price,
                            )}
                          </s>
                        )}
                        <strong>{formatCurrency(monthlyPrice)}</strong>
                        <span>/ mês</span>
                      </div>
                      {isAnnual && (
                        <p className="annual-charge">
                          Cobrado {formatCurrency(discountedPrice)} anualmente
                        </p>
                      )}
                      <ul>
                        {description.features.map((feature, featureIndex) => (
                          <li key={featureIndex}>
                            <Icon name="check" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {description.highlight && (
                        <p className="plan-highlight">
                          {description.highlight}
                        </p>
                      )}
                      <button
                        className="plan-button"
                        disabled={subscribeStatus === "loading"}
                        onClick={() => handleSubscribe(plan.tier, plan.cycle)}
                      >
                        Assinar {plan.name}
                        <Icon name="arrow" />
                      </button>
                    </article>
                  );
                })}
            </div>
            <div className="social-commitment">
              <Icon name="heart" />
              <div>
                <strong>Uma caminhada que também acolhe outras vidas.</strong>
                <p>
                  Ao assinar um plano pago, você nos ajuda a destinar 1% do
                  faturamento à compra de cestas básicas para famílias
                  necessitadas.
                </p>
              </div>
            </div>
            <p className="checkout-note">
              O checkout é processado pelo Asaas. Consulte os{" "}
              <Link href="/termos">termos</Link> para condições de cancelamento.
            </p>
          </div>
        </section>

        <section id="faq" className="maria-faq section-spacing maria-container">
          <div className="faq-intro" data-reveal>
            <p className="overline">PARA CONHECER MELHOR</p>
            <h2>
              Antes de
              <br />
              <em>começar.</em>
            </h2>
            <p>Algumas respostas para caminhar com clareza.</p>
            <a className="maria-link" href="mailto:maria@acutistech.com.br">
              Fale com a nossa equipe <span>↗</span>
            </a>
          </div>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <details
                key={faq.q}
                className="maria-faq-item"
                name="maria-questions"
              >
                <summary>
                  <span className="faq-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{faq.q}</h3>
                  <span className="faq-plus" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <LandingFooter />

      {/* Modal de Pagamento e Ativação */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Checkout e ativação da assinatura"
            aria-live="polite"
            className="bg-white max-w-lg w-full rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden relative p-8 md:p-10 flex flex-col items-center text-center animate-scale-up"
          >
            {/* Botão de Fechar */}
            <button
              onClick={() => {
                setShowModal(false);
                setSubscribeStatus("idle");
                localStorage.removeItem("maria_checkout_session_id");
              }}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors z-50"
              aria-label="Fechar modal"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* ESTADO: CARREGANDO CHECKOUT */}
            {subscribeStatus === "loading" && (
              <div className="py-10 flex flex-col items-center">
                <div className="relative w-20 h-20 flex items-center justify-center mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-[#D4AF37] border-r-transparent animate-spin"></div>
                </div>
                <h4 className="text-2xl font-extrabold text-slate-900 mb-4">
                  Gerando Link de Pagamento
                </h4>
                <p className="text-slate-500 font-light max-w-xs">
                  Estamos abrindo seu checkout seguro no Asaas. Por favor,
                  aguarde alguns instantes...
                </p>
              </div>
            )}

            {/* ESTADO: AGUARDANDO PAGAMENTO */}
            {subscribeStatus === "pending" && (
              <div className="py-6 flex flex-col items-center">
                <div className="relative w-20 h-20 flex items-center justify-center mb-8">
                  <span className="absolute flex h-12 w-12">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0047AB]/20 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-12 w-12 bg-[#0047AB]/10 flex items-center justify-center text-[#0047AB] text-xl font-bold">
                      💳
                    </span>
                  </span>
                </div>
                <h4 className="text-2xl font-extrabold text-slate-900 mb-4">
                  Aguardando Pagamento
                </h4>
                <p className="text-slate-500 font-light text-sm leading-relaxed mb-6 max-w-sm">
                  O checkout seguro do Asaas foi aberto em uma nova aba.
                </p>
                <div className="bg-[#0047AB]/5 border border-[#0047AB]/10 rounded-2xl p-4 text-left mb-6 max-w-sm">
                  <p className="text-xs text-[#0047AB] font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0047AB] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0047AB]"></span>
                    </span>
                    Instruções Importantes:
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 font-light">
                    <li>
                      Preencha seu Nome, E-mail e CPF de forma segura no
                      checkout.
                    </li>
                    <li>
                      <strong>Não feche esta aba</strong> enquanto realiza o
                      pagamento.
                    </li>
                    <li>
                      Seu código de ativação aparecerá aqui assim que o
                      pagamento for concluído!
                    </li>
                    <li>
                      Enviaremos também um e-mail com os dados de
                      acesso/ativação (caso não encontre, verifique a pasta de
                      spam).
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => window.open(checkoutUrl, "_blank")}
                    className="px-6 py-3 bg-[#0047AB] text-white rounded-full font-bold text-sm hover:bg-[#003580] transition-colors"
                  >
                    Reabrir Tela de Checkout
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSubscribeStatus("idle");
                      localStorage.removeItem("maria_checkout_session_id");
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 hover:underline transition-colors py-2"
                  >
                    Cancelar e Voltar
                  </button>
                </div>
              </div>
            )}

            {/* ESTADO: SUCESSO (CÓDIGO DE ATIVAÇÃO GERADO) */}
            {subscribeStatus === "success" && (
              <div className="py-4 flex flex-col items-center w-full">
                <div className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center text-3xl mb-6 animate-bounce shadow-lg">
                  🎉
                </div>
                <h4 className="text-2xl font-extrabold text-slate-900 mb-2">
                  Assinatura Confirmada!
                </h4>
                <p className="text-slate-500 font-light text-sm max-w-sm mb-6">
                  Seja bem-vindo(a) à MarIA! Seu pagamento foi identificado.
                  Agora, basta ativar a sua conta enviando o código abaixo no
                  WhatsApp.
                </p>

                {/* Caixa do Código */}
                <div className="bg-[#fafafc] border border-slate-200/80 rounded-2xl p-5 w-full max-w-sm flex flex-col items-center mb-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1.5">
                    Seu Código de Ativação
                  </span>
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
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Copiado!
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                          />
                        </svg>
                        Copiar Código
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-[#22C55E]/5 border border-[#22C55E]/10 rounded-2xl p-4 text-center max-w-sm mb-6">
                  <p className="text-xs text-[#22C55E] font-bold uppercase tracking-wider mb-1">
                    Atenção
                  </p>
                  <p className="text-xs text-slate-600 font-light leading-relaxed text-center">
                    O código acima também foi enviado para o seu{" "}
                    <strong>e-mail de faturamento</strong>. Clique no botão
                    abaixo para ir direto ao WhatsApp e ativar a sua conta!
                  </p>
                </div>

                {/* Botão Premium do WhatsApp com Spring Animation e Ripple */}
                <a
                  href={`https://wa.me/5562981949980?text=Quero%20ativar%20minha%20MarIA:%20${activationCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full max-w-sm py-4 px-6 bg-[#22C55E] text-white rounded-full font-bold text-lg hover:bg-[#1eb052] shadow-[0_8px_30px_rgba(34,197,94,0.3)] hover:shadow-[0_12px_40px_rgba(34,197,94,0.5)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 group relative overflow-hidden text-center"
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
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Ativar no WhatsApp
                </a>
              </div>
            )}

            {/* ESTADO: ERRO */}
            {subscribeStatus === "error" && (
              <div className="py-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-3xl mb-6 shadow-inner">
                  ❌
                </div>
                <h4 className="text-2xl font-extrabold text-slate-900 mb-4 font-sans">
                  Falha na Requisição
                </h4>
                <p className="text-slate-500 font-light text-sm max-w-sm mb-8 leading-relaxed">
                  {errorMessage ||
                    "Não conseguimos processar o seu pedido de assinatura no momento. Por favor, tente de novo."}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSubscribeStatus("idle");
                      localStorage.removeItem("maria_checkout_session_id");
                    }}
                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-full font-bold text-sm hover:bg-slate-200 transition-colors"
                  >
                    Voltar
                  </button>
                  <a
                    href="mailto:maria@acutistech.com.br"
                    className="px-6 py-3 bg-[#0047AB] text-white rounded-full font-bold text-sm hover:bg-[#003580] transition-colors flex items-center justify-center"
                  >
                    Falar com Suporte
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
