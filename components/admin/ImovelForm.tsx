'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cropper, { Area } from 'react-easy-crop';
import {
  Save, Loader2, UploadCloud, X, MapPin, Crop, Star, GripVertical,
  Lock, FileText, Trash2, Plus, Video, AlertTriangle, Search,
} from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import FotoCover from '@/components/FotoCover';
import MapaImovel from '@/components/MapaImovel';
import { TIPOS_IMOVEL, CARACTERISTICAS, CATEGORIAS_DOCUMENTO, videoEmbedUrl } from '@/lib/imovel-opcoes';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type GaleriaItem = { id: string; url: string; vertical?: boolean };

type Documento = { id: number; nome: string; categoria: string; mime: string; tamanho: number; criado_em: string };
type DocumentoPendente = { id: string; file: File; categoria: string };

const IMOVEL_VAZIO = {
  codigo: '', titulo: '', descricao: '', preco: '', tipo: 'Casa', finalidade: 'Venda',
  cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  latitude: '', longitude: '',
  area_construida: '', area_terreno: '',
  quartos: '0', suites: '0', banheiros: '0', vagas: '0', pavimentos: '0',
  caracteristicas: [] as string[],
  imagem_url: '', video_url: '',
  aceita_financiamento: false, aceita_fgts: false, aceita_permuta: false, aceita_negociacao: false,
  documentacao_regular: false, ocupacao: '', disponibilidade_visitas: '',
  destaque: true, ativo: true, status: 'disponivel',
};

const INTERNO_VAZIO = {
  matricula: '', inscricao_imobiliaria: '',
  proprietario_nome: '', proprietario_telefone: '', proprietario_email: '', proprietario_cpf: '',
  area_registrada: '', area_averbada: '', iptu_valor: '', iptu_situacao: '',
  possui_financiamento: false, onus: '', financiamento_bancario: false,
  comissao_percentual: '', comissao_valor: '',
  autorizacao_venda: false, autorizacao_validade: '', observacoes: '',
};

type ImovelState = typeof IMOVEL_VAZIO;
type InternoState = typeof INTERNO_VAZIO;

const PROPORCAO_FOTO = 3 / 2;

function gerarId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Preenche o estado do formulário com os valores do banco (null → ''). */
function preencher<T extends Record<string, unknown>>(base: T, dados: Record<string, unknown> | null | undefined): T {
  const out: Record<string, unknown> = { ...base };
  if (!dados) return out as T;
  for (const k of Object.keys(base)) {
    const v = dados[k];
    if (v === null || v === undefined) continue;
    if (typeof base[k] === 'boolean') out[k] = Boolean(v);
    else if (Array.isArray(base[k])) out[k] = Array.isArray(v) ? v : [];
    else out[k] = k.endsWith('_validade') ? String(v).slice(0, 10) : String(v);
  }
  return out as T;
}

const formatarTamanho = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

// ─── Componentes de layout ────────────────────────────────────────────────────

const inputCls = 'w-full bg-[#2f4968]/80 border border-slate-500/40 text-white px-4 py-3 rounded-lg focus:border-gold outline-none text-sm placeholder:text-slate-500';
const labelCls = 'block text-[10px] uppercase tracking-widest text-slate-400 mb-2';

function Secao({ titulo, icone, children, interna }: { titulo: string; icone?: React.ReactNode; children: React.ReactNode; interna?: boolean }) {
  return (
    <div className={`p-6 md:p-8 rounded-xl shadow-xl border ${interna ? 'bg-[#1d2b3c]/80 border-amber-500/30' : 'bg-[#2f4968]/60 border-slate-500/30'}`}>
      <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 border-b border-slate-500/30 pb-4 flex items-center gap-2">
        {icone}{titulo}
      </h2>
      {children}
    </div>
  );
}

function Campo({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function Marcador({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer rounded-lg border px-4 py-3 text-sm transition-colors ${checked ? 'border-gold/60 bg-gold/10 text-white' : 'border-slate-500/30 text-slate-300 hover:border-slate-400/50'}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-gold cursor-pointer" />
      {children}
    </label>
  );
}

// ─── Foto arrastável da galeria ───────────────────────────────────────────────

function FotoArrastavel({ item, index, onCapa, onEditar, onRemover, onOrientacao }: {
  item: GaleriaItem;
  index: number;
  onCapa: () => void;
  onEditar: () => void;
  onRemover: () => void;
  onOrientacao: (img: HTMLImageElement) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const isCapa = index === 0;

  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : undefined }}
      className={`rounded-lg overflow-hidden border-2 bg-[#1d2b3c] ${isDragging ? 'opacity-80 shadow-2xl scale-[1.03]' : ''} ${isCapa ? 'border-gold shadow-[0_0_15px_rgba(197,160,89,0.4)]' : 'border-slate-600'}`}>
      {/* Área de arrastar: a foto inteira */}
      <div {...attributes} {...listeners} className="relative aspect-[3/2] cursor-grab active:cursor-grabbing touch-none select-none" title="Arraste para mudar a ordem">
        <FotoCover src={item.url} alt={`Foto ${index + 1}`} className="w-full h-full pointer-events-none" />
        {/* Detecta a orientação real da foto */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt="" className="hidden" onLoad={(e) => onOrientacao(e.currentTarget)} />
        <span className="absolute top-2 right-2 flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-slate-200">
          <GripVertical size={11} /> {index + 1}
        </span>
        {isCapa && (
          <div className="absolute bottom-0 left-0 w-full bg-gold text-[#04122b] text-[9px] font-black uppercase tracking-widest text-center py-1">Capa</div>
        )}
        {item.vertical && (
          <div className="absolute top-2 left-2 rounded bg-amber-500 text-[#04122b] text-[9px] font-black uppercase tracking-widest px-2 py-0.5">Vertical</div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1 p-1.5">
        <button type="button" onClick={onCapa} disabled={isCapa} title="Tornar capa (vai para o início)"
          className="flex items-center justify-center gap-1 rounded-md bg-white/5 text-slate-200 py-1.5 text-[10px] uppercase hover:bg-gold/20 hover:text-gold disabled:opacity-40 disabled:hover:bg-white/5 disabled:hover:text-slate-200">
          <Star size={12} /> Capa
        </button>
        <button type="button" onClick={onEditar} className="flex items-center justify-center gap-1 rounded-md bg-gold/15 text-gold py-1.5 text-[10px] uppercase hover:bg-gold/25">
          <Crop size={12} /> Editar
        </button>
        <button type="button" onClick={onRemover} className="flex items-center justify-center gap-1 rounded-md bg-red-500/15 text-red-300 py-1.5 text-[10px] uppercase hover:bg-red-500/25">
          <X size={12} /> Tirar
        </button>
      </div>
    </div>
  );
}

// ─── Formulário ───────────────────────────────────────────────────────────────

export default function ImovelForm({ imovelId }: { imovelId?: string }) {
  const router = useRouter();
  const editando = Boolean(imovelId);

  const [carregando, setCarregando] = useState(editando);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<ImovelState>(IMOVEL_VAZIO);
  const [interno, setInterno] = useState<InternoState>(INTERNO_VAZIO);
  const [galeria, setGaleria] = useState<GaleriaItem[]>([]);
  const [uploadingGaleria, setUploadingGaleria] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [localizando, setLocalizando] = useState(false);
  const [precisaoMapa, setPrecisaoMapa] = useState('');
  const [novaCaracteristica, setNovaCaracteristica] = useState('');

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [docsPendentes, setDocsPendentes] = useState<DocumentoPendente[]>([]);
  const [categoriaDoc, setCategoriaDoc] = useState('matricula');
  const [enviandoDoc, setEnviandoDoc] = useState(false);

  // Editor de corte
  const [editItem, setEditItem] = useState<GaleriaItem | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [aplicandoCorte, setAplicandoCorte] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const set = <K extends keyof ImovelState>(campo: K, valor: ImovelState[K]) => setForm((f) => ({ ...f, [campo]: valor }));
  const setInt = <K extends keyof InternoState>(campo: K, valor: InternoState[K]) => setInterno((f) => ({ ...f, [campo]: valor }));

  // ── Carregar imóvel existente ──
  useEffect(() => {
    if (!imovelId) return;
    (async () => {
      const res = await fetch(`/api/admin/imoveis/${imovelId}`).catch(() => null);
      const dados = res?.ok ? await res.json() : null;
      if (!dados) {
        alert('Erro ao carregar os dados do imóvel.');
        router.push('/admin/imoveis');
        return;
      }
      setForm(preencher(IMOVEL_VAZIO, dados));
      setInterno(preencher(INTERNO_VAZIO, dados.interno));
      setDocumentos(dados.documentos ?? []);
      const urls = Array.from(new Set<string>([...(dados.imagem_url ? [dados.imagem_url] : []), ...(dados.fotos ?? [])]));
      setGaleria(urls.map((url) => ({ id: gerarId(), url })));
      setCarregando(false);
    })();
  }, [imovelId, router]);

  // ── Fotos ──
  const handleUploadGaleria = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingGaleria(true);

    const data = new FormData();
    Array.from(files).forEach((file) => data.append('file', file));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: data });
      const result = await res.json();
      if (result.urls) {
        const novos: GaleriaItem[] = result.urls.map((url: string) => ({ id: gerarId(), url }));
        setGaleria((prev) => [...prev, ...novos]);
      } else {
        alert('Erro: ' + result.error);
      }
    } catch {
      alert('Erro ao enviar para o servidor.');
    }
    setUploadingGaleria(false);
    e.target.value = '';
  };

  const marcarOrientacao = (id: string, img: HTMLImageElement) => {
    const vertical = img.naturalHeight > img.naturalWidth;
    setGaleria((prev) => prev.map((g) => (g.id === id && g.vertical !== vertical ? { ...g, vertical } : g)));
  };

  // A primeira foto da galeria é sempre a capa
  useEffect(() => {
    const capa = galeria[0]?.url || '';
    setForm((f) => (f.imagem_url === capa ? f : { ...f, imagem_url: capa }));
  }, [galeria]);

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),        // mouse: arrasta após 6px
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }), // celular: segurar e arrastar (rolagem continua normal)
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const aoSoltarFoto = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setGaleria((prev) => arrayMove(
      prev,
      prev.findIndex((g) => g.id === active.id),
      prev.findIndex((g) => g.id === over.id),
    ));
  };

  const tornarCapa = (item: GaleriaItem) =>
    setGaleria((prev) => [item, ...prev.filter((g) => g.id !== item.id)]);

  const removerFoto = (item: GaleriaItem) => setGaleria((prev) => prev.filter((g) => g.id !== item.id));

  const abrirEditor = async (item: GaleriaItem) => {
    try {
      const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(item.url)}`);
      if (!response.ok) throw new Error('Não foi possível carregar a imagem para edição');
      setEditPreviewUrl(URL.createObjectURL(await response.blob()));
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setEditItem(item);
    } catch (err) {
      console.error(err);
      alert('Não foi possível abrir o editor de imagem.');
    }
  };

  const fecharEditor = () => {
    if (editPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(editPreviewUrl);
    setEditPreviewUrl('');
    setEditItem(null);
    setAplicandoCorte(false);
  };

  const onCropComplete = useCallback((_: Area, pixels: Area) => setCroppedAreaPixels(pixels), []);

  const aplicarCorte = async () => {
    if (!editItem || !canvasRef.current || !croppedAreaPixels || aplicandoCorte) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = editPreviewUrl;
    await img.decode();

    const { width, height, x, y } = croppedAreaPixels;
    const outW = Math.min(1500, Math.round(width));
    const outH = Math.round(outW / PROPORCAO_FOTO);
    canvasRef.current.width = outW;
    canvasRef.current.height = outH;
    ctx.drawImage(img, x, y, width, height, 0, 0, outW, outH);

    const blob = await new Promise<Blob | null>((resolve) => canvasRef.current!.toBlob(resolve, 'image/webp', 0.9));
    if (!blob) return alert('Não foi possível gerar a imagem editada.');

    const data = new FormData();
    data.append('file', new File([blob], `imovel-edit-${editItem.id}.webp`, { type: 'image/webp' }));
    data.append('marca', '0'); // a foto original já tem marca d'água

    setAplicandoCorte(true);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: data });
      const result = await res.json();
      if (!res.ok || !result.urls?.length) throw new Error(result.error || 'Erro ao enviar imagem editada');
      const novaUrl = result.urls[0];
      setGaleria((prev) => prev.map((g) => (g.id === editItem.id ? { id: g.id, url: novaUrl, vertical: false } : g)));
      fecharEditor();
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar a imagem editada.');
      setAplicandoCorte(false);
    }
  };

  // ── CEP (ViaCEP) ──
  const buscarCep = async (valor: string) => {
    const cep = valor.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await res.json();
      if (d.erro) {
        alert('CEP não encontrado.');
      } else {
        const novo = {
          ...form,
          cep: `${cep.slice(0, 5)}-${cep.slice(5)}`,
          endereco: d.logradouro || form.endereco,
          bairro: d.bairro || form.bairro,
          cidade: d.localidade || form.cidade,
          estado: d.uf || form.estado,
        };
        setForm(novo);
        localizar(novo); // já posiciona o mapa no endereço do CEP
      }
    } catch {
      alert('Não foi possível consultar o CEP agora.');
    }
    setBuscandoCep(false);
  };

  // ── Mapa (OpenStreetMap) ──
  const localizar = async (endereco = form) => {
    if (!endereco.cidade) return alert('Preencha ao menos a cidade.');
    setLocalizando(true);
    try {
      const res = await fetch('/api/admin/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endereco: endereco.endereco, numero: endereco.numero, bairro: endereco.bairro,
          cidade: endereco.cidade, estado: endereco.estado, cep: endereco.cep,
        }),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error);
      setForm((f) => ({ ...f, latitude: r.lat.toFixed(7), longitude: r.lng.toFixed(7) }));
      setPrecisaoMapa(r.precisao === 'endereço' ? '' : `Localizado pelo(a) ${r.precisao}. Arraste o marcador até o ponto exato.`);
    } catch (err) {
      alert((err as Error).message || 'Não foi possível localizar o endereço.');
    }
    setLocalizando(false);
  };

  const lat = parseFloat(form.latitude);
  const lng = parseFloat(form.longitude);
  const temCoordenadas = Number.isFinite(lat) && Number.isFinite(lng);

  // ── Características ──
  const alternarCaracteristica = (c: string) =>
    set('caracteristicas', form.caracteristicas.includes(c)
      ? form.caracteristicas.filter((x) => x !== c)
      : [...form.caracteristicas, c]);

  const adicionarCaracteristica = () => {
    const c = novaCaracteristica.trim();
    if (c && !form.caracteristicas.some((x) => x.toLowerCase() === c.toLowerCase())) {
      set('caracteristicas', [...form.caracteristicas, c]);
    }
    setNovaCaracteristica('');
  };
  const extras = form.caracteristicas.filter((c) => !(CARACTERISTICAS as readonly string[]).includes(c));

  // ── Documentos ──
  const enviarDocumento = async (id: string | number, file: File, categoria: string) => {
    const data = new FormData();
    data.append('file', file);
    data.append('categoria', categoria);
    const res = await fetch(`/api/admin/imoveis/${id}/documentos`, { method: 'POST', body: data });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao enviar documento');
    return result as Documento;
  };

  const handleDocumentos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const grandes = files.filter((f) => f.size > 4 * 1024 * 1024);
    if (grandes.length) alert(`Arquivo acima de 4 MB não pode ser enviado:\n${grandes.map((f) => f.name).join('\n')}`);
    const validos = files.filter((f) => f.size <= 4 * 1024 * 1024);
    if (validos.length === 0) return;

    // Imóvel novo ainda não tem id: os arquivos ficam na fila e sobem ao publicar.
    if (!imovelId) {
      setDocsPendentes((prev) => [...prev, ...validos.map((file) => ({ id: gerarId(), file, categoria: categoriaDoc }))]);
      return;
    }

    setEnviandoDoc(true);
    for (const file of validos) {
      try {
        const doc = await enviarDocumento(imovelId, file, categoriaDoc);
        setDocumentos((prev) => [doc, ...prev]);
      } catch (err) {
        alert(`${file.name}: ${(err as Error).message}`);
      }
    }
    setEnviandoDoc(false);
  };

  const excluirDocumento = async (doc: Documento) => {
    if (!window.confirm(`Excluir o documento "${doc.nome}"?`)) return;
    const res = await fetch(`/api/admin/documentos/${doc.id}`, { method: 'DELETE' });
    if (res.ok) setDocumentos((prev) => prev.filter((d) => d.id !== doc.id));
    else alert('Erro ao excluir o documento.');
  };

  // ── Salvar ──
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const res = await fetch(editando ? `/api/admin/imoveis/${imovelId}` : '/api/admin/imoveis', {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, galeria: galeria.map((g) => g.url), interno }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao salvar imóvel');

      const falhas: string[] = [];
      for (const pend of docsPendentes) {
        try { await enviarDocumento(result.id, pend.file, pend.categoria); }
        catch (err) { falhas.push(`${pend.file.name}: ${(err as Error).message}`); }
      }
      if (falhas.length) alert(`Imóvel salvo, mas alguns documentos não subiram:\n${falhas.join('\n')}`);
      else alert(editando ? 'Imóvel atualizado com sucesso!' : `Imóvel cadastrado com sucesso! Código: ${result.codigo}`);

      router.push('/admin/imoveis');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar o imóvel no banco de dados.');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  const embed = videoEmbedUrl(form.video_url);
  const verticais = galeria.filter((g) => g.vertical).length;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-white">{editando ? 'Editar Imóvel' : 'Cadastrar Imóvel'}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {editando ? `Código ${form.codigo || '—'}` : 'Crie um novo anúncio no seu portfólio.'}
        </p>
      </div>

      <form onSubmit={handleSalvar} className="space-y-8">

        {/* ── FOTOS E VÍDEO ── */}
        <div className="bg-[#2f4968]/60 border border-slate-500/30 p-6 md:p-8 rounded-xl shadow-xl">
          <div className="flex flex-wrap gap-4 justify-between items-center mb-4 border-b border-slate-500/30 pb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Fotos do Imóvel (Capa e Galeria)</h2>
            <label className="cursor-pointer bg-gold text-[#04122b] px-6 py-2 rounded-lg text-xs font-bold uppercase hover:bg-gold-light transition-colors flex items-center gap-2">
              {uploadingGaleria ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
              {uploadingGaleria ? 'Enviando...' : 'Adicionar Fotos'}
              <input type="file" multiple className="hidden" accept="image/*" onChange={handleUploadGaleria} />
            </label>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            <strong className="text-slate-200">Arraste as fotos</strong> para mudar a ordem (no celular, segure e arraste). A <strong className="text-slate-200">primeira foto é a capa</strong>.
            Use fotos horizontais, de preferência em 3:2. Em &quot;Editar&quot; o corte já sai em 3:2.
          </p>

          {verticais > 0 && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <AlertTriangle size={16} className="shrink-0" />
              {verticais === 1 ? '1 foto está na vertical.' : `${verticais} fotos estão na vertical.`} Recorte em 3:2 pelo botão Editar para manter a galeria uniforme.
            </div>
          )}

          {galeria.length === 0 ? (
            <div className="border-2 border-dashed border-slate-500/40 rounded-xl h-48 flex flex-col items-center justify-center text-slate-400 bg-[#2f4968]/40">
              <UploadCloud size={32} className="mb-3 opacity-50" />
              <p className="text-sm">Nenhuma foto adicionada.</p>
              <p className="text-xs opacity-60">As fotos recebem marca d&apos;água e vão para o Cloudflare R2.</p>
            </div>
          ) : (
            <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={aoSoltarFoto}>
              <SortableContext items={galeria.map((g) => g.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {galeria.map((item, index) => (
                    <FotoArrastavel key={item.id} item={item} index={index}
                      onCapa={() => tornarCapa(item)}
                      onEditar={() => abrirEditor(item)}
                      onRemover={() => removerFoto(item)}
                      onOrientacao={(img) => marcarOrientacao(item.id, img)} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <div className="mt-8 pt-6 border-t border-slate-500/30 grid md:grid-cols-2 gap-6 items-start">
            <Campo label="Vídeo (link do YouTube ou Vimeo)">
              <div className="relative">
                <Video size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" />
                <input type="url" value={form.video_url} onChange={(e) => set('video_url', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className={`${inputCls} pl-11`} />
              </div>
              {form.video_url && !embed && <p className="text-xs text-amber-300 mt-2">Link não reconhecido. Use um link do YouTube ou do Vimeo.</p>}
            </Campo>
            {embed && (
              <div className="aspect-video rounded-lg overflow-hidden border border-slate-600">
                <iframe src={embed} title="Vídeo do imóvel" className="w-full h-full" allow="encrypted-media; picture-in-picture" allowFullScreen />
              </div>
            )}
          </div>
        </div>

        {/* ── INFORMAÇÕES PRINCIPAIS ── */}
        <Secao titulo="Informações Principais">
          <div className="grid md:grid-cols-12 gap-6">
            <Campo label="Código" className="md:col-span-3">
              <input type="text" value={form.codigo} onChange={(e) => set('codigo', e.target.value.toUpperCase())} placeholder={editando ? '' : 'Automático'} className={inputCls} />
              {!editando && <p className="text-[11px] text-slate-500 mt-1.5">Deixe vazio para gerar (ex.: CASA01).</p>}
            </Campo>
            <Campo label="Título do Anúncio *" className="md:col-span-9">
              <input required type="text" value={form.titulo} onChange={(e) => set('titulo', e.target.value)} className={inputCls} />
              {/R\$\s*\d/.test(form.titulo) && (
                <p className="text-[11px] text-amber-300 mt-1.5">O valor já aparece ao lado do título no site. Tire o preço daqui para não ficar repetido.</p>
              )}
            </Campo>
            <Campo label="Tipo do Imóvel" className="md:col-span-4">
              <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)} className={inputCls}>
                {TIPOS_IMOVEL.map((t) => <option key={t} value={t}>{t}</option>)}
                {!(TIPOS_IMOVEL as readonly string[]).includes(form.tipo) && <option value={form.tipo}>{form.tipo}</option>}
              </select>
            </Campo>
            <Campo label="Finalidade" className="md:col-span-4">
              <select value={form.finalidade} onChange={(e) => set('finalidade', e.target.value)} className={inputCls}>
                <option value="Venda">Venda</option>
                <option value="Locação">Locação</option>
              </select>
            </Campo>
            <Campo label="Valor (R$) *" className="md:col-span-4">
              <input required type="number" step="0.01" min="0" value={form.preco} onChange={(e) => set('preco', e.target.value)} className={inputCls} />
            </Campo>
          </div>
        </Secao>

        {/* ── LOCALIZAÇÃO ── */}
        <Secao titulo="Localização" icone={<MapPin size={16} className="text-gold" />}>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="grid grid-cols-6 gap-4 content-start">
              <Campo label="CEP" className="col-span-6 sm:col-span-2">
                <div className="relative">
                  <input type="text" inputMode="numeric" value={form.cep} placeholder="00000-000"
                    onChange={(e) => { set('cep', e.target.value); if (e.target.value.replace(/\D/g, '').length === 8) buscarCep(e.target.value); }}
                    className={`${inputCls} pr-10`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {buscandoCep ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  </span>
                </div>
              </Campo>
              <Campo label="Endereço (rua)" className="col-span-6 sm:col-span-4">
                <input type="text" value={form.endereco} onChange={(e) => set('endereco', e.target.value)} className={inputCls} />
              </Campo>
              <Campo label="Número" className="col-span-2">
                <input type="text" value={form.numero} onChange={(e) => set('numero', e.target.value)} className={inputCls} />
              </Campo>
              <Campo label="Complemento" className="col-span-4">
                <input type="text" value={form.complemento} onChange={(e) => set('complemento', e.target.value)} placeholder="Apto, bloco, lote..." className={inputCls} />
              </Campo>
              <Campo label="Bairro" className="col-span-6 sm:col-span-3">
                <input type="text" value={form.bairro} onChange={(e) => set('bairro', e.target.value)} className={inputCls} />
              </Campo>
              <Campo label="Cidade *" className="col-span-4 sm:col-span-2">
                <input required type="text" value={form.cidade} onChange={(e) => set('cidade', e.target.value)} className={inputCls} />
              </Campo>
              <Campo label="UF" className="col-span-2 sm:col-span-1">
                <input type="text" maxLength={2} value={form.estado} onChange={(e) => set('estado', e.target.value.toUpperCase())} className={inputCls} />
              </Campo>
              <Campo label="Latitude (opcional)" className="col-span-3">
                <input type="text" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder="-26.230..." className={inputCls} />
              </Campo>
              <Campo label="Longitude (opcional)" className="col-span-3">
                <input type="text" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="-51.085..." className={inputCls} />
              </Campo>
              <div className="col-span-6 flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => localizar()} disabled={localizando}
                  className="flex items-center gap-2 rounded-lg border border-gold/50 px-4 py-2 text-xs font-bold uppercase text-gold hover:bg-gold/10 disabled:opacity-50">
                  {localizando ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                  Localizar pelo endereço
                </button>
                <p className="text-[11px] text-slate-500 flex-1 min-w-48">
                  {precisaoMapa || 'Clique no mapa ou arraste o marcador para ajustar o ponto exato.'}
                </p>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden border border-slate-600 min-h-80 bg-[#1d2b3c]">
              {temCoordenadas
                ? <MapaImovel lat={lat} lng={lng} className="w-full h-80 lg:h-full lg:min-h-80"
                    onChange={(la, ln) => { setForm((f) => ({ ...f, latitude: la.toFixed(7), longitude: ln.toFixed(7) })); setPrecisaoMapa(''); }} />
                : <div className="h-full min-h-80 flex items-center justify-center text-center px-6 text-sm text-slate-500">
                    Preencha o CEP ou clique em &quot;Localizar pelo endereço&quot; para ver o mapa.<br />Ao salvar sem localizar, o sistema localiza sozinho.
                  </div>}
            </div>
          </div>
        </Secao>

        {/* ── DADOS PRINCIPAIS ── */}
        <Secao titulo="Características do Imóvel — Dados Principais">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Campo label="Área construída (m²)" className="col-span-2 md:col-span-2 lg:col-span-1">
              <input type="number" step="0.01" min="0" value={form.area_construida} onChange={(e) => set('area_construida', e.target.value)} className={inputCls} />
            </Campo>
            <Campo label="Área do terreno (m²)" className="col-span-2 md:col-span-2 lg:col-span-1">
              <input type="number" step="0.01" min="0" value={form.area_terreno} onChange={(e) => set('area_terreno', e.target.value)} className={inputCls} />
            </Campo>
            {([['quartos', 'Quartos'], ['suites', 'Suítes'], ['banheiros', 'Banheiros'], ['vagas', 'Vagas'], ['pavimentos', 'Pavimentos']] as const).map(([campo, label]) => (
              <Campo key={campo} label={label}>
                <input type="number" min="0" value={form[campo]} onChange={(e) => set(campo, e.target.value)} className={inputCls} />
              </Campo>
            ))}
          </div>
        </Secao>

        {/* ── CARACTERÍSTICAS DETALHADAS ── */}
        <Secao titulo="Características Detalhadas">
          <p className="text-xs text-slate-400 mb-4">Marque só o que realmente existe no imóvel.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...CARACTERISTICAS, ...extras].map((c) => (
              <Marcador key={c} checked={form.caracteristicas.includes(c)} onChange={() => alternarCaracteristica(c)}>{c}</Marcador>
            ))}
          </div>
          <div className="mt-4 flex gap-2 max-w-md">
            <input type="text" value={novaCaracteristica} onChange={(e) => setNovaCaracteristica(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarCaracteristica(); } }}
              placeholder="Outra característica..." className={inputCls} />
            <button type="button" onClick={adicionarCaracteristica} className="shrink-0 flex items-center gap-1 rounded-lg border border-gold/50 px-4 text-xs font-bold uppercase text-gold hover:bg-gold/10">
              <Plus size={14} /> Incluir
            </button>
          </div>
        </Secao>

        {/* ── CONDIÇÕES COMERCIAIS ── */}
        <Secao titulo="Condições Comerciais">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Marcador checked={form.aceita_financiamento} onChange={(v) => set('aceita_financiamento', v)}>Aceita financiamento</Marcador>
            <Marcador checked={form.aceita_fgts} onChange={(v) => set('aceita_fgts', v)}>Aceita FGTS</Marcador>
            <Marcador checked={form.aceita_permuta} onChange={(v) => set('aceita_permuta', v)}>Aceita permuta</Marcador>
            <Marcador checked={form.aceita_negociacao} onChange={(v) => set('aceita_negociacao', v)}>Possibilidade de negociação</Marcador>
            <Marcador checked={form.documentacao_regular} onChange={(v) => set('documentacao_regular', v)}>Documentação regular (confirmada)</Marcador>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <Campo label="Ocupação">
              <select value={form.ocupacao} onChange={(e) => set('ocupacao', e.target.value)} className={inputCls}>
                <option value="">Não informar</option>
                <option value="desocupado">Desocupado</option>
                <option value="ocupado">Ocupado</option>
              </select>
            </Campo>
            <Campo label="Disponibilidade para visitas" className="md:col-span-2">
              <input type="text" value={form.disponibilidade_visitas} onChange={(e) => set('disponibilidade_visitas', e.target.value)} placeholder="Ex.: Segunda a sábado, com agendamento" className={inputCls} />
            </Campo>
          </div>
          <p className="text-[11px] text-slate-500 mt-4">
            &quot;Aceita financiamento&quot; e &quot;Documentação regular&quot; aparecem como selo no site. Marque só quando estiver confirmado.
          </p>
        </Secao>

        {/* ── STATUS E PUBLICAÇÃO ── */}
        <Secao titulo="Status e Publicação">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([
              ['disponivel', 'Disponível', 'text-green-400', 'accent-green-500'],
              ['reservado', 'Reservado', 'text-yellow-400', 'accent-yellow-500'],
              ['vendido', 'Vendido', 'text-red-400', 'accent-red-500'],
              ['alugado', 'Alugado', 'text-blue-400', 'accent-blue-500'],
            ] as const).map(([valor, label, cor, accent]) => (
              <label key={valor} className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="status" value={valor} checked={form.status === valor} onChange={() => set('status', valor)} className={`w-5 h-5 cursor-pointer ${accent}`} />
                <span className={`text-sm font-bold uppercase tracking-widest ${cor}`}>{label}</span>
              </label>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-500/30 flex flex-wrap gap-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.destaque} onChange={(e) => set('destaque', e.target.checked)} className="w-5 h-5 accent-gold cursor-pointer" />
              <span className="text-sm font-bold text-gold uppercase tracking-widest">Imóvel Destaque</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.ativo} onChange={(e) => set('ativo', e.target.checked)} className="w-5 h-5 accent-green-500 cursor-pointer" />
              <span className="text-sm text-slate-300 uppercase tracking-widest">Anúncio Ativo</span>
            </label>
          </div>
        </Secao>

        {/* ── DESCRIÇÃO ── */}
        <Secao titulo="Descrição Completa">
          <textarea rows={8} value={form.descricao} onChange={(e) => set('descricao', e.target.value)} placeholder="Descreva os detalhes, diferenciais e acabamentos do imóvel..." className={`${inputCls} resize-none px-6 py-4`} />
        </Secao>

        {/* ── ÁREA ADMINISTRATIVA (INTERNA) ── */}
        <Secao interna titulo="Área Administrativa — não aparece no site" icone={<Lock size={16} className="text-amber-400" />}>
          <div className="space-y-8">
            <div className="grid md:grid-cols-4 gap-4">
              <Campo label="Matrícula" className="md:col-span-2"><input type="text" value={interno.matricula} onChange={(e) => setInt('matricula', e.target.value)} className={inputCls} /></Campo>
              <Campo label="Inscrição imobiliária" className="md:col-span-2"><input type="text" value={interno.inscricao_imobiliaria} onChange={(e) => setInt('inscricao_imobiliaria', e.target.value)} className={inputCls} /></Campo>
              <Campo label="Área registrada (m²)"><input type="number" step="0.01" min="0" value={interno.area_registrada} onChange={(e) => setInt('area_registrada', e.target.value)} className={inputCls} /></Campo>
              <Campo label="Área construída averbada (m²)"><input type="number" step="0.01" min="0" value={interno.area_averbada} onChange={(e) => setInt('area_averbada', e.target.value)} className={inputCls} /></Campo>
              <Campo label="IPTU anual (R$)"><input type="number" step="0.01" min="0" value={interno.iptu_valor} onChange={(e) => setInt('iptu_valor', e.target.value)} className={inputCls} /></Campo>
              <Campo label="Situação do IPTU"><input type="text" value={interno.iptu_situacao} onChange={(e) => setInt('iptu_situacao', e.target.value)} placeholder="Em dia, em atraso..." className={inputCls} /></Campo>
            </div>

            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-amber-300 mb-4">Proprietário</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <Campo label="Nome" className="md:col-span-2"><input type="text" value={interno.proprietario_nome} onChange={(e) => setInt('proprietario_nome', e.target.value)} className={inputCls} /></Campo>
                <Campo label="CPF / CNPJ"><input type="text" value={interno.proprietario_cpf} onChange={(e) => setInt('proprietario_cpf', e.target.value)} className={inputCls} /></Campo>
                <Campo label="Telefone"><input type="text" value={interno.proprietario_telefone} onChange={(e) => setInt('proprietario_telefone', e.target.value)} className={inputCls} /></Campo>
                <Campo label="E-mail" className="md:col-span-2"><input type="email" value={interno.proprietario_email} onChange={(e) => setInt('proprietario_email', e.target.value)} className={inputCls} /></Campo>
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-amber-300 mb-4">Situação documental e financeira</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <Marcador checked={interno.possui_financiamento} onChange={(v) => setInt('possui_financiamento', v)}>Imóvel possui financiamento em aberto</Marcador>
                <Marcador checked={interno.financiamento_bancario} onChange={(v) => setInt('financiamento_bancario', v)}>Possibilidade de financiamento bancário</Marcador>
              </div>
              <Campo label="Ônus (penhora, hipoteca, usufruto...)" className="mt-4">
                <textarea rows={2} value={interno.onus} onChange={(e) => setInt('onus', e.target.value)} placeholder="Deixe vazio se não houver" className={`${inputCls} resize-none`} />
              </Campo>
            </div>

            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-amber-300 mb-4">Comissão e autorização</h3>
              <div className="grid md:grid-cols-4 gap-4 items-end">
                <Campo label="Comissão (%)"><input type="number" step="0.01" min="0" max="100" value={interno.comissao_percentual} onChange={(e) => setInt('comissao_percentual', e.target.value)} className={inputCls} /></Campo>
                <Campo label="Comissão (R$)"><input type="number" step="0.01" min="0" value={interno.comissao_valor} onChange={(e) => setInt('comissao_valor', e.target.value)} className={inputCls} /></Campo>
                <Marcador checked={interno.autorizacao_venda} onChange={(v) => setInt('autorizacao_venda', v)}>Autorização de venda assinada</Marcador>
                <Campo label="Validade da autorização"><input type="date" value={interno.autorizacao_validade} onChange={(e) => setInt('autorizacao_validade', e.target.value)} className={inputCls} /></Campo>
              </div>
            </div>

            <Campo label="Observações internas">
              <textarea rows={4} value={interno.observacoes} onChange={(e) => setInt('observacoes', e.target.value)} className={`${inputCls} resize-none`} />
            </Campo>

            {/* Documentos */}
            <div>
              <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-amber-300">Documentos (PDF ou imagem, até 4 MB)</h3>
                <div className="flex gap-2">
                  <select value={categoriaDoc} onChange={(e) => setCategoriaDoc(e.target.value)} className={`${inputCls} py-2 w-auto`}>
                    {CATEGORIAS_DOCUMENTO.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <label className="cursor-pointer shrink-0 bg-amber-500 text-[#04122b] px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 hover:bg-amber-400">
                    {enviandoDoc ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                    Anexar
                    <input type="file" multiple className="hidden" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={handleDocumentos} />
                  </label>
                </div>
              </div>

              {documentos.length === 0 && docsPendentes.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum documento anexado.</p>
              ) : (
                <ul className="divide-y divide-slate-600/40 rounded-lg border border-slate-600/40">
                  {docsPendentes.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                      <FileText size={16} className="text-slate-400 shrink-0" />
                      <span className="flex-1 truncate text-slate-200">{d.file.name}</span>
                      <span className="text-[11px] text-slate-400">{CATEGORIAS_DOCUMENTO.find((c) => c.value === d.categoria)?.label}</span>
                      <span className="text-[11px] text-amber-300">sobe ao publicar</span>
                      <button type="button" onClick={() => setDocsPendentes((p) => p.filter((x) => x.id !== d.id))} className="text-slate-400 hover:text-red-400"><X size={16} /></button>
                    </li>
                  ))}
                  {documentos.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                      <FileText size={16} className="text-amber-400 shrink-0" />
                      <a href={`/api/admin/documentos/${d.id}`} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-slate-100 hover:text-gold underline-offset-2 hover:underline">{d.nome}</a>
                      <span className="text-[11px] text-slate-400">{CATEGORIAS_DOCUMENTO.find((c) => c.value === d.categoria)?.label ?? d.categoria}</span>
                      <span className="text-[11px] text-slate-500">{formatarTamanho(d.tamanho)}</span>
                      <button type="button" onClick={() => excluirDocumento(d)} className="text-slate-400 hover:text-red-400" title="Excluir"><Trash2 size={16} /></button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Secao>

        <div className="sticky bottom-4 bg-[#04122b]/90 backdrop-blur-xl border border-gold/30 p-4 rounded-xl flex justify-between items-center shadow-[0_0_40px_rgba(0,0,0,0.8)] z-40">
          <button type="button" onClick={() => router.back()} className="text-slate-400 hover:text-white px-6 py-3 text-xs uppercase tracking-widest font-bold transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="bg-gold text-[#04122b] px-10 py-4 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-gold-light transition-colors shadow-[0_0_15px_rgba(197,160,89,0.3)] flex items-center gap-2 disabled:opacity-60">
            {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Publicar Imóvel'}
          </button>
        </div>
      </form>

      {/* ── EDITOR DE CORTE (3:2) ── */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl rounded-3xl border border-slate-700/60 bg-[#08111f] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-4 p-5 border-b border-slate-700/40">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">Recortar foto em 3:2</h3>
                <p className="text-xs text-slate-400">Arraste para posicionar e use o zoom para enquadrar.</p>
              </div>
              <button type="button" onClick={fecharEditor} className="text-slate-300 hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr] p-5">
              <div className="relative w-full bg-[#061124] overflow-hidden rounded-2xl" style={{ minHeight: 420 }}>
                <Cropper
                  image={editPreviewUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={PROPORCAO_FOTO}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  showGrid
                />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-700/50 bg-[#081633] p-4">
                  <label className="text-[11px] uppercase tracking-widest text-slate-400">Zoom</label>
                  <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" />
                  <p className="text-[11px] text-slate-500 mt-3">A foto sai em 3:2, com até 1500 px de largura.</p>
                </div>
                <button type="button" onClick={aplicarCorte} disabled={aplicandoCorte} className="w-full rounded-2xl bg-gold px-4 py-3 text-sm font-bold uppercase tracking-widest text-[#04122b] transition hover:bg-gold/90 disabled:opacity-50">
                  {aplicandoCorte ? 'Aplicando...' : 'Aplicar Corte'}
                </button>
                <button type="button" onClick={fecharEditor} className="w-full rounded-2xl border border-slate-500/50 bg-[#12243a] px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-200 transition hover:bg-[#1c3351]">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
