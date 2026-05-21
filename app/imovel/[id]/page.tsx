'use client'

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Bed, Bath, Car, Maximize,
  Star, HomeIcon, ChevronLeft,
  ChevronRight, X, Heart, Share2, Grid3x3
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

/* ── Design tokens — sem dependência de classes Tailwind externas ── */
const C = {
  bg:     '#020b18',
  card:   '#04122b',
  gold:   '#c9a84c',
  goldL:  '#e2c46d',
  b:      'rgba(201,168,76,0.20)',   // border gold
  bs:     'rgba(148,163,184,0.10)',  // border slate
};

/* ── Helpers de componente ── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
      <div style={{ width: 24, height: 1, background: C.gold, flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: C.gold, letterSpacing: '0.18em', textTransform: 'uppercase' as const, fontWeight: 700 }}>
        {children}
      </span>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.bs}`, padding: '20px 12px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8, textAlign: 'center' as const }}>
      {icon}
      <span style={{ fontFamily: 'Georgia,serif', fontSize: 28, color: '#fff', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 10, color: '#475569', letterSpacing: '0.13em', textTransform: 'uppercase' as const }}>{label}</span>
    </div>
  );
}

/* ════════════════════════════════════════
   PÁGINA PRINCIPAL
════════════════════════════════════════ */
export default function ImovelPage() {
  const { id }    = useParams();
  const router    = useRouter();
  const [imovel, setImovel]       = useState<any>(null);
  const [galeria, setGaleria]     = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);
  const [idx, setIdx]             = useState(0);      // índice no modal
  const [modal, setModal]         = useState(false);
  const [fav, setFav]             = useState(false);

  useEffect(() => { load(); }, [id]);

  /* Fecha modal com ESC */
  useEffect(() => {
    if (!modal) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     setModal(false);
      if (e.key === 'ArrowRight') setIdx(p => (p + 1) % galeria.length);
      if (e.key === 'ArrowLeft')  setIdx(p => (p - 1 + galeria.length) % galeria.length);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [modal, galeria.length]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('imoveis').select('*').eq('id', id).eq('ativo', true).single();
    if (error || !data) { router.push('/'); return; }
    setImovel(data);

    const { data: fotos } = await supabase
      .from('imovel_fotos').select('url').eq('imovel_id', id);

    const urls = Array.from(new Set<string>([
      ...(data.imagem_url ? [data.imagem_url] : []),
      ...(fotos?.map((f: any) => f.url) ?? []),
    ]));
    setGaleria(urls);
    setLoading(false);
  }

  const fmt  = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const open = (i: number) => { setIdx(i); setModal(true); };
  const prev = () => setIdx(p => (p - 1 + galeria.length) % galeria.length);
  const next = () => setIdx(p => (p + 1) % galeria.length);

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: '100vh', paddingTop: 96, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ scale: [1,1.1,1], opacity: [0.4,1,0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
        <HomeIcon size={44} color={C.gold} strokeWidth={1.5} />
      </motion.div>
    </div>
  );

  if (!imovel) return (
    <div style={{ minHeight: '100vh', paddingTop: 96, background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <HomeIcon size={56} color="#1e3a5f" />
      <p style={{ color: '#64748b', marginTop: 16, fontSize: 18 }}>Imóvel não encontrado</p>
      <Link href="/" style={{ marginTop: 24, padding: '12px 32px', background: C.gold, color: C.card, fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
        Voltar ao Início
      </Link>
    </div>
  );

  /* ── Grid de fotos (layout igual ao exemplo, mas dark luxury) ── */
  const [f0, ...rest] = galeria;
  const side = rest.slice(0, 4);            // até 4 miniaturas
  const extra = galeria.length - 5;        // fotos além das 5 exibidas
  const codigo = imovel.codigo || `IMV${String(imovel.id ?? '').substring(0, 6).toUpperCase()}`;

  return (
    <main style={{ background: C.bg, minHeight: '100vh', overflowX: 'hidden', paddingTop: 96 }}>

      {/* ════════════════════════
          CONTEÚDO PRINCIPAL
      ════════════════════════ */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* ── TÍTULO + PREÇO (topo, acima das fotos) ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' as const, marginBottom: 24 }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 12 }}>
              <span style={{ background: C.gold, color: C.card, padding: '3px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>{imovel.finalidade}</span>
              <span style={{ border: `1px solid #1e3a5f`, color: '#64748b', padding: '3px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>{imovel.tipo}</span>
              {imovel.destaque && (
                <span style={{ border: `1px solid ${C.b}`, background: 'rgba(201,168,76,0.06)', color: C.gold, padding: '3px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Star size={9} fill={C.gold} color={C.gold} /> Destaque
                </span>
              )}
            </div>
            <h1 style={{ fontFamily: 'Georgia,"Times New Roman",serif', fontSize: 'clamp(24px, 3vw, 40px)', color: '#fff', lineHeight: 1.2, margin: '0 0 10px', fontWeight: 400 }}>
              {imovel.titulo}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#475569', fontSize: 13 }}>
              <MapPin size={13} color={C.gold} style={{ flexShrink: 0 }} />
              <span>{imovel.endereco}{imovel.bairro ? `, ${imovel.bairro}` : ''} — {imovel.cidade}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' as const }}>
            <p style={{ fontSize: 10, color: '#475569', letterSpacing: '0.14em', textTransform: 'uppercase' as const, margin: '0 0 6px' }}>Valor</p>
            <span style={{ fontFamily: 'Georgia,"Times New Roman",serif', fontSize: 'clamp(26px, 3vw, 38px)', color: C.gold, lineHeight: 1, letterSpacing: '-0.01em' }}>
              {fmt(imovel.preco)}
            </span>
            {imovel.finalidade === 'Locacao' && (
              <span style={{ color: '#475569', fontSize: 14, marginLeft: 6 }}>/mês</span>
            )}
          </div>
        </div>

        {/* ════════════════════════
            GRID DE FOTOS
        ════════════════════════ */}
        {galeria.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            {/* Desktop: foto grande + 2x2 */}
            <div style={{ display: 'grid', gridTemplateColumns: galeria.length === 1 ? '1fr' : '1fr 1fr', gridTemplateRows: galeria.length === 1 ? 'auto' : '240px 240px', gap: 4, borderRadius: 2, overflow: 'hidden' }}>

              {/* Foto principal — ocupa 2 linhas à esquerda */}
              <div
                onClick={() => open(0)}
                style={{ gridRow: galeria.length > 1 ? '1 / 3' : '1', position: 'relative', cursor: 'zoom-in', overflow: 'hidden', background: C.card, minHeight: galeria.length === 1 ? 420 : undefined }}
              >
                <img
                  src={f0}
                  alt="Foto principal"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .5s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.03)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
                />
              </div>

              {/* Miniaturas (até 4) */}
              {side.map((url, i) => {
                const isLast = i === 3 && extra > 0;
                return (
                  <div
                    key={i}
                    onClick={() => open(i + 1)}
                    style={{ position: 'relative', cursor: 'zoom-in', overflow: 'hidden', background: C.card }}
                  >
                    <img
                      src={url}
                      alt={`Foto ${i + 2}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .5s ease', filter: isLast ? 'brightness(0.35)' : undefined }}
                      onMouseEnter={e => { if (!isLast) (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
                    />
                    {/* Overlay "+X fotos" na última miniatura */}
                    {isLast && (
                      <div
                        style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 8, pointerEvents: 'none' }}
                      >
                        <Grid3x3 size={22} color={C.gold} />
                        <span style={{ fontFamily: 'Georgia,serif', fontSize: 22, color: '#fff', fontWeight: 400 }}>+{extra + 1}</span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>fotos</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile: carrossel horizontal simples */}
            <div style={{ display: 'none' }} id="mobile-gallery">
              {/* injetado via CSS abaixo */}
            </div>
          </div>
        )}

        {/* ════════════════════════
            GRID: CONTEÚDO + SIDEBAR
        ════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 48, alignItems: 'start' }}>

          {/* ── ESQUERDA ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>

            {/* Visão geral */}
            <div style={{ paddingBottom: 36, borderBottom: `1px solid ${C.bs}`, marginBottom: 36 }}>
              <Label>Visão Geral</Label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
                {imovel.quartos   > 0 && <Stat icon={<Bed      size={20} color={C.gold} />} value={imovel.quartos}      label="Quartos"   />}
                {imovel.banheiros > 0 && <Stat icon={<Bath     size={20} color={C.gold} />} value={imovel.banheiros}    label="Banheiros" />}
                {imovel.vagas     > 0 && <Stat icon={<Car      size={20} color={C.gold} />} value={imovel.vagas}        label="Vagas"     />}
                {imovel.area      > 0 && <Stat icon={<Maximize size={20} color={C.gold} />} value={`${imovel.area}m²`} label="Área"      />}
              </div>
            </div>

            {/* Descrição */}
            {imovel.descricao && (
              <div>
                <Label>Sobre o Imóvel</Label>
                <p style={{ color: '#94a3b8', lineHeight: 1.9, fontSize: 15, margin: 0, fontWeight: 300, whiteSpace: 'pre-line' as const }}>
                  {imovel.descricao}
                </p>
              </div>
            )}
          </motion.div>

          {/* ── SIDEBAR CORRETOR ── */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} style={{ position: 'sticky', top: 80 }}>
            <div style={{ position: 'relative' }}>
              {/* Sombra deslocada */}
              <div style={{ position: 'absolute', right: -7, bottom: -7, width: '100%', height: '100%', border: `1px solid ${C.bs}`, pointerEvents: 'none' }} />

              <div style={{ position: 'relative', background: C.card, border: `1px solid ${C.b}` }}>
                {/* Linha dourada */}
                <div style={{ height: 2, background: `linear-gradient(to right, transparent, ${C.gold}, transparent)` }} />

                <div style={{ padding: '28px 24px' }}>
                  {/* Corretor */}
                  <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', textAlign: 'center' as const, paddingBottom: 24, marginBottom: 24, borderBottom: `1px solid ${C.bs}` }}>
                    <div style={{ width: 88, height: 88, borderRadius: '50%', border: `1px solid ${C.b}`, padding: 3, marginBottom: 14, background: 'rgba(201,168,76,0.05)', flexShrink: 0, overflow: 'hidden' }}>
                      <img
                        src="/foto_claudinei.png"
                        alt="Claudiney"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', borderRadius: '50%', display: 'block' }}
                        onError={e => {
                          const el = e.currentTarget as HTMLImageElement;
                          el.style.display = 'none';
                          const parent = el.parentElement!;
                          parent.innerHTML = '<span style="font-family:Georgia,serif;font-size:26px;color:#c9a84c;display:flex;align-items:center;justify-content:center;width:100%;height:100%;border-radius:50%">CJ</span>';
                        }}
                      />
                    </div>
                    <p style={{ fontFamily: 'Georgia,serif', fontSize: 17, color: '#fff', margin: '0 0 5px' }}>Claudiney W. Otto Junior</p>
                    <p style={{ fontSize: 10, color: '#475569', letterSpacing: '0.13em', textTransform: 'uppercase' as const, margin: '0 0 5px' }}>Corretor e Avaliador de Imóveis</p>
                    <p style={{ fontSize: 10, color: `${C.gold}80`, letterSpacing: '0.11em', textTransform: 'uppercase' as const, margin: 0 }}>CRECI 37016-PR · CNAI 45505</p>
                  </div>

                  {/* Botões */}
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 9, marginBottom: 20 }}>
                    <a
                      href={`https://wa.me/5542984156013?text=${encodeURIComponent(`Olá! Tenho interesse no imóvel: ${imovel.titulo}`)}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: C.gold, color: C.card, padding: '13px 0', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const, textDecoration: 'none', transition: 'background .2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.goldL; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.gold; }}
                    >
                      <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: C.card, flexShrink: 0 }}>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </a>

                  </div>

                  {/* Código */}
                  <div style={{ background: C.bg, border: `1px solid rgba(148,163,184,0.07)`, padding: '13px 15px' }}>
                    {[
                      { k: 'Código', v: codigo, mono: true },
                    ].map((row, i, arr) => (
                      <div key={row.k}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                          <span style={{ fontSize: 10, color: '#1e3a5f', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>{row.k}</span>
                          <span style={{ fontSize: 11, fontFamily: row.mono ? 'monospace' : 'inherit', color: row.mono ? C.gold : '#475569' }}>{row.v}</span>
                        </div>
                        {i < arr.length - 1 && <div style={{ height: 1, background: 'rgba(148,163,184,0.07)', margin: '10px 0' }} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ════════════════════════
          MODAL GALERIA
      ════════════════════════ */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(2,11,24,0.97)', display: 'flex', flexDirection: 'column' as const, backdropFilter: 'blur(16px)' }}
            onClick={() => setModal(false)}
          >
            <div
              style={{ display: 'flex', flexDirection: 'column' as const, height: '100%', padding: '20px 28px' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: 'Georgia,serif', fontSize: 22, color: C.gold }}>{idx + 1}</span>
                  <span style={{ color: '#1e3a5f', fontSize: 13 }}>/ {galeria.length}</span>
                </div>
                <button
                  onClick={() => setModal(false)}
                  style={{ width: 40, height: 40, background: 'transparent', border: `1px solid ${C.bs}`, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.gold; el.style.color = C.gold; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.bs; el.style.color = '#475569'; }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Foto grande */}
              <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={idx}
                    src={galeria[idx]}
                    alt=""
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', userSelect: 'none', display: 'block' }}
                  />
                </AnimatePresence>
                {galeria.length > 1 && (
                  <>
                    <button onClick={prev}
                      style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, background: 'rgba(4,18,43,0.8)', border: `1px solid ${C.b}`, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.gold; el.style.color = C.gold; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.b; el.style.color = '#fff'; }}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button onClick={next}
                      style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, background: 'rgba(4,18,43,0.8)', border: `1px solid ${C.b}`, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.gold; el.style.color = C.gold; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.b; el.style.color = '#fff'; }}
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>

              {/* Miniaturas */}
              <div style={{ height: 68, marginTop: 14, display: 'flex', justifyContent: 'center', gap: 5, overflowX: 'auto', flexShrink: 0, paddingBottom: 2 }}>
                {galeria.map((url, i) => (
                  <button key={i} onClick={() => setIdx(i)}
                    style={{ flexShrink: 0, width: 68, height: '100%', padding: 0, border: i === idx ? `2px solid ${C.gold}` : '2px solid transparent', opacity: i === idx ? 1 : 0.38, cursor: 'pointer', overflow: 'hidden', transition: 'all .2s' }}
                  >
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════
          CSS RESPONSIVO
      ════════════════════════ */}
      <style>{`
        @media (max-width: 768px) {
          /* Grid de conteúdo: 1 coluna no mobile */
          main > div:last-of-type > div:last-of-type {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          /* Sidebar: sai do sticky no mobile */
          main > div:last-of-type > div:last-of-type > div:last-of-type {
            position: static !important;
          }
          /* Grid de fotos: 1 coluna no mobile, altura fixa */
          main > div:last-of-type > div:first-of-type + div {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto !important;
          }
          main > div:last-of-type > div:first-of-type + div > div:first-child {
            grid-row: auto !important;
            min-height: 260px !important;
            height: 260px !important;
          }
          /* Miniaturas: esconde no mobile, o clique na principal já abre o modal */
          main > div:last-of-type > div:first-of-type + div > div:not(:first-child) {
            display: none !important;
          }
        }
      `}</style>
    </main>
  );
}