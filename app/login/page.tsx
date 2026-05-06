// app/login/page.tsx
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação com os dados solicitados
    if (username === 'claudiney' && password === 'clauimoveis@7873') {
      // Cria o cookie que o middleware vai ler (válido por 1 dia = 86400 segundos)
      document.cookie = "admin_token=claudiney_autorizado; path=/; max-age=86400";
      // Redireciona para o painel
      router.push('/admin');
    } else {
      setErro('Credenciais inválidas. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-[#020b18] flex items-center justify-center relative overflow-hidden px-6">
      <div className="absolute top-0 w-full h-[500px] bg-luxury-gradient z-0"></div>
      
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
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#020b18] border border-slate-700 text-white px-12 py-4 rounded-lg focus:outline-none focus:border-gold transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/70" size={18} />
            <input 
              type="password" 
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#020b18] border border-slate-700 text-white px-12 py-4 rounded-lg focus:outline-none focus:border-gold transition-colors"
              required
            />
          </div>

          {erro && (
            <p className="text-red-400 text-xs text-center animate-pulse">{erro}</p>
          )}

          <button 
            type="submit" 
            className="bg-gold text-[#04122b] w-full py-4 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-gold-light transition-colors mt-2 flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            Acessar Painel
          </button>
        </form>
      </motion.div>
    </div>
  );
}