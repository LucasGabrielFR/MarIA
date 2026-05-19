"use client";

import { useState } from "react";
import Link from "next/link";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/customer/auth/magic-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao solicitar o link de acesso.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <Link href="/" className="absolute top-6 left-6 font-bold text-2xl text-blue-700">
        MarIA
      </Link>
      
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Acessar minha conta</h1>
        <p className="text-slate-500 mb-8 text-sm">
          Digite o número do WhatsApp usado na sua assinatura para receber um link de acesso seguro.
        </p>

        {success ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 border border-green-200">
            Link de acesso enviado! Verifique o seu WhatsApp.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                {error}
              </div>
            )}
            <div className="text-left">
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                Número do WhatsApp
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !phone}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Receber link por WhatsApp"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
