export default function LobbyLoading() {
  return (
    <div className="page-bg min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm text-gray-400">Yükleniyor…</p>
      </div>
    </div>
  );
}
