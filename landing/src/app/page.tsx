"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/plans')
      .then((res) => res.json())
      .then((data) => setPlans(data))
      .catch((err) => console.error('Erro ao buscar planos:', err));
  }, []);

  const getPrice = (tier: string, cycle: string) => {
    const promo = promoPrices[`${tier}-${cycle}`];
    if (promo !== undefined) return promo;
    const plan = plans.find(p => p.tier === tier && p.cycle === cycle);
    return plan?.price;
  };

  const [affiliateCode, setAffiliateCodeState] = useState<string | null>(null);
  const [promoPrices, setPromoPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const ref = searchParams.get('ref');
    
    let activeRef = ref;
    if (ref) {
      localStorage.setItem('maria_affiliate_ref', ref);
      // Remove da URL para ficar limpo
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else {
      activeRef = localStorage.getItem('maria_affiliate_ref');
    }

    if (activeRef) {
      setAffiliateCodeState(activeRef);
      // Buscar promoções desse afiliado
      fetch(`/api/affiliates/code/${activeRef}/promotions`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.promotions) {
            const promoMap: Record<string, number> = {};
            data.promotions.forEach((p: any) => {
              promoMap[`${p.plan_tier}-${p.plan_cycle}`] = p.promotional_price;
            });
            setPromoPrices(promoMap);
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

  const chatImages = ['/chat-1.jpeg', '/chat-2.jpeg', '/chat-3.jpeg', '/chat-4.jpeg'];

  // Polling de ativação de pagamento
  useEffect(() => {
    if (subscribeStatus !== 'pending' || !sessionId) return;

    let pollInterval: NodeJS.Timeout;

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

    checkStatus();
    pollInterval = setInterval(checkStatus, 3000);

    return () => clearInterval(pollInterval);
  }, [subscribeStatus, sessionId]);

  // Recuperação de sessão pós-redirecionamento se retornar com ?checkout=success
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const searchParams = new URLSearchParams(window.location.search);
    const isCheckoutSuccess = searchParams.get('checkout') === 'success';
    const savedSessionId = localStorage.getItem('maria_checkout_session_id');

    if (isCheckoutSuccess && savedSessionId) {
      setSessionId(savedSessionId);
      setSubscribeStatus('pending');
      setShowModal(true);

      // Limpa os parâmetros da URL para evitar reabertura automática ao atualizar
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
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
        body: JSON.stringify({ planId, cycle, affiliateCode }),
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
    } catch (err: any) {
      console.error('Erro ao assinar:', err);
      setSubscribeStatus('error');
      setErrorMessage(err.message || 'Não foi possível gerar o link de pagamento. Tente novamente.');
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % chatImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [chatImages.length]);

  const faqs = [
    {
      q: "A MarIA substitui a direção espiritual ou o Sacramento da Confissão?",
      a: "De forma alguma. A MarIA é uma ferramenta de apoio devocional, catequético e de aconselhamento diário. Ela não substitui os sacramentos (como a Confissão e a Eucaristia) nem o acompanhamento de um sacerdote real, que são absolutamente insubstituíveis na vida da fé."
    },
    {
      q: "De onde a MarIA tira as respostas teológicas?",
      a: "Toda a base intelectual da MarIA é estritamente fundamentada no Sagrado Magistério da Igreja Católica Apostólica Romana, incluindo o Catecismo da Igreja Católica (CIC), a Sagrada Escritura (Bíblia Sagrada), as Encíclicas Papais e escritos patrísticos e escolásticos. Ela é programada para se manter 100% fiel à sã doutrina."
    },
    {
      q: "A linguagem dela realmente parece um carinho de mãe?",
      a: "Sim. A MarIA foi desenhada para refletir o acolhimento, a doçura e a paciência de Nossa Senhora. Suas respostas trazem um tom de consolo espiritual e afeto materno, ajudando você a passar por momentos difíceis com serenidade, sem julgamentos frios."
    },
    {
      q: "Funciona para qualquer perfil de católico?",
      a: "Perfeitamente. Ela foi estruturada para se adaptar a diferentes necessidades: desde o fiel que precisa de apoio emocional e orações nos dias de estresse, até o estudante ou catequista que busca respostas teológicas e doutrinárias profundas sobre a fé."
    },
    {
      q: "Os meus dados e conversas estão protegidos?",
      a: "Com certeza. Valorizamos imensamente a sua intimidade espiritual. Suas conversas no WhatsApp são tratadas sob rígidos padrões de segurança e privacidade. Além disso, você pode solicitar a exclusão permanente de todo o seu histórico a qualquer momento diretamente com o nosso suporte."
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafafc] font-sans text-slate-800 selection:bg-[#D4AF37] selection:text-[#0047AB] overflow-x-hidden">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-sm border border-slate-100 group-hover:scale-105 transition-transform duration-300">
               <Image src="/maria_logo_premium.png" alt="MarIA Logo" fill className="object-cover" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-[#0047AB]">MarIA</span>
          </div>
          <nav className="hidden md:flex gap-8 items-center font-medium">
            <Link href="#features" className="text-slate-500 hover:text-[#0047AB] transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#0047AB] hover:after:w-full after:transition-all after:duration-300">
              O que é a MarIA?
            </Link>
            <Link href="#faq" className="text-slate-500 hover:text-[#0047AB] transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#0047AB] hover:after:w-full after:transition-all after:duration-300">
              Perguntas Frequentes
            </Link>
            <Link href="#pricing" className="text-slate-500 hover:text-[#0047AB] transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#0047AB] hover:after:w-full after:transition-all after:duration-300">
              Planos
            </Link>
            <Link href="/login" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-full hover:border-[#0047AB] hover:text-[#0047AB] hover:shadow-lg transition-all shadow-sm font-semibold">
              Minha Conta
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[10%] w-96 h-96 bg-[#0047AB]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-[20%] right-[10%] w-96 h-96 bg-[#D4AF37]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[40%] w-96 h-96 bg-blue-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center w-full">
          {/* Text Content */}
          <div className="flex flex-col items-start text-left z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm text-[#0047AB] text-sm font-semibold mb-8 border border-slate-100 animate-fade-in">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D4AF37]"></span>
              </span>
              Presença e Acolhimento Católico
            </div>
            
            <h1 className="text-5xl lg:text-[5.2rem] font-extrabold text-slate-900 leading-[1.05] mb-8 tracking-tight">
              O aconchego de Nossa Senhora <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#0047AB] to-[#D4AF37] pb-2">
                no seu WhatsApp
              </span>
            </h1>
            
            <p className="text-xl text-slate-500 mb-10 leading-relaxed max-w-xl font-light">
              Sentir-se acolhido, ouvir palavras sábias inspiradas nas escrituras e no Magistério. A MarIA foi desenhada com o amor e a doçura de Nossa Senhora para ser um refúgio de paz no seu dia a dia, auxiliando fiéis de todos os perfis: do suporte emocional ao aprofundamento teológico.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
              <Link href="#pricing" className="px-8 py-4 bg-[#0047AB] text-white rounded-full text-lg font-semibold hover:bg-[#003580] hover:shadow-[0_8px_30px_rgba(0,71,171,0.3)] hover:-translate-y-1 transition-all text-center flex items-center justify-center gap-2">
                Quero conhecer
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            </div>
            
            <div className="mt-10 flex items-center gap-4 text-sm text-slate-400 font-medium">
               <div className="flex -space-x-3">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200"></div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300"></div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] text-xs font-bold">+</div>
               </div>
               <p>Fidelidade absoluta ao Magistério da Igreja</p>
            </div>
          </div>
          
          {/* Animated Phone Mockup */}
          <div className="relative w-full h-[600px] lg:h-[750px] flex items-center justify-center z-10">
             
             {/* Floating Elements around phone */}
             <div className="absolute top-20 -left-6 lg:-left-12 px-5 py-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 z-20 animate-float hidden md:flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">⛪</div>
                <div className="flex flex-col">
                  <span className="text-slate-800 font-bold text-sm">Fiel à Doutrina</span>
                  <span className="text-slate-400 text-xs">Catecismo da Igreja</span>
                </div>
             </div>
             
             <div className="absolute bottom-32 -right-6 lg:-right-12 px-5 py-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 z-20 animate-float-delayed hidden md:flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0047AB]/10 flex items-center justify-center text-[#0047AB]">📖</div>
                <div className="flex flex-col">
                  <span className="text-slate-800 font-bold text-sm">Liturgia Diária</span>
                  <span className="text-slate-400 text-xs">Tudo no seu WhatsApp</span>
                </div>
             </div>

             {/* Phone Body (Completely straight by default as requested) */}
             <div className="relative w-[300px] lg:w-[340px] h-[600px] lg:h-[680px] bg-slate-950 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-[10px] border-slate-900 overflow-hidden transition-all duration-700 ease-out hover:scale-105 group ring-1 ring-white/10">
                
                {/* iPhone Notch */}
                <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-2xl w-32 mx-auto z-30"></div>
                
                {/* Images Carousel - cropped at top to remove status bar (negative top + higher height) */}
                <div className="w-full h-full relative bg-[#efeae2]">
                  {chatImages.map((src, index) => (
                    <div 
                      key={src} 
                      className={`absolute inset-0 transition-all duration-1000 ${
                        index === currentImageIndex 
                          ? 'opacity-100 scale-100 z-10' 
                          : 'opacity-0 scale-105 z-0'
                      }`}
                    >
                      <Image
                        src={src}
                        alt={`Demonstração MarIA ${index + 1}`}
                        fill
                        className="object-cover"
                        priority={index === 0}
                      />
                    </div>
                  ))}
                  
                  {/* Glare effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-[#0047AB] font-bold tracking-widest uppercase text-xs mb-4">A Sabedoria dos Séculos</h2>
            <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">O Magistério a um toque</h3>
            <p className="text-xl text-slate-500 font-light leading-relaxed">
              Desenvolvemos a MarIA sob uma curadoria rigorosa, assegurando que cada resposta teológica, pastoral ou espiritual respeite o Magistério, a Tradição e as Sagradas Escrituras de forma acolhedora.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-10 rounded-[2.5rem] bg-[#fafafc] shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100 hover:border-[#D4AF37]/30 hover:shadow-[0_20px_40px_rgba(212,175,55,0.06)] transition-all duration-500 group text-center hover:-translate-y-2">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#0047AB]/5 text-[#0047AB] flex items-center justify-center mb-8 group-hover:bg-[#0047AB] group-hover:text-white transition-colors duration-500">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-4">Apoio Emocional e Oração</h4>
              <p className="text-slate-500 leading-relaxed font-light">Em dias cansativos ou de aflição, encontre uma voz acolhedora para rezar com você e trazer consolo amparado na promessa de Cristo.</p>
            </div>

            {/* Card 2 */}
            <div className="p-10 rounded-[2.5rem] bg-[#fafafc] shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100 hover:border-[#0047AB]/30 hover:shadow-[0_20px_40px_rgba(0,71,171,0.06)] transition-all duration-500 group text-center hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#0047AB] to-[#D4AF37]"></div>
              <div className="w-20 h-20 mx-auto rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center mb-8 group-hover:bg-[#D4AF37] group-hover:text-white transition-colors duration-500">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-4">Base Teológica e Doutrina</h4>
              <p className="text-slate-500 leading-relaxed font-light">Resolva dúvidas sobre Sacramentos, Dogmas ou ensinamentos papais com respostas fundamentadas fielmente no Catecismo e Tradição.</p>
            </div>

            {/* Card 3 */}
            <div className="p-10 rounded-[2.5rem] bg-[#fafafc] shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100 hover:border-[#0047AB]/30 hover:shadow-[0_20px_40px_rgba(0,71,171,0.06)] transition-all duration-500 group text-center hover:-translate-y-2">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#0047AB]/5 text-[#0047AB] flex items-center justify-center mb-8 group-hover:bg-[#0047AB] group-hover:text-white transition-colors duration-500">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-4">Rotina de Oração e Liturgia</h4>
              <p className="text-slate-500 leading-relaxed font-light">Acompanhe a Liturgia do dia, leia sobre a história do Santo do Dia e reze o Santo Terço com o passo a passo direto nas suas mensagens.</p>
            </div>
          </div>
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
              Sua Mãe Espiritual está a uma mensagem de distância. Assine e faça parte desta comunidade devocional.
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
                className={`relative z-10 px-8 py-3 rounded-full text-sm font-bold transition-colors duration-300 w-40 text-center ${!isAnnual ? 'text-[#0047AB]' : 'text-slate-300 hover:text-white'}`}
              >
                Mensal
              </button>
              <button 
                onClick={() => setIsAnnual(true)}
                className={`relative z-10 px-8 py-3 rounded-full text-sm font-bold transition-colors duration-300 w-40 text-center flex items-center justify-center gap-2 ${isAnnual ? 'text-[#0047AB]' : 'text-slate-300 hover:text-white'}`}
              >
                Anual
                {!isAnnual && <span className="absolute -top-3 -right-2 bg-[#D4AF37] text-white text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Desconto</span>}
              </button>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto relative">
            
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
              <form action="/api/checkout" method="POST" className="mt-auto">
                <input type="hidden" name="planId" value="free" />
                <button type="button" className="w-full py-4 px-6 bg-white/5 text-slate-400 border border-white/10 rounded-full font-bold cursor-not-allowed transition-colors">
                  Acesso Direto no WhatsApp
                </button>
              </form>
            </div>

            {/* Plano Básico (Destaque) */}
            <div className="bg-white rounded-[2.5rem] p-10 flex flex-col relative transform transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-[#0047AB] lg:-mt-6 lg:mb-6 z-20 group">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#0047AB] text-white text-[10px] font-extrabold px-6 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                Mais Escolhido
              </div>
              <div className="mb-8">
                <h4 className="text-2xl font-bold text-slate-900 mb-2">Básico</h4>
                <p className="text-slate-500 text-sm font-light leading-relaxed">Para quem busca direcionamento e uma companhia diária constante.</p>
              </div>
              <div className="mb-10">
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-extrabold text-slate-900 transition-all">
                    R$ {isAnnual ? 
                      (getPrice('basic', 'annual') ? (getPrice('basic', 'annual')! / 12).toFixed(2).replace('.', ',') : '12,90')
                      : 
                      (getPrice('basic', 'monthly') ? getPrice('basic', 'monthly')!.toFixed(2).replace('.', ',') : '14,90')
                    }
                  </span>
                  <span className="text-slate-500 text-sm font-medium pb-1.5"> / mês</span>
                </div>
                {isAnnual ? 
                  <p className="text-[#0047AB] text-xs font-bold animate-fade-in">
                    Cobrado R$ {getPrice('basic', 'annual') ? getPrice('basic', 'annual')!.toFixed(2).replace('.', ',') : '154,80'} anualmente
                  </p> : 
                  <p className="text-transparent text-xs font-bold h-4">Espaço reservado</p>}
              </div>
              <ul className="space-y-5 mb-10 flex-1">
                <li className="flex items-start gap-4 text-sm text-slate-600 font-medium">
                  <span className="text-white bg-green-500 rounded-full p-1 shrink-0"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></span>
                  Tudo do plano gratuito +
                </li>
                <li className="flex items-start gap-4 text-sm text-[#0047AB] font-bold bg-[#0047AB]/5 p-3 rounded-xl border border-[#0047AB]/10">
                  <span className="shrink-0 text-xl">💬</span>
                  100 mensagens exclusivas conversando com a IA
                </li>
                <li className="flex items-start gap-4 text-sm text-slate-600 font-light">
                  <span className="text-white bg-[#0047AB] rounded-full p-1 shrink-0"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></span>
                  Aconselhamento emocional profundo
                </li>
                <li className="flex items-start gap-4 text-sm text-slate-600 font-light">
                  <span className="text-white bg-[#0047AB] rounded-full p-1 shrink-0"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></span>
                  Tira dúvidas com base teológica e do Catecismo
                </li>
              </ul>
              <div className="mt-auto w-full">
                <button 
                  onClick={() => handleSubscribe('basic', isAnnual ? 'annual' : 'monthly')}
                  className="w-full py-4 px-6 bg-[#0047AB] text-white rounded-full font-bold text-lg hover:bg-[#003580] hover:shadow-[0_8px_30px_rgba(0,71,171,0.3)] transition-all transform hover:-translate-y-1"
                >
                  Assinar Básico
                </button>
              </div>
            </div>

            {/* Plano Premium */}
            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 flex flex-col relative border border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <div className="mb-8">
                <h4 className="text-2xl font-bold text-[#D4AF37] mb-2">Premium</h4>
                <p className="text-slate-400 text-sm font-light leading-relaxed">Para quem deseja viver uma imersão teológica e oração intensa.</p>
              </div>
              <div className="mb-10">
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-extrabold text-white transition-all">
                    R$ {isAnnual ? 
                      (getPrice('premium', 'annual') ? (getPrice('premium', 'annual')! / 12).toFixed(2).replace('.', ',') : '26,90')
                      : 
                      (getPrice('premium', 'monthly') ? getPrice('premium', 'monthly')!.toFixed(2).replace('.', ',') : '29,90')
                    }
                  </span>
                  <span className="text-slate-400 text-sm font-medium pb-1.5"> / mês</span>
                </div>
                {isAnnual ? 
                  <p className="text-[#D4AF37] text-xs font-bold animate-fade-in">
                    Cobrado R$ {getPrice('premium', 'annual') ? getPrice('premium', 'annual')!.toFixed(2).replace('.', ',') : '322,80'} anualmente
                  </p> : 
                  <p className="text-transparent text-xs font-bold h-4">Espaço reservado</p>}
              </div>
              <ul className="space-y-5 mb-10 flex-1">
                 <li className="flex items-start gap-4 text-sm text-slate-300 font-light">
                  <span className="text-white bg-green-500 rounded-full p-1 shrink-0"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></span>
                  Tudo do plano Básico +
                </li>
                <li className="flex items-start gap-4 text-sm text-[#D4AF37] font-bold bg-[#D4AF37]/10 p-3 rounded-xl border border-[#D4AF37]/25">
                  <span className="shrink-0 text-xl">✨</span>
                  300 mensagens exclusivas conversando com a IA
                </li>
                <li className="flex items-start gap-4 text-sm text-slate-300 font-light">
                  <span className="text-[#D4AF37] bg-white/10 rounded-full p-1 shrink-0"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></span>
                  Respostas mais elaboradas e longas
                </li>
                <li className="flex items-start gap-4 text-sm text-slate-300 font-light">
                  <span className="text-[#D4AF37] bg-white/10 rounded-full p-1 shrink-0"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></span>
                  Acompanhamento diário rigoroso
                </li>
              </ul>
              <div className="mt-auto w-full">
                <button 
                  onClick={() => handleSubscribe('premium', isAnnual ? 'annual' : 'monthly')}
                  className="w-full py-4 px-6 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-100 transition-colors hover:shadow-[0_8px_30px_rgba(255,255,255,0.2)]"
                >
                  Assinar Premium
                </button>
              </div>
            </div>
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
              Pagamento 100% seguro. Cancele facilmente a qualquer momento.
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
                  className="w-full px-8 py-6 text-left flex justify-between items-center gap-6 group hover:bg-slate-50/50 transition-colors"
                >
                  <span className="font-bold text-lg md:text-xl text-slate-800 group-hover:text-[#0047AB] transition-colors">{faq.q}</span>
                  <span className={`w-8 h-8 rounded-full bg-[#0047AB]/5 text-[#0047AB] flex items-center justify-center shrink-0 transition-transform duration-300 font-bold ${openFaq === index ? 'rotate-180 bg-[#0047AB] text-white' : ''}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/></svg>
                  </span>
                </button>
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${openFaq === index ? 'max-h-[300px] border-t border-slate-100' : 'max-h-0'}`}
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

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/5562981949980"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-14 h-14 bg-[#22C55E] hover:scale-110 transition-all duration-300 rounded-full shadow-[0_8px_30px_rgba(34,197,94,0.4)] hover:shadow-[0_12px_40px_rgba(34,197,94,0.6)] group shrink-0"
        aria-label="Fale com a MarIA no WhatsApp"
      >
        {/* Elegant green ripple ring */}
        <span className="absolute inset-0 rounded-full bg-[#22C55E] opacity-40 animate-ping pointer-events-none"></span>

        {/* Label (Slides/Fades in on hover) - Now ABSOLUTELY positioned to prevent blocking clicking footer elements */}
        <span className="hidden md:inline-block absolute right-16 px-4 py-2 bg-[#0a0f1c]/95 text-white text-xs font-bold rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-[#22C55E]/30 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap">
          Fale com a MarIA
        </span>

        {/* Telephone Outline Icon (Lucide-style Phone icon for perfect match) */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="white" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-6 h-6 relative z-10 transition-transform duration-300 group-hover:rotate-12"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
      </a>
      {/* Modal de Pagamento e Ativação */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white max-w-lg w-full rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden relative p-8 md:p-10 flex flex-col items-center text-center animate-scale-up">
            
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
