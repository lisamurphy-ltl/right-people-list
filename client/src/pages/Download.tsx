import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Download, Loader2, AlertCircle, ArrowRight } from "lucide-react";

export default function DownloadPage() {
  const [location] = useLocation();
  const sessionId = new URLSearchParams(window.location.search).get("session_id") ?? "";
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading, error } = trpc.promptPack.verifyAndGetDownload.useQuery(
    { sessionId },
    { enabled: !!sessionId, retry: false }
  );

  const handleDownload = () => {
    if (!data?.downloadUrl) return;
    setDownloading(true);
    const a = document.createElement("a");
    a.href = data.downloadUrl;
    a.download = data.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "oklch(0.13 0.012 260)" }}>
      <div className="w-full max-w-lg">

        {/* Loading */}
        {isLoading && (
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-4" size={40} style={{ color: "oklch(0.78 0.18 85)" }} />
            <p style={{ color: "oklch(0.68 0.008 260)", fontFamily: "Inter, sans-serif" }}>Verifying your payment...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-8 rounded-xl text-center" style={{ background: "oklch(0.18 0.012 260)", border: "1px solid oklch(0.35 0.012 260)" }}>
            <AlertCircle className="mx-auto mb-4" size={40} style={{ color: "#cc3333" }} />
            <h2 className="mb-2 text-xl" style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, color: "oklch(0.95 0.005 260)" }}>
              Payment Not Verified
            </h2>
            <p className="mb-6 text-sm" style={{ color: "oklch(0.60 0.008 260)" }}>
              We couldn't verify your payment. If you completed checkout, please contact support with your order confirmation.
            </p>
            <a href="/pricing" style={{ color: "oklch(0.78 0.18 85)", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>
              ← Back to Pricing
            </a>
          </div>
        )}

        {/* Success */}
        {data && (
          <div className="p-8 rounded-xl text-center" style={{ background: "oklch(0.18 0.012 260)", border: "1px solid oklch(0.78 0.18 85 / 0.4)" }}>
            {/* Gold glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 blur-3xl rounded-full pointer-events-none" style={{ background: "oklch(0.78 0.18 85 / 0.08)" }} />

            <div className="relative">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "oklch(0.78 0.18 85 / 0.15)", border: "2px solid oklch(0.78 0.18 85 / 0.5)" }}>
                <CheckCircle size={32} style={{ color: "oklch(0.78 0.18 85)" }} />
              </div>

              <div className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(0.78 0.18 85)", fontFamily: "Syne, sans-serif" }}>
                Payment Confirmed
              </div>
              <h2 className="mb-3 text-2xl" style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, color: "oklch(0.97 0.005 260)", letterSpacing: "-0.02em" }}>
                Your Outreach System<br />is Ready
              </h2>
              <p className="mb-6 text-sm" style={{ color: "oklch(0.60 0.008 260)", lineHeight: 1.6 }}>
                You've got the 3 prompts. Now go find your people and start real conversations with them.
              </p>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg font-bold text-sm mb-4 transition-all duration-160"
                style={{
                  background: "oklch(0.78 0.18 85)",
                  color: "oklch(0.13 0.012 260)",
                  fontFamily: "Syne, sans-serif",
                  fontSize: "1rem",
                  transform: downloading ? "scale(0.97)" : "scale(1)",
                }}
              >
                {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                {downloading ? "Downloading..." : "Download PDF — Plug-and-Play Outreach System"}
              </button>

              <div className="pt-4" style={{ borderTop: "1px solid oklch(0.26 0.012 260)" }}>
                <p className="text-xs mb-3" style={{ color: "oklch(0.45 0.008 260)" }}>
                  Ready to find the leads to use these prompts on?
                </p>
                <a
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: "oklch(0.60 0.20 255)", fontFamily: "Syne, sans-serif" }}
                >
                  Go to your Lead Dashboard <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* No session ID */}
        {!sessionId && !isLoading && (
          <div className="text-center">
            <p style={{ color: "oklch(0.60 0.008 260)" }}>No session found. <a href="/pricing" style={{ color: "oklch(0.78 0.18 85)" }}>Go to Pricing →</a></p>
          </div>
        )}

      </div>
    </div>
  );
}
