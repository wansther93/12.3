import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Crown,
  Trophy,
  Award,
  Star,
  Clock,
  Film,
  ShieldCheck,
  BarChart2,
  Tv,
  BookOpen,
  Sparkles,
  Share2,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import type { Anime } from '../types';
import type { UserProfile } from '../services/profileService';
import { isDeveloperEmail } from '../services/profileService';
import { calculateUserAchievements, getAnimeWatchedEpisodes } from '../services/achievementService';
import { BADGE_IMAGE_MAP, getBadgeImageUrl } from '../assets/achievementAssets';

export interface SocialCardGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  animes: Anime[];
  userProfile: UserProfile | null;
  userName: string;
  avatarUrl?: string;
  unlockedAchievementsCount?: number;
  initialCardType?: CardType;
}

export type CardType = 'top5' | 'stats' | 'watching' | 'achievements';

/**
 * Converte qualquer URL de imagem externa para Data URL (Base64) em memória
 * para que o html-to-image renderize com 100% de confiabilidade e zero bloqueio CORS.
 */
async function preloadToDataUrl(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || url);
        reader.onerror = () => resolve(url);
        reader.readAsDataURL(blob);
      });
    }
  } catch {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const blob = await res.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string) || url);
          reader.onerror = () => resolve(url);
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      // Fallback para URL original
    }
  }
  return url;
}

export const SocialCardGeneratorModal: React.FC<SocialCardGeneratorModalProps> = ({
  isOpen,
  onClose,
  animes,
  userProfile,
  userName,
  avatarUrl,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados com URLs protegidas para injeção sem CORS
  const [safeBannerUrl, setSafeBannerUrl] = useState<string>('');
  const [safeAvatarUrl, setSafeAvatarUrl] = useState<string>('');
  const [safeCoverMap, setSafeCoverMap] = useState<Record<string, string>>({});
  const [isPreloading, setIsPreloading] = useState(true);

  // Verificação de privilégios de Admin
  const isDevAdmin = useMemo(() => {
    return isDeveloperEmail(userProfile?.email);
  }, [userProfile?.email]);

  // Estatísticas completas da jornada
  const stats = useMemo(() => {
    const totalEps = animes.reduce((acc, a) => acc + getAnimeWatchedEpisodes(a), 0);
    const totalHours = Math.round((totalEps * 24) / 60);
    const days = Math.floor(totalHours / 24);
    const remHours = totalHours % 24;
    const formattedTime = days > 0 ? `${days}d ${remHours}h` : `${totalHours}h`;

    const ratedAnimes = animes.filter((a) => typeof a.rating === 'number' && a.rating > 0);
    const meanScore =
      ratedAnimes.length > 0
        ? (ratedAnimes.reduce((sum, a) => sum + (a.rating || 0), 0) / ratedAnimes.length).toFixed(1)
        : '0.0';

    const completedCount = animes.filter((a) => a.status === 'completed').length;
    const watchingCount = animes.filter((a) => a.status === 'watching').length;
    const totalCount = animes.length;

    return {
      totalEps,
      formattedTime,
      meanScore,
      completedCount,
      watchingCount,
      totalCount,
    };
  }, [animes]);

  // Top 5 Animes Favoritos (mesma lógica oficial da tela de perfil)
  const top5Animes = useMemo(() => {
    const ids =
      (userProfile as any)?.top5AnimeIds ||
      userProfile?.favoriteAnimeIds ||
      [];
    const list: (Anime | null)[] = [null, null, null, null, null];

    ids.slice(0, 5).forEach((id: string, index: number) => {
      const found = animes.find((a) => a.id === id);
      if (found) list[index] = found;
    });

    if (list.every((item) => item === null) && animes.length > 0) {
      const sorted = [...animes]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);
      sorted.forEach((item, index) => {
        list[index] = item;
      });
    }

    return list;
  }, [userProfile, animes]);

  // Pódio Olímpico ordenado exatamente como no perfil: 4º, 2º, 1º (centro), 3º, 5º
  const podiumSlots = useMemo(() => {
    return [
      {
        rank: 4,
        label: '4º',
        anime: top5Animes[3],
        scale: 'scale-90',
        badgeBg: 'bg-white/10 text-slate-300 border-white/10',
        borderClass: 'border-white/15',
      },
      {
        rank: 2,
        label: '2º',
        anime: top5Animes[1],
        scale: 'scale-95',
        badgeBg: 'bg-slate-300/20 text-slate-200 border-slate-300/40',
        borderClass: 'border-slate-300/50 shadow-md shadow-slate-300/10',
      },
      {
        rank: 1,
        label: '1º',
        anime: top5Animes[0],
        scale: 'scale-105 z-10',
        isFirst: true,
        badgeBg: 'bg-amber-400 text-slate-950 font-black border-amber-300',
        borderClass: 'border-amber-400 shadow-xl shadow-amber-500/25 ring-2 ring-amber-400/40',
      },
      {
        rank: 3,
        label: '3º',
        anime: top5Animes[2],
        scale: 'scale-95',
        badgeBg: 'bg-amber-700/30 text-amber-300 border-amber-600/40',
        borderClass: 'border-amber-600/50 shadow-md shadow-amber-600/10',
      },
      {
        rank: 5,
        label: '5º',
        anime: top5Animes[4],
        scale: 'scale-90',
        badgeBg: 'bg-white/10 text-slate-300 border-white/10',
        borderClass: 'border-white/15',
      },
    ];
  }, [top5Animes]);

  // 5 Insígnias em Destaque (mesma lógica oficial da tela de perfil)
  const slotBadges = useMemo(() => {
    const result = calculateUserAchievements(animes, userProfile?.email);
    const calculated = result.achievements;
    const featured = userProfile?.featuredBadges || [];

    return [0, 1, 2, 3, 4].map((index) => {
      const badgeId = featured[index];
      if (!badgeId) return null;
      const ach = calculated.find((a) => a.id === badgeId);
      return ach || null;
    });
  }, [animes, userProfile]);

  // Cores de brilho por tier de insígnia
  const getBadgeToneColor = (tier?: string) => {
    switch (tier) {
      case 'diamond':
        return { border: '#38BDF8', glow: 'rgba(56, 189, 248, 0.45)' };
      case 'platinum':
        return { border: '#C084FC', glow: 'rgba(192, 132, 252, 0.45)' };
      case 'gold':
        return { border: '#FACC15', glow: 'rgba(250, 204, 21, 0.45)' };
      case 'silver':
        return { border: '#60A5FA', glow: 'rgba(96, 165, 250, 0.45)' };
      default:
        return { border: '#FB923C', glow: 'rgba(251, 146, 60, 0.45)' };
    }
  };

  // Pré-carrega todas as imagens para Data URLs antes da captura para evitar problemas de CORS
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsPreloading(true);

    const runPreload = async () => {
      // 1. Banner
      const rawBanner = userProfile?.customBannerUrl || '';
      if (rawBanner) {
        const loaded = await preloadToDataUrl(rawBanner);
        if (isMounted) setSafeBannerUrl(loaded);
      } else {
        if (isMounted) setSafeBannerUrl('');
      }

      // 2. Avatar
      const rawAvatar = avatarUrl || userProfile?.customAvatarUrl || '';
      if (rawAvatar) {
        const loaded = await preloadToDataUrl(rawAvatar);
        if (isMounted) setSafeAvatarUrl(loaded);
      } else {
        if (isMounted) setSafeAvatarUrl('');
      }

      // 3. Capas do Top 5
      const map: Record<string, string> = {};
      for (const a of top5Animes) {
        if (a && a.coverUrl) {
          map[a.id] = await preloadToDataUrl(a.coverUrl);
        }
      }
      if (isMounted) {
        setSafeCoverMap(map);
        setIsPreloading(false);
      }
    };

    runPreload();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userProfile?.customBannerUrl, userProfile?.customAvatarUrl, avatarUrl, top5Animes]);

  // Função para baixar a imagem em resolução ultra HD 9:16 (1080 x 1920)
  const handleDownloadImage = useCallback(async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    setErrorMessage(null);

    try {
      const exportOptions = {
        skipFonts: true,
        fontEmbedCSS: '',
        cacheBust: true,
        pixelRatio: 2.25, // Gera imagem de ~1080x1920 nítida
        quality: 0.98,
      };

      const dataUrl = await toPng(cardRef.current, exportOptions);

      const cleanNick = (userName || 'otaku').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      const filename = `wanime_perfil_${cleanNick}_stories.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
      setErrorMessage('Não foi possível gerar a imagem automaticamente. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, userName]);

  // Função para copiar a imagem diretamente para a área de transferência
  const handleCopyImage = useCallback(async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    setErrorMessage(null);

    try {
      const exportOptions = {
        skipFonts: true,
        fontEmbedCSS: '',
        cacheBust: true,
        pixelRatio: 2.25,
        quality: 0.98,
      };

      const blob = await toBlob(cardRef.current, exportOptions);

      if (!blob) throw new Error('Falha ao gerar blob de imagem');

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 3000);
      } else {
        // Fallback para download caso a área de transferência não suporte imagens
        await handleDownloadImage();
      }
    } catch (err) {
      console.warn('Erro ao copiar imagem para clipboard:', err);
      // Fallback para download direto
      await handleDownloadImage();
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, handleDownloadImage]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#07070a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header do Modal */}
        <div className="px-4 sm:px-5 py-3 border-b border-white/[0.08] flex items-center justify-between bg-black/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
              <Share2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-2">
                Card do Perfil
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  9:16 Stories
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Visual oficial completo do seu perfil para WhatsApp Status e Instagram
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Modal com Visualizador Centralizado */}
        <div className="p-3 sm:p-5 flex flex-col items-center justify-center bg-black/40 overflow-y-auto max-h-[72vh]">
          {/* Card Preview Container com proporção estrita 9:16 (504px x 896px no DOM de captura) */}
          <div className="relative w-full max-w-[370px] sm:max-w-[400px] shadow-[0_0_50px_rgba(0,0,0,0.9)] rounded-3xl overflow-hidden border border-white/15">
            
            {/* O Elemento Real que é fotografado pelo html-to-image */}
            <div
              ref={cardRef}
              className="w-full bg-[#030305] text-slate-100 flex flex-col relative overflow-hidden select-none"
              style={{
                aspectRatio: '9 / 16',
                minHeight: '640px',
              }}
            >
              {/* Luzes de Ambiente e Atmosfera Cósmica */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-36 bg-amber-500/15 blur-3xl pointer-events-none rounded-full" />
              <div className="absolute bottom-1/4 right-0 w-64 h-40 bg-purple-600/10 blur-3xl pointer-events-none rounded-full" />

              {/* 1. BANNER COM GRADIENTE SUAVE FUNDINDO NO PRETO */}
              <div className="relative w-full aspect-[21/9] max-h-36 overflow-hidden bg-black shrink-0">
                {safeBannerUrl ? (
                  <img
                    src={safeBannerUrl}
                    alt="Banner"
                    className="w-full h-full object-cover object-center brightness-100"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-neutral-950 via-zinc-900 to-neutral-950 flex items-center justify-center text-slate-600 text-xs font-bold" />
                )}

                {/* Sombra suave com degradê cobrindo os 30% inferiores do banner para fundir no preto */}
                <div className="absolute bottom-0 inset-x-0 h-[35%] bg-gradient-to-b from-transparent via-[#030305]/70 to-[#030305] pointer-events-none z-10" />

                {/* Tag de Marca Discreta no Topo Direito do Banner */}
                <div className="absolute top-2.5 right-3 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-bold text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>WAnime List</span>
                </div>
              </div>

              {/* 2. IDENTIDADE DO USUÁRIO INTEGRADA AO BANNER */}
              <div className="px-3.5 pb-2 pt-0.5 relative z-20 shrink-0">
                <div className="flex flex-row items-start gap-3 -mt-9 sm:-mt-10 relative">
                  {/* Avatar Circular com Glow Dourado */}
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.35)]">
                      <div className="w-full h-full rounded-full overflow-hidden bg-black relative">
                        {safeAvatarUrl ? (
                          <img
                            src={safeAvatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-amber-300 font-black text-lg bg-indigo-950">
                            {(userName || 'O').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detalhes do Usuário: @Nick, Tag, Título de Honra e Bio */}
                  <div className="pt-2 min-w-0 flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate drop-shadow-md">
                        @{userName?.replace(/^@/, '') || 'Otaku'}
                      </h1>

                      {isDevAdmin && (
                        <div className="h-5 inline-flex items-center gap-1 px-2 rounded-full bg-purple-500/20 border border-purple-400/50 text-purple-300 text-[8.5px] font-black tracking-wider uppercase shadow-[0_0_8px_rgba(168,85,247,0.3)] shrink-0">
                          <ShieldCheck className="w-3 h-3 text-purple-400" />
                          <span>DEV / ADMIN</span>
                        </div>
                      )}
                    </div>

                    {/* Título de Honra com a Coroa */}
                    <div className="mt-0.5 flex items-center gap-1 text-amber-400 text-[11px] font-bold truncate">
                      <Crown className="w-3 h-3 fill-amber-400 shrink-0" />
                      <span className="truncate">{userProfile?.honoraryTitle || 'Imperador dos Animes'}</span>
                    </div>

                    {/* Biografia Compacta */}
                    <p className="mt-1 text-[10px] text-slate-300 leading-snug line-clamp-2">
                      {userProfile?.publicBio || 'Animes, boas histórias e grandes emoções. Esse é o meu mundo.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. BLOCO DE ESTATÍSTICAS EXPANDIDAS (6 MÉTRICAS NO ESTILO OFICIAL DO PERFIL) */}
              <div className="px-3.5 py-1.5 shrink-0">
                <div className="w-full bg-black/85 border border-white/10 rounded-2xl p-2.5 shadow-xl space-y-1.5">
                  {/* Cabeçalho de Estatísticas */}
                  <div className="flex items-center justify-center gap-1.5 pb-1 border-b border-white/5">
                    <BarChart2 className="w-3 h-3 text-amber-400" />
                    <span className="text-[9.5px] font-bold text-white tracking-wider uppercase">
                      Estatísticas da Coleção
                    </span>
                  </div>

                  {/* Grid de 6 Métricas */}
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    {/* Tempo */}
                    <div className="flex flex-col items-center bg-white/[0.02] rounded-xl py-1 px-0.5 border border-white/[0.04]">
                      <div className="flex items-center gap-1 text-slate-400 text-[9px] font-medium">
                        <Clock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                        <span>Tempo</span>
                      </div>
                      <span className="text-xs sm:text-sm font-black text-white">
                        {stats.formattedTime}
                      </span>
                    </div>

                    {/* Episódios */}
                    <div className="flex flex-col items-center bg-white/[0.02] rounded-xl py-1 px-0.5 border border-white/[0.04]">
                      <div className="flex items-center gap-1 text-slate-400 text-[9px] font-medium">
                        <Film className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                        <span>Episódios</span>
                      </div>
                      <span className="text-xs sm:text-sm font-black text-white">
                        {stats.totalEps.toLocaleString('pt-BR')}
                      </span>
                    </div>

                    {/* Nota Média */}
                    <div className="flex flex-col items-center bg-white/[0.02] rounded-xl py-1 px-0.5 border border-white/[0.04]">
                      <div className="flex items-center gap-1 text-slate-400 text-[9px] font-medium">
                        <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400 shrink-0" />
                        <span>Média</span>
                      </div>
                      <span className="text-xs sm:text-sm font-black text-white">
                        {stats.meanScore}
                      </span>
                    </div>

                    {/* Concluídos */}
                    <div className="flex flex-col items-center bg-white/[0.02] rounded-xl py-1 px-0.5 border border-white/[0.04]">
                      <div className="flex items-center gap-1 text-slate-400 text-[9px] font-medium">
                        <Trophy className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                        <span>Terminados</span>
                      </div>
                      <span className="text-xs sm:text-sm font-black text-white">
                        {stats.completedCount}
                      </span>
                    </div>

                    {/* Assistindo */}
                    <div className="flex flex-col items-center bg-white/[0.02] rounded-xl py-1 px-0.5 border border-white/[0.04]">
                      <div className="flex items-center gap-1 text-slate-400 text-[9px] font-medium">
                        <Tv className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                        <span>Assistindo</span>
                      </div>
                      <span className="text-xs sm:text-sm font-black text-white">
                        {stats.watchingCount}
                      </span>
                    </div>

                    {/* Coleção Total */}
                    <div className="flex flex-col items-center bg-white/[0.02] rounded-xl py-1 px-0.5 border border-white/[0.04]">
                      <div className="flex items-center gap-1 text-slate-400 text-[9px] font-medium">
                        <BookOpen className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                        <span>Coleção</span>
                      </div>
                      <span className="text-xs sm:text-sm font-black text-white">
                        {stats.totalCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. TOP 5 ANIMES FAVORITOS (PÓDIO OLÍMPICO COM CAPAS HD E COROA) */}
              <div className="px-3.5 py-1.5 shrink-0 flex-1 flex flex-col justify-center">
                <div className="w-full bg-black/85 border border-white/10 rounded-2xl p-2.5 shadow-xl relative overflow-visible">
                  {/* Cabeçalho do Pódio */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-lg bg-amber-400 flex items-center justify-center text-slate-950 font-black shadow-xs">
                        <Trophy className="w-3 h-3 fill-slate-950" />
                      </div>
                      <span className="text-[10px] font-black text-white uppercase tracking-wider">
                        Top 5 Animes Favoritos
                      </span>
                    </div>
                    <span className="text-[8.5px] text-amber-400/80 font-bold">
                      ★ Pódio de Honra
                    </span>
                  </div>

                  {/* Grade de 5 Colunas do Pódio */}
                  <div className="grid grid-cols-5 gap-1.5 w-full items-end pt-3 pb-1">
                    {podiumSlots.map((slot) => {
                      const anime = slot.anime;
                      const cover = anime ? safeCoverMap[anime.id] || anime.coverUrl : null;

                      return (
                        <div
                          key={`podium-slot-${slot.rank}`}
                          className={`flex flex-col items-center justify-end w-full ${slot.scale} relative`}
                        >
                          {/* Coroa Dourada Flutuante no 1º Lugar */}
                          {slot.isFirst && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center justify-center z-30 pointer-events-none">
                              <Crown className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                            </div>
                          )}

                          {anime ? (
                            <div
                              className={`w-full aspect-[2/3] rounded-lg relative overflow-hidden flex flex-col justify-between p-1 text-center bg-zinc-950 ${slot.borderClass}`}
                            >
                              {/* Tag da Nota no Topo da Capa */}
                              <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 px-1 py-0.2 rounded-full bg-black/85 backdrop-blur-md border border-amber-400/50 text-amber-300 text-[7px] font-black shadow-sm">
                                <Star className="w-2 h-2 fill-amber-300 text-amber-300" />
                                <span>{anime.rating ? anime.rating.toFixed(1) : '-'}</span>
                              </div>

                              {/* Capa Oficial HD */}
                              {cover ? (
                                <img
                                  src={cover}
                                  alt={anime.title}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 w-full h-full bg-zinc-900 flex items-center justify-center text-[8px] text-slate-500">
                                  Capa
                                </div>
                              )}

                              {/* Degradê na base para leitura do título */}
                              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none z-10" />

                              {/* Nome do Anime na Base */}
                              <div className="relative z-20 mt-auto">
                                <span className="text-[7.5px] font-black text-white leading-tight line-clamp-1 block drop-shadow-md">
                                  {anime.title}
                                </span>
                              </div>
                            </div>
                          ) : (
                            /* Slot Vazio */
                            <div className="w-full aspect-[2/3] rounded-lg border border-dashed border-white/20 bg-white/[0.02] flex flex-col items-center justify-center text-slate-500 p-1">
                              <span className="text-[8px] font-bold opacity-60">{slot.rank}º</span>
                            </div>
                          )}

                          {/* Medalha / Selo da Posição */}
                          <div
                            className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black border shadow-sm ${slot.badgeBg}`}
                          >
                            {slot.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 5. 5 INSÍGNIAS EM DESTAQUE (ARTES PERSONALIZADAS OFICIAIS) */}
              <div className="px-3.5 py-1.5 shrink-0">
                <div className="w-full bg-black/85 border border-white/10 rounded-2xl p-2.5 shadow-xl">
                  {/* Cabeçalho de Insígnias */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                        <Award className="w-3 h-3" />
                      </div>
                      <span className="text-[10px] font-black text-white uppercase tracking-wider">
                        5 Insígnias em Destaque
                      </span>
                    </div>
                    <span className="text-[8.5px] text-slate-400 font-bold">
                      Conquistas Desbloqueadas
                    </span>
                  </div>

                  {/* Grid das 5 Insígnias com as Fotos Customizadas */}
                  <div className="grid grid-cols-5 gap-1.5 py-1">
                    {slotBadges.map((badge, idx) => {
                      if (!badge) {
                        return (
                          <div
                            key={`badge-empty-${idx}`}
                            className="flex flex-col items-center justify-center p-1 rounded-xl bg-white/[0.02] border border-dashed border-white/10 aspect-square text-slate-600"
                          >
                            <span className="text-[8px] font-bold">Slot {idx + 1}</span>
                          </div>
                        );
                      }

                      const badgeImg = BADGE_IMAGE_MAP[badge.id] || getBadgeImageUrl(badge.id);
                      const tone = getBadgeToneColor(badge.tier);

                      return (
                        <div
                          key={`badge-slot-${badge.id}-${idx}`}
                          className="flex flex-col items-center text-center p-1 rounded-xl bg-white/[0.02] border border-white/10 relative"
                        >
                          {/* Contêiner da Imagem com Halo Suave */}
                          <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
                            {/* Halo Luminoso */}
                            <div
                              className="absolute inset-1 rounded-full filter blur-xs opacity-75 pointer-events-none"
                              style={{ backgroundColor: tone.glow }}
                            />

                            {/* Arte Oficial da Insígnia (WebP) */}
                            <img
                              src={badgeImg}
                              alt={badge.title}
                              className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                            />
                          </div>

                          {/* Título da Insígnia */}
                          <span className="mt-1 text-[7.5px] font-bold text-slate-200 line-clamp-1 leading-tight block w-full px-0.5">
                            {badge.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 6. RODAPÉ INSTITUCIONAL (MARCA D'ÁGUA ELEGANTE) */}
              <div className="mt-auto px-4 py-2 border-t border-white/[0.06] bg-black flex items-center justify-between shrink-0 text-[8.5px] text-slate-400">
                <div className="flex items-center gap-1.5 font-bold text-slate-300">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>WAnime List</span>
                </div>
                <span className="font-mono text-slate-500 text-[8px]">
                  wanime-list.web.app
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notificações e Toasts de Sucesso */}
        {copiedSuccess && (
          <div className="mx-4 mt-2 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Imagem copiada para a área de transferência!</span>
          </div>
        )}

        {downloadSuccess && (
          <div className="mx-4 mt-2 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Download da imagem iniciado com sucesso!</span>
          </div>
        )}

        {errorMessage && (
          <div className="mx-4 mt-2 p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold text-center">
            {errorMessage}
          </div>
        )}

        {/* Rodapé do Modal com Botões de Ação */}
        <div className="p-3 sm:p-4 border-t border-white/[0.08] bg-black/60 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={handleCopyImage}
            disabled={isExporting || isPreloading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>Copiar Imagem</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isExporting || isPreloading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
            ) : (
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>Baixar Imagem (PNG HD)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
