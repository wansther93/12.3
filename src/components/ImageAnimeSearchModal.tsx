import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Search,
  Link2,
  Film,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plus,
  Tv,
  Camera,
  Loader2
} from 'lucide-react';
import {
  searchAnimeByImageFile,
  searchAnimeByImageUrl,
  formatTime,
  TraceMoeMatch,
} from '../services/traceMoeService';

interface ImageAnimeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnimeForAdd?: (animeTitle: string) => void;
  onOpenDetails?: (animeTitle: string) => void;
}

export const ImageAnimeSearchModal: React.FC<ImageAnimeSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectAnimeForAdd,
  onOpenDetails,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TraceMoeMatch[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suporte a colar print da área de transferência (Ctrl + V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP).');
      return;
    }

    setSelectedFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSearch = async () => {
    setError(null);
    setResults([]);

    if (activeTab === 'upload') {
      if (!selectedFile) {
        setError('Por favor, selecione ou cole uma imagem para pesquisar.');
        return;
      }
      setLoading(true);
      try {
        const matches = await searchAnimeByImageFile(selectedFile);
        if (matches.length === 0) {
          setError('Nenhum anime correspondente foi encontrado para esta imagem.');
        } else {
          setResults(matches);
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao identificar anime por imagem.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!imageUrlInput.trim()) {
        setError('Por favor, digite ou cole a URL direta de uma imagem.');
        return;
      }
      setLoading(true);
      try {
        const matches = await searchAnimeByImageUrl(imageUrlInput.trim());
        if (matches.length === 0) {
          setError('Nenhum anime correspondente foi encontrado para esta URL.');
        } else {
          setResults(matches);
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao identificar anime pela URL informada.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopyInfo = (match: TraceMoeMatch, index: number) => {
    const title = match.title?.romaji || match.title?.english || match.filename;
    const text = `Anime: ${title} | Episódio: ${match.episode || 'N/A'} | Minuto: ${formatTime(match.from)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-black border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Compacto e Minimalista */}
        <div className="px-4 sm:px-5 py-3 border-b border-white/[0.08] flex items-center justify-between bg-black shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Identificar Cena por Imagem</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  trace.moe
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Descubra o anime, episódio e minuto exato da cena
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body com Scroll Suave */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 bg-black">
          {/* Alternância de Modo: Upload/Print vs URL */}
          <div className="flex gap-1.5 p-1 bg-white/[0.03] border border-white/10 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('upload');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Enviar Imagem ou Colar (Ctrl+V)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('url');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Link URL</span>
            </button>
          </div>

          {/* Área de Seleção de Imagem */}
          {activeTab === 'upload' ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-purple-500 bg-purple-500/10 scale-[0.99]'
                  : selectedImagePreview
                  ? 'border-purple-500/40 bg-white/[0.02] hover:border-purple-400'
                  : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />

              {selectedImagePreview ? (
                <div className="space-y-2.5">
                  <div className="relative inline-block max-h-40 rounded-xl overflow-hidden border border-white/15 shadow-xl">
                    <img
                      src={selectedImagePreview}
                      alt="Preview da cena"
                      className="max-h-40 w-auto object-contain mx-auto"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                      Trocar Imagem
                    </div>
                  </div>
                  <p className="text-[11px] text-purple-300 font-medium">
                    {selectedFile?.name} • Clique para trocar ou aperte Ctrl+V
                  </p>
                </div>
              ) : (
                <div className="space-y-2 py-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">
                    Arraste uma captura ou clique para selecionar
                  </h4>
                  <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                    Você pode tirar um print e apertar <strong className="text-purple-300">Ctrl + V</strong> aqui mesmo!
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block px-0.5">
                URL Direta da Imagem
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://exemplo.com/cena.jpg"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-purple-500 outline-none font-medium"
                />
              </div>
            </div>
          )}

          {/* Botão de Busca */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              id="btn-search-trace-moe"
              onClick={handleSearch}
              disabled={loading || (activeTab === 'upload' && !selectedFile) || (activeTab === 'url' && !imageUrlInput.trim())}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Analisando frames da cena...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Identificar Cena</span>
                </>
              )}
            </button>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Lista de Resultados */}
          {results.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-3 h-3 text-purple-400" />
                  <span>Resultados ({results.length})</span>
                </h4>
                <span className="text-[10px] text-zinc-500">Ordenado por similaridade</span>
              </div>

              <div className="space-y-2.5">
                {results.slice(0, 4).map((match, idx) => {
                  const bestTitle = match.title?.romaji || match.title?.english || match.title?.native || match.filename;
                  const similarityPercent = (match.similarity * 100).toFixed(1);
                  const isHighMatch = match.similarity >= 0.85;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border transition-all ${
                        idx === 0
                          ? 'bg-purple-950/20 border-purple-500/40 shadow-lg'
                          : 'bg-white/[0.02] border-white/10'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Video / Snapshot Preview */}
                        <div className="sm:w-44 shrink-0 space-y-1">
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
                            {match.videoUrl ? (
                              <video
                                src={match.videoUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={match.imageUrl}
                                alt={bestTitle}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                            <span>{formatTime(match.from)}</span>
                            <span>{formatTime(match.to)}</span>
                          </div>
                        </div>

                        {/* Detalhes do Anime */}
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h5 className="text-xs font-black text-white truncate hover:text-purple-300 transition-colors">
                                {bestTitle}
                              </h5>
                              {match.title?.english && match.title.english !== bestTitle && (
                                <p className="text-[11px] text-zinc-400 truncate">
                                  {match.title.english}
                                </p>
                              )}
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 flex items-center gap-1 ${
                                isHighMatch
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>{similarityPercent}%</span>
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 text-[11px] text-zinc-300">
                            <span className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 flex items-center gap-1">
                              <Film className="w-3 h-3 text-purple-400" />
                              <span>Episódio: <strong>{match.episode || 'Filme / Especial'}</strong></span>
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-purple-400" />
                              <span>Momento: <strong>{formatTime(match.from)}</strong></span>
                            </span>
                          </div>

                          {/* Ações Rápidas */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {onSelectAnimeForAdd && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onSelectAnimeForAdd(bestTitle);
                                }}
                                className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Adicionar à Lista</span>
                              </button>
                            )}

                            {onOpenDetails && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onOpenDetails(bestTitle);
                                }}
                                className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Tv className="w-3 h-3 text-purple-400" />
                                <span>Ver Detalhes</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleCopyInfo(match, idx)}
                              className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border border-white/10"
                            >
                              {copiedId === idx ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedId === idx ? 'Copiado!' : 'Copiar'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé Compacto */}
        <div className="px-4 sm:px-5 py-2.5 bg-black border-t border-white/[0.08] flex items-center justify-between shrink-0">
          <span className="text-[10px] text-zinc-500 font-medium">
            trace.moe & AniList
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
