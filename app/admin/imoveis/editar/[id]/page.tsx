// app/admin/imoveis/editar/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { Save, Loader2, UploadCloud, X, Star, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';

export default function EditarImovel() {
  const router = useRouter();
  const { id } = useParams();
  
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [uploadingGaleria, setUploadingGaleria] = useState(false);

  const [formData, setFormData] = useState({
    codigo: '', titulo: '', descricao: '', preco: '', tipo: 'Casa', finalidade: 'Venda',
    cidade: '', bairro: '', endereco: '', latitude: '', longitude: '',
    quartos: 0, banheiros: 0, vagas: 0, area: 0, imagem_url: '', destaque: false, ativo: true, status: 'disponivel',
  });

  const [galeria, setGaleria] = useState<string[]>([]);

  // ==========================================
  // CARREGAR DADOS DO BANCO AO ABRIR A PÁGINA
  // ==========================================
  useEffect(() => {
    async function carregarImovel() {
      // 1. Puxa os dados principais do imóvel
      const { data: imovelData, error: imovelError } = await supabase
        .from('imoveis')
        .select('*')
        .eq('id', id)
        .single();

      if (imovelError) {
        alert("Erro ao carregar os dados do imóvel.");
        router.push('/admin/imoveis');
        return;
      }

      if (imovelData) {
        setFormData({
          codigo: imovelData.codigo || '',
          titulo: imovelData.titulo || '',
          descricao: imovelData.descricao || '',
          preco: imovelData.preco ? imovelData.preco.toString() : '',
          tipo: imovelData.tipo || 'Casa',
          finalidade: imovelData.finalidade || 'Venda',
          cidade: imovelData.cidade || '',
          bairro: imovelData.bairro || '',
          endereco: imovelData.endereco || '',
          latitude: imovelData.latitude ? imovelData.latitude.toString() : '',
          longitude: imovelData.longitude ? imovelData.longitude.toString() : '',
          quartos: imovelData.quartos || 0,
          banheiros: imovelData.banheiros || 0,
          vagas: imovelData.vagas || 0,
          area: imovelData.area || 0,
          imagem_url: imovelData.imagem_url || '',
          destaque: imovelData.destaque || false,
          ativo: imovelData.ativo !== false,
          status: imovelData.status || 'disponivel',
        });

        // 2. Puxa as fotos da galeria (tabela imovel_fotos)
        const { data: fotosData } = await supabase
          .from('imovel_fotos')
          .select('url')
          .eq('imovel_id', id);

        const fotosUrls = fotosData ? fotosData.map(f => f.url) : [];
        
        // Coloca a foto de capa (se existir e não estiver na galeria) + fotos da galeria no estado
        const galeriaCompleta = new Set([...(imovelData.imagem_url ? [imovelData.imagem_url] : []), ...fotosUrls]);
        setGaleria(Array.from(galeriaCompleta));
      }
      setCarregando(false);
    }

    carregarImovel();
  }, [id, router]);

  // ==========================================
  // LÓGICA DA GALERIA E CAPA
  // ==========================================
  const handleUploadGaleria = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingGaleria(true);
    
    const data = new FormData();
    Array.from(files).forEach(file => data.append("file", file));

    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const result = await res.json();
      
      if (result.urls) {
        setGaleria((prev) => {
          const novaGaleria = [...prev, ...result.urls];
          if (!formData.imagem_url && novaGaleria.length > 0) {
            setFormData(prevForm => ({ ...prevForm, imagem_url: novaGaleria[0] }));
          }
          return novaGaleria;
        });
      } else {
        alert("Erro no upload: " + result.error);
      }
    } catch (error) {
      alert("Erro de conexão ao enviar imagens para o Cloudflare R2.");
    }
    
    setUploadingGaleria(false);
  };

  const definirComoCapa = (url: string) => {
    setFormData({ ...formData, imagem_url: url });
  };

  const removerFoto = (urlParaRemover: string) => {
    setGaleria(galeria.filter((url) => url !== urlParaRemover));
    if (formData.imagem_url === urlParaRemover) {
      setFormData({ ...formData, imagem_url: '' });
    }
  };

  // ==========================================
  // ATUALIZAR TUDO NO SUPABASE
  // ==========================================
  const handleAtualizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    
    try {
      // 1. Atualiza a tabela principal 'imoveis'
      const { error: updateError } = await supabase
        .from('imoveis')
        .update({ 
          ...formData, 
          preco: Number(formData.preco),
          latitude: formData.latitude ? Number(formData.latitude) : null,
          longitude: formData.longitude ? Number(formData.longitude) : null,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // 2. O jeito mais fácil e limpo de atualizar a galeria é deletar as antigas e salvar as novas
      // Deleta as fotos atuais desse imóvel na tabela imovel_fotos
      await supabase.from('imovel_fotos').delete().eq('imovel_id', id);

      // Salva a nova configuração da galeria (ignorando a foto que virou capa para não duplicar, caso queira)
      const fotosParaGaleria = galeria.filter(url => url !== formData.imagem_url);
      if (fotosParaGaleria.length > 0) {
        const fotosInsert = fotosParaGaleria.map(url => ({
          imovel_id: id,
          url: url
        }));
        const { error: fotosError } = await supabase.from('imovel_fotos').insert(fotosInsert);
        if (fotosError) throw fotosError;
      }
      
      alert("Imóvel atualizado com sucesso!");
      router.push('/admin/imoveis');
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar o imóvel no banco de dados.");
    } finally {
      setSalvando(false);
    }
  };

  const handleInputChange = (e: any) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-serif text-3xl text-white">Editar Imóvel</h1>
          <p className="text-sm text-gold mt-1 line-clamp-1">{formData.titulo}</p>
        </div>
      </div>

      <form onSubmit={handleAtualizar} className="space-y-8">
        
        {/* GALERIA UNIFICADA E DEFINIÇÃO DE CAPA */}
        <div className="bg-[#2f4968]/60 border border-slate-500/30 p-8 rounded-xl shadow-xl">
          <div className="flex justify-between items-center mb-6 border-b border-slate-500/30 pb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Fotos do Imóvel (Capa e Galeria)</h2>
            <label className="cursor-pointer bg-gold text-[#04122b] px-6 py-2 rounded-lg text-xs font-bold uppercase hover:bg-gold-light transition-colors flex items-center gap-2">
              {uploadingGaleria ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
              {uploadingGaleria ? 'Enviando...' : 'Adicionar Fotos'}
              <input type="file" multiple className="hidden" accept="image/*" onChange={handleUploadGaleria} />
            </label>
          </div>
          
          {galeria.length === 0 ? (
            <div className="border-2 border-dashed border-slate-500/40 rounded-xl h-48 flex flex-col items-center justify-center text-slate-400 bg-[#2f4968]/40">
              <UploadCloud size={32} className="mb-3 opacity-50" />
              <p className="text-sm">Nenhuma foto adicionada.</p>
              <p className="text-xs opacity-60">Selecione as fotos para aplicar marca d'água e subir pro Cloudflare R2.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {galeria.map((url, index) => {
                const isCapa = url === formData.imagem_url;
                return (
                  <div key={index} className={`relative aspect-square rounded-lg overflow-hidden border-2 group cursor-pointer ${isCapa ? 'border-gold shadow-[0_0_15px_rgba(197,160,89,0.4)]' : 'border-slate-600'}`} onClick={() => !isCapa && definirComoCapa(url)}>
                    <img src={url} alt={`Foto ${index}`} className="w-full h-full object-cover bg-slate-800" />
                    
                    {isCapa && (
                      <div className="absolute bottom-0 left-0 w-full bg-gold text-[#04122b] text-[9px] font-black uppercase tracking-widest text-center py-1">
                        Capa Atual
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                      {!isCapa && (
                        <span className="text-gold flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider hover:scale-110 transition-transform">
                          <Star size={14} className="fill-gold" /> Tornar Capa
                        </span>
                      )}
                      <button type="button" onClick={(e) => { e.stopPropagation(); removerFoto(url); }} className="text-red-400 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider hover:scale-110 transition-transform">
                        <X size={14} /> Remover
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DADOS PRINCIPAIS */}
        <div className="bg-[#2f4968]/60 border border-slate-500/30 p-8 rounded-xl shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 border-b border-slate-500/30 pb-4">Informações Principais</h2>
          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2">Código</label>
              <input type="text" name="codigo" value={formData.codigo} onChange={handleInputChange} placeholder="Ex: CA001" className="w-full bg-[#2f4968]/80 border border-slate-500/40 text-white px-4 py-3 rounded-lg focus:border-gold outline-none text-sm" />
            </div>
            <div className="md:col-span-10">
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2">Título do Anúncio *</label>
              <input required type="text" name="titulo" value={formData.titulo} onChange={handleInputChange} className="w-full bg-[#2f4968]/80 border border-slate-500/40 text-white px-4 py-3 rounded-lg focus:border-gold outline-none text-sm" />
            </div>
            <div className="md:col-span-4">
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2">Finalidade</label>
              <select name="finalidade" value={formData.finalidade} onChange={handleInputChange} className="w-full bg-[#2f4968]/80 border border-slate-500/40 text-slate-200 px-4 py-3 rounded-lg focus:border-gold outline-none text-sm">
                <option value="Venda">Venda</option>
                <option value="Locação">Locação</option>
              </select>
            </div>
            <div className="md:col-span-4">
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2">Tipo de Imóvel</label>
              <select name="tipo" value={formData.tipo} onChange={handleInputChange} className="w-full bg-[#2f4968]/80 border border-slate-500/40 text-slate-200 px-4 py-3 rounded-lg focus:border-gold outline-none text-sm">
                <option value="Casa">Casa</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Terreno">Terreno</option>
                <option value="Comercial">Comercial</option>
                <option value="Chácara">Chácara/Sítio</option>
              </select>
            </div>
            <div className="md:col-span-4">
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2">Preço (R$) *</label>
              <input required type="number" step="0.01" name="preco" value={formData.preco} onChange={handleInputChange} className="w-full bg-[#2f4968]/80 border border-slate-500/40 text-white px-4 py-3 rounded-lg focus:border-gold outline-none text-sm" />
            </div>
          </div>
        </div>

        {/* LOCALIZAÇÃO E CARACTERÍSTICAS */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-[#2f4968]/60 border border-slate-500/30 p-8 rounded-xl shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 border-b border-slate-500/30 pb-4 flex items-center gap-2"><MapPin size={16} className="text-gold"/> Localização</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2">Cidade *</label>
                <input required type="text" name="cidade" value={formData.cidade} onChange={handleInputChange} className="w-full bg-[#2f4968]/80 border border-slate-500/40 text-white px-4 py-3 rounded-lg focus:border-gold outline-none text-sm" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2">Bairro</label>
                <input type="text" name="bairro" value={formData.bairro} onChange={handleInputChange} className="w-full bg-[#2f4968]/80 border border-slate-500/40 text-white px-4 py-3 rounded-lg focus:border-gold outline-none text-sm" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2">Endereço Completo</label>
                <input type="text" name="endereco" value={formData.endereco} onChange={handleInputChange} className="w-full bg-[#2f4968]/80 border border-slate-500/40 text-white px-4 py-3 rounded-lg focus:border-gold outline-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2">Latitude</label>
                  <input type="text" name="latitude" value={formData.latitude} onChange={handleInputChange} placeholder="-26.230..." className="w-full bg-[#2f4968]/80 border border-slate-500/40 text-white px-4 py-3 rounded-lg focus:border-gold outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2">Longitude</label>
                  <input type="text" name="longitude" value={formData.longitude} onChange={handleInputChange} placeholder="-51.085..." className="w-full bg-[#2f4968]/80 border border-slate-500/40 text-white px-4 py-3 rounded-lg focus:border-gold outline-none text-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#2f4968]/60 border border-slate-500/30 p-8 rounded-xl shadow-xl flex flex-col">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 border-b border-slate-500/30 pb-4">Características</h2>
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2">Área (m²)</label>
                <input type="number" name="area" value={formData.area} onChange={handleInputChange} className="w-full bg-[#2f4968]/80 border border-slate-500/40 text-white px-4 py-3 rounded-lg focus:border-gold outline-none text-sm" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2">Quartos</label>
                <input type="number" name="quartos" value={formData.quartos} onChange={handleInputChange} className="w-full bg-[#2f4968]/80 border border-slate-500/40 text-white px-4 py-3 rounded-lg focus:border-gold outline-none text-sm" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2">Banheiros</label>
                <input type="number" name="banheiros" value={formData.banheiros} onChange={handleInputChange} className="w-full bg-[#2f4968]/80 border border-slate-500/40 text-white px-4 py-3 rounded-lg focus:border-gold outline-none text-sm" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2">Vagas de Garagem</label>
                <input type="number" name="vagas" value={formData.vagas} onChange={handleInputChange} className="w-full bg-[#2f4968]/80 border border-slate-500/40 text-white px-4 py-3 rounded-lg focus:border-gold outline-none text-sm" />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-500/30 flex gap-8">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="destaque" checked={formData.destaque} onChange={handleInputChange} className="w-5 h-5 accent-gold cursor-pointer" />
                <span className="text-sm font-bold text-gold uppercase tracking-widest">Imóvel Destaque</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="ativo" checked={formData.ativo} onChange={handleInputChange} className="w-5 h-5 accent-green-500 cursor-pointer" />
                <span className="text-sm text-slate-300 uppercase tracking-widest">Anúncio Ativo</span>
              </label>
            </div>
          </div>
        </div>

        {/* CONTROLE DE STATUS */}
        <div className="bg-[#2f4968]/60 border border-slate-500/30 p-8 rounded-xl shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 border-b border-slate-500/30 pb-4">Status do Imóvel</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="status" 
                value="disponivel" 
                checked={formData.status === 'disponivel'} 
                onChange={handleInputChange} 
                className="w-5 h-5 accent-green-500 cursor-pointer" 
              />
              <div>
                <span className="text-sm font-bold text-green-400 uppercase tracking-widest block">Disponível</span>
                <span className="text-xs text-slate-400">Imóvel ativo para venda/aluguel</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="status" 
                value="reservado" 
                checked={formData.status === 'reservado'} 
                onChange={handleInputChange} 
                className="w-5 h-5 accent-yellow-500 cursor-pointer" 
              />
              <div>
                <span className="text-sm font-bold text-yellow-400 uppercase tracking-widest block">Reservado</span>
                <span className="text-xs text-slate-400">Em negociação</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="status" 
                value="vendido" 
                checked={formData.status === 'vendido'} 
                onChange={handleInputChange} 
                className="w-5 h-5 accent-red-500 cursor-pointer" 
              />
              <div>
                <span className="text-sm font-bold text-red-400 uppercase tracking-widest block">Vendido</span>
                <span className="text-xs text-slate-400">Transação concluída</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="status" 
                value="alugado" 
                checked={formData.status === 'alugado'} 
                onChange={handleInputChange} 
                className="w-5 h-5 accent-blue-500 cursor-pointer" 
              />
              <div>
                <span className="text-sm font-bold text-blue-400 uppercase tracking-widest block">Alugado</span>
                <span className="text-xs text-slate-400">Contrato ativo</span>
              </div>
            </label>
          </div>
        </div>

        {/* DESCRIÇÃO */}
        <div className="bg-[#2f4968]/60 border border-slate-500/30 p-8 rounded-xl shadow-xl">
          <label className="block text-sm font-bold text-white uppercase tracking-widest mb-6 border-b border-slate-500/30 pb-4">Descrição Completa</label>
          <textarea name="descricao" rows={8} value={formData.descricao} onChange={handleInputChange} placeholder="Descreva os detalhes, diferenciais e acabamentos do imóvel..." className="w-full bg-[#2f4968]/80 border border-slate-500/40 text-white px-6 py-4 rounded-lg focus:border-gold outline-none resize-none text-sm"></textarea>
        </div>

        {/* AÇÕES FINAIS */}
        <div className="sticky bottom-4 bg-[#04122b]/90 backdrop-blur-xl border border-gold/30 p-4 rounded-xl flex justify-between items-center shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50">
          <button type="button" onClick={() => router.back()} className="text-slate-400 hover:text-white px-6 py-3 text-xs uppercase tracking-widest font-bold transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="bg-gold text-[#04122b] px-10 py-4 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-gold-light transition-colors shadow-[0_0_15px_rgba(197,160,89,0.3)] flex items-center gap-2">
            {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {salvando ? 'Atualizando Banco...' : 'Salvar Alterações'}
          </button>
        </div>

      </form>
    </div>
  );
}