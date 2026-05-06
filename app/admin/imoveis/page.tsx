// app/admin/imoveis/page.tsx
'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Edit, Trash2, Plus, ExternalLink } from 'lucide-react';

export default function AdminImoveisList() {
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    buscarImoveis();
  }, []);

  async function buscarImoveis() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('imoveis')
      .select('*')
      .order('criado_em', { ascending: false });

    if (data) setImoveis(data);
    setCarregando(false);
  }

  async function deletarImovel(id: number) {
    if (!window.confirm("Tem certeza que deseja apagar este imóvel?")) return;
    
    await supabase.from('imoveis').delete().eq('id', id);
    buscarImoveis(); // Recarrega a lista após deletar
  }

  const formatarPreco = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl text-white">Gerenciar Imóveis</h1>
          <p className="text-sm text-slate-400 mt-1">Seu portfólio completo.</p>
        </div>
        <Link 
          href="/admin/imoveis/novo" 
          className="bg-gold text-[#04122b] px-6 py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-gold-light transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Novo Imóvel
        </Link>
      </div>

      <div className="bg-[#1a304d]/50 border border-slate-700/50 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#04122b] text-xs uppercase tracking-widest text-gold font-bold">
              <tr>
                <th className="px-6 py-4">Foto / Título</th>
                <th className="px-6 py-4">Finalidade</th>
                <th className="px-6 py-4">Preço</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {carregando ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 animate-pulse">Carregando imóveis...</td></tr>
              ) : imoveis.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhum imóvel cadastrado.</td></tr>
              ) : (
                imoveis.map((imovel) => (
                  <tr key={imovel.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded bg-slate-800 flex-shrink-0 overflow-hidden relative border border-slate-700">
                        {imovel.imagem_url ? (
                          <img src={imovel.imagem_url} alt={imovel.titulo} className="w-full h-full object-cover" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-[8px] text-slate-500">S/ Foto</span>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium line-clamp-1">{imovel.titulo}</p>
                        <p className="text-xs text-slate-500">{imovel.cidade}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-[10px] uppercase tracking-wider">
                        {imovel.finalidade}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-serif text-gold">{formatarPreco(imovel.preco)}</td>
                    <td className="px-6 py-4">
                      {imovel.ativo ? (
                        <span className="text-green-400 text-xs flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span> Ativo</span>
                      ) : (
                        <span className="text-red-400 text-xs flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> Inativo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                      <Link href={`/imovel/${imovel.id}`} target="_blank" className="text-slate-400 hover:text-blue-400 transition-colors" title="Ver no site">
                        <ExternalLink size={18} />
                      </Link>
                      
                      {/* AQUI ESTAVA O ERRO! Troquei o <button> por um <Link> apontando para a página certa */}
                      <Link href={`/admin/imoveis/editar/${imovel.id}`} className="text-slate-400 hover:text-gold transition-colors" title="Editar">
                        <Edit size={18} />
                      </Link>

                      <button onClick={() => deletarImovel(imovel.id)} className="text-slate-400 hover:text-red-400 transition-colors" title="Excluir">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}