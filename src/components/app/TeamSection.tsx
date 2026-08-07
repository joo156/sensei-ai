import { motion } from "motion/react";
import { Github, Linkedin, Sparkles } from "lucide-react";
import sprintsLogo from "@/assets/sprints-logo.png";

export interface TeamMember {
  name: string;
  role: string;
  focus: string;
  contribution: string;
  initials: string;
  linkedin: string;
  github: string;
}

export const TEAM: TeamMember[] = [
  {
    name: "Nour Atef",
    role: "RAG Engineer",
    focus: "Retrieval pipeline",
    contribution:
      "Designed the ingestion pipeline — document parsing, semantic chunking and the hybrid retriever that keeps every generated answer tied to a real passage.",
    initials: "NA",
    linkedin: "https://linkedin.com",
    github: "https://github.com",
  },
  {
    name: "Yousef Alaa",
    role: "AI Agent Engineer & Frontend Engineer",
    focus: "Multi-agent system",
    contribution:
      "Built the seven study agents (Question Bank, Mentor, Test Help, Flashcards, Concept, Study Plan, Revision) and the prompt + model-routing layer behind them.",
    initials: "YA",
    linkedin: "https://linkedin.com",
    github: "https://github.com",
  },
  {
    name: "Name 3",
    role: "Frontend Engineer",
    focus: "Product interface",
    contribution:
      "Built the workspace experience: isolated project workspaces, the document explorer, interactive quizzes and the animated flashcard deck.",
    initials: "__",
    linkedin: "https://linkedin.com",
    github: "https://github.com",
  },
  {
    name: "Name 4",
    role: "Backend & Data Engineer",
    focus: "APIs & storage",
    contribution:
      "Owned the data model, embeddings store, generation history and the review workflow that records who approved what and when.",
    initials: "__",
    linkedin: "https://linkedin.com",
    github: "https://github.com",
  },
  {
    name: "Name 5",
    role: "Quality & Evaluation",
    focus: "Evaluation harness",
    contribution:
      "Created the evaluation set and review rubric, ran the model comparisons and tuned difficulty calibration across the question bank.",
    initials: "__",
    linkedin: "https://linkedin.com",
    github: "https://github.com",
  },
];

export function TeamSection({ id = "team" }: { id?: string }) {
  return (
    <section id={id} className="border-border/60 border-t">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <span className="border-border bg-card/70 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
            <Sparkles className="text-primary size-3.5" /> Meet the team
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
            Five students, one grounded learning platform
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Every part of this product — retrieval, agents, interface and evaluation — was designed
            and built by the team below.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((m, i) => (
            <motion.article
              key={m.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.07, duration: 0.45, ease: "easeOut" }}
              whileHover={{ y: -6 }}
              className="surface-card hover:border-primary/40 hover:shadow-elevated group relative overflow-hidden p-6 transition-all"
            >
              <span className="bg-primary/8 pointer-events-none absolute -top-16 -right-16 size-40 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              <div className="flex items-center gap-3">
                <motion.span
                  whileHover={{ rotate: -6, scale: 1.06 }}
                  className="bg-primary text-primary-foreground shadow-glow flex size-12 items-center justify-center rounded-2xl text-sm font-bold"
                >
                  {m.initials}
                </motion.span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{m.name}</h3>
                  <p className="text-primary truncate text-xs font-medium">{m.role}</p>
                </div>
              </div>
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed">{m.contribution}</p>
              <div className="text-muted-foreground mt-4 flex items-center gap-3 text-xs">
                <span className="border-border rounded-full border px-2 py-0.5">{m.focus}</span>
                <span className="ml-auto flex items-center gap-1.5">
                  <a
                    href={m.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${m.name} on LinkedIn`}
                    className="border-border text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/10 inline-flex size-7 items-center justify-center rounded-lg border transition-all hover:-translate-y-0.5"
                  >
                    <Linkedin className="size-3.5" />
                  </a>
                  <a
                    href={m.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${m.name} on GitHub`}
                    className="border-border text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/10 inline-flex size-7 items-center justify-center rounded-lg border transition-all hover:-translate-y-0.5"
                  >
                    <Github className="size-3.5" />
                  </a>
                </span>
              </div>
            </motion.article>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.35, duration: 0.45 }}
            className="surface-card flex flex-col justify-center gap-4 p-6"
          >
            <span className="self-start rounded-xl bg-white px-3 py-2 ring-1 ring-black/5">
              <img
                src={sprintsLogo}
                alt="Sprints AI logo"
                className="h-9 w-auto object-contain"
                loading="lazy"
              />
            </span>
            <p className="text-sm leading-relaxed">
              This platform was designed and engineered end to end by our team during the{" "}
              <strong>Sprints AI</strong> training programme — a hands-on apprenticeship where
              students ship a real, production-shaped AI product rather than a course exercise.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
