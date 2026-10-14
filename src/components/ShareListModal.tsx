import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Globe, 
  Lock, 
  ExternalLink, 
  QrCode, 
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { Anime } from '../types';
import type { UserProfile } from '../services/profileService';
import { saveUserProfile } from '../services/profileService';
import { copyToClipboard } from '../lib/clipboard';

interface ShareListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  avatarUrl?: string;
  animes: Anime[];
  userProfile?: UserProfile | null;
  onProfileUpdated?: (profile: UserProfile) => void;
  onOpenProfileSettings?: () => void;
}

export const ShareListModal: React.FC<ShareListModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  userProfile,
  onProfileUpdated,
}) => {
  const [isPublic, setIsPublic] = useState<boolean>(userProfile?.isPublicList ?? true);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  // URL compartilhável direta e funcional
  const shareDirectUrl = `${window.location.origin}/?user=${encodeURIComponent(userId)}`;

  useEffect(() => {
    if (isOpen && userProfile) {
      setIsPublic(userProfile.isPublicList !== false);
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  const handleCopyLink = async (url: string) => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleTogglePublic = async (newVal: boolean) => {
    setIsPublic(newVal);
    setSaving(true);
    try {
      const updated = await saveUserProfile(userId, {
        isPublicList: newVal,
        publicUsername: userProfile?.publicUsername || userName,
        publicBio: userProfile?.publicBio || '',
      });
      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }
    } catch (error) {
      console.error('Erro ao atualizar privacidade da lista:', error);
    } finally {
      setSaving(false);
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareDirectUrl)}&bgcolor=000000&color=6366f1&margin=2`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-black border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Compacto Preto Puro */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between bg-black shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Compartilhar Minha Lista</span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Link público da sua coleção e progresso
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-share-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo Fluído sem Caixas Pesadas Aninhadas */}
        <div className="p-4 sm:p-5 space-y-4 bg-black">
          {/* Status de Visibilidade */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-white block">Status da Lista</span>
              <span className="text-[11px] text-zinc-400 block">
                {isPublic ? 'Visível para quem tiver o link' : 'Privada (oculta para terceiros)'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10 shrink-0">
              <button
                type="button"
                id="btn-set-public-list"
                onClick={() => handleTogglePublic(true)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isPublic 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>Pública</span>
              </button>
              <button
                type="button"
                id="btn-set-private-list"
                onClick={() => handleTogglePublic(false)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  !isPublic 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>Privada</span>
              </button>
            </div>
          </div>

          {/* Campo de Link Direto com Copiar */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block px-0.5">
              Link do Perfil Público
            </label>
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 focus-within:border-emerald-500/50 transition-colors">
              <input
                type="text"
                readOnly
                value={shareDirectUrl}
                className="flex-1 bg-transparent text-xs text-zinc-200 font-mono px-2.5 py-1 outline-none select-all font-semibold"
              />
              <button
                type="button"
                id="btn-copy-share-direct-link"
                onClick={() => handleCopyLink(shareDirectUrl)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
                  copied
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                    : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Botões de Ação Rápida: WhatsApp & Abrir em Nova Aba */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `🎬 Olá! Confira minha lista de animes e progresso no WAnime:\n${shareDirectUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer active:scale-95 text-center"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp</span>
            </a>

            <a
              href={shareDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-zinc-200 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95 text-center"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              <span>Abrir Lista</span>
            </a>
          </div>

          {/* Alternador de QR Code Integrado */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowQrCode((prev) => !prev)}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] text-xs font-bold text-zinc-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-400" />
                <span>{showQrCode ? 'Ocultar QR Code' : 'Ver QR Code para Escanear'}</span>
              </div>
              {showQrCode ? (
                <ChevronUp className="w-4 h-4 text-zinc-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              )}
            </button>

            {showQrCode && (
              <div className="mt-3 flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2 animate-in fade-in duration-150 text-center">
                <div className="p-2.5 bg-black border border-white/10 rounded-2xl shadow-xl">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code da lista"
                    className="w-40 h-40 rounded-xl object-contain"
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Aponte a câmera do celular para abrir diretamente a sua lista
                </p>
              </div>
            )}
          </div>

          {/* Segurança / Somente Leitura */}
          <div className="flex items-center gap-2 pt-1 text-zinc-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Somente leitura: quem acessar não pode editar sua coleção.</span>
          </div>
        </div>

        {/* Rodapé Compacto */}
        <div className="px-4 sm:px-5 py-3 border-t border-white/[0.08] bg-black flex items-center justify-end shrink-0">
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
