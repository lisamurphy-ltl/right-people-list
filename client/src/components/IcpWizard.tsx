import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Pencil, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Answers, Question, QUESTIONS, SECTIONS, buildOneSentenceIcp, questionsForSection,
} from "@/icpQuestionnaire";

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

// Anything in an answer array that isn't one of the question's predefined
// options is treated as the free-text "Other" entry, for hydrating the box.
function otherTextFor(q: Question, answers: Answers): string {
  const val = answers[q.id];
  const opts = q.options ?? [];
  if (q.type === "single") return typeof val === "string" && !opts.includes(val) ? val : "";
  const arr = asArray(val);
  return arr.find(v => !opts.includes(v)) ?? "";
}

export function isProfileReady(answers: Answers): boolean {
  const required = ["q1", "q2", "q3", "q15", "q18"];
  const hasRequired = required.every(id => {
    const v = answers[id];
    return Array.isArray(v) ? v.length > 0 : !!v?.trim();
  });
  return hasRequired && asArray(answers.q10).length > 0 && asArray(answers.q4).length > 0;
}

function mappedFields(answers: Answers) {
  const location = (answers.q7_metro as string) || (answers.q7_state as string) || (answers.q7_regional as string) || asArray(answers.q7)[0] || "";
  return {
    industry: asArray(answers.q4).join(", "),
    roles: asArray(answers.q10).join(", "),
    businessSize: asArray(answers.q6).join(", "),
    geography: location,
    activeSignals: asArray(answers.q9).join(", "),
    problemTheyreIn: (answers.q15 as string) || "",
    whatTheyLookLike: buildOneSentenceIcp(answers),
  };
}

function QuestionField({ q, answers, onChange, onCommit }: {
  q: Question;
  answers: Answers;
  onChange: (id: string, value: string | string[]) => void;
  onCommit: () => void;
}) {
  const [otherDraft, setOtherDraft] = useState(() => otherTextFor(q, answers));
  useEffect(() => { setOtherDraft(otherTextFor(q, answers)); }, [q.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = asArray(answers[q.id]);
  const charLimit = q.charLimit ?? (q.type === "long" ? 1000 : 120);

  const commitOther = (text: string) => {
    const opts = q.options ?? [];
    if (q.type === "single") {
      onChange(q.id, text.trim() || (selected[0] && opts.includes(selected[0]) ? selected[0] : ""));
    } else {
      const withoutOther = selected.filter(v => opts.includes(v));
      onChange(q.id, text.trim() ? [...withoutOther, text.trim()] : withoutOther);
    }
    onCommit();
  };

  const toggleOption = (opt: string) => {
    if (q.type === "single") {
      onChange(q.id, opt);
    } else {
      const next = selected.includes(opt) ? selected.filter(v => v !== opt) : [...selected, opt];
      onChange(q.id, next);
    }
    onCommit();
  };

  const labelId = `q-${q.id}-label`;
  const inputId = `q-${q.id}-input`;
  const otherId = `q-${q.id}-other`;
  const counterId = `q-${q.id}-counter`;
  const warningId = `q-${q.id}-warning`;
  const hasWarning = (q.maxSelections && selected.length > q.warnAtSelections!) || (q.warnAtSelections === 0 && selected.length === 0);

  return (
    <div className="mb-7">
      <p id={labelId} className="font-semibold mb-1" style={{ fontFamily: "Archivo, sans-serif", color: "oklch(0.92 0.005 260)", fontSize: "0.95rem" }}>
        {q.label} {q.required && (
          <span aria-hidden="true" style={{ color: "oklch(0.78 0.18 85)" }}>*</span>
        )}
        {q.required && <span className="sr-only"> (required)</span>}
      </p>
      {q.prompt && <p className="text-xs mb-3" style={{ color: "oklch(0.66 0.008 260)" }}>{q.prompt}</p>}

      {(q.type === "single" || q.type === "multi") && (
        <div
          className="flex flex-wrap gap-2 mb-2"
          role={q.type === "single" ? "radiogroup" : "group"}
          aria-labelledby={labelId}
          aria-describedby={hasWarning ? warningId : undefined}
        >
          {(q.options ?? []).map(opt => {
            const active = selected.includes(opt);
            const stateProps = q.type === "single"
              ? { role: "radio" as const, "aria-checked": active }
              : { "aria-pressed": active };
            return (
              <button key={opt} onClick={() => toggleOption(opt)} {...stateProps}
                className="px-3 py-1 rounded-full text-sm font-medium transition-all duration-150"
                style={{
                  background: active ? "oklch(0.78 0.18 85 / 0.18)" : "oklch(0.22 0.014 260)",
                  color: active ? "oklch(0.78 0.18 85)" : "oklch(0.68 0.008 260)",
                  border: `1px solid ${active ? "oklch(0.78 0.18 85 / 0.6)" : "oklch(0.30 0.012 260)"}`,
                }}>
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {(q.type === "single" || q.type === "multi") && q.otherEnabled !== false && (
        <>
          <label htmlFor={otherId} className="sr-only">{q.otherLabel ?? `Other, for ${q.label}`}</label>
          <input
            id={otherId}
            value={otherDraft}
            onChange={e => setOtherDraft(e.target.value.slice(0, 120))}
            onBlur={() => commitOther(otherDraft)}
            placeholder={q.otherLabel ?? "Other (type your own)"}
            className="w-full px-3 py-2 rounded text-sm mt-1"
            style={{ background: "oklch(0.14 0.012 260)", border: "1px solid oklch(0.28 0.012 260)", color: "oklch(0.85 0.008 260)" }}
          />
        </>
      )}

      {q.type === "short" && (
        <>
          <label htmlFor={inputId} className="sr-only">{q.label}</label>
          <input
            id={inputId}
            value={(answers[q.id] as string) ?? ""}
            onChange={e => onChange(q.id, e.target.value.slice(0, charLimit))}
            onBlur={onCommit}
            className="w-full px-3 py-2 rounded text-sm"
            style={{ background: "oklch(0.14 0.012 260)", border: "1px solid oklch(0.28 0.012 260)", color: "oklch(0.85 0.008 260)" }}
          />
        </>
      )}

      {q.type === "long" && (
        <>
          <label htmlFor={inputId} className="sr-only">{q.label}</label>
          <textarea
            id={inputId}
            value={(answers[q.id] as string) ?? ""}
            onChange={e => onChange(q.id, e.target.value.slice(0, charLimit))}
            onBlur={onCommit}
            rows={4}
            aria-describedby={counterId}
            className="w-full px-3 py-2 rounded text-sm"
            style={{ background: "oklch(0.14 0.012 260)", border: "1px solid oklch(0.28 0.012 260)", color: "oklch(0.85 0.008 260)" }}
          />
          <p id={counterId} className="text-xs text-right mt-1" style={{ color: "oklch(0.62 0.008 260)" }}>
            {((answers[q.id] as string) ?? "").length} / {charLimit} characters
          </p>
        </>
      )}

      {q.maxSelections && selected.length > q.warnAtSelections! && (
        <p id={warningId} className="text-xs mt-2" role="status" style={{ color: "oklch(0.70 0.20 60)" }}>
          That's {selected.length} industries — more than {q.warnAtSelections} isn't a niche, it's a phone book. Consider narrowing.
        </p>
      )}
      {q.warnAtSelections === 0 && selected.length === 0 && (
        <p id={warningId} className="text-xs mt-2" role="status" style={{ color: "oklch(0.70 0.20 60)" }}>Pick at least one title — this is what actually drives the search.</p>
      )}
    </div>
  );
}

export default function IcpWizard({ onComplete }: { onComplete?: () => void }) {
  const { data: profile, isLoading } = trpc.icpProfile.get.useQuery();
  const utils = trpc.useUtils();
  const [answers, setAnswers] = useState<Answers>({});
  const [sectionIdx, setSectionIdx] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (profile && !hydrated) {
      setAnswers(profile.answers ?? {});
      setHydrated(true);
    }
  }, [profile, hydrated]);

  const saveMutation = trpc.icpProfile.save.useMutation({
    onSuccess: () => utils.icpProfile.get.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const persist = (next: Answers, activate?: boolean) => {
    const cleaned: Record<string, string | string[]> = {};
    for (const [k, v] of Object.entries(next)) {
      if (v !== undefined) cleaned[k] = v;
    }
    saveMutation.mutate({ answers: cleaned, ...mappedFields(next), isActive: activate });
  };

  const updateAnswer = (id: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const section = SECTIONS[sectionIdx];
  const visibleQuestions = useMemo(() => questionsForSection(section.id, answers), [section.id, answers]);
  const isLastSection = sectionIdx === SECTIONS.length - 1;
  const ready = isProfileReady(answers);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12" role="status" aria-live="polite">
        <Loader2 className="animate-spin" style={{ color: "oklch(0.78 0.18 85)" }} aria-hidden="true" />
        <span className="sr-only">Loading your ICP profile…</span>
      </div>
    );
  }

  return (
    <div className="mb-8 p-7 rounded-lg" style={{ background: "oklch(0.18 0.012 260)", border: "1px solid oklch(0.26 0.012 260)" }}>
      <div className="flex items-center justify-between mb-1">
        <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "oklch(0.95 0.005 260)" }}>
          ICP Discovery
        </h2>
        <span className="text-xs font-semibold" style={{ color: "oklch(0.66 0.008 260)" }}>
          Section {sectionIdx + 1} of {SECTIONS.length}
        </span>
      </div>

      {/* Section stepper */}
      <div className="flex gap-1 mb-6" role="tablist" aria-label="ICP Discovery sections">
        {SECTIONS.map((s, i) => (
          <button key={s.id} onClick={() => setSectionIdx(i)}
            role="tab"
            aria-selected={i === sectionIdx}
            aria-label={`Section ${i + 1}: ${s.title}`}
            className="flex-1 h-1.5 rounded-full transition-all"
            style={{ background: i <= sectionIdx ? "oklch(0.78 0.18 85)" : "oklch(0.28 0.012 260)" }} />
        ))}
      </div>

      <p className="mb-1 font-bold" style={{ fontFamily: "Archivo, sans-serif", color: "oklch(0.78 0.18 85)" }}>{section.title}</p>
      <p className="mb-6 text-sm" style={{ color: "oklch(0.60 0.008 260)" }}>{section.blurb}</p>

      {visibleQuestions.map(q => (
        <QuestionField key={q.id} q={q} answers={answers} onChange={updateAnswer} onCommit={() => persist(answers)} />
      ))}

      <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: "1px solid oklch(0.26 0.012 260)" }}>
        <button
          onClick={() => setSectionIdx(i => Math.max(0, i - 1))}
          disabled={sectionIdx === 0}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold"
          style={{ background: "oklch(0.22 0.012 260)", color: "oklch(0.68 0.008 260)", border: "1px solid oklch(0.30 0.012 260)", opacity: sectionIdx === 0 ? 0.4 : 1 }}>
          <ArrowLeft size={14} aria-hidden="true" /> Back
        </button>

        {!isLastSection ? (
          <button
            onClick={() => { persist(answers); setSectionIdx(i => Math.min(SECTIONS.length - 1, i + 1)); }}
            className="flex items-center gap-2 px-5 py-2 rounded text-sm font-bold"
            style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Archivo, sans-serif" }}>
            Next <ArrowRight size={14} aria-hidden="true" />
          </button>
        ) : (
          <button
            onClick={() => { persist(answers, true); toast.success("ICP profile saved!"); onComplete?.(); }}
            disabled={!ready || saveMutation.isPending}
            aria-describedby={!ready ? "icp-finish-warning" : undefined}
            className="flex items-center gap-2 px-5 py-2 rounded text-sm font-bold"
            style={{ background: ready ? "oklch(0.78 0.18 85)" : "oklch(0.30 0.012 260)", color: ready ? "oklch(0.13 0.012 260)" : "oklch(0.50 0.008 260)", fontFamily: "Archivo, sans-serif" }}>
            {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Check size={14} aria-hidden="true" />} Finish
          </button>
        )}
      </div>
      {!ready && isLastSection && (
        <p id="icp-finish-warning" className="text-xs mt-3 text-right" style={{ color: "oklch(0.70 0.20 60)" }}>
          Fill in Q1–Q3, Q15, Q18, at least one job title (Q10), and at least one industry (Q4) to finish.
        </p>
      )}
    </div>
  );
}

export function IcpSummaryCard({ onEdit }: { onEdit: () => void }) {
  const { data: profile } = trpc.icpProfile.get.useQuery();
  if (!profile) return null;
  const summary = profile.whatTheyLookLike || buildOneSentenceIcp(profile.answers ?? {});

  return (
    <div className="mb-8 p-6 rounded-lg" style={{ background: "oklch(0.18 0.012 260)", border: "1px solid oklch(0.26 0.012 260)" }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <Sparkles size={18} style={{ color: "oklch(0.78 0.18 85)", marginTop: "0.15rem" }} aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "oklch(0.78 0.18 85)", fontFamily: "Archivo, sans-serif" }}>
              Your ICP
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "oklch(0.85 0.008 260)" }}>{summary}</p>
          </div>
        </div>
        <button onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold shrink-0"
          style={{ background: "oklch(0.22 0.012 260)", color: "oklch(0.68 0.008 260)", border: "1px solid oklch(0.30 0.012 260)" }}>
          <Pencil size={13} aria-hidden="true" /> Edit ICP
        </button>
      </div>
    </div>
  );
}
