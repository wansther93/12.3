import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  User as UserIcon, 
  Camera, 
  Bell, 
  BellRing, 
  BellOff, 
  LogOut, 
  Share2, 
  DownloadCloud, 
  Smartphone, 
  Send, 
  Image, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import type { User } from '../lib/firebase';
import {
  getNotificationPermission,
  requestNotificationPermission,
  isEpisodeNotificationEnabled,
  setEpisodeNotificationEnabled,
  sendTestNotification
} from '../services/notificationService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  customAvatarUrl?: string;
  onOpenAvatarModal: () => void;
  onLogout: () => void;
  onOpenBackup: () => void;
  onOpenInstallModal?: () => void;
  onOpenShareModal?: () => void;
  onOpenImageSearch?: () => void;
  onOpenSocialCard?: () => void;
  otakuLevel?: {
    level: number;
    title?: string;
    totalXp: number;
    progressPercent: number;
  };
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  customAvatarUrl,
  onOpenAvatarModal,
  onLogout,
  onOpenBackup,
  onOpenInstallModal,
  onOpenShareModal,
  onOpenImageSearch,
  onOpenSocialCard,
  otakuLevel,
}) => {
  const [notifEnabled, setNotifEnabled] = useState(() => isEpisodeNotificationEnabled());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [testSuccess, setTestSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNotifEnabled(isEpisodeNotificationEnabled());
      setPermissionStatus(getNotificationPermission());
      setTestSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermissionStatus(perm);
    if (perm === 'granted') {
      setEpisodeNotificationEnabled(true);
      setNotifEnabled(true);
      sendTestNotification();
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
    }
  };

  const handleToggleNotif = () => {
    if (notifEnabled) {
      setEpisodeNotificationEnabled(false);
      setNotifEnabled(false);
    } else {
      if (getNotificationPermission() === 'granted') {
        setEpisodeNotificationEnabled(true);
        setNotifEnabled(true);
      } else {
        handleRequestPermission();
      }
    }
  };

  const handleSendTest = () => {
    const ok = sendTestNotification();
    if (ok) {
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
    }
  };

  const avatarImage = customAvatarUrl || user?.photoURL;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm sm:max-w-md bg-black border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho Minimalista e Direto */}
        <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center text-amber-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-wide">
                Configurações & Ajustes
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo: Lista Fluída sobre Fundo Preto Puro (Zero Containers Aninhados) */}
        <div className="p-4 space-y-4 text-xs overflow-y-auto max-h-[82vh] no-scrollbar">
          
          {/* 1. PERFIL DO USUÁRIO (Flutuando diretamente no preto) */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-white/20 bg-zinc-900 shadow-md">
                {avatarImage ? (
                  <img src={avatarImage} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-amber-400 font-extrabold text-base">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <span className="font-extrabold text-white block truncate text-sm">
                  {user?.displayName || 'Usuário Otaku'}
                </span>
                <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] truncate">
                  <span className="truncate">{user?.email || 'Sincronizado na nuvem'}</span>
                </div>
                {otakuLevel && (
                  <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-300">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Nível {otakuLevel.level} • {otakuLevel.totalXp} XP</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAvatarModal();
              }}
              className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-bold transition-all cursor-pointer shrink-0 border border-white/10 flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Alterar Foto</span>
            </button>
          </div>

          <div className="h-px bg-white/[0.06] w-full" />

          {/* 2. CENTRAL DE NOTIFICAÇÕES (Linha Direta de Ajuste) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  notifEnabled ? 'bg-amber-400/15 text-amber-400' : 'bg-white/[0.04] text-zinc-400'
                }`}>
                  {notifEnabled ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-white text-xs block">Avisos de Episódios Novos</span>
                  <span className="text-[10px] text-zinc-400 block">Alertas automáticos de lançamentos</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {notifEnabled && (
                  <button
                    type="button"
                    onClick={handleSendTest}
                    title="Enviar notificação de teste"
                    className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3 text-amber-400" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleToggleNotif}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none ${
                    notifEnabled ? 'bg-amber-400' : 'bg-zinc-800'
                  }`}
                  title={notifEnabled ? 'Desativar avisos' : 'Ativar avisos'}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-black shadow-md transform transition-transform ${
                      notifEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            {testSuccess && (
              <p className="text-[10px] text-emerald-400 font-bold text-right pr-1">
                ✓ Notificação enviada!
              </p>
            )}
          </div>

          <div className="h-px bg-white/[0.06] w-full" />

          {/* 3. RECURSOS & FERRAMENTAS (Lista Fluída de Toque Confortável) */}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block px-1 pb-1">
              Recursos & Ferramentas
            </span>

            {/* Instalar Aplicativo (PWA) */}
            {onOpenInstallModal && (
              <button
                type="button"
                id="btn-settings-install-pwa"
                onClick={() => {
                  onClose();
                  onOpenInstallModal();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/[0.05] active:bg-white/[0.08] transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">Instalar Aplicativo (PWA)</span>
                    <span className="text-[10px] text-zinc-400 block truncate">Acesso rápido e suporte offline</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>
            )}

            {/* Gerar Card do Perfil (Stories) */}
            {onOpenSocialCard && (
              <button
                type="button"
                id="btn-settings-profile-card"
                onClick={() => {
                  onClose();
                  onOpenSocialCard();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/[0.05] active:bg-white/[0.08] transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Image className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">Card do Perfil (Stories)</span>
                    <span className="text-[10px] text-zinc-400 block truncate">Gerar imagem para redes sociais</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>
            )}

            {/* Compartilhar Lista */}
            {onOpenShareModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenShareModal();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/[0.05] active:bg-white/[0.08] transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">Compartilhar Minha Lista</span>
                    <span className="text-[10px] text-zinc-400 block truncate">Link público da sua coleção</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>
            )}

            {/* Identificar Cena (Trace.moe) */}
            {onOpenImageSearch && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenImageSearch();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/[0.05] active:bg-white/[0.08] transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">Achar Cena de Anime</span>
                    <span className="text-[10px] text-zinc-400 block truncate">Descobrir obra por imagem (Trace.moe)</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>
            )}
          </div>

          <div className="h-px bg-white/[0.06] w-full" />

          {/* 4. SISTEMA & CONTA */}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block px-1 pb-1">
              Sistema & Conta
            </span>

            {/* Backup & Migração */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBackup();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/[0.05] active:bg-white/[0.08] transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <DownloadCloud className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">Backup & Sincronização</span>
                  <span className="text-[10px] text-zinc-400 block truncate">Exportar ou restaurar dados</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-rose-500/10 active:bg-rose-500/20 text-rose-300 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <LogOut className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-rose-200 block truncate">Desconectar da Conta</span>
                  <span className="text-[10px] text-rose-400/70 block truncate">Encerrar sessão neste dispositivo</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400/60 group-hover:text-rose-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          </div>

        </div>

        {/* Rodapé Limpo */}
        <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
          <span className="font-semibold">WAnime List</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white font-bold transition-colors cursor-pointer text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
