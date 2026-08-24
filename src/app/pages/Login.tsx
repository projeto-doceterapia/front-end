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
    <main className="login-page">
      <div className="login-decoration" aria-hidden="true">
        <div className="decoration decoration-top-right" />
        <div className="decoration decoration-bottom-left" />
        <div className="decoration decoration-center-left" />
      </div>

      <div className="login-container">
        <section className="login-card">
          <header className="login-header">
            <div className="login-logo">
              <img
                src={logoImage}
                alt="Doceterapia"
              />
            </div>
            <div className="login-brand">
              <h1>Doceterapia</h1>
              <p>
                Sistema de Gestão da Confeitaria
              </p>
            </div>
          </header>

          <div className="login-content">
            <div className="login-intro">
              <h2>Bem-vinda de volta 🍰</h2>
              <p>
                Entre na sua conta para continuar
              </p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-field">
                <label htmlFor="email"> 
                  E-mail
                </label>
                <div className="input-wrapper">
                  <Mail className="field-icon" aria-hidden="true" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="password"> 
                  Senha
                </label>
                <div className="input-wrapper">
                  <Lock className="field-icon" aria-hidden="true" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" />
                    ) : (
                      <Eye aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="login-submit"
              >
                {loading ? (
                  <span className="loading-state">
                    <span className="loading-spinner" />
                    Entrando...
                  </span>
                ) : (
                  "Entrar no sistema"
                )}
              </button>
            </form>

            <div className="login-note">
              <Cake aria-hidden="true" />
              <p>
                Este é um protótipo demonstrativo. Use qualquer e-mail e senha
                para acessar.
              </p>
            </div>
          </div>
        </section>

        <p className="login-footer">
          © 2026 Doceterapia · Todos os direitos reservados
        </p>
      </div>
    </main>
  );
}
