"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Nenhum token fornecido na URL.");
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/customer/auth/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Token inválido ou expirado.");
        }

        // The backend should return the Stripe Customer Portal URL
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("URL do portal não encontrada.");
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.message);
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="mb-6">
          <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4">
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Verificando seu acesso...</h1>
        </div>

        {status === "error" && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-6">
            <p className="font-medium mb-1">Acesso negado</p>
            <p className="text-sm">{errorMsg}</p>
          </div>
        )}

        {status === "error" && (
          <button
            onClick={() => router.push("/login")}
            className="w-full py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
          >
            Voltar para o Login
          </button>
        )}
      </div>
    </div>
  );
}

export default function Verify() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="mb-6">
            <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4 animate-pulse">
              <div className="w-6 h-6 bg-blue-400 rounded-full"></div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Carregando...</h1>
          </div>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
