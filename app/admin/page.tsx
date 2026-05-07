// app/admin/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { Home, Users, Eye, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalImoveis: 0,
    imoveisAtivos: 0,
    imoveisVendidos: 0,
    imoveisAlugados: 0,
    imoveisDisponiveis: 0,
    imoveisReservados: 0
  });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      setCarregando(true);

      try {
        // Busca estatísticas dos imóveis
        const { data: imoveis, error } = await supabase
          .from('imoveis')
          .select('ativo, status');

        if (imoveis && !error) {
          const stats = {
            totalImoveis: imoveis.length,
            imoveisAtivos: imoveis.filter(imovel => imovel.ativo).length,
            imoveisVendidos: imoveis.filter(imovel => imovel.status === 'vendido').length,
            imoveisAlugados: imoveis.filter(imovel => imovel.status === 'alugado').length,
            imoveisDisponiveis: imoveis.filter(imovel => imovel.status === 'disponivel' || !imovel.status).length,
            imoveisReservados: imoveis.filter(imovel => imovel.status === 'reservado').length
          };

          setStats(stats);
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      }

      setCarregando(false);
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
        
        <div className="bg-[#2f4968]/60 border border-slate-500/30 p-6 rounded-xl flex flex-col gap-4">
          <div className="flex justify-between items-center text-slate-400">
            <p className="text-xs uppercase tracking-widest font-bold">Total de Imóveis</p>
            <Home size={18} className="text-gold" />
          </div>
          <p className="font-serif text-4xl text-white">{carregando ? '...' : stats.totalImoveis}</p>
        </div>

        <div className="bg-[#2f4968]/60 border border-slate-500/30 p-6 rounded-xl flex flex-col gap-4">
          <div className="flex justify-between items-center text-slate-400">
            <p className="text-xs uppercase tracking-widest font-bold">Disponíveis</p>
            <CheckCircle size={18} className="text-green-400" />
          </div>
          <p className="font-serif text-4xl text-white">{carregando ? '...' : stats.imoveisDisponiveis}</p>
        </div>

        <div className="bg-[#2f4968]/60 border border-slate-500/30 p-6 rounded-xl flex flex-col gap-4">
          <div className="flex justify-between items-center text-slate-400">
            <p className="text-xs uppercase tracking-widest font-bold">Vendidos</p>
            <XCircle size={18} className="text-red-400" />
          </div>
          <p className="font-serif text-4xl text-white">{carregando ? '...' : stats.imoveisVendidos}</p>
        </div>

        <div className="bg-[#2f4968]/60 border border-slate-500/30 p-6 rounded-xl flex flex-col gap-4">
          <div className="flex justify-between items-center text-slate-400">
            <p className="text-xs uppercase tracking-widest font-bold">Alugados</p>
            <Home size={18} className="text-blue-400" />
          </div>
          <p className="font-serif text-4xl text-white">{carregando ? '...' : stats.imoveisAlugados}</p>
        </div>

      </div>

      {/* CARDS ADICIONAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        
        <div className="bg-[#2f4968]/60 border border-slate-500/30 p-6 rounded-xl flex flex-col gap-4">
          <div className="flex justify-between items-center text-slate-400">
            <p className="text-xs uppercase tracking-widest font-bold">Reservados</p>
            <Clock size={18} className="text-yellow-400" />
          </div>
          <p className="font-serif text-4xl text-white">{carregando ? '...' : stats.imoveisReservados}</p>
        </div>

        <div className="bg-[#2f4968]/60 border border-slate-500/30 p-6 rounded-xl flex flex-col gap-4">
          <div className="flex justify-between items-center text-slate-400">
            <p className="text-xs uppercase tracking-widest font-bold">Ativos no Site</p>
            <Eye size={18} className="text-green-400" />
          </div>
          <p className="font-serif text-4xl text-white">{carregando ? '...' : stats.imoveisAtivos}</p>
        </div>

      </div>
    </div>
  );
}