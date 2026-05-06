// app/admin/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { Home, Users, Eye, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
  const [totalImoveis, setTotalImoveis] = useState(0);

  useEffect(() => {
    async function carregarDados() {
      // Puxa apenas a contagem de imóveis ativos para não pesar
      const { count } = await supabase
        .from('imoveis')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);
        
      if (count) setTotalImoveis(count);
    }
    carregarDados();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl text-white">Resumo Geral</h1>
          <p className="text-sm text-slate-400 mt-1">Acompanhe os números da sua imobiliária hoje.</p>
        </div>
        <Link 
          href="/admin/imoveis/novo" 
          className="bg-gold text-[#04122b] px-6 py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-gold-light transition-colors"
        >
          + Novo Imóvel
        </Link>
      </div>

      {/* CARDS DE ESTATÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-[#1a304d]/50 border border-slate-700/50 p-6 rounded-xl flex flex-col gap-4">
          <div className="flex justify-between items-center text-slate-400">
            <p className="text-xs uppercase tracking-widest font-bold">Imóveis Ativos</p>
            <Home size={18} className="text-gold" />
          </div>
          <p className="font-serif text-4xl text-white">{totalImoveis}</p>
        </div>

        <div className="bg-[#1a304d]/50 border border-slate-700/50 p-6 rounded-xl flex flex-col gap-4">
          <div className="flex justify-between items-center text-slate-400">
            <p className="text-xs uppercase tracking-widest font-bold">Novos Leads</p>
            <Users size={18} className="text-blue-400" />
          </div>
          <p className="font-serif text-4xl text-white">12</p>
        </div>

        <div className="bg-[#1a304d]/50 border border-slate-700/50 p-6 rounded-xl flex flex-col gap-4">
          <div className="flex justify-between items-center text-slate-400">
            <p className="text-xs uppercase tracking-widest font-bold">Visualizações</p>
            <Eye size={18} className="text-green-400" />
          </div>
          <p className="font-serif text-4xl text-white">1.430</p>
        </div>

        <div className="bg-[#1a304d]/50 border border-slate-700/50 p-6 rounded-xl flex flex-col gap-4">
          <div className="flex justify-between items-center text-slate-400">
            <p className="text-xs uppercase tracking-widest font-bold">Conversão</p>
            <TrendingUp size={18} className="text-purple-400" />
          </div>
          <p className="font-serif text-4xl text-white">4,2%</p>
        </div>

      </div>
    </div>
  );
}