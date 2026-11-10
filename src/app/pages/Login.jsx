import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import logoImage from "../../assets/logo.png";
import useToast from "../../components/feedback/useToast";
import { NOME_NEGOCIO } from "../../components/identidade";
import useSessao from "../../components/sessao/useSessao";
import { ehFalhaAoBuscarUsuario } from "../../services/sessao";

function mensagemDeErro(erro) {
  if (ehFalhaAoBuscarUsuario(erro)) {
    return "Não foi possível iniciar a sessão. Tente novamente.";
  }
  const status = erro.response?.status;
  if (status >= 400 && status < 500) {
    return "E-mail ou senha inválidos. Tente novamente.";
  }
  return "Não foi possível entrar agora. Tente novamente em instantes.";
}

export default function Login() {
  const { entrar } = useSessao();
  const toast = useToast();
  const campoEmail = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    campoEmail.current.focus();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Preencha e-mail e senha para continuar.");
      return;
    }
    setLoading(true);
    try {
      await entrar(email, password);
    } catch (erro) {
      setLoading(false);
      toast.erro(mensagemDeErro(erro));
    }
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
              <h1>{NOME_NEGOCIO}</h1>
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
                    ref={campoEmail}
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
          </div>
        </section>

        <p className="login-footer">
          © 2026 Doceterapia · Todos os direitos reservados
        </p>
      </div>
    </main>
  );
}
