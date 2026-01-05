export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center text-slate-900">
      <h1 className="text-2xl font-semibold">Sedang offline</h1>
      <p className="mt-2 max-w-sm text-sm">
        Koneksi internet tidak tersedia. Silakan periksa jaringan dan coba
        lagi.
      </p>
    </div>
  );
}
