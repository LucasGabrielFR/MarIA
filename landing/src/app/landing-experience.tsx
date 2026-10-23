"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { storeLinks } from "./store-links";

type IconName =
  | "arrow"
  | "heart"
  | "book"
  | "cross"
  | "bell"
  | "chat"
  | "check"
  | "sun"
  | "calendar";

export function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, string> = {
    arrow: "M4 12h16m-6-6 6 6-6 6",
    heart:
      "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
    book: "M12 5v16m0-16C9 3 5 3 2 4v15c3-1 7-1 10 2m0-16c3-2 7-2 10-1v15c-3-1-7-1-10 2",
    cross: "M9 2h6v7h7v6h-7v7H9v-7H2V9h7Z",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2 2 0 0 0 4 0",
    chat: "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v1.4Z",
    check: "m5 12 4 4L19 6",
    sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
    calendar: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z",
  };
  return (
    <svg
      aria-hidden="true"
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}

function Brand() {
  return (
    <span className="maria-brand">
      <Image src="/maria_logo_premium.png" alt="" width={44} height={44} />
      <span translate="no">
        MarIA<span className="brand-period">.</span>
      </span>
    </span>
  );
}

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="maria-header">
        <div className="maria-container nav-inner">
          <Link
            href="#inicio"
            aria-label="MarIA — início"
            onClick={() => setMenuOpen(false)}
          >
            <Brand />
          </Link>
          <button
            ref={menuToggleRef}
            className="menu-toggle"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span />
            <span />
          </button>
          <nav
            id="main-navigation"
            className={`maria-nav${menuOpen ? " is-open" : ""}`}
            aria-label="Navegação principal"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setMenuOpen(false);
                menuToggleRef.current?.focus();
              }
            }}
          >
            <Link href="#features" onClick={() => setMenuOpen(false)}>
              A companhia
            </Link>
            <Link href="#santuario" onClick={() => setMenuOpen(false)}>
              Seu santuário
            </Link>
            <Link href="#journey" onClick={() => setMenuOpen(false)}>
              Como funciona
            </Link>
            <Link href="#pricing" onClick={() => setMenuOpen(false)}>
              Planos
            </Link>
            <Link href="/login" className="nav-account">
              Minha conta <Icon name="arrow" />
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}

function ChatArtwork() {
  return (
    <div
      className="art-chat"
      role="img"
      aria-label="Prévia da conversa com a MarIA: uma pergunta sobre o perdão e uma resposta acolhedora, inspiradas nas telas do aplicativo."
    >
      <div aria-hidden="true">
        <div className="art-chat-header">
          <span className="art-avatar">
            <Image
              src="/maria_logo_premium.png"
              alt=""
              width={40}
              height={40}
            />
          </span>
          <span>
            <strong>MarIA</strong>
            <small>Acolhimento e oração</small>
          </span>
          <span className="art-spark">✧</span>
        </div>
        <div className="art-chat-body">
          <p className="art-user-message">
            O que a Igreja nos ensina sobre o perdão sincero?
          </p>
          <div className="art-answer">
            <span className="art-answer-label">✧ MarIA</span>
            <p>
              Que alegria ver seu coração buscando entender a beleza do perdão!
            </p>
            <p>
              Perdoar não significa esquecer ou minimizar a dor causada, mas é
              um convite para libertar nosso coração do peso do ressentimento.
            </p>
            <span className="art-answer-rule" />
          </div>
        </div>
        <div className="art-chat-input">
          <span>Uma dúvida, intenção ou reflexão…</span>
          <span className="art-send">
            <Icon name="arrow" />
          </span>
        </div>
      </div>
    </div>
  );
}

function RoutineArtwork() {
  const practices: { time: string; title: string; icon: IconName }[] = [
    { time: "07:00", title: "Oferecimento da Manhã", icon: "sun" },
    { time: "09:00", title: "Liturgia & Evangelho", icon: "book" },
    { time: "12:00", title: "Oração do Angelus", icon: "bell" },
    { time: "17:28", title: "Santo Terço Mariano", icon: "cross" },
  ];
  return (
    <div
      className="routine-artwork"
      role="img"
      aria-label="Visão do Plano de Vida com Oferecimento da Manhã às 7h, Liturgia às 9h, Angelus ao meio-dia e Terço às 17h28; horários e lembretes são configuráveis."
    >
      <div className="routine-orbit" aria-hidden="true" />
      <div className="routine-window" aria-hidden="true">
        <div className="routine-window-bar">
          <span className="mini-cross">✝</span>
          <span>MEU PLANO DE VIDA</span>
          <span>•••</span>
        </div>
        <div className="routine-summary">
          <small>Jornada de santificação</small>
          <strong>Um dia, um passo de cada vez.</strong>
          <div className="routine-progress">
            <span />
          </div>
          <span>Seu tempo de estar com Deus</span>
        </div>
        <div className="routine-rows">
          {practices.map((practice, index) => (
            <div
              className={`routine-row${index === 3 ? " is-selected" : ""}`}
              key={practice.time}
            >
              <span className="routine-time">{practice.time}</span>
              <span className="routine-line-icon">
                <Icon name={practice.icon} />
              </span>
              <div>
                <strong>{practice.title}</strong>
                <span>
                  <Icon name="bell" /> Lembrete no celular
                  {index === 3 && (
                    <b>
                      <Icon name="chat" /> WhatsApp
                    </b>
                  )}
                </span>
              </div>
              <span className="routine-circle" />
            </div>
          ))}
        </div>
      </div>
      <div className="routine-floating" aria-hidden="true">
        <span className="floating-icon">
          <Icon name="calendar" />
        </span>
        <div>
          <small>Um ritmo que é seu</small>
          <strong>Você escolhe o horário.</strong>
        </div>
        <Icon name="check" />
      </div>
    </div>
  );
}

const devotionTabs = [
  {
    id: "liturgia",
    label: "A Palavra do dia",
    icon: "book",
    title: "Encontre a Palavra. Leve-a para a vida.",
    copy: "Acompanhe a Liturgia Diária, o Santo do Dia e a Liturgia das Horas em uma experiência feita para a leitura orante.",
  },
  {
    id: "terco",
    label: "Santo Terço",
    icon: "cross",
    title: "Uma oração de cada vez. No seu ritmo.",
    copy: "Reze com guias passo a passo ou acompanhe cada conta do Terço Interativo, com os mistérios e as orações sempre por perto.",
  },
  {
    id: "novenas",
    label: "Novenas",
    icon: "calendar",
    title: "Nove dias. Uma intenção no coração.",
    copy: "Escolha uma novena, acompanhe os dias rezados e organize lembretes para perseverar na oração até o fim.",
  },
] as const;

function DevotionArtwork({
  active,
}: {
  active: (typeof devotionTabs)[number]["id"];
}) {
  const artwork = {
    liturgia: {
      src: "/art/liturgia.png",
      width: 460,
      height: 906,
      label: "LITURGIA DA PALAVRA",
      alt: "Liturgia da Palavra no aplicativo MarIA: Evangelho de Lucas 12,54–59, com abas de leitura, salmo e Evangelho.",
    },
    terco: {
      src: "/art/terco.png",
      width: 461,
      height: 895,
      label: "SANTO TERÇO INTERATIVO",
      alt: "Terço Interativo com contas de oração: primeiro Mistério Doloroso, sexta Ave-Maria e acompanhamento da dezena no aplicativo MarIA.",
    },
    novenas: {
      src: "/art/novena-app.png",
      width: 446,
      height: 909,
      label: "NO SEU SANTUÁRIO",
      alt: "Novena a São Judas Tadeu no Santuário do aplicativo MarIA: data da festa, início e opção Iniciar Novena.",
    },
  }[active];
  return (
    <div className={`devotion-feature devotion-feature--${active}`}>
      <span className="devotion-feature-label">
        <Icon
          name={
            active === "terco"
              ? "cross"
              : active === "novenas"
                ? "calendar"
                : "book"
          }
        />
        {artwork.label}
      </span>
      <div className="devotion-screen-detail">
        <Image
          src={artwork.src}
          alt={artwork.alt}
          width={artwork.width}
          height={artwork.height}
          sizes="(max-width: 700px) 88vw, 400px"
        />
      </div>
      <span className="devotion-feature-note">
        {active === "liturgia"
          ? "A leitura que acompanha sua oração."
          : active === "terco"
            ? "Cada conta, um passo de oração."
            : "Uma intenção. Nove dias com Deus."}
      </span>
    </div>
  );
}

function StoreBadges() {
  const stores = [
    {
      name: "App Store",
      href: storeLinks.appStore,
      src: "/stores/app-store.svg",
      width: 120,
      height: 40,
    },
    {
      name: "Google Play",
      href: storeLinks.googlePlay,
      src: "/stores/google-play.png",
      width: 646,
      height: 250,
    },
  ];
  return (
    <div className="store-availability">
      <p>A sua companhia, também no celular.</p>
      <div className="store-badges">
        {stores.map((store) => {
          const badge = (
            <Image
              src={store.src}
              alt={store.name}
              width={store.width}
              height={store.height}
              unoptimized
            />
          );
          return (
            <div className="store-option" key={store.name}>
              {store.href ? (
                <a
                  href={store.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Baixar MarIA na ${store.name} (abre em nova aba)`}
                >
                  {badge}
                </a>
              ) : (
                <span className="store-pending">{badge}</span>
              )}
              <span className="store-status">
                {store.href ? "Disponível para baixar" : "Em breve"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LandingStory() {
  const [activeDevotion, setActiveDevotion] =
    useState<(typeof devotionTabs)[number]["id"]>("liturgia");
  const devotion = devotionTabs.find((tab) => tab.id === activeDevotion)!;
  return (
    <>
      <section id="inicio" className="maria-hero">
        <div className="maria-container hero-heading" data-reveal>
          <p className="overline">
            <span>✧</span> ACOLHIMENTO. ORAÇÃO. COMPANHIA.
          </p>
          <h1>
            Uma presença de fé,
            <br />
            <em>perto de você.</em>
          </h1>
          <p>
            A MarIA é uma assistente digital acolhedora, inspirada nas virtudes
            de Nossa Senhora, para acompanhar sua caminhada com oração, escuta e
            conteúdos da tradição católica.
          </p>
          <div className="maria-actions">
            <Link href="#features" className="maria-button">
              Conheça a MarIA <Icon name="arrow" />
            </Link>
            <Link href="#pricing" className="maria-link">
              Encontre seu plano <span>↗</span>
            </Link>
          </div>
        </div>
        <StoreBadges />
        <div className="hero-stage maria-container" data-reveal>
          <div className="sanctuary-backdrop">
            <Image
              src="/art/sanctuary-arch.webp"
              alt=""
              width={1536}
              height={1024}
              priority
              sizes="(max-width: 700px) 100vw, 1200px"
            />
          </div>
          <div className="hero-stage-shade" aria-hidden="true" />
          <div className="hero-stage-caption">
            <span className="stage-cross">✝</span>
            <p>
              Para os dias de paz.
              <br />
              <em>E para os dias em que ela faz falta.</em>
            </p>
            <span>MARIA · SUA COMPANHIA NA CAMINHADA</span>
          </div>
          <div className="hero-chat-placement">
            <ChatArtwork />
          </div>
          <div className="hero-prayer-note">
            <span>
              <Icon name="bell" />
            </span>
            <div>
              <small>Um momento para Deus</small>
              <strong>Santo Terço Mariano</strong>
              <span>Seu lembrete, no horário que você escolheu.</span>
            </div>
            <span className="note-time">17:28</span>
          </div>
        </div>
        <div className="hero-footline maria-container">
          <span>Inspirada no acolhimento mariano</span>
          <span>Uma assistente. Dois espaços de encontro.</span>
          <a href="#features">
            Continue a conhecer <span>↓</span>
          </a>
        </div>
      </section>

      <section
        id="features"
        className="companionship-section maria-container section-spacing"
      >
        <div className="editorial-heading" data-reveal>
          <p className="overline">A COMPANHIA É O CENTRO</p>
          <h2>
            A vida acontece.
            <br />
            <em>A fé caminha junto.</em>
          </h2>
          <p>
            A MarIA é a assistente que caminha com você. O aplicativo e o
            WhatsApp são maneiras diferentes de viver essa presença no dia a
            dia.
          </p>
        </div>
        <div className="companionship-columns">
          {[
            {
              number: "01",
              icon: "heart" as const,
              title: "Escuta que acolhe.",
              text: "Uma conversa respeitosa para organizar pensamentos, encontrar uma oração e retomar o caminho com serenidade.",
            },
            {
              number: "02",
              icon: "book" as const,
              title: "Fé que se aprofunda.",
              text: "Liturgia, orações, Santo do Dia, terço, novenas e conteúdos para aprofundar sua caminhada católica.",
            },
            {
              number: "03",
              icon: "sun" as const,
              title: "Um ritmo possível.",
              text: "Práticas e lembretes configurados no seu ritmo, sem transformar a vida espiritual em cobrança.",
            },
          ].map((feature) => (
            <article key={feature.number} data-reveal>
              <div className="feature-line">
                <Icon name={feature.icon} />
                <span>{feature.number}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="routine-section section-spacing">
        <div className="maria-container routine-layout">
          <div className="routine-copy" data-reveal>
            <p className="overline">PLANO DE VIDA ESPIRITUAL</p>
            <h2>
              Um pequeno sim.
              <br />
              <em>Todos os dias.</em>
            </h2>
            <p>
              Reserve espaço para o que alimenta sua fé. No aplicativo, organize
              práticas, horários e lembretes em uma rotina que respeita o seu
              tempo.
            </p>
            <ul className="maria-check-list">
              <li>
                <Icon name="check" /> Práticas e hábitos escolhidos por você
              </li>
              <li>
                <Icon name="check" /> Horários que cabem no seu dia
              </li>
              <li>
                <Icon name="check" /> Lembretes no celular e entrega pelo
                WhatsApp
              </li>
            </ul>
            <Link href="/mobile/" className="maria-link">
              Conheça seu Santuário Digital <span>↗</span>
            </Link>
          </div>
          <div data-reveal>
            <RoutineArtwork />
          </div>
        </div>
      </section>

      <section id="santuario" className="devotion-section section-spacing">
        <div className="maria-container">
          <div className="devotion-heading" data-reveal>
            <p className="overline">SEU SANTUÁRIO DIGITAL</p>
            <h2>
              Mais espaço para Deus.
              <br />
              <em>No ritmo da sua vida.</em>
            </h2>
            <p>
              Recursos para acompanhar a caminhada, da Palavra do dia à oração
              que você quer fazer agora.
            </p>
          </div>
          <div className="devotion-showcase" data-reveal>
            <div className="devotion-controls">
              <div
                className="devotion-buttons"
                aria-label="Explore os recursos de oração"
              >
                {devotionTabs.map((tab) => (
                  <button
                    key={tab.id}
                    aria-pressed={activeDevotion === tab.id}
                    onClick={() => setActiveDevotion(tab.id)}
                  >
                    <Icon name={tab.icon} />
                    <span>{tab.label}</span>
                    <span className="devotion-button-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </button>
                ))}
              </div>
              <div className="devotion-description" aria-live="polite">
                <span>0{devotionTabs.indexOf(devotion) + 1} / 03</span>
                <h3>{devotion.title}</h3>
                <p>{devotion.copy}</p>
              </div>
            </div>
            <div className="devotion-art-scene" key={activeDevotion}>
              <div className="scene-arch" aria-hidden="true" />
              <DevotionArtwork active={activeDevotion} />
            </div>
          </div>
          <div className="devotion-extras">
            <span>
              <Icon name="heart" /> Acolhimento com a MarIA
            </span>
            <span>
              <Icon name="book" /> Liturgia das Horas
            </span>
            <span>
              <Icon name="cross" /> Preparação para a Confissão
            </span>
          </div>
        </div>
      </section>

      <section
        id="journey"
        className="channels-section section-spacing maria-container"
      >
        <div className="editorial-heading" data-reveal>
          <p className="overline">UMA EXPERIÊNCIA, DOIS ESPAÇOS</p>
          <h2>
            Você organiza.
            <br />
            <em>A MarIA acompanha.</em>
          </h2>
          <p>
            O aplicativo é o lugar para cuidar da sua rotina espiritual e
            escolher o que deseja receber. O WhatsApp continua próximo, exibindo
            as mensagens que você já agendou.
          </p>
        </div>
        <div className="channels-composition" data-reveal>
          <div className="channel-config">
            <span className="composition-label">NO APLICATIVO</span>
            <div className="channel-config-title">
              <span>
                <Icon name="cross" />
              </span>
              <div>
                <small>Minha prática espiritual</small>
                <strong>Santo Terço Mariano</strong>
              </div>
            </div>
            <div className="schedule-time">
              <Icon name="calendar" />
              <span>Horário escolhido</span>
              <strong>17:28</strong>
            </div>
            <div className="channel-chips">
              <span>
                <Icon name="bell" /> Celular
              </span>
              <span>
                <Icon name="chat" /> WhatsApp <Icon name="check" />
              </span>
            </div>
            <span className="schedule-confirmation">
              <Icon name="check" /> Um lembrete do seu jeito
            </span>
          </div>
          <div className="channel-connector" aria-hidden="true">
            <span />
            <Icon name="arrow" />
            <span />
          </div>
          <div className="channel-delivery">
            <span className="composition-label">NO WHATSAPP</span>
            <div className="delivery-message">
              <span className="delivery-title">
                <Icon name="chat" /> MarIA
              </span>
              <strong>Chegou o momento do Santo Terço.</strong>
              <p>
                Hoje meditamos os Mistérios Dolorosos. Una o seu coração à
                Santíssima Virgem e ofereça este terço pelas suas intenções.
              </p>
              <div>
                <span>Mensagem previamente agendada</span>
                <span>
                  17:28 <Icon name="check" />
                </span>
              </div>
            </div>
          </div>
        </div>
        <ol className="channel-steps">
          <li data-reveal>
            <span>01</span>
            <h3>Configure no aplicativo</h3>
            <p>
              Escolha práticas, horários e quais lembretes deseja receber pelo
              WhatsApp ou no próprio celular.
            </p>
          </li>
          <li data-reveal>
            <span>02</span>
            <h3>Construa seu ritmo</h3>
            <p>
              Organize plano espiritual, novenas, orações e lembretes em um só
              lugar, com autonomia para ajustar sua rotina.
            </p>
          </li>
          <li data-reveal>
            <span>03</span>
            <h3>Receba o que agendou</h3>
            <p>
              No WhatsApp, a MarIA entrega as mensagens programadas por você. A
              gestão e a configuração ficam no aplicativo.
            </p>
          </li>
        </ol>
      </section>

      <section className="marian-section">
        <div className="maria-container marian-layout">
          <div className="marian-emblem" aria-hidden="true">
            <span>✧</span>
            <span className="marian-monogram">M</span>
            <span>✝</span>
          </div>
          <div data-reveal>
            <p className="overline">TECNOLOGIA A SERVIÇO DA FÉ</p>
            <h2>
              Ternura na escuta.
              <br />
              <em>Clareza no caminho.</em>
            </h2>
            <p>
              Inspirada nas virtudes de Nossa Senhora — ternura, escuta e
              esperança — a MarIA é uma assistente digital de apoio à vida
              espiritual.
            </p>
            <p className="marian-note">
              A MarIA não é Nossa Senhora nem fala em nome dela. Não substitui
              os sacramentos, a comunidade ou a orientação de um sacerdote.
            </p>
            <div className="marian-values">
              <span>Respeito à fé católica</span>
              <span>Consciência dos limites da IA</span>
              <span>Valorização do encontro humano</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function LandingFooter() {
  return (
    <footer className="maria-footer">
      <div className="maria-container">
        <div className="footer-top">
          <div>
            <p className="overline">PARA CAMINHAR COM VOCÊ</p>
            <h2>
              Faça espaço para a fé.
              <br />
              <em>A MarIA acompanha.</em>
            </h2>
          </div>
          <Link href="#pricing" className="maria-button">
            Encontre seu plano <Icon name="arrow" />
          </Link>
        </div>
        <div className="footer-bottom">
          <Link href="#inicio" aria-label="MarIA — voltar ao início">
            <Brand />
          </Link>
          <p>
            © {new Date().getFullYear()} MarIA · Uma iniciativa Acutis Tech.
          </p>
          <div>
            <Link href="/termos">Termos</Link>
            <Link href="/privacidade">Privacidade</Link>
            <a href="mailto:maria@acutistech.com.br">Fale conosco ↗</a>
          </div>
        </div>
        <div className="footer-wordmark" aria-hidden="true">
          MarIA<span>.</span>
        </div>
      </div>
    </footer>
  );
}
