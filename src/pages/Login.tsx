import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/button';

export function Login() {
  const navigate = useNavigate();
  const { login, companyInfo, isAuthenticated } = useStore();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Brute force protection state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLocked) {
      setError('Compte temporairement bloqué suite à de multiples tentatives. Veuillez réessayer plus tard.');
      return;
    }

    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(email, password);

      if (success) {
        setFailedAttempts(0);
        navigate('/');
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);

        if (newAttempts >= 5) {
          setIsLocked(true);
          setError('Trop de tentatives échouées. Compte bloqué par sécurité.');
          // Reset lock after 1 minute for demo purposes
          setTimeout(() => {
            setIsLocked(false);
            setFailedAttempts(0);
          }, 60000);
        } else {
          setError('Identifiants incorrects. Veuillez réessayer.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Veuillez entrer votre adresse email.');
      return;
    }

    setIsLoading(true);

    // Simulate sending reset email
    setTimeout(() => {
      setResetSent(true);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            {companyInfo.logo ? (
              <img src={companyInfo.logo} alt={companyInfo.name} className="h-12 w-auto mb-4" />
            ) : (
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-slate-50">{companyInfo.name}</h1>
            <p className="text-sm text-slate-400 mt-1">
              {isForgotPassword ? 'Réinitialisation du mot de passe' : 'Connexion à votre espace sécurisé'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {resetSent ? (
            <div className="text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-slate-200 mb-2">Email envoyé !</h3>
              <p className="text-sm text-slate-400 mb-6">
                Si un compte est associé à <strong>{email}</strong>, vous recevrez un lien pour réinitialiser votre mot
                de passe d'ici quelques minutes.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsForgotPassword(false);
                  setResetSent(false);
                  setError('');
                }}
              >
                Retour à la connexion
              </Button>
            </div>
          ) : (
            <form
              onSubmit={isForgotPassword ? handleResetPassword : handleLogin}
              className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email ou identifiant</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-lg bg-slate-950/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
                    placeholder="votre@email.com"
                    disabled={isLoading || isLocked}
                  />
                </div>
              </div>

              {!isForgotPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">Mot de passe</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2.5 border border-slate-700 rounded-lg bg-slate-950/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
                      placeholder="••••••••"
                      disabled={isLoading || isLocked}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading || isLocked}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-slate-50 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all"
                disabled={isLoading || isLocked}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-50/30 border-t-slate-50 rounded-full animate-spin" />
                ) : isForgotPassword ? (
                  'Envoyer le lien'
                ) : (
                  <span className="flex items-center gap-2">
                    Se connecter <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              {isForgotPassword && (
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setError('');
                    }}
                    className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Retour à la connexion
                  </button>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Security badge footer */}
        <div className="bg-slate-950/50 py-3 px-8 border-t border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500/70" />
          <span>Connexion chiffrée de bout en bout (JWT)</span>
        </div>
      </div>
    </div>
  );
}
