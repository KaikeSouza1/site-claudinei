// app/imovel/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Bed, Bath, Car, Maximize, Phone, Mail, Star, HomeIcon, ChevronLeft, ChevronRight, X, Heart, Share2, Calendar, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ImovelPage() {
  const { id } = useParams();
  const router = useRouter();
  const [imovel, setImovel] = useState<any>(null);
  const [galeria, setGaleria] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [fotoAtual, setFotoAtual] = useState(0);
  const [modalAberto, setModalAberto] = useState(false);
  const [favoritado, setFavoritado] = useState(false);

  useEffect(() => {
    carregarImovel();
  }, [id]);

  async function carregarImovel() {
    setCarregando(true);

    // Busca dados do imóvel
    const { data: imovelData, error: imovelError } = await supabase
      .from('imoveis')
      .select('*')
      .eq('id', id)
      .eq('ativo', true) // Só mostra imóveis ativos
      .single();

    if (imovelError || !imovelData) {
      router.push('/');
      return;
    }

    setImovel(imovelData);

    // Busca fotos da galeria
    const { data: fotosData } = await supabase
      .from('imovel_fotos')
      .select('url')
      .eq('imovel_id', id);

    const fotosUrls = fotosData ? fotosData.map(f => f.url) : [];
    const galeriaCompleta = new Set([
      ...(imovelData.imagem_url ? [imovelData.imagem_url] : []),
      ...fotosUrls
    ]);
    setGaleria(Array.from(galeriaCompleta));

    setCarregando(false);
  }

  const formatarPreco = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const proximaFoto = () => {
    setFotoAtual((prev) => (prev + 1) % galeria.length);
  };

  const fotoAnterior = () => {
    setFotoAtual((prev) => (prev - 1 + galeria.length) % galeria.length);
  };

  const abrirModal = (index: number) => {
    setFotoAtual(index);
    setModalAberto(true);
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-blue-600"
        >
          <HomeIcon size={64} />
        </motion.div>
      </div>
    );
  }

  if (!imovel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-slate-600 text-xl">Imóvel não encontrado</div>
      </div>
    );
  }

  return (
    <main className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen">
      {/* HEADER FLUTUANTE */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-3 text-slate-600 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium uppercase tracking-widest">Voltar</span>
            </Link>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setFavoritado(!favoritado)}
                className={`p-2 rounded-full transition-colors ${
                  favoritado ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                <Heart size={20} fill={favoritado ? 'currentColor' : 'none'} />
              </button>
              <button className="p-2 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="pt-20">
        {/* GALERIA PRINCIPAL */}
        {galeria.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative mb-12"
          >
            <div className="relative h-[60vh] md:h-[70vh] overflow-hidden rounded-b-3xl shadow-2xl">
              <img
                src={galeria[fotoAtual]}
                alt={`Foto principal ${fotoAtual + 1}`}
                className="w-full h-full object-cover"
              />

              {/* OVERLAY COM CONTROLES */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex gap-2">
                      {galeria.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setFotoAtual(index)}
                          className={`w-3 h-3 rounded-full transition-all ${
                            index === fotoAtual ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={fotoAnterior}
                        className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={proximaFoto}
                        className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                      >
                        <ChevronRight size={24} />
                      </button>
                      <button
                        onClick={() => abrirModal(fotoAtual)}
                        className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                      >
                        <Maximize size={24} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MINIATURAS */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="flex gap-2 bg-white/95 backdrop-blur-sm rounded-2xl p-2 shadow-lg">
                {galeria.slice(0, 5).map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setFotoAtual(index)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      index === fotoAtual ? 'border-blue-500 scale-110' : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <img src={url} alt={`Miniatura ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
                {galeria.length > 5 && (
                  <button
                    onClick={() => abrirModal(0)}
                    className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-medium hover:bg-slate-200 transition-colors"
                  >
                    +{galeria.length - 5}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <div className="max-w-7xl mx-auto px-6 md:px-10 pb-20">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* CONTEÚDO PRINCIPAL */}
            <div className="lg:col-span-2 space-y-12">
              {/* CABEÇALHO */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200/50"
              >
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 text-sm font-bold uppercase tracking-widest rounded-full shadow-lg">
                    {imovel.finalidade}
                  </span>
                  <span className="bg-slate-100 text-slate-700 px-4 py-2 text-sm font-bold uppercase tracking-widest rounded-full">
                    {imovel.tipo}
                  </span>
                  {imovel.status && imovel.status !== 'disponivel' && (
                    <span className={`px-4 py-2 text-sm font-bold uppercase tracking-widest rounded-full shadow-lg ${
                      imovel.status === 'vendido' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
                      imovel.status === 'alugado' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                      imovel.status === 'reservado' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black' :
                      'bg-slate-500 text-white'
                    }`}>
                      {imovel.status}
                    </span>
                  )}
                  {imovel.destaque && (
                    <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-4 py-2 text-sm font-bold uppercase tracking-widest rounded-full shadow-lg flex items-center gap-2">
                      <Star size={14} fill="currentColor" />
                      Destaque
                    </span>
                  )}
                </div>

                <h1 className="font-serif text-4xl md:text-5xl text-slate-900 mb-4 leading-tight">
                  {imovel.titulo}
                </h1>

                <div className="flex items-center gap-3 text-slate-600 mb-8">
                  <MapPin size={20} className="text-blue-600" />
                  <span className="text-lg">{imovel.endereco}, {imovel.bairro} - {imovel.cidade}</span>
                </div>

                <div className="flex items-baseline gap-4">
                  <div className="font-serif text-5xl text-blue-600 font-bold">
                    {formatarPreco(imovel.preco)}
                  </div>
                  {imovel.finalidade === 'Locacao' && (
                    <div className="text-slate-500 text-lg">/mês</div>
                  )}
                </div>
              </motion.div>

              {/* CARACTERÍSTICAS */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200/50"
              >
                <h2 className="text-2xl font-serif text-slate-900 mb-8 flex items-center gap-3">
                  <Award className="text-blue-600" />
                  Características do Imóvel
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {imovel.quartos > 0 && (
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200/50">
                      <Bed size={32} className="text-blue-600 mx-auto mb-3" />
                      <p className="text-3xl font-serif text-slate-900 font-bold">{imovel.quartos}</p>
                      <p className="text-sm text-slate-600 uppercase tracking-widest">Quartos</p>
                    </div>
                  )}

                  {imovel.banheiros > 0 && (
                    <div className="text-center p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl border border-cyan-200/50">
                      <Bath size={32} className="text-cyan-600 mx-auto mb-3" />
                      <p className="text-3xl font-serif text-slate-900 font-bold">{imovel.banheiros}</p>
                      <p className="text-sm text-slate-600 uppercase tracking-widest">Banheiros</p>
                    </div>
                  )}

                  {imovel.vagas > 0 && (
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200/50">
                      <Car size={32} className="text-green-600 mx-auto mb-3" />
                      <p className="text-3xl font-serif text-slate-900 font-bold">{imovel.vagas}</p>
                      <p className="text-sm text-slate-600 uppercase tracking-widest">Vagas</p>
                    </div>
                  )}

                  {imovel.area > 0 && (
                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200/50">
                      <Maximize size={32} className="text-purple-600 mx-auto mb-3" />
                      <p className="text-3xl font-serif text-slate-900 font-bold">{imovel.area}</p>
                      <p className="text-sm text-slate-600 uppercase tracking-widest">Área m²</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* LOCALIZAÇÃO DETALHADA */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200/50"
              >
                <h2 className="text-2xl font-serif text-slate-900 mb-6 flex items-center gap-3">
                  <MapPin className="text-blue-600" />
                  Localização
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <MapPin size={20} className="text-slate-500" />
                    <div>
                      <p className="text-slate-900 font-medium">Endereço</p>
                      <p className="text-slate-600">{imovel.endereco}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-slate-900 font-medium">Bairro</p>
                        <p className="text-slate-600">{imovel.bairro}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-slate-900 font-medium">Cidade</p>
                        <p className="text-slate-600">{imovel.cidade}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* SIDEBAR DE CONTATO */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="sticky top-24"
              >
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl p-8 shadow-2xl border border-blue-500/20">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-serif text-white mb-2">Interessado?</h3>
                    <p className="text-blue-100">Entre em contato agora mesmo</p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-white text-blue-600 py-4 text-lg font-bold uppercase tracking-widest hover:bg-blue-50 transition-colors flex items-center justify-center gap-3 rounded-xl shadow-lg"
                    >
                      <Phone size={20} />
                      Ligar Agora
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full border-2 border-white/30 text-white py-4 text-lg font-bold uppercase tracking-widest hover:bg-white/10 hover:border-white/50 transition-colors flex items-center justify-center gap-3 rounded-xl"
                    >
                      <Mail size={20} />
                      Enviar Mensagem
                    </motion.button>
                  </div>

                  <div className="border-t border-white/20 pt-6">
                    <div className="text-center">
                      <p className="text-blue-100 text-sm mb-2">Código do imóvel</p>
                      <p className="text-white font-mono text-lg font-bold">{imovel.codigo || `IMV${imovel.id}`}</p>
                    </div>
                  </div>
                </div>

                {/* INFORMAÇÕES ADICIONAIS */}
                <div className="mt-6 bg-white rounded-3xl p-6 shadow-xl border border-slate-200/50">
                  <h4 className="text-lg font-serif text-slate-900 mb-4 flex items-center gap-2">
                    <Calendar className="text-blue-600" />
                    Detalhes
                  </h4>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Finalidade:</span>
                      <span className="text-slate-900 font-medium">{imovel.finalidade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tipo:</span>
                      <span className="text-slate-900 font-medium">{imovel.tipo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status:</span>
                      <span className="text-slate-900 font-medium capitalize">{imovel.status || 'Disponível'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE GALERIA */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setModalAberto(false)}
          >
            <div className="relative max-w-6xl max-h-screen p-4" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setModalAberto(false)}
                className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-colors"
              >
                <X size={32} />
              </button>

              <img
                src={galeria[fotoAtual]}
                alt={`Foto ${fotoAtual + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />

              <div className="absolute inset-y-0 left-0 flex items-center">
                <button
                  onClick={fotoAnterior}
                  className="text-white hover:text-slate-300 transition-colors p-4"
                >
                  <ChevronLeft size={48} />
                </button>
              </div>

              <div className="absolute inset-y-0 right-0 flex items-center">
                <button
                  onClick={proximaFoto}
                  className="text-white hover:text-slate-300 transition-colors p-4"
                >
                  <ChevronRight size={48} />
                </button>
              </div>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {galeria.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setFotoAtual(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === fotoAtual ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}