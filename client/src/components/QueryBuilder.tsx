import { useState, useCallback } from "react";
import { Copy, Check, Loader2, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const ROLES = ["Founder", "Owner", "CEO", "President", "Managing Director", "Principal"];
const INDUSTRIES = ["Coaching", "Consulting", "Marketing Agency", "PR Agency", "Staffing", "Financial Advisory", "Legal Services", "Accounting", "IT Services", "Real Estate"];
const PAIN_KEYWORDS = ["scale", "scaling", "burnout", "growth", "overworked", "systems", "hiring", "stuck", "overwhelmed", "team", "delegation", "revenue"];
const LOCATIONS = ["United States", "Canada", "United Kingdom", "Australia", "Remote"];
const COMPANY_SIZES = ["Solopreneur", "Boutique agency", "Small team", "Growing team", "Established firm"];

function buildQuery(roles: string[], industries: string[], pains: string[], location: string, companySize: string): string {
  const roleStr = roles.length > 0 ? `(${roles.map(r => `"${r}"`).join(" OR ")})` : `("Founder" OR "Owner" OR "CEO")`;
  const indStr = industries.length > 0 ? `(${industries.map(i => `"${i}"`).join(" OR ")})` : `("Consulting" OR "Coaching" OR "Agency")`;
  const painStr = pains.length > 0 ? `(${pains.slice(0, 5).map(p => `"${p}"`).join(" OR ")})` : `("scale" OR "burnout" OR "growth")`;
  const locStr = location ? `"${location}"` : `"United States"`;
  const sizeStr = companySize ? ` "${companySize.toLowerCase()}"` : "";
  return `site:linkedin.com/in/ ${roleStr} ${indStr} ${painStr} ${locStr}${sizeStr}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all duration-200"
      style={{
        background: copied ? "oklch(0.78 0.18 85 / 0.15)" : "oklch(0.28 0.012 260)",
        color: copied ? "oklch(0.78 0.18 85)" : "oklch(0.72 0.005 260)",
        border: `1px solid ${copied ? "oklch(0.78 0.18 85 / 0.5)" : "oklch(0.35 0.012 260)"}`,
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied!" : "Copy Query"}
    </button>
  );
}

function TagSelector({
  label, options, selected, onToggle,
}: { label: string; options: string[]; selected: string[]; onToggle: (val: string) => void }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "oklch(0.58 0.012 260)", fontFamily: "Archivo, sans-serif" }}>
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className="px-3 py-1 rounded-full text-sm font-medium transition-all duration-150"
              style={{
                background: active ? "oklch(0.78 0.18 85 / 0.18)" : "oklch(0.22 0.014 260)",
                color: active ? "oklch(0.78 0.18 85)" : "oklch(0.68 0.008 260)",
                border: `1px solid ${active ? "oklch(0.78 0.18 85 / 0.6)" : "oklch(0.30 0.012 260)"}`,
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function QueryBuilder() {
  const [roles, setRoles] = useState<string[]>(["Founder", "Owner", "CEO"]);
  const [industries, setIndustries] = useState<string[]>(["Coaching", "Consulting"]);
  const [pains, setPains] = useState<string[]>(["scale", "burnout", "growth"]);
  const [location, setLocation] = useState("United States");
  const [companySize, setCompanySize] = useState("");

  const toggle = (arr: string[], val: string, set: (a: string[]) => void) => {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const query = buildQuery(roles, industries, pains, location, companySize);
  const utils = trpc.useUtils();

  const searchMutation = trpc.leads.runSearch.useMutation({
    onSuccess: (data) => {
      utils.leads.list.invalidate();
      utils.subscription.get.invalidate();
      if (data.added > 0) {
        toast.success(`Found ${data.found} matching profiles — added ${data.added} new leads to your list.`);
      } else {
        toast.info(`Found ${data.found} matching profiles, but they're all already in your list.`);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="mb-8 p-7 rounded-lg" style={{ background: "oklch(0.18 0.012 260)", border: "1px solid oklch(0.26 0.012 260)" }}>
      <h2 className="mb-1" style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "oklch(0.95 0.005 260)" }}>
        Build Your ICP Query
      </h2>
      <p className="mb-6 text-sm" style={{ color: "oklch(0.60 0.008 260)" }}>
        Select the tags that match your ideal client. Your query updates in real time.
      </p>

      <div className="grid lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3">
          <TagSelector label="Job Titles / Roles" options={ROLES} selected={roles} onToggle={(v) => toggle(roles, v, setRoles)} />
          <TagSelector label="Industry / Niche" options={INDUSTRIES} selected={industries} onToggle={(v) => toggle(industries, v, setIndustries)} />
          <TagSelector label="Pain Point Keywords" options={PAIN_KEYWORDS} selected={pains} onToggle={(v) => toggle(pains, v, setPains)} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "oklch(0.58 0.012 260)", fontFamily: "Archivo, sans-serif" }}>Location</p>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  onClick={() => setLocation(loc)}
                  className="px-3 py-1 rounded-full text-sm font-medium transition-all duration-150"
                  style={{
                    background: location === loc ? "oklch(0.60 0.20 255 / 0.18)" : "oklch(0.22 0.014 260)",
                    color: location === loc ? "oklch(0.60 0.20 255)" : "oklch(0.68 0.008 260)",
                    border: `1px solid ${location === loc ? "oklch(0.60 0.20 255 / 0.6)" : "oklch(0.30 0.012 260)"}`,
                  }}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "oklch(0.58 0.012 260)", fontFamily: "Archivo, sans-serif" }}>
              Company Size <span style={{ textTransform: "none", fontWeight: 400, color: "oklch(0.45 0.008 260)" }}>(optional — narrows results further)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {COMPANY_SIZES.map((size) => {
                const active = companySize === size;
                return (
                  <button
                    key={size}
                    onClick={() => setCompanySize(active ? "" : size)}
                    className="px-3 py-1 rounded-full text-sm font-medium transition-all duration-150"
                    style={{
                      background: active ? "oklch(0.65 0.18 145 / 0.18)" : "oklch(0.22 0.014 260)",
                      color: active ? "oklch(0.65 0.18 145)" : "oklch(0.68 0.008 260)",
                      border: `1px solid ${active ? "oklch(0.65 0.18 145 / 0.6)" : "oklch(0.30 0.012 260)"}`,
                    }}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(0.78 0.18 85)", fontFamily: "Archivo, sans-serif" }}>
              Your Search Query
            </p>
            <CopyButton text={query} />
          </div>
          <div className="query-block mb-5 min-h-[100px]">{query}</div>
          <button
            onClick={() => searchMutation.mutate({ roles, industries, pains, location, companySize })}
            disabled={searchMutation.isPending}
            className="flex items-center justify-center gap-2 w-full py-3 rounded font-bold text-sm transition-all duration-160"
            style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Archivo, sans-serif", opacity: searchMutation.isPending ? 0.7 : 1 }}
          >
            {searchMutation.isPending
              ? (<><Loader2 size={15} className="animate-spin" /> Finding your leads…</>)
              : (<><Sparkles size={15} /> Find My Leads</>)}
          </button>
          <p className="mt-4 text-xs text-center" style={{ color: "oklch(0.45 0.008 260)" }}>
            We run the search for you and add matches straight to your list below.
          </p>
        </div>
      </div>
    </div>
  );
}
