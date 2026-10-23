"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

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

export default function Home() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    fetch('/api/plans')
      .then((res) => res.json())
      .then((data: Plan[]) => setPlans(data))
      .catch((err) => console.error('Erro ao buscar planos:', err));
  }, []);
  
  const getDiscount = (tier: string, cycle: string) => {
    return promoDiscounts[`${tier}-${cycle}`];
  };

  const [promoDiscounts, setPromoDiscounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const ref = searchParams.get('ref');

    if (ref) {
      // Buscar promoções desse afiliado
      fetch(`/api/affiliates/code/${ref}/promotions`)
        .then(res => res.json())
        .then((data: { success: boolean; promotions?: AffiliatePromotion[] }) => {
          if (data.success && data.promotions) {
            const promoMap: Record<string, number> = {};
            data.promotions.forEach((p) => {
              promoMap[`${p.plan_tier}-${p.plan_cycle}`] = p.discount_percentage || p.promotional_price || 0;
            });
            setPromoDiscounts(promoMap);
          }
        })
        .catch(err => console.error('Erro ao buscar promoções do afiliado', err));
    }
  }, []);
  
  // Novos estados para o fluxo de checkout e ativação
  const [showModal, setShowModal] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'pending' | 'success' | 'error'>('idle');
  const [activationCode, setActivationCode] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [copied, setCopied] = useState(false);


  // Polling de ativação de pagamento
  useEffect(() => {
    if (subscribeStatus !== 'pending' || !sessionId) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payment/asaas/status/${sessionId}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.confirmed && data.code) {
          setActivationCode(data.code);
          setSubscribeStatus('success');
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Erro no polling de ativação:', err);
      }
    };

    const pollInterval = setInterval(checkStatus, 3000);
    void checkStatus();

    return () => clearInterval(pollInterval);
  }, [subscribeStatus, sessionId]);

  useEffect(() => {
    if (!showModal) return;

    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    focusable?.[0]?.focus();

    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowModal(false);
        setSubscribeStatus('idle');
        localStorage.removeItem('maria_checkout_session_id');
        return;
      }

      if (event.key !== 'Tab' || !focusable?.length) return;
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

    document.addEventListener('keydown', handleDialogKeys);
    return () => {
      document.removeEventListener('keydown', handleDialogKeys);
      previousFocus?.focus();
    };
  }, [showModal]);

  // Recuperação de sessão pós-redirecionamento se retornar com ?checkout=success
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const searchParams = new URLSearchParams(window.location.search);
    const isCheckoutSuccess = searchParams.get('checkout') === 'success';
    const savedSessionId = localStorage.getItem('maria_checkout_session_id');

    if (!isCheckoutSuccess || !savedSessionId) return;
    const timeout = window.setTimeout(() => {
      setSessionId(savedSessionId);
      setSubscribeStatus('pending');
      setShowModal(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const handleSubscribe = async (planId: string, cycle: string) => {
    try {
      setSubscribeStatus('loading');
      setErrorMessage('');
      setShowModal(true);

      const response = await fetch('/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          cycle,
          affiliateCode: new URLSearchParams(window.location.search).get('ref'),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar sessão de checkout');
      }

      setCheckoutUrl(data.url);
      setSessionId(data.sessionId);
      localStorage.setItem('maria_checkout_session_id', data.sessionId);
      setSubscribeStatus('pending');

      // Abre a URL do Asaas em uma nova aba
      window.open(data.url, '_blank');
    } catch (err: unknown) {
      console.error('Erro ao assinar:', err);
      setSubscribeStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Não foi possível gerar o link de pagamento. Tente novamente.');
    }
  };

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
    document.documentElement.classList.add('motion-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const faqs = [
    {
      q: "A MarIA substitui a direção espiritual ou o Sacramento da Confissão?",
      a: "De forma alguma. A MarIA é uma ferramenta de apoio devocional, catequético e de aconselhamento diário. Ela não substitui os sacramentos (como a Confissão e a Eucaristia) nem o acompanhamento de um sacerdote real, que são absolutamente insubstituíveis na vida da fé."
    },
    {
      q: "De onde a MarIA tira as respostas teológicas?",
      a: "A MarIA foi concebida para apoiar a caminhada católica com referências à Sagrada Escritura e ao ensinamento da Igreja. Como toda ferramenta de inteligência artificial, pode cometer erros; suas respostas não substituem fontes oficiais nem a orientação de um sacerdote."
    },
    {
      q: "A MarIA se apresenta como Nossa Senhora?",
      a: "A MarIA é uma assistente digital com linguagem acolhedora, inspirada nas virtudes marianas de ternura, escuta e esperança. Ela não é Nossa Senhora nem fala em nome dela."
    },
    {
      q: "Funciona para qualquer perfil de católico?",
      a: "A MarIA reúne recursos para diferentes momentos da caminhada católica, como oração, liturgia e reflexão. A experiência e os recursos disponíveis podem variar conforme a conta e a configuração atual do serviço."
    },
    {
      q: "Os meus dados e conversas estão protegidos?",
      a: "Consulte nossa Política de Privacidade para entender como os dados são tratados e quais são seus direitos. Evite compartilhar informações muito sensíveis em qualquer serviço digital."
    }
  ];

  return (
    <div className="sanctuary-page min-h-screen bg-[#fafafc] font-sans text-slate-800 selection:bg-[#D4AF37] selection:text-[#0047AB] overflow-x-hidden">
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="#inicio" className="brand" aria-label="MarIA — início">
            <span className="brand-mark"><Image src="/maria_logo_premium.png" alt="" fill sizes="44px" className="object-cover" /></span>
            <span>MarIA</span>
          </Link>
          <nav aria-label="Navegação principal" className="main-nav">
            <Link href="#features">A companhia</Link>
            <Link href="#journey">Como funciona</Link>
            <Link href="#pricing">Planos</Link>
            <Link href="#faq">Dúvidas</Link>
            <Link href="/login" className="account-link">Minha conta</Link>
          </nav>
        </div>
      </header>

      <main id="conteudo">
        <section id="inicio" className="hero-section">
          <div className="hero-inner">
            <div className="hero-copy" data-reveal>
              <p className="eyebrow"><span aria-hidden="true">✦</span> Uma companhia católica para o cotidiano</p>
              <h1>Uma presença de fé, <em>perto de você.</em></h1>
              <p className="hero-description">A MarIA é uma assistente digital acolhedora, inspirada nas virtudes de Nossa Senhora, para acompanhar sua caminhada com oração, escuta e conteúdos da tradição católica.</p>
              <div className="hero-actions">
                <Link href="#journey" className="button button-primary">Conheça a MarIA <span aria-hidden="true">→</span></Link>
                <Link href="#pricing" className="button button-secondary">Ver planos</Link>
              </div>
              <p className="hero-note">Uma ferramenta de apoio à sua vida espiritual — não substitui os sacramentos, a comunidade ou a orientação de um sacerdote.</p>
            </div>
            <div className="hero-visual" data-reveal>
              <div className="visual-halo" aria-hidden="true"></div>
              <div className="hero-screenshot">
                <Image src="/art/chat-assistente.png" alt="Captura real do chat do aplicativo MarIA com saudação e sugestões para iniciar uma conversa de oração; a faixa informativa de privacidade foi ocultada nesta prévia." fill priority sizes="(max-width: 700px) 72vw, 340px" className="object-contain" />
              </div>
              <p className="visual-caption">MarIA no aplicativo · captura real</p>
            </div>
          </div>
          <div className="hero-divider" aria-hidden="true"><span></span></div>
        </section>

        <section id="features" className="companion-section section-pad">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">Mais do que canais</p>
            <h2>O centro é a companhia.</h2>
            <p>A MarIA é a assistente que caminha com você. O aplicativo e o WhatsApp são maneiras diferentes de viver essa presença no dia a dia.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-card" data-reveal><span className="feature-symbol" aria-hidden="true">♡</span><h3>Escuta e acolhimento</h3><p>Uma conversa respeitosa para organizar pensamentos, encontrar uma oração e retomar o caminho com serenidade.</p></article>
            <article className="feature-card" data-reveal><span className="feature-symbol" aria-hidden="true">✝</span><h3>Fé vivida no cotidiano</h3><p>Liturgia, orações, Santo do Dia, terço, novenas e conteúdos para aprofundar sua caminhada católica.</p></article>
            <article className="feature-card" data-reveal><span className="feature-symbol" aria-hidden="true">⌁</span><h3>Constância possível</h3><p>Práticas e lembretes configurados no seu ritmo, sem transformar a vida espiritual em cobrança.</p></article>
          </div>
        </section>

        <section id="journey" className="journey-section section-pad">
          <div className="journey-inner">
            <div className="section-heading journey-heading" data-reveal>
              <p className="eyebrow">Uma experiência, dois espaços</p>
              <h2>Você organiza.<br /><em>A MarIA acompanha.</em></h2>
              <p>O aplicativo é o lugar para cuidar da sua rotina espiritual e escolher o que deseja receber. O WhatsApp continua próximo, mas com um papel claro: exibir as mensagens que você já agendou.</p>
              <Link href="/mobile/" className="text-link">Conheça o Santuário Digital <span aria-hidden="true">→</span></Link>
            </div>
            <ol className="journey-steps">
              <li data-reveal><span className="step-number">01</span><div><h3>Configure no aplicativo</h3><p>Escolha práticas, horários e quais lembretes deseja receber pelo WhatsApp ou no próprio celular.</p></div><span className="step-tag">Gestão no app</span></li>
              <li data-reveal><span className="step-number">02</span><div><h3>Construa seu ritmo</h3><p>Organize plano espiritual, novenas, orações e lembretes em um só lugar, com autonomia para ajustar sua rotina.</p></div><span className="step-tag">No seu tempo</span></li>
              <li data-reveal><span className="step-number">03</span><div><h3>Receba o que agendou</h3><p>No WhatsApp, a MarIA entrega as mensagens programadas por você. A gestão e a configuração ficam no aplicativo.</p></div><span className="step-tag">Entrega no WhatsApp</span></li>
            </ol>
          </div>
        </section>

        <section className="sanctuary-gallery section-pad">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">Seu Santuário Digital</p>
            <h2>Recursos para acompanhar a caminhada.</h2>
            <p>Uma experiência pensada para a oração e a vida real — organizada no aplicativo, no seu ritmo.</p>
          </div>
          <div className="gallery-grid">
            <figure className="gallery-card gallery-plan" data-reveal><div className="gallery-image"><Image src="/art/plano-de-vida.png" alt="Tela do Plano de Vida com práticas espirituais organizadas por horário e opções de lembrete." fill sizes="(max-width: 760px) 90vw, 420px" className="object-contain" /></div><figcaption><strong>Plano de Vida</strong><span>Escolha práticas, horários e canais de lembrete no aplicativo.</span></figcaption></figure>
            <figure className="gallery-card" data-reveal><div className="gallery-image"><Image src="/art/liturgia.png" alt="Tela da Liturgia da Palavra com navegação entre leituras e Evangelho." fill sizes="(max-width: 760px) 90vw, 360px" className="object-contain" /></div><figcaption><strong>Liturgia da Palavra</strong><span>Acompanhe as leituras do dia em uma tela feita para a oração.</span></figcaption></figure>
            <figure className="gallery-card" data-reveal><div className="gallery-image"><Image src="/art/terco.png" alt="Tela do Santo Terço Interativo durante uma dezena dos Mistérios Dolorosos." fill sizes="(max-width: 760px) 90vw, 360px" className="object-contain" /></div><figcaption><strong>Oração guiada</strong><span>Reze o terço e avance no seu próprio ritmo.</span></figcaption></figure>
          </div>
          <div className="scheduled-message" data-reveal>
            <div><p className="eyebrow">WhatsApp como entrega</p><h3>Você escolhe no app.<br />Recebe a mensagem agendada.</h3><p>Os lembretes do WhatsApp são configurados no Plano de Vida. O canal mostra o que foi programado; para organizar horários e práticas, use o aplicativo.</p></div>
            <figure><Image src="/art/lembrete-whatsapp.png" alt="Mensagem no WhatsApp lembrando o horário do Santo Terço; a captura oculta o controle antigo de cancelamento, e o agendamento é feito no aplicativo." fill sizes="(max-width: 760px) 90vw, 440px" className="object-contain" /><figcaption>Exemplo de lembrete programado</figcaption></figure>
          </div>
        </section>

        <section className="trust-section section-pad">
          <div className="trust-panel" data-reveal>
            <p className="eyebrow">Tecnologia a serviço da fé</p>
            <h2>Inspirada no acolhimento mariano.<br />Presente como uma assistente digital.</h2>
            <p>A MarIA não é Nossa Senhora nem fala em nome dela. Sua linguagem busca refletir virtudes marianas — ternura, escuta e esperança — em uma ferramenta criada para apoiar, nunca substituir, a vida sacramental e comunitária.</p>
            <div className="trust-values"><span>Respeito à fé católica</span><span>Consciência dos limites da IA</span><span>Valorização do encontro humano</span></div>
          </div>
        </section>

      <section id="pricing" className="py-32 relative bg-slate-900 overflow-hidden">
        {/* Dark Mode Background Decoration */}
        <div className="absolute inset-0 bg-[#001b44]"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-[#0047AB]/30 rounded-full filter blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#D4AF37]/20 rounded-full filter blur-[100px] opacity-40"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-[#D4AF37] font-bold tracking-widest uppercase text-xs mb-4">Assinatura Simples e Transparente</h2>
            <h3 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Escolha o seu plano</h3>
            <p className="text-xl text-blue-100/70 max-w-2xl mx-auto font-light">
              Escolha como a MarIA pode acompanhar sua rotina de oração, com recursos e condições apresentados em cada plano.
            </p>
          </div>

          {/* Premium Toggle Mensal/Anual */}
          <div className="flex justify-center mb-20">
            <div className="bg-white/5 p-1.5 rounded-full flex items-center backdrop-blur-md border border-white/10 relative">
              <div 
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-full transition-transform duration-300 ease-out shadow-sm ${isAnnual ? 'translate-x-full left-1.5' : 'left-1.5'}`}
              ></div>
              <button 
                onClick={() => setIsAnnual(false)}
                aria-pressed={!isAnnual}
                className={`relative z-10 px-8 py-3 rounded-full text-sm font-bold transition-colors duration-300 w-40 text-center ${!isAnnual ? 'text-[#0047AB]' : 'text-slate-300 hover:text-white'}`}
              >
                Mensal
              </button>
              <button 
                onClick={() => setIsAnnual(true)}
                aria-pressed={isAnnual}
                className={`relative z-10 px-8 py-3 rounded-full text-sm font-bold transition-colors duration-300 w-40 text-center flex items-center justify-center gap-2 ${isAnnual ? 'text-[#0047AB]' : 'text-slate-300 hover:text-white'}`}
              >
                Anual
                {!isAnnual && <span className="absolute -top-3 -right-2 bg-[#D4AF37] text-white text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Desconto</span>}
              </button>
            </div>
          </div>
          
          <div className="grid gap-8 items-stretch mx-auto relative md:grid-cols-2 lg:grid-cols-3 max-w-6xl">
            
            {/* Plano Gratuito */}
            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 flex flex-col relative border border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <div className="mb-8">
                <h4 className="text-2xl font-bold text-white mb-2">Gratuito</h4>
                <p className="text-slate-400 text-sm font-light leading-relaxed">Para experimentar e iniciar sua vida de oração com a MarIA.</p>
              </div>
              <div className="mb-10">
                <span className="text-5xl font-extrabold text-white">R$ 0</span>
              </div>
              <ul className="space-y-5 mb-10 flex-1">
                <li className="flex items-start gap-4 text-sm text-slate-300 font-light">
                  <span className="text-[#0047AB] bg-white/10 rounded-full p-1 shrink-0"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></span>
                  Reflexão da Liturgia Diária
                </li>
                <li className="flex items-start gap-4 text-sm text-slate-300 font-light">
                  <span className="text-[#0047AB] bg-white/10 rounded-full p-1 shrink-0"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></span>
                  História do Santo do Dia
                </li>
                <li className="flex items-start gap-4 text-sm text-slate-300 font-light">
                  <span className="text-[#0047AB] bg-white/10 rounded-full p-1 shrink-0"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></span>
                  Guia de oração do Terço e Rosário
                </li>
                <li className="flex items-start gap-4 text-sm text-white font-medium bg-white/10 p-3 rounded-xl border border-white/20">
                  <span className="shrink-0 text-xl">💬</span>
                  20 mensagens iniciais para testar a IA
                </li>
              </ul>
              <Link href="/mobile/" className="mt-auto w-full py-4 px-6 bg-white/5 text-white border border-white/20 rounded-full font-bold text-center hover:bg-white/10 transition-colors">
                Conhecer o aplicativo
              </Link>
            </div>

            {/* Planos Dinâmicos */}
            {plans.filter(p => p.is_active !== false && p.cycle === (isAnnual ? 'annual' : 'monthly')).map((plan, index) => {
              const discount = getDiscount(plan.tier, plan.cycle);
              const discountedPrice = discount ? plan.price - (plan.price * discount / 100) : plan.price;
              const priceDisplay = isAnnual ? (discountedPrice / 12).toFixed(2).replace('.', ',') : discountedPrice.toFixed(2).replace('.', ',');
              
              // Destacar o primeiro plano pago ou o plano 'basic'
              const isHighlighted = plan.tier === 'basic' || (index === 0 && plan.tier !== 'premium');
              
              return (
                <div key={plan.id} className={isHighlighted 
                  ? "bg-white rounded-[2.5rem] p-10 flex flex-col relative transform transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-[#0047AB] lg:-mt-6 lg:mb-6 z-20 group"
                  : "bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 flex flex-col relative border border-white/10 hover:bg-white/10 transition-all duration-300 group"
                }>
                  {isHighlighted && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#0047AB] text-white text-[10px] font-extrabold px-6 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                      Mais Escolhido
                    </div>
                  )}
                  
                  {/* Promo Banner */}
                  {discount > 0 && (
                    <div className={`absolute -top-6 -right-6 md:-right-8 bg-[#D4AF37] text-white font-black text-sm px-4 py-2 rounded-xl shadow-lg rotate-12 animate-pulse border-2 ${isHighlighted ? 'border-white' : 'border-[#001b44]'} z-30`}>
                      {discount}% OFF
                    </div>
                  )}
                  
                  <div className="mb-8">
                    <h4 className={`text-2xl font-bold mb-2 ${isHighlighted ? 'text-slate-900' : 'text-[#D4AF37]'}`}>{plan.name}</h4>
                    <p className={isHighlighted ? "text-slate-500 text-sm font-light leading-relaxed" : "text-slate-400 text-sm font-light leading-relaxed"}>
                      Limite de {plan.messages_limit} mensagens de IA.
                    </p>
                  </div>
                  
                  <div className="mb-10">
                    <div className="flex items-end gap-1 mb-1">
                      {discount > 0 && (
                        <span className={`text-xl line-through font-medium mr-2 self-center ${isHighlighted ? 'text-slate-400' : 'text-slate-500'}`}>
                          R$ {plan.price.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                      <span className={`text-5xl font-extrabold transition-all ${isHighlighted ? 'text-slate-900' : 'text-white'}`}>
                        R$ {priceDisplay}
                      </span>
                      <span className={`text-sm font-medium pb-1.5 ${isHighlighted ? 'text-slate-500' : 'text-slate-400'}`}> / mês</span>
                    </div>
                    {isAnnual ? 
                      <p className={`text-xs font-bold animate-fade-in ${isHighlighted ? 'text-[#0047AB]' : 'text-[#D4AF37]'}`}>
                        Cobrado R$ {discountedPrice.toFixed(2).replace('.', ',')} anualmente
                      </p> : 
                      <p className="text-transparent text-xs font-bold h-4">Espaço reservado</p>}
                  </div>
                  
                  <ul className="space-y-5 mb-10 flex-1">
                    {(() => {
                      let features: string[] = [];
                      let highlight = "";
                      try {
                        const parsed = JSON.parse(plan.description || "{}");
                        if (parsed && typeof parsed === 'object') {
                          features = Array.isArray(parsed.features) ? parsed.features : [plan.description];
                          highlight = parsed.highlight || "";
                        } else {
                          features = [plan.description || "Descrição não disponível."];
                        }
                      } catch {
                        features = [plan.description || "Descrição não disponível."];
                      }
                      
                      return (
                        <>
                          {features.map((feature, i) => (
                            <li key={i} className={`flex items-start gap-4 text-sm font-light ${isHighlighted ? 'text-slate-600' : 'text-slate-300'}`}>
                              <span className={`rounded-full p-1 shrink-0 ${isHighlighted ? 'text-white bg-[#0047AB]' : 'text-[#0047AB] bg-white/10'}`}><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></span>
                              {feature}
                            </li>
                          ))}
                          {highlight && (
                            <li className={`flex items-start gap-4 text-sm font-medium p-3 rounded-xl border mt-4 ${isHighlighted ? 'bg-[#0047AB]/5 text-[#0047AB] border-[#0047AB]/20' : 'bg-white/10 text-white border-white/20'}`}>
                              {highlight}
                            </li>
                          )}
                        </>
                      );
                    })()}
                  </ul>
                  
                  <div className="mt-auto w-full">
                    <button 
                      onClick={() => handleSubscribe(plan.tier, plan.cycle)}
                      className={`w-full py-4 px-6 rounded-full font-bold text-lg transition-all transform hover:-translate-y-1 ${
                        isHighlighted 
                          ? 'bg-[#0047AB] text-white hover:bg-[#003580] hover:shadow-[0_8px_30px_rgba(0,71,171,0.3)]' 
                          : 'bg-white text-slate-900 hover:bg-slate-100 hover:shadow-[0_8px_30px_rgba(255,255,255,0.2)]'
                      }`}
                    >
                      Assinar {plan.name}
                    </button>
                  </div>
                </div>
              );
            })}

          </div>
          
          {/* ESG Banner */}
          <div className="mt-20 p-8 bg-gradient-to-r from-[#0047AB]/20 to-[#D4AF37]/10 backdrop-blur-xl rounded-[2rem] border border-white/10 max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#D4AF37]/20 rounded-full filter blur-2xl"></div>
             <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#b3922c] flex items-center justify-center shrink-0 shadow-lg relative z-10">
               <span className="text-white text-3xl">🤝</span>
             </div>
             <div className="text-center md:text-left relative z-10">
               <h5 className="text-white font-extrabold text-xl mb-2">Impacto Social (ESG Espiritual)</h5>
               <p className="text-blue-100/80 font-light leading-relaxed">
                 Ao assinar qualquer plano pago, você nos ajuda a destinar 1% de todo o nosso faturamento à compra de cestas básicas para famílias necessitadas. A sua assinatura também é uma obra de misericórdia.
               </p>
             </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              O checkout é processado pelo Asaas. Consulte os termos para condições de cancelamento.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 bg-[#fafafc] border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-[#0047AB] font-bold tracking-widest uppercase text-xs mb-4">Dúvidas Frequentes</h2>
            <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Perguntas Frequentes</h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.01)] transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  aria-expanded={openFaq === index}
                  aria-controls={`faq-answer-${index}`}
                  className="w-full px-8 py-6 text-left flex justify-between items-center gap-6 group hover:bg-slate-50/50 transition-colors"
                >
                  <span id={`faq-question-${index}`} className="font-bold text-lg md:text-xl text-slate-800 group-hover:text-[#0047AB] transition-colors">{faq.q}</span>
                  <span className={`w-8 h-8 rounded-full bg-[#0047AB]/5 text-[#0047AB] flex items-center justify-center shrink-0 transition-transform duration-300 font-bold ${openFaq === index ? 'rotate-180 bg-[#0047AB] text-white' : ''}`}>
                    <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/></svg>
                  </span>
                </button>
                <div
                  id={`faq-answer-${index}`}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                  hidden={openFaq !== index}
                  className="border-t border-slate-100"
                >
                  <div className="px-8 py-6 text-slate-500 font-light leading-relaxed text-base">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center text-slate-400 text-sm font-medium">
             Ainda tem dúvidas? Fale conosco em: <a href="mailto:maria@acutistech.com.br" className="text-[#0047AB] hover:underline font-bold">maria@acutistech.com.br</a>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-16 bg-[#0a0f1c] text-slate-500 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-800 grayscale">
               <Image src="/maria_logo_premium.png" alt="MarIA Logo" fill className="object-cover" />
            </div>
            <span className="font-bold text-2xl text-white tracking-tight">MarIA</span>
          </div>
          <div className="flex flex-col items-center md:items-end text-center md:text-right gap-2">
            <p className="text-sm font-light">
              &copy; {new Date().getFullYear()} MarIA. Uma iniciativa Acutis Tech. Todos os direitos reservados.
            </p>
            <p className="text-xs text-slate-600 font-light">
              Suporte: <a href="mailto:maria@acutistech.com.br" className="text-[#0047AB] hover:underline font-medium">maria@acutistech.com.br</a>
            </p>
          </div>
          <div className="flex gap-6">
             <Link href="/termos" className="hover:text-white transition-colors text-sm font-medium">Termos</Link>
             <Link href="/privacidade" className="hover:text-white transition-colors text-sm font-medium">Privacidade</Link>
          </div>
        </div>
      </footer>

      {/* Modal de Pagamento e Ativação */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div role="dialog" aria-modal="true" aria-label="Checkout e ativação da assinatura" aria-live="polite" className="bg-white max-w-lg w-full rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden relative p-8 md:p-10 flex flex-col items-center text-center animate-scale-up">
            
            {/* Botão de Fechar */}
            <button 
              onClick={() => {
                setShowModal(false);
                setSubscribeStatus('idle');
                localStorage.removeItem('maria_checkout_session_id');
              }}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors z-50"
              aria-label="Fechar modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* ESTADO: CARREGANDO CHECKOUT */}
            {subscribeStatus === 'loading' && (
              <div className="py-10 flex flex-col items-center">
                <div className="relative w-20 h-20 flex items-center justify-center mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-[#D4AF37] border-r-transparent animate-spin"></div>
                </div>
                <h4 className="text-2xl font-extrabold text-slate-900 mb-4">Gerando Link de Pagamento</h4>
                <p className="text-slate-500 font-light max-w-xs">
                  Estamos abrindo seu checkout seguro no Asaas. Por favor, aguarde alguns instantes...
                </p>
              </div>
            )}

            {/* ESTADO: AGUARDANDO PAGAMENTO */}
            {subscribeStatus === 'pending' && (
              <div className="py-6 flex flex-col items-center">
                <div className="relative w-20 h-20 flex items-center justify-center mb-8">
                  <span className="absolute flex h-12 w-12">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0047AB]/20 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-12 w-12 bg-[#0047AB]/10 flex items-center justify-center text-[#0047AB] text-xl font-bold">💳</span>
                  </span>
                </div>
                <h4 className="text-2xl font-extrabold text-slate-900 mb-4">Aguardando Pagamento</h4>
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
                    <li>Preencha seu Nome, E-mail e CPF de forma segura no checkout.</li>
                    <li><strong>Não feche esta aba</strong> enquanto realiza o pagamento.</li>
                    <li>Seu código de ativação aparecerá aqui assim que o pagamento for concluído!</li>
                    <li>Enviaremos também um e-mail com os dados de acesso/ativação (caso não encontre, verifique a pasta de spam).</li>
                  </ul>
                </div>
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => window.open(checkoutUrl, '_blank')}
                    className="px-6 py-3 bg-[#0047AB] text-white rounded-full font-bold text-sm hover:bg-[#003580] transition-colors"
                  >
                    Reabrir Tela de Checkout
                  </button>
                  <button 
                    onClick={() => {
                      setShowModal(false);
                      setSubscribeStatus('idle');
                      localStorage.removeItem('maria_checkout_session_id');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 hover:underline transition-colors py-2"
                  >
                    Cancelar e Voltar
                  </button>
                </div>
              </div>
            )}

            {/* ESTADO: SUCESSO (CÓDIGO DE ATIVAÇÃO GERADO) */}
            {subscribeStatus === 'success' && (
              <div className="py-4 flex flex-col items-center w-full">
                <div className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center text-3xl mb-6 animate-bounce shadow-lg">
                  🎉
                </div>
                <h4 className="text-2xl font-extrabold text-slate-900 mb-2">Assinatura Confirmada!</h4>
                <p className="text-slate-500 font-light text-sm max-w-sm mb-6">
                  Seja bem-vindo(a) à MarIA! Seu pagamento foi identificado. Agora, basta ativar a sua conta enviando o código abaixo no WhatsApp.
                </p>

                {/* Caixa do Código */}
                <div className="bg-[#fafafc] border border-slate-200/80 rounded-2xl p-5 w-full max-w-sm flex flex-col items-center mb-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
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
                    className={`mt-3 text-xs font-bold transition-all px-4 py-1.5 rounded-full flex items-center gap-1.5 ${copied ? 'bg-green-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
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

                <div className="bg-[#22C55E]/5 border border-[#22C55E]/10 rounded-2xl p-4 text-center max-w-sm mb-6">
                  <p className="text-xs text-[#22C55E] font-bold uppercase tracking-wider mb-1">
                     Atenção
                  </p>
                  <p className="text-xs text-slate-600 font-light leading-relaxed text-center">
                    O código acima também foi enviado para o seu <strong>e-mail de faturamento</strong>. Clique no botão abaixo para ir direto ao WhatsApp e ativar a sua conta!
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
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  Ativar no WhatsApp
                </a>
              </div>
            )}

            {/* ESTADO: ERRO */}
            {subscribeStatus === 'error' && (
              <div className="py-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-3xl mb-6 shadow-inner">
                  ❌
                </div>
                <h4 className="text-2xl font-extrabold text-slate-900 mb-4 font-sans">Falha na Requisição</h4>
                <p className="text-slate-500 font-light text-sm max-w-sm mb-8 leading-relaxed">
                  {errorMessage || 'Não conseguimos processar o seu pedido de assinatura no momento. Por favor, tente de novo.'}
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setShowModal(false);
                      setSubscribeStatus('idle');
                      localStorage.removeItem('maria_checkout_session_id');
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
