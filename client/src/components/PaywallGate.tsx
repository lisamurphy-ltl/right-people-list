/**
 * PaywallGate — wraps any action that requires:
 *   1. Authentication (sign-in)
 *   2. Remaining monthly lead credits
 *
 * Usage:
 *   <PaywallGate sub={sub} isAuthenticated={isAuthenticated}>
 *     <button>Add Lead</button>
 *   </PaywallGate>
 *
 * When blocked, it renders an overlay/modal explaining the limit
 * and offering upgrade options.
 */

import { useState } from "react";
import { Lock, Zap, LogIn, X } from "lucide-react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface SubData {
  plan: string;
  leadsUsed: number;
  leadsRemaining: number;
  limits: {
    leadsPerMonth: number;
    hasUnverifiedEmail: boolean;
    hasVerifiedEmail: boolean;
    hasPhone: boolean;
    teamSeats: number;
  };
}

interface Props {
  sub?: SubData | null;
  isAuthenticated: boolean;
  children: React.ReactNode;
  onAllowed?: () => void;
}

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  pro: "Scout Pro",
  pro_plus: "Scout Pro+",
  agency: "Agency",
};

export default function PaywallGate({ sub, isAuthenticated, children, onAllowed }: Props) {
  const [showModal, setShowModal] = useState(false);

  const checkoutMutation = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: (e) => toast.error(e.message),
  });

  const topUpMutation = trpc.subscription.createTopUpCheckout.useMutation({
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: (e) => toast.error(e.message),
  });

  const isAtLimit = sub && sub.limits.leadsPerMonth !== 99999 && sub.leadsRemaining <= 0;
  const isBlocked = !isAuthenticated || isAtLimit;

  const handleClick = () => {
    if (!isBlocked) {
      onAllowed?.();
      return;
    }
    setShowModal(true);
  };

  return (
    <>
      <div onClick={handleClick} style={{ display: "contents", cursor: isBlocked ? "pointer" : "auto" }}>
        {children}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 0.75)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "oklch(0.17 0.012 260)", border: "1px solid oklch(0.28 0.012 260)", boxShadow: "0 25px 60px oklch(0 0 0 / 0.5)" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid oklch(0.24 0.012 260)" }}>
              <div className="flex items-center gap-2">
                <Lock size={16} style={{ color: "oklch(0.78 0.18 85)" }} />
                <span style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, color: "oklch(0.92 0.005 260)" }}>
                  {!isAuthenticated ? "Sign in to continue" : "Monthly limit reached"}
                </span>
              </div>
              <button onClick={() => setShowModal(false)} style={{ color: "oklch(0.45 0.008 260)" }}>
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {!isAuthenticated ? (
                <>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: "oklch(0.65 0.008 260)" }}>
                    The Right-People List is <strong style={{ color: "oklch(0.90 0.005 260)" }}>free to start</strong> — 25 leads per month, no credit card required. Sign in to track your leads and save your searches.
                  </p>
                  <div className="p-4 rounded-lg mb-5"
                    style={{ background: "oklch(0.78 0.18 85 / 0.08)", border: "1px solid oklch(0.78 0.18 85 / 0.25)" }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                      style={{ color: "oklch(0.78 0.18 85)", fontFamily: "Archivo, sans-serif" }}>Free plan includes</p>
                    <ul className="text-xs space-y-1" style={{ color: "oklch(0.68 0.008 260)" }}>
                      <li>✓ 25 leads per month</li>
                      <li>✓ ICP query builder</li>
                      <li>✓ Relevance scoring</li>
                      <li>✓ CSV export</li>
                      <li>✓ ICP Clarity Guide</li>
                    </ul>
                  </div>
                  <a href={getLoginUrl()}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded font-bold text-sm"
                    style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Archivo, sans-serif", textDecoration: "none" }}>
                    <LogIn size={15} /> Sign In — It's Free
                  </a>
                </>
              ) : (
                <>
                  <p className="text-sm leading-relaxed mb-2" style={{ color: "oklch(0.65 0.008 260)" }}>
                    You've used all <strong style={{ color: "oklch(0.90 0.005 260)" }}>{sub?.limits.leadsPerMonth} leads</strong> on your {PLAN_LABEL[sub?.plan ?? "free"]} plan this month.
                  </p>
                  <p className="text-sm mb-5" style={{ color: "oklch(0.55 0.008 260)" }}>
                    Limits reset on the 1st of each month — or upgrade now to keep going.
                  </p>

                  <div className="p-4 rounded-lg mb-4"
                    style={{ background: "oklch(0.78 0.18 85 / 0.08)", border: "1px solid oklch(0.78 0.18 85 / 0.25)" }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                      style={{ color: "oklch(0.78 0.18 85)", fontFamily: "Archivo, sans-serif" }}>
                      Need more leads right now?
                    </p>
                    <p className="text-xs" style={{ color: "oklch(0.60 0.008 260)" }}>
                      Buy a one-time top-up, or go Pro for 100 fresh leads every month.
                    </p>
                  </div>

                  <button
                    onClick={() => topUpMutation.mutate()}
                    disabled={topUpMutation.isPending}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded font-bold text-sm mb-2"
                    style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Archivo, sans-serif" }}>
                    <Zap size={15} /> Buy 100 Leads — $27
                  </button>

                  {sub?.plan === "free" && (
                    <button
                      onClick={() => checkoutMutation.mutate({ plan: "pro" })}
                      disabled={checkoutMutation.isPending}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded font-bold text-sm mb-3"
                      style={{ background: "oklch(0.22 0.012 260)", color: "oklch(0.80 0.008 260)", border: "1px solid oklch(0.32 0.012 260)", fontFamily: "Archivo, sans-serif" }}>
                      Go Pro — $17/mo (100 leads/mo)
                    </button>
                  )}

                  <button onClick={() => setShowModal(false)}
                    className="w-full py-2.5 rounded text-sm font-semibold"
                    style={{ background: "oklch(0.22 0.012 260)", color: "oklch(0.60 0.008 260)", border: "1px solid oklch(0.30 0.012 260)" }}>
                    Wait until next month
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
