"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { getSocket } from "@/lib/socket-client";
import { BackButton } from "@/components/BackButton";
import { Checkbox } from "@/components/Checkbox";
import { getAvatarEmoji } from "@/lib/avatars";

type Player = { id: string; nickname: string; avatarId?: string; isLeader: boolean };

type ModeInfo = {
  id: string;
  name: string;
  categoryNames: string[];
};

export default function LobbyRoomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lobbyId = searchParams.get("lobbyId");
  const userId = searchParams.get("userId");
  const code = searchParams.get("code");

  const [players, setPlayers] = useState<Player[]>([]);
  const [leaderId, setLeaderId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("waiting");
  const [modes, setModes] = useState<ModeInfo[]>([]);
  const [selectedModeId, setSelectedModeId] = useState<string>("");
  const [loadingModes, setLoadingModes] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [selfVoteAllowed, setSelfVoteAllowed] = useState(true);
  const [codeFromState, setCodeFromState] = useState<string | null>(null);
  const [disconnected, setDisconnected] = useState(false);

  const isLeader = userId === leaderId;

  const rejoinLobby = useCallback(() => {
    if (!lobbyId || !userId) return;
    setDisconnected(false);
    getSocket().emit("lobby:join", { lobbyId, userId });
  }, [lobbyId, userId]);

  const fetchModes = useCallback(async () => {
    try {
      const res = await fetch("/api/modes");
      if (res.ok) {
        const data = await res.json();
        const list = data.modes ?? [];
        setModes(list);
        if (list.length && !selectedModeId) setSelectedModeId(list[0].id);
      }
    } catch {
      setModes([]);
    } finally {
      setLoadingModes(false);
    }
  }, [selectedModeId]);

  useEffect(() => {
    if (!lobbyId || !userId) return;
    const socket = getSocket();
    socket.emit("lobby:join", { lobbyId, userId });
    setDisconnected(false);
    const onConnect = () => {
      setDisconnected(false);
      socket.emit("lobby:join", { lobbyId, userId });
    };
    const onDisconnect = () => setDisconnected(true);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("lobby:state", (state: {
      players: Player[];
      leaderId: string;
      code: string;
      status: string;
      timerEnabled?: boolean;
      timerSeconds?: number;
      selfVoteAllowed?: boolean;
    }) => {
      setPlayers(state.players);
      setLeaderId(state.leaderId);
      setStatus(state.status);
      if (state.code) setCodeFromState(state.code);
      if (typeof state.timerEnabled === "boolean") setTimerEnabled(state.timerEnabled);
      if (typeof state.timerSeconds === "number") setTimerSeconds(state.timerSeconds);
      if (typeof state.selfVoteAllowed === "boolean") setSelfVoteAllowed(state.selfVoteAllowed);
    });
    socket.on("lobby:players", (p: Player[]) => setPlayers(p));
    socket.on("game:started", (data: { gameId: string }) => {
      router.push(`/game?lobbyId=${lobbyId}&userId=${userId}&gameId=${data.gameId}`);
    });
    socket.on("game:start:not_ready", (data: { missing: string[] }) => {
      setStarting(false);
      setError(data.missing?.length ? `${data.missing.join(", ")} lobiye dönmedi.` : "Tüm oyuncular lobiye dönmeden oyun başlatılamaz.");
    });
    socket.on("lobby:kicked", () => {
      window.location.href = "/lobby";
    });
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("lobby:state");
      socket.off("lobby:players");
      socket.off("game:started");
      socket.off("game:start:not_ready");
      socket.off("lobby:kicked");
    };
  }, [lobbyId, userId]);

  useEffect(() => {
    fetchModes();
  }, [fetchModes]);

  const startGame = async () => {
    if (!isLeader || !selectedModeId || players.length < 2) return;
    setStarting(true);
    setError("");
    getSocket().emit("game:start", { lobbyId, modeId: selectedModeId });
  };

  const kickPlayerFromLobby = (playerId: string) => {
    if (!isLeader || !lobbyId || playerId === userId) return;
    if (!confirm("Bu oyuncuyu lobiden atmak istediğine emin misin?")) return;
    setError("");
    getSocket().emit("lobby:kick", { lobbyId, userIdToKick: playerId });
  };

  const leaveLobby = async () => {
    if (!lobbyId || !userId || leaving) return;
    if (!confirm("Lobiden çıkmak istediğine emin misin?")) return;
    setLeaving(true);
    try {
      const res = await fetch("/api/lobby/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobbyId, userId }),
      });
      if (res.ok) window.location.href = "/lobby";
      else setError("Çıkış yapılamadı.");
    } catch {
      setError("Bir hata oluştu.");
    } finally {
      setLeaving(false);
    }
  };

  if (!lobbyId || !userId) {
    return (
      <div className="page-bg min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="absolute left-4 top-4">
          <BackButton href="/lobby" label="Lobiler" />
        </div>
        <p className="text-gray-400">Lobi veya kullanıcı bilgisi eksik. Geri dönüp lobi oluştur veya katıl.</p>
      </div>
    );
  }

  const lobbyCode = codeFromState ?? code ?? "-----";

  const copyCode = () => {
    if (lobbyCode && lobbyCode !== "-----") {
      navigator.clipboard.writeText(lobbyCode);
    }
  };

  const shareLink = () => {
    if (typeof window !== "undefined" && lobbyCode && lobbyCode !== "-----") {
      const url = `${window.location.origin}/lobby/join?code=${lobbyCode}`;
      if (navigator.share) {
        navigator.share({ title: "PARMAK", url, text: `Lobime katıl: ${lobbyCode}` });
      } else {
        navigator.clipboard.writeText(url);
      }
    }
  };

  return (
    <div className="page-bg min-h-screen flex flex-col px-4 pb-8 pt-20 sm:pt-8">
      {disconnected && (
        <div className="fixed left-4 right-4 top-20 z-40 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 backdrop-blur-sm sm:left-auto sm:right-4 sm:top-4 sm:max-w-sm">
          <p className="text-sm text-amber-200">Bağlantı koptu. Tekrar katılmak için butona tıkla.</p>
          <button
            type="button"
            onClick={rejoinLobby}
            className="mt-2 w-full rounded-xl bg-amber-500/30 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/50"
          >
            Tekrar bağlan
          </button>
        </div>
      )}
      {/* Üst bar: her zaman tıklanabilir, mobilde sabit üstte */}
      <div className="fixed left-0 right-0 top-0 z-30 flex items-center justify-between gap-3 border-b border-white/5 bg-[var(--surface)]/95 px-4 py-3 backdrop-blur-sm sm:absolute sm:left-4 sm:right-auto sm:top-4 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <BackButton href="/lobby" label="Lobiler" />
          <motion.button
            type="button"
            onClick={leaveLobby}
            disabled={leaving}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-gray-400 transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            {leaving ? "Çıkılıyor…" : "Lobiden çık"}
          </motion.button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mx-auto w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="card-glass rounded-3xl p-6"
        >
          {/* Lobi kodu: tüm kullanıcılar görür */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold text-white">Lobi</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-2xl tracking-[0.2em] text-indigo-400">{lobbyCode}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyCode}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15 active:scale-[0.98]"
                >
                  Kopyala
                </button>
                <button
                  type="button"
                  onClick={shareLink}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15 active:scale-[0.98]"
                >
                  Paylaş
                </button>
              </div>
            </div>
          </div>

          {isLeader ? (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Sol: Oyuncular */}
              <div className="relative z-0 flex flex-col">
                <p className="text-sm text-gray-400">Oyuncular ({players.length}) — başlamak için en az 2 kişi</p>
                <ul className="mt-3 space-y-2">
                  {players.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-2.5"
                    >
                      <span className="text-2xl" title={p.avatarId}>{getAvatarEmoji(p.avatarId)}</span>
                      <span className="flex-1 text-white">
                        {p.nickname} {p.isLeader && <span className="text-indigo-400">(Lider)</span>}
                      </span>
                      {isLeader && p.id !== userId && (
                        <button
                          type="button"
                          onClick={() => kickPlayerFromLobby(p.id)}
                          className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
                        >
                          At
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-gray-400">
                  Bu oyunda: Kendine oy {selfVoteAllowed ? "verilebilir" : "verilemez"} · Zamanlayıcı {timerEnabled ? `${timerSeconds} sn` : "kapalı"}
                </p>
              </div>

              {/* Sağ: Lider ayarları */}
              <div className="relative z-0 flex flex-col">
                <p className="mb-3 text-sm font-medium text-gray-400">Oyun ayarları</p>
                <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Checkbox
                    checked={selfVoteAllowed}
                    onChange={(v) => {
                      setSelfVoteAllowed(v);
                      getSocket().emit("lobby:updateSettings", { lobbyId, selfVoteAllowed: v });
                    }}
                    label="Kendine oy verilebilir"
                  />
                  <Checkbox
                    checked={timerEnabled}
                    onChange={(v) => {
                      setTimerEnabled(v);
                      getSocket().emit("lobby:updateSettings", { lobbyId, timerEnabled: v, timerSeconds: v ? timerSeconds : undefined });
                    }}
                    label="Zamanlayıcı"
                  />
                  {timerEnabled && (
                    <div className="flex min-w-0 flex-1 basis-full items-center gap-3 sm:basis-auto">
                      <input
                        type="range"
                        min={5}
                        max={120}
                        step={5}
                        value={timerSeconds}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setTimerSeconds(v);
                          getSocket().emit("lobby:updateSettings", { lobbyId, timerSeconds: v });
                        }}
                        className="timer-slider w-28 flex-1 min-w-0 sm:w-40"
                      />
                      <span className="w-11 shrink-0 text-right text-sm font-medium text-white tabular-nums">
                        {timerSeconds} sn
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-6">
                  <p className="mb-3 text-sm font-medium text-gray-400">Oyun modu seç</p>
                  {loadingModes ? (
                    <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-10 text-gray-400">
                      Yükleniyor…
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {modes.map((m) => {
                        const selected = selectedModeId === m.id;
                        return (
                          <motion.button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedModeId(m.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative z-10 rounded-2xl border p-4 text-left transition ${
                              selected
                                ? "border-indigo-500/80 bg-indigo-500/15 ring-2 ring-indigo-500/40 shadow-glow"
                                : "card-glass border-white/10 hover:border-white/20"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-white">{m.name}</span>
                              {selected && (
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm text-white">✓</span>
                              )}
                            </div>
                            <ul className="mt-2 space-y-1 text-xs text-gray-400">
                              <li>• Sorular: {m.categoryNames.length ? m.categoryNames.join(", ") : "Karışık"}</li>
                            </ul>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
                <motion.button
                  type="button"
                  disabled={players.length < 2 || starting || !selectedModeId}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={startGame}
                  className="relative z-10 mt-6 min-h-[48px] w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-4 text-lg font-semibold text-white shadow-lg disabled:opacity-50"
                >
                  {starting ? "Başlatılıyor…" : "Oyunu Başlat"}
                </motion.button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-3 text-sm text-gray-400">Oyuncular ({players.length}) — başlamak için en az 2 kişi</p>
              <ul className="mt-4 space-y-2">
                {players.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-2.5"
                  >
                    <span className="text-2xl">{getAvatarEmoji(p.avatarId)}</span>
                    <span className="text-white">
                      {p.nickname} {p.isLeader && <span className="text-indigo-400">(Lider)</span>}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-gray-400">
                Bu oyunda: Kendine oy {selfVoteAllowed ? "verilebilir" : "verilemez"} · Zamanlayıcı {timerEnabled ? `${timerSeconds} sn` : "kapalı"}
              </p>
            </>
          )}
        </motion.div>
        </div>
      </div>
    </div>
  );
}
