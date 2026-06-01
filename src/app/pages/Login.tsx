import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Cake } from "lucide-react";
import logoImage from "../../assets/logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Preencha e-mail e senha para continuar.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F5E8DC] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#D9898C]/10" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#5A3A2E]/10" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-[#F3D7D8]/40" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#5A3A2E] to-[#7a4e3e] px-8 py-8 flex flex-col items-center gap-3">
            <div className="w-24 h-24 bg-white/15 rounded-2xl flex items-center justify-center p-2">
              <img
                src={logoImage}
                alt="Doceterapia"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-center">
              <h1 className="text-white text-2xl">Doceterapia</h1>
              <p className="text-[#F5E8DC]/70 text-sm mt-0.5">
                Sistema de Gestão da Confeitaria
              </p>
            </div>
          </div>

          <div className="px-8 py-8">
            <div className="mb-6">
              <h2 className="text-[#5A3A2E] text-xl">Bem-vinda de volta 🍰</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                Entre na sua conta para continuar
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-[#5A3A2E] mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-[#F5E8DC]/40 border border-[#e8d5c4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D9898C]/40 focus:border-[#D9898C] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#5A3A2E] mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-[#F5E8DC]/40 border border-[#e8d5c4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D9898C]/40 focus:border-[#D9898C] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#D9898C] hover:bg-[#c7787b] text-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  "Entrar no sistema"
                )}
              </button>
            </form>

            <div className="mt-6 p-3 bg-[#F5E8DC]/60 rounded-xl flex items-start gap-2">
              <Cake className="w-4 h-4 text-[#D9898C] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500">
                Este é um protótipo demonstrativo. Use qualquer e-mail e senha
                para acessar.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          © 2026 Doceterapia · Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
