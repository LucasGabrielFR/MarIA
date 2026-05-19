"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Setting {
  key: string;
  value: string;
  description: string;
  updated_at: string;
}

export default function TermsOfUse() {
  const [setting, setSetting] = useState<Setting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/admin/settings/public/terms_of_use`);
      if (!response.ok) {
        throw new Error("Não foi possível carregar os Termos de Uso no momento.");
      }
      const data = await response.json();
      setSetting(data);
    } catch (err: any) {
      setError(err.message || "Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  function parseMarkdown(md: string) {
    if (!md) return "";
    
    let html = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Headers
    html = html.replace(/^### (.*?)$/gm, "<h3 class='text-xl font-bold mt-8 mb-4 text-white'>$1</h3>");
    html = html.replace(/^## (.*?)$/gm, "<h2 class='text-2xl font-bold mt-10 mb-4 text-white border-b border-white/10 pb-2'>$1</h2>");
    html = html.replace(/^# (.*?)$/gm, "<h1 class='text-4xl font-extrabold mt-12 mb-6 text-[#D4AF37]'>$1</h1>");

    // Bullet Lists
    const lines = html.split("\n");
    let inList = false;
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const content = trimmed.substring(2);
        let res = "";
        if (!inList) {
          inList = true;
          res += "<ul class='list-disc list-inside my-6 pl-4 space-y-3 text-slate-300'>";
        }
        res += `<li>${content}</li>`;
        return res;
      } else {
        let res = "";
        if (inList) {
          inList = false;
          res += "</ul>";
        }
        return res + line;
      }
    });
    if (inList) {
      processedLines.push("</ul>");
    }
    html = processedLines.join("\n");

    // Paragraphs (double newlines)
    const paragraphs = html.split(/\n\s*\n/);
    html = paragraphs
      .map(p => {
        const trimmed = p.trim();
        if (!trimmed) return "";
        if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<li")) {
          return trimmed;
        }
        return `<p class="my-5 text-slate-300 leading-relaxed font-light text-base md:text-lg">${trimmed.replace(/\n/g, "<br />")}</p>`;
      })
      .filter(Boolean)
      .join("\n");

    return html;
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-300 selection:bg-[#D4AF37] selection:text-[#0047AB] overflow-x-hidden relative flex flex-col justify-between">
      {/* Background Ornaments */}
      <div className="absolute inset-0 bg-[#000a1c] -z-20"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-[#0047AB]/20 rounded-full filter blur-[120px] opacity-40 -z-10"></div>
      <div className="absolute bottom-[-15%] left-[-10%] w-[60%] h-[60%] bg-[#D4AF37]/10 rounded-full filter blur-[100px] opacity-30 -z-10"></div>

      {/* Top Navbar */}
      <header className="w-full z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-sm border border-white/10 group-hover:scale-105 transition-transform duration-300">
               <Image src="/maria_logo_premium.png" alt="MarIA Logo" fill className="object-cover" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">MarIA</span>
          </Link>
          <Link href="/" className="px-6 py-2.5 bg-white/5 border border-white/10 text-white rounded-full hover:bg-white/10 hover:border-white/20 hover:shadow-lg transition-all shadow-sm font-semibold text-sm">
            Voltar para o Início
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-16 md:py-24 relative z-10">
        {loading ? (
          /* Loading Skeleton Status */
          <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 md:p-12 shadow-2xl animate-pulse space-y-8">
            <div className="h-4 bg-white/10 rounded w-1/4"></div>
            <div className="h-10 bg-white/10 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-white/10 rounded"></div>
              <div className="h-4 bg-white/10 rounded"></div>
              <div className="h-4 bg-white/10 rounded w-5/6"></div>
            </div>
            <div className="h-8 bg-white/10 rounded w-1/2 mt-12"></div>
            <div className="space-y-3">
              <div className="h-4 bg-white/10 rounded"></div>
              <div className="h-4 bg-white/10 rounded w-4/5"></div>
            </div>
          </div>
        ) : error ? (
          /* Error Screen */
          <div className="bg-red-500/10 backdrop-blur-xl rounded-[2rem] border border-red-500/25 p-8 md:p-12 text-center max-w-2xl mx-auto shadow-2xl">
            <span className="text-5xl block mb-6">⚠️</span>
            <h2 className="text-2xl font-bold text-white mb-4">Falha ao Carregar</h2>
            <p className="text-red-200/80 font-light mb-8 leading-relaxed">
              {error}
            </p>
            <button 
              onClick={fetchData}
              className="px-8 py-3 bg-[#0047AB] text-white rounded-full font-bold shadow-lg hover:bg-[#003580] transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          /* Dynamic Render Page */
          <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 md:p-16 shadow-2xl relative overflow-hidden">
            {setting?.updated_at && (
              <div className="text-slate-400 text-xs font-semibold tracking-wider uppercase mb-4">
                Última atualização: {new Date(setting.updated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </div>
            )}
            <div 
              className="prose prose-invert max-w-none text-slate-300 font-sans"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(setting?.value || "") }}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-12 bg-slate-950 text-slate-500 border-t border-white/5 text-center mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
          <p className="font-light">
            &copy; {new Date().getFullYear()} MarIA. Uma iniciativa Acutis Tech. Todos os direitos reservados.
          </p>
          <p className="font-light">
            Suporte: <a href="mailto:maria@acutistech.com.br" className="text-[#0047AB] hover:underline font-medium">maria@acutistech.com.br</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
