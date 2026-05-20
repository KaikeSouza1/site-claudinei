'use client'

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User, LogIn, AlertTriangle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erro,     setErro]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [blocked,  setBlocked]  = useState<number | null>(null); // segundos até desbloqueio
  const router       = useRouter();
  const searchParams = useSearchParams();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading || blocked) return;

    setLoading(true);
    setErro('');

    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') ?? '60', 10);
        setBlocked(retryAfter);
        // Faz contagem regressiva
        const tick = setInterval(() => {
          setBlocked(prev => {
            if (prev === null || prev <= 1) { clearInterval(tick); return null; }
            return prev - 1;
          });
        }, 1000);
        return;
      }

      if (!res.ok) {
        setErro(data.error ?? 'Credenciais inválidas.');
        setPassword('');
        return;
      }

      // Sucesso — redireciona para where came from ou /admin
      const from = searchParams.get('from') || '/admin';
      router.push(from);
      router.refresh();
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020b18] flex items-center justify-center relative overflow-hidden px-6">
      <div className="absolute top-0 w-full h-[500px] bg-luxury-gradient z-0" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1a304d]/80 backdrop-blur-xl border border-gold/30 p-10 rounded-2xl shadow-2xl w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl text-gold mb-2">Painel Restrito</h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest">Claudiney W. Otto Junior</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/70" size={18} />
            <input
              type="text"
              placeholder="Usuário"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              disabled={loading || !!blocked}
              className="w-full bg-[#020b18] border border-slate-700 text-white px-12 py-4 rounded-lg focus:outline-none focus:border-gold transition-colors disabled:opacity-50"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/70" size={18} />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading || !!blocked}
              className="w-full bg-[#020b18] border border-slate-700 text-white px-12 py-4 rounded-lg focus:outline-none focus:border-gold transition-colors disabled:opacity-50"
              required
            />
          </div>

          {/* Erro normal */}
          {erro && !blocked && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              <AlertTriangle size={13} />
              {erro}
            </div>
          )}

          {/* Bloqueio por rate limit */}
          {blocked && (
            <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
              <Clock size={13} />
              Muitas tentativas. Aguarde <strong>{blocked}s</strong> para tentar novamente.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !!blocked}
            className="bg-gold text-[#04122b] w-full py-4 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-gold-light transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-[#04122b]/40 border-t-[#04122b] rounded-full animate-spin" />
              : <LogIn size={18} />
            }
            {loading ? 'Entrando…' : 'Acessar Painel'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
