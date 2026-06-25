'use client'

import { useCallback, useRef, useState } from 'react';
import { Save, Loader2, UploadCloud, X, Star, MapPin, ChevronLeft, ChevronRight, Crop } from 'lucide-react';
import Cropper, { Area } from 'react-easy-crop';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type GaleriaItem = {
  id: string;
  url: string;
  file?: File;
  editedFile?: File;
};

type CropState = {
  x: number;
  y: number;
  outputWidth: number;
  zoom: number;
  rotation: number;
};

function gerarId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function NovoImovel() {
  const router = useRouter();
  
  const [salvando, setSalvando] = useState(false);

  const [formData, setFormData] = useState({
    codigo: '', titulo: '', descricao: '', preco: '', tipo: 'Casa', finalidade: 'Venda',
    cidade: '', bairro: '', endereco: '', latitude: '', longitude: '',
    quartos: 0, banheiros: 0, vagas: 0, area: 0, imagem_url: '', destaque: true, ativo: true, status: 'disponivel',
  });

  const [galeria, setGaleria] = useState<GaleriaItem[]>([]);
  const [uploadingGaleria, setUploadingGaleria] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<GaleriaItem | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState('');
  const [cropState, setCropState] = useState<CropState>({ x: 0, y: 0, outputWidth: 1200, zoom: 1, rotation: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [editingUploading, setEditingUploading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ==========================================
  // UPLOAD DE VÁRIAS FOTOS EM LOTE
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
          const novaGaleria = [...prev, ...result.urls.map((url: string) => ({ id: gerarId(), url }))];
          if (!formData.imagem_url && novaGaleria.length > 0) {
            setFormData(prevForm => ({ ...prevForm, imagem_url: novaGaleria[0].url }));
          }
          return novaGaleria;
        });
      } else {
         alert("Erro: " + result.error);
      }
    } catch (error) {
      alert("Erro ao enviar para o servidor.");
    }
    
    setUploadingGaleria(false);
  };

  const moverFoto = (index: number, delta: number) => {
    setGaleria((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const abrirEditor = async (item: GaleriaItem) => {
    try {
      setEditItem(item);
      const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(item.url)}`);
      if (!response.ok) {
        throw new Error('Não foi possível carregar a imagem para edição');
      }
      const blob = await response.blob();
      const previewUrl = URL.createObjectURL(blob);
      setEditPreviewUrl(previewUrl);
      setCropState({ x: 0, y: 0, outputWidth: 1200, zoom: 1, rotation: 0 });
      setCroppedAreaPixels(null);
      setEditModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('Não foi possível abrir o editor de imagem.');
    }
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const fecharEditor = () => {
    setEditModalOpen(false);
    setEditItem(null);
    setCropState({ x: 0, y: 0, outputWidth: 1200, zoom: 1, rotation: 0 });
    if (editPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(editPreviewUrl);
    }
    setEditPreviewUrl('');
    setEditingUploading(false);
  };

  const ajustarCrop = (field: 'zoom' | 'rotation' | 'outputWidth', value: number) => {
    setCropState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  const aplicarEdicao = async () => {
    if (!editItem || !canvasRef.current) return;
    if (editingUploading) return;

    if (!croppedAreaPixels) {
      return alert('Selecione uma área para cortar.');
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = editPreviewUrl;
    await img.decode();

    const { width: cropWidth, height: cropHeight, x, y } = croppedAreaPixels;
    const outputWidth = cropState.outputWidth;
    const outputHeight = Math.round((cropHeight / cropWidth) * outputWidth);

    canvas.width = outputWidth;
    canvas.height = outputHeight;
    ctx.clearRect(0, 0, outputWidth, outputHeight);
    ctx.drawImage(img, x, y, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
    if (!blob) {
      return alert('Não foi possível gerar a imagem editada.');
    }

    const file = new File([blob], `imovel-edit-${editItem.id}.webp`, { type: 'image/webp' });
    const data = new FormData();
    data.append('file', file);

    setEditingUploading(true);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: data });
      const result = await res.json();
      if (!res.ok || !result.urls?.length) {
        throw new Error(result.error || 'Erro ao enviar imagem editada');
      }

      const novaUrl = result.urls[0];
      setGaleria((prev) => prev.map((item) => item.id === editItem.id ? { ...item, url: novaUrl } : item));
      if (formData.imagem_url === editItem.url) {
        setFormData({ ...formData, imagem_url: novaUrl });
      }
      fecharEditor();
      alert('Imagem editada e enviada com sucesso.');
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar a imagem editada.');
    } finally {
      setEditingUploading(false);
    }
  };

  const definirComoCapa = (url: string) => {
    setFormData({ ...formData, imagem_url: url });
  };

  const removerFoto = (urlParaRemover: string) => {
    const novaGaleria = galeria.filter((item) => item.url !== urlParaRemover);
    if (formData.imagem_url === urlParaRemover) {
      setFormData({ ...formData, imagem_url: novaGaleria[0]?.url || '' });
    }
    setGaleria(novaGaleria);
  };


  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    
    try {
      // Limpa os dados removendo campos que não existem na tabela
      const { galeria: _, ...dadosLimpos } = formData;
      
      const { data: imovelSalvo, error: imovelError } = await supabase
        .from('imoveis')
        .insert([{ 
          ...dadosLimpos, 
          preco: Number(formData.preco),
          latitude: formData.latitude ? Number(formData.latitude) : null,
          longitude: formData.longitude ? Number(formData.longitude) : null,
        }])
        .select()
        .single();

      if (imovelError) throw imovelError;

      const fotosParaGaleria = galeria.map(item => item.url).filter(url => url !== formData.imagem_url);

      if (fotosParaGaleria.length > 0 && imovelSalvo) {
        const fotosInsert = fotosParaGaleria.map(url => ({
          imovel_id: imovelSalvo.id,
          url: url
        }));

        const { error: fotosError } = await supabase.from('imovel_fotos').insert(fotosInsert);
        if (fotosError) throw fotosError;
      }
      
      alert("Imóvel cadastrado com sucesso!");
      router.push('/admin/imoveis');
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar imóvel no banco de dados.");
    } finally {
      setSalvando(false);
    }
  };

  const handleInputChange = (e: any) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-serif text-3xl text-white">Cadastrar Imóvel</h1>
          <p className="text-sm text-slate-400 mt-1">Crie um novo anúncio no seu portfólio.</p>
        </div>
      </div>


      <form onSubmit={handleSalvar} className="space-y-8">
        
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
              {galeria.map((item, index) => {
                const isCapa = item.url === formData.imagem_url;
                return (
                  <div key={item.id} className={`relative aspect-square rounded-lg overflow-hidden border-2 group cursor-pointer ${isCapa ? 'border-gold shadow-[0_0_15px_rgba(197,160,89,0.4)]' : 'border-slate-600'}`} onClick={() => definirComoCapa(item.url)}>
                    <img src={item.url} alt={`Foto ${index}`} className="w-full h-full object-cover" />
                    
                    {isCapa && (
                      <div className="absolute bottom-0 left-0 w-full bg-gold text-[#04122b] text-[9px] font-black uppercase tracking-widest text-center py-1">
                        Capa
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase tracking-widest text-slate-300">#{index + 1}</span>
                        {isCapa && (
                          <div className="text-[10px] font-black uppercase tracking-widest text-gold">Capa</div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={(e) => { e.stopPropagation(); moverFoto(index, -1); }} disabled={index === 0} className="rounded-xl bg-white/10 text-white disabled:opacity-40 px-2 py-2 text-[10px] uppercase tracking-widest">
                          <ChevronLeft size={14} />
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); moverFoto(index, 1); }} disabled={index === galeria.length - 1} className="rounded-xl bg-white/10 text-white disabled:opacity-40 px-2 py-2 text-[10px] uppercase tracking-widest">
                          <ChevronRight size={14} />
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); abrirEditor(item); }} className="rounded-xl bg-gold/10 text-gold px-2 py-2 text-[10px] uppercase tracking-widest">
                          <Crop size={14} /> Editar
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removerFoto(item.url); }} className="rounded-xl bg-red-500/10 text-red-300 px-2 py-2 text-[10px] uppercase tracking-widest">
                          <X size={14} /> Remover
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {editModalOpen && editItem && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-5xl rounded-4xl border border-slate-700/60 bg-[#08111f] shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between gap-4 p-5 border-b border-slate-700/40">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white">Editar Imagem</h3>
                  <p className="text-xs text-slate-400">Cortar e redimensionar antes de salvar.</p>
                </div>
                <button type="button" onClick={fecharEditor} className="text-slate-300 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr] p-5">
                <div className="rounded-3xl bg-[#0d1a2a] p-4 flex items-center justify-center min-h-90">
                  <div className="relative w-full bg-[#061124] overflow-hidden rounded-3xl" style={{ minHeight: '420px' }}>
                    <Cropper
                      image={editPreviewUrl}
                      crop={{ x: cropState.x, y: cropState.y }}
                      zoom={cropState.zoom}
                      rotation={cropState.rotation}
                      aspect={undefined}
                      onCropChange={(crop) => setCropState((prev) => ({ ...prev, x: crop.x, y: crop.y }))}
                      onZoomChange={(zoom) => setCropState((prev) => ({ ...prev, zoom }))}
                      onRotationChange={(rotation) => setCropState((prev) => ({ ...prev, rotation }))}
                      onCropComplete={onCropComplete}
                      objectFit="horizontal-cover"
                      showGrid={false}
                    />
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-700/50 bg-[#081633] p-4">
                    <div className="flex items-center justify-between mb-3 text-xs uppercase tracking-widest text-slate-400">
                      <span>Recorte com o mouse</span>
                      <span className="text-slate-300 text-[11px]">Arraste e redimensione livremente</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[11px] uppercase tracking-widest text-slate-400">Zoom</label>
                        <input
                          type="range"
                          min={1}
                          max={3}
                          step={0.01}
                          value={cropState.zoom}
                          onChange={(e) => ajustarCrop('zoom', Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] uppercase tracking-widest text-slate-400">Rotação</label>
                        <input
                          type="range"
                          min={0}
                          max={360}
                          step={1}
                          value={cropState.rotation}
                          onChange={(e) => ajustarCrop('rotation', Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-700/50 bg-[#081633] p-4">
                    <div className="flex items-center justify-between mb-3 text-xs uppercase tracking-widest text-slate-400">
                      <span>Redimensionar</span>
                      <span>Saída até 1200px</span>
                    </div>
                    <input type="number" value={cropState.outputWidth} min={300} max={1200} onChange={(e) => ajustarCrop('outputWidth', Number(e.target.value))} className="w-full rounded-xl border border-slate-600 bg-[#0f1a2d] px-3 py-2 text-sm text-white outline-none" />
                    <p className="text-[11px] text-slate-500 mt-2">A proporção final será calculada automaticamente.</p>
                  </div>

                  <div className="grid gap-3">
                    <button type="button" onClick={aplicarEdicao} disabled={editingUploading} className="w-full rounded-2xl bg-gold px-4 py-3 text-sm font-bold uppercase tracking-widest text-[#04122b] transition hover:bg-gold/90 disabled:opacity-50">
                      {editingUploading ? 'Aplicando...' : 'Aplicar Corte e Redimensionar'}
                    </button>
                    <button type="button" onClick={fecharEditor} className="w-full rounded-2xl border border-slate-500/50 bg-[#12243a] px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-200 transition hover:bg-[#1c3351]">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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

        <div className="bg-[#2f4968]/60 border border-slate-500/30 p-8 rounded-xl shadow-xl">
          <label className="block text-sm font-bold text-white uppercase tracking-widest mb-6 border-b border-slate-500/30 pb-4">Descrição Completa</label>
          <textarea name="descricao" rows={8} value={formData.descricao} onChange={handleInputChange} placeholder="Descreva os detalhes, diferenciais e acabamentos do imóvel..." className="w-full bg-[#2f4968]/80 border border-slate-500/40 text-white px-6 py-4 rounded-lg focus:border-gold outline-none resize-none text-sm"></textarea>
        </div>

        <div className="sticky bottom-4 bg-[#04122b]/90 backdrop-blur-xl border border-gold/30 p-4 rounded-xl flex justify-between items-center shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50">
          <button type="button" onClick={() => router.back()} className="text-slate-400 hover:text-white px-6 py-3 text-xs uppercase tracking-widest font-bold transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="bg-gold text-[#04122b] px-10 py-4 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-gold-light transition-colors shadow-[0_0_15px_rgba(197,160,89,0.3)] flex items-center gap-2">
            {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {salvando ? 'Salvando no Banco...' : 'Publicar Imóvel'}
          </button>
        </div>

      </form>
    </div>
  );
}