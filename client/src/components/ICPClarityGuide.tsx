import { useState } from "react";
import { X, ChevronRight, ChevronLeft, Lightbulb, Target, Users, ArrowRight } from "lucide-react";

interface Props {
  onClose: () => void;
}

const STEPS = [
  {
    id: 1,
    icon: <Target size={28} />,
    title: "Who do you actually help?",
    subtitle: "Not 'everyone' — be ruthless here.",
    question: "Describe the person you've gotten the BEST results for. What was their role, industry, and situation?",
    placeholder: "e.g. 'A founder of a 5-person marketing agency who was drowning in client work and couldn't step back from delivery...'",
    tip: "Think about your top 3 clients ever. What did they have in common?",
    field: "bestClient",
  },
  {
    id: 2,
    icon: <Lightbulb size={28} />,
    title: "What problem were they trying to solve?",
    subtitle: "The one they'd pay to fix at 11pm on a Tuesday.",
    question: "What was the painful, urgent problem they came to you with? Use their words, not yours.",
    placeholder: "e.g. 'They were working 60+ hours a week, couldn't hire fast enough, and felt like the business would collapse if they took a vacation...'",
    tip: "Pain that's urgent + expensive + embarrassing = the sweet spot. If they'd Google it at midnight, you're on the right track.",
    field: "coreProblem",
  },
  {
    id: 3,
    icon: <Users size={28} />,
    title: "Where do they hang out?",
    subtitle: "Online and offline. Where are they already gathering?",
    question: "Where does your ideal client spend time, ask questions, and look for solutions?",
    placeholder: "e.g. 'LinkedIn (posts about team building), Facebook groups for agency owners, attends mastermind events, listens to business podcasts...'",
    tip: "This tells you exactly where to point The Right-People List's search queries.",
    field: "hangouts",
  },
  {
    id: 4,
    icon: <ArrowRight size={28} />,
    title: "Your ICP snapshot",
    subtitle: "Here's what you've built. Now go find them.",
    question: null,
    placeholder: null,
    tip: null,
    field: null,
  },
];

export default function ICPClarityGuide({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    bestClient: "",
    coreProblem: "",
    hangouts: "",
  });

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const canNext = current.field ? answers[current.field]?.trim().length > 10 : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "oklch(0 0 0 / 0.75)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-xl rounded-2xl overflow-hidden"
        style={{ background: "oklch(0.17 0.012 260)", border: "1px solid oklch(0.28 0.012 260)", boxShadow: "0 25px 60px oklch(0 0 0 / 0.5)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid oklch(0.24 0.012 260)", background: "oklch(0.15 0.012 260)" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "oklch(0.78 0.18 85)", fontFamily: "Syne, sans-serif" }}>
              ICP Clarity Guide — Free
            </p>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.45 0.008 260)" }}>
              Step {step + 1} of {STEPS.length}
            </p>
          </div>
          <button onClick={onClose} style={{ color: "oklch(0.45 0.008 260)" }} className="hover:opacity-70 transition-opacity">
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1" style={{ background: "oklch(0.22 0.012 260)" }}>
          <div className="h-full transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: "oklch(0.78 0.18 85)" }} />
        </div>

        {/* Content */}
        <div className="p-6">
          {!isLast ? (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "oklch(0.78 0.18 85 / 0.12)", color: "oklch(0.78 0.18 85)" }}>
                  {current.icon}
                </div>
                <div>
                  <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "oklch(0.95 0.005 260)" }}>
                    {current.title}
                  </h2>
                  <p className="text-sm" style={{ color: "oklch(0.55 0.008 260)" }}>{current.subtitle}</p>
                </div>
              </div>

              <p className="text-sm mb-3 font-medium" style={{ color: "oklch(0.78 0.008 260)" }}>
                {current.question}
              </p>

              <textarea
                rows={4}
                value={answers[current.field!] ?? ""}
                onChange={e => setAnswers(a => ({ ...a, [current.field!]: e.target.value }))}
                placeholder={current.placeholder ?? ""}
                className="w-full px-4 py-3 rounded-lg text-sm resize-none outline-none transition-all"
                style={{
                  background: "oklch(0.21 0.014 260)",
                  border: "1px solid oklch(0.30 0.012 260)",
                  color: "oklch(0.88 0.005 260)",
                  lineHeight: 1.6,
                }}
              />

              {current.tip && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-lg"
                  style={{ background: "oklch(0.60 0.20 255 / 0.07)", border: "1px solid oklch(0.60 0.20 255 / 0.20)" }}>
                  <Lightbulb size={13} style={{ color: "oklch(0.60 0.20 255)", marginTop: "2px", flexShrink: 0 }} />
                  <p className="text-xs leading-relaxed" style={{ color: "oklch(0.60 0.008 260)" }}>{current.tip}</p>
                </div>
              )}
            </>
          ) : (
            /* Summary / Final Step */
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "oklch(0.65 0.18 145 / 0.12)", color: "oklch(0.65 0.18 145)" }}>
                  <Target size={28} />
                </div>
                <div>
                  <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "oklch(0.95 0.005 260)" }}>
                    Your ICP snapshot
                  </h2>
                  <p className="text-sm" style={{ color: "oklch(0.55 0.008 260)" }}>Here's what you've built. Now go find them.</p>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                {[
                  { label: "Who they are", value: answers.bestClient },
                  { label: "Their core problem", value: answers.coreProblem },
                  { label: "Where they hang out", value: answers.hangouts },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-lg"
                    style={{ background: "oklch(0.21 0.012 260)", border: "1px solid oklch(0.28 0.012 260)" }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                      style={{ color: "oklch(0.78 0.18 85)", fontFamily: "Syne, sans-serif" }}>{item.label}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "oklch(0.75 0.008 260)" }}>
                      {item.value || <span style={{ color: "oklch(0.40 0.008 260)", fontStyle: "italic" }}>Not filled in</span>}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-lg mb-4"
                style={{ background: "oklch(0.78 0.18 85 / 0.08)", border: "1px solid oklch(0.78 0.18 85 / 0.25)" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "oklch(0.90 0.005 260)", fontFamily: "Syne, sans-serif" }}>
                  Next step: Use the query builder below
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "oklch(0.60 0.008 260)" }}>
                  Take what you just wrote and translate it into the role, industry, and pain keyword tags in the The Right-People List query builder. Your "where they hang out" answer tells you which keywords to prioritize.
                </p>
              </div>

              <div className="p-4 rounded-lg"
                style={{ background: "oklch(0.60 0.20 255 / 0.06)", border: "1px solid oklch(0.60 0.20 255 / 0.20)" }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{ color: "oklch(0.60 0.20 255)", fontFamily: "Syne, sans-serif" }}>Still fuzzy on your ICP?</p>
                <p className="text-xs leading-relaxed" style={{ color: "oklch(0.55 0.008 260)" }}>
                  The Client Engine Builder walks you through a full ICP architecture session — positioning, messaging, and offer alignment. It's the deeper work that makes this tool 10x more powerful.
                </p>
                <p className="text-xs mt-2 font-semibold" style={{ color: "oklch(0.60 0.20 255)" }}>
                  → Available in the Client Engine Suite bundle
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: "1px solid oklch(0.24 0.012 260)" }}>
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-all"
            style={{ background: "oklch(0.22 0.012 260)", color: "oklch(0.65 0.008 260)", border: "1px solid oklch(0.30 0.012 260)" }}>
            <ChevronLeft size={14} />
            {step === 0 ? "Cancel" : "Back"}
          </button>

          {!isLast ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext}
              className="flex items-center gap-2 px-5 py-2 rounded text-sm font-bold transition-all"
              style={{
                background: canNext ? "oklch(0.78 0.18 85)" : "oklch(0.30 0.012 260)",
                color: canNext ? "oklch(0.13 0.012 260)" : "oklch(0.45 0.008 260)",
                fontFamily: "Syne, sans-serif",
                cursor: canNext ? "pointer" : "not-allowed",
              }}>
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2 rounded text-sm font-bold"
              style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Syne, sans-serif" }}>
              Build My Query <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
