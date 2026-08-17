import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, BrainCircuit, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FWA Risk Investigator — AI Payment Integrity Platform" },
      {
        name: "description",
        content:
          "AI-powered Fraud, Waste & Abuse investigation platform for claims and providers with explainable risk scoring and expert review.",
      },
      { property: "og:title", content: "FWA Risk Investigator" },
      {
        property: "og:description",
        content: "AI-Powered Fraud, Waste & Abuse Investigation for claims and provider payment integrity.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="gradient-mesh pointer-events-none absolute inset-0" />
      <div className="grid-lines animate-drift pointer-events-none absolute -inset-40 opacity-70" />
      <div className="animate-pulse-soft pointer-events-none absolute -left-24 top-24 size-72 rounded-full bg-accent/20 blur-3xl" />
      <div
        className="animate-pulse-soft pointer-events-none absolute -right-16 bottom-10 size-80 rounded-full bg-primary/20 blur-3xl"
        style={{ animationDelay: "1.6s" }}
      />

      <header className="relative z-10 mx-auto flex w-full max-w-[1500px] items-center gap-3 px-6 py-6">
        <span className="gradient-navy flex size-9 items-center justify-center rounded-xl text-navy-foreground shadow-float">
          <ShieldCheck className="size-5" />
        </span>
        <span className="text-[12px] font-semibold tracking-[0.22em] text-foreground">
          FWA RISK INVESTIGATOR
        </span>
        <span className="ml-auto hidden text-xs text-muted-foreground sm:block">
          Enterprise Payment Integrity · v2.4
        </span>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <p className="animate-fade rounded-full border border-border bg-card/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent backdrop-blur">
          Fraud · Waste · Abuse Intelligence
        </p>

        <h1 className="animate-float mt-8">
          <span className="text-gradient-brand animate-rise block text-4xl font-semibold tracking-[0.06em] sm:text-6xl lg:text-7xl">
            FWA RISK INVESTIGATOR
          </span>
        </h1>

        <p
          className="animate-rise mt-6 text-base text-muted-foreground sm:text-xl"
          style={{ animationDelay: "160ms" }}
        >
          AI-Powered Fraud, Waste &amp; Abuse Investigation
        </p>

        <div className="animate-rise mt-10" style={{ animationDelay: "320ms" }}>
          <Link
            to="/login"
            className="group inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-semibold tracking-[0.12em] text-primary-foreground uppercase shadow-float transition-all duration-400 hover:-translate-y-1 hover:bg-primary/92 hover:shadow-lift"
          >
            Enter Secure Portal
            <ArrowRight className="size-4 transition-transform duration-400 group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="animate-rise mt-16 grid w-full gap-4 sm:grid-cols-3" style={{ animationDelay: "460ms" }}>
          {[
            { icon: BrainCircuit, title: "Explainable ML", body: "Anomaly scoring with signal-level attribution." },
            { icon: BarChart3, title: "Power BI Native", body: "Embedded dashboards for claims and providers." },
            { icon: ShieldCheck, title: "Expert Review", body: "Human-in-the-loop accept, reject, resubmit." },
          ].map((f) => (
            <div
              key={f.title}
              className="surface-panel p-5 text-left transition-all duration-400 hover:-translate-y-1 hover:shadow-lift"
            >
              <f.icon className="size-5 text-accent" />
              <p className="mt-3 text-sm font-semibold text-foreground">{f.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
