import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useCallback } from "react";
import { getLoginUrl } from "@/const";
import {
  Download, Zap, Trash2, Mail, Phone, ExternalLink,
  TrendingUp, Users, Star, AlertCircle, Loader2, Plus
} from "lucide-react";
import { toast } from "sonner";
import AddLeadModal from "@/components/AddLeadModal";
import PaywallGate from "@/components/PaywallGate";

const SCORE_COLOR: Record<string, string> = {
  high:   "oklch(0.65 0.18 145)",
  medium: "oklch(0.78 0.18 85)",
  low:    "oklch(0.60 0.20 255)",
};

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  pro: "Scout Pro",
  pro_plus: "Scout Pro+",
  agency: "Agency",
};

const PLAN_COLOR: Record<string, string> = {
  free:     "oklch(0.60 0.008 260)",
  pro:      "oklch(0.60 0.20 255)",
  pro_plus: "oklch(0.78 0.18 85)",
  agency:   "oklch(0.65 0.18 145)",
};

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: sub, refetch: refetchSub } = trpc.subscription.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: leadsData, refetch: refetchLeads, isLoading: leadsLoading } = trpc.leads.list.useQuery(
    { limit: 200, offset: 0 },
    { enabled: isAuthenticated }
  );

  const enrichMutation = trpc.leads.enrich.useMutation({
    onSuccess: () => { refetchLeads(); toast.success("Lead enriched!"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.leads.delete.useMutation({
    onSuccess: () => { refetchLeads(); refetchSub(); toast.success("Lead removed"); },
    onError: (e) => toast.error(e.message),
  });

  const checkoutMutation = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: (e) => toast.error(e.message),
  });

  const portalMutation = trpc.subscription.createPortal.useMutation({
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: (e) => toast.error(e.message),
  });

  const exportCSV = useCallback(() => {
    if (!leadsData?.items?.length) return;
    const headers = ["Name","Title","Company","LinkedIn URL","Email (Unverified)","Email (Verified)","Phone","Location","Score","Enrichment Status"];
    const rows = leadsData.items.map(l => [
      l.fullName ?? "",
      l.title ?? "",
      l.company ?? "",
      l.linkedinUrl ?? "",
      l.emailUnverified ?? "",
      l.emailVerified ?? "",
      l.phone ?? "",
      l.location ?? "",
      l.relevanceScore ?? "",
      l.enrichmentStatus ?? "",
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "icp-scout-leads.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  }, [leadsData]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.13 0.012 260)" }}>
      <Loader2 className="animate-spin" style={{ color: "oklch(0.78 0.18 85)" }} size={32} />
    </div>
  );

  if (!isAuthenticated) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: "oklch(0.13 0.012 260)" }}>
      <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.8rem", color: "oklch(0.95 0.005 260)" }}>
        Sign in to access your dashboard
      </h2>
      <a href={getLoginUrl()} style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Syne, sans-serif", fontWeight: 700, padding: "0.875rem 2rem", borderRadius: "0.375rem", textDecoration: "none" }}>
        Sign In
      </a>
    </div>
  );

  const plan = (sub?.plan ?? "free") as string;
  const leadsUsed = sub?.leadsUsed ?? 0;
  const leadsLimit = sub?.limits?.leadsPerMonth ?? 25;
  const leadsRemaining = sub?.leadsRemaining ?? 25;
  const usagePct = leadsLimit === 99999 ? 0 : Math.min(100, Math.round((leadsUsed / leadsLimit) * 100));
  const canEnrich = sub?.limits?.hasUnverifiedEmail || sub?.limits?.hasVerifiedEmail;
  const hasVerified = sub?.limits?.hasVerifiedEmail;

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.13 0.012 260)" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: "oklch(0.13 0.012 260 / 0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid oklch(0.22 0.012 260)" }}>
        <a href="/" style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "oklch(0.92 0.005 260)", textDecoration: "none", letterSpacing: "-0.02em" }}>
          The <span className="text-chrome-gold">Right-People List</span>
        </a>
        <div className="flex items-center gap-3">
          <span className="text-sm px-3 py-1 rounded-full" style={{ background: "oklch(0.20 0.012 260)", color: PLAN_COLOR[plan], border: `1px solid ${PLAN_COLOR[plan]}40`, fontFamily: "Syne, sans-serif", fontWeight: 700 }}>
            {PLAN_LABEL[plan]}
          </span>
          <span className="text-sm" style={{ color: "oklch(0.60 0.008 260)" }}>{user?.name}</span>
        </div>
      </nav>

      <div className="pt-20 container py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Users size={18} />, label: "Total Leads", value: leadsData?.total ?? 0, color: "oklch(0.60 0.20 255)" },
            { icon: <TrendingUp size={18} />, label: "Used This Month", value: leadsUsed, color: "oklch(0.78 0.18 85)" },
            { icon: <Star size={18} />, label: "Remaining", value: leadsLimit === 99999 ? "∞" : leadsRemaining, color: "oklch(0.65 0.18 145)" },
            { icon: <Zap size={18} />, label: "Plan", value: PLAN_LABEL[plan], color: PLAN_COLOR[plan] },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-lg" style={{ background: "oklch(0.18 0.012 260)", border: "1px solid oklch(0.26 0.012 260)" }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: s.color }}>{s.icon}<span className="text-xs uppercase tracking-widest font-semibold" style={{ fontFamily: "Syne, sans-serif" }}>{s.label}</span></div>
              <div className="text-2xl font-black" style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.95 0.005 260)" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Usage Bar */}
        {leadsLimit !== 99999 && (
          <div className="mb-6 p-4 rounded-lg" style={{ background: "oklch(0.18 0.012 260)", border: "1px solid oklch(0.26 0.012 260)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(0.58 0.012 260)", fontFamily: "Syne, sans-serif" }}>Monthly Usage</span>
              <span className="text-xs" style={{ color: "oklch(0.60 0.008 260)" }}>{leadsUsed} / {leadsLimit} leads</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.22 0.012 260)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${usagePct}%`, background: usagePct > 80 ? "oklch(0.65 0.22 25)" : "oklch(0.78 0.18 85)" }} />
            </div>
            {usagePct > 80 && (
              <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: "oklch(0.65 0.22 25)" }}>
                <AlertCircle size={12} /> Running low — <button onClick={() => checkoutMutation.mutate({ plan: plan === "free" ? "pro" : plan === "pro" ? "pro_plus" : "agency" } as { plan: "pro" | "pro_plus" | "agency" })} className="underline font-semibold">upgrade now</button>
              </div>
            )}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "oklch(0.95 0.005 260)" }}>Your Leads</h1>
          <div className="flex gap-3">
            {plan !== "agency" && (
              <button
                onClick={() => {
                  const next = plan === "free" ? "pro" : plan === "pro" ? "pro_plus" : "agency";
                  checkoutMutation.mutate({ plan: next as "pro" | "pro_plus" | "agency" });
                }}
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-bold transition-all"
                style={{ background: "oklch(0.78 0.18 85 / 0.15)", color: "oklch(0.78 0.18 85)", border: "1px solid oklch(0.78 0.18 85 / 0.4)", fontFamily: "Syne, sans-serif" }}
              >
                <Zap size={14} /> Upgrade Plan
              </button>
            )}
            {plan !== "free" && (
              <button onClick={() => portalMutation.mutate()} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-all"
                style={{ background: "oklch(0.22 0.012 260)", color: "oklch(0.68 0.008 260)", border: "1px solid oklch(0.30 0.012 260)" }}>
                Manage Billing
              </button>
            )}
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-all"
              style={{ background: "oklch(0.22 0.012 260)", color: "oklch(0.68 0.008 260)", border: "1px solid oklch(0.30 0.012 260)" }}>
              <Download size={14} /> Export CSV
            </button>
            <PaywallGate sub={sub} isAuthenticated={isAuthenticated} onAllowed={() => setShowAddModal(true)}>
              <button className="flex items-center gap-2 px-4 py-2 rounded text-sm font-bold transition-all"
                style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Syne, sans-serif" }}>
                <Plus size={14} /> Add Lead
              </button>
            </PaywallGate>
          </div>
        </div>

        {/* Leads Table */}
        {leadsLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" style={{ color: "oklch(0.78 0.18 85)" }} size={28} /></div>
        ) : !leadsData?.items?.length ? (
          <div className="text-center py-20 rounded-lg" style={{ background: "oklch(0.18 0.012 260)", border: "1px solid oklch(0.26 0.012 260)" }}>
            <Users size={40} style={{ color: "oklch(0.35 0.012 260)", margin: "0 auto 1rem" }} />
            <p style={{ color: "oklch(0.55 0.008 260)", fontFamily: "Syne, sans-serif", fontWeight: 600 }}>No leads yet</p>
            <p className="text-sm mt-1" style={{ color: "oklch(0.40 0.008 260)" }}>Use the query builder on the home page, then add leads here.</p>
            <PaywallGate sub={sub} isAuthenticated={isAuthenticated} onAllowed={() => setShowAddModal(true)}>
              <button className="mt-4 px-5 py-2 rounded text-sm font-bold"
                style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Syne, sans-serif" }}>
                Add Your First Lead
              </button>
            </PaywallGate>
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid oklch(0.26 0.012 260)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "oklch(0.18 0.012 260)", borderBottom: "1px solid oklch(0.26 0.012 260)" }}>
                    {["Name & Title","Company","Contact","Score","Status","Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "oklch(0.50 0.010 260)", fontFamily: "Syne, sans-serif" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leadsData.items.map((lead, i) => (
                    <tr key={lead.id} style={{ background: i % 2 === 0 ? "oklch(0.15 0.012 260)" : "oklch(0.17 0.012 260)", borderBottom: "1px solid oklch(0.22 0.012 260)" }}>
                      <td className="px-4 py-3">
                        <div className="font-semibold" style={{ color: "oklch(0.92 0.005 260)" }}>{lead.fullName ?? "—"}</div>
                        <div className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.008 260)" }}>{lead.title ?? ""}</div>
                        {lead.linkedinUrl && (
                          <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs mt-1" style={{ color: "oklch(0.60 0.20 255)" }}>
                            LinkedIn <ExternalLink size={10} />
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div style={{ color: "oklch(0.75 0.008 260)" }}>{lead.company ?? "—"}</div>
                        {lead.companyDomain && <div className="text-xs" style={{ color: "oklch(0.45 0.008 260)" }}>{lead.companyDomain}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {lead.emailVerified ? (
                          <div className="flex items-center gap-1 text-xs" style={{ color: "oklch(0.65 0.18 145)" }}>
                            <Mail size={11} /> <span className="font-mono">{lead.emailVerified}</span>
                            <span className="ml-1 px-1 rounded text-xs" style={{ background: "oklch(0.65 0.18 145 / 0.15)", color: "oklch(0.65 0.18 145)" }}>✓ verified</span>
                          </div>
                        ) : lead.emailUnverified ? (
                          <div className="flex items-center gap-1 text-xs" style={{ color: "oklch(0.68 0.008 260)" }}>
                            <Mail size={11} /> <span className="font-mono">{lead.emailUnverified}</span>
                            <span className="ml-1 px-1 rounded text-xs" style={{ background: "oklch(0.78 0.18 85 / 0.12)", color: "oklch(0.78 0.18 85)" }}>unverified</span>
                          </div>
                        ) : !canEnrich ? (
                          <span className="text-xs" style={{ color: "oklch(0.40 0.008 260)" }}>Upgrade for email</span>
                        ) : (
                          <span className="text-xs" style={{ color: "oklch(0.40 0.008 260)" }}>Not enriched</span>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-xs mt-1" style={{ color: "oklch(0.65 0.18 145)" }}>
                            <Phone size={11} /> {lead.phone}
                          </div>
                        )}
                        {!lead.phone && !hasVerified && lead.emailVerified && (
                          <div className="text-xs mt-1" style={{ color: "oklch(0.40 0.008 260)" }}>Upgrade for phone</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                          style={{ background: `${SCORE_COLOR[lead.relevanceScore ?? "medium"]}20`, color: SCORE_COLOR[lead.relevanceScore ?? "medium"] }}>
                          {lead.relevanceScore ?? "medium"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs capitalize" style={{ color: lead.enrichmentStatus === "enriched" ? "oklch(0.65 0.18 145)" : "oklch(0.50 0.008 260)" }}>
                          {lead.enrichmentStatus?.replace("_", " ") ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {canEnrich && lead.enrichmentStatus !== "enriched" && (
                            <button
                              onClick={() => enrichMutation.mutate({ leadId: lead.id })}
                              disabled={enrichMutation.isPending}
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all"
                              style={{ background: "oklch(0.78 0.18 85 / 0.15)", color: "oklch(0.78 0.18 85)", border: "1px solid oklch(0.78 0.18 85 / 0.3)" }}
                            >
                              {enrichMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
                              Enrich
                            </button>
                          )}
                          <button
                            onClick={() => deleteMutation.mutate({ leadId: lead.id })}
                            className="p-1 rounded transition-all"
                            style={{ color: "oklch(0.45 0.008 260)" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tier upsell notice for free users */}
        {plan === "free" && (
          <div className="mt-6 p-5 rounded-lg" style={{ background: "oklch(0.78 0.18 85 / 0.06)", border: "1px solid oklch(0.78 0.18 85 / 0.25)" }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-bold" style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.92 0.005 260)" }}>Want emails and phone numbers?</p>
                <p className="text-sm mt-1" style={{ color: "oklch(0.60 0.008 260)" }}>
                  Scout Pro adds unverified emails. Scout Pro+ adds verified emails + phone via Apollo. Agency is unlimited.
                </p>
              </div>
              <button onClick={() => checkoutMutation.mutate({ plan: "pro" })}
                className="px-5 py-2.5 rounded font-bold text-sm whitespace-nowrap"
                style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Syne, sans-serif" }}>
                Upgrade to Pro — $47/mo
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => { refetchLeads(); refetchSub(); setShowAddModal(false); }}
        />
      )}
    </div>
  );
}
