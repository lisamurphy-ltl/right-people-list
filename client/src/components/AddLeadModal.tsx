import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddLeadModal({ onClose, onAdded }: Props) {
  const [form, setForm] = useState({
    fullName: "", title: "", linkedinUrl: "", headline: "",
    location: "", company: "", companyDomain: "",
    relevanceScore: "medium" as "high" | "medium" | "low",
    searchQuery: "",
  });

  const addMutation = trpc.leads.add.useMutation({
    onSuccess: () => { toast.success("Lead added!"); onAdded(); },
    onError: (e) => toast.error(e.message),
  });

  const field = (key: keyof typeof form, label: string, placeholder = "") => (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest mb-1"
        style={{ color: "oklch(0.55 0.010 260)", fontFamily: "Archivo, sans-serif" }}>{label}</label>
      <input
        value={form[key] as string}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded text-sm outline-none transition-all"
        style={{ background: "oklch(0.22 0.014 260)", border: "1px solid oklch(0.30 0.012 260)", color: "oklch(0.90 0.005 260)" }}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "oklch(0 0 0 / 0.7)" }}>
      <div className="w-full max-w-lg rounded-xl p-6" style={{ background: "oklch(0.18 0.012 260)", border: "1px solid oklch(0.28 0.012 260)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, color: "oklch(0.95 0.005 260)" }}>Add Lead</h2>
          <button onClick={onClose} style={{ color: "oklch(0.50 0.008 260)" }}><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {field("fullName", "Full Name", "Jane Smith")}
          {field("title", "Title", "Founder / CEO")}
          {field("company", "Company", "Acme Consulting")}
          {field("companyDomain", "Company Domain", "acmeconsulting.com")}
          {field("linkedinUrl", "LinkedIn URL", "https://linkedin.com/in/...")}
          {field("location", "Location", "United States")}
        </div>

        <div className="mt-3">
          <label className="block text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: "oklch(0.55 0.010 260)", fontFamily: "Archivo, sans-serif" }}>Relevance Score</label>
          <div className="flex gap-2">
            {(["high", "medium", "low"] as const).map(s => (
              <button key={s} onClick={() => setForm(f => ({ ...f, relevanceScore: s }))}
                className="px-3 py-1.5 rounded text-xs font-semibold capitalize transition-all"
                style={{
                  background: form.relevanceScore === s ? "oklch(0.78 0.18 85 / 0.18)" : "oklch(0.22 0.014 260)",
                  color: form.relevanceScore === s ? "oklch(0.78 0.18 85)" : "oklch(0.60 0.008 260)",
                  border: `1px solid ${form.relevanceScore === s ? "oklch(0.78 0.18 85 / 0.5)" : "oklch(0.30 0.012 260)"}`,
                }}>{s}</button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded text-sm font-semibold"
            style={{ background: "oklch(0.22 0.012 260)", color: "oklch(0.65 0.008 260)", border: "1px solid oklch(0.30 0.012 260)" }}>
            Cancel
          </button>
          <button
            onClick={() => addMutation.mutate(form)}
            disabled={addMutation.isPending || !form.fullName}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-sm font-bold"
            style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Archivo, sans-serif", opacity: addMutation.isPending || !form.fullName ? 0.6 : 1 }}
          >
            {addMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            Add Lead
          </button>
        </div>
      </div>
    </div>
  );
}
