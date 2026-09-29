import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BatteryCharging,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Cpu,
  Gauge,
  Layers,
  Leaf,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EvSnap — EV & Battery Visual Intelligence" },
      {
        name: "description",
        content:
          "Instant visual diagnostic intelligence for electric vehicles, e-scooters, and lithium battery systems.",
      },
      { property: "og:title", content: "EvSnap — EV & Battery Visual Intelligence" },
      {
        property: "og:description",
        content: "Instant visual diagnostic intelligence for electric vehicles and lithium battery systems.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased selection:bg-electric-soft selection:text-ink">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src="/favicon.svg" alt="EvSnap" className="size-9 rounded-xl shadow-sm" />
            <div>
              <p className="text-[15px] font-extrabold tracking-tight text-ink">
                EvSnap
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                EV Visual Intelligence
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-semibold text-muted-foreground md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-primary">
              How It Works
            </a>
            <a href="#capabilities" className="transition-colors hover:text-primary">
              Diagnostic Scope
            </a>
            <a href="#safety-standards" className="transition-colors hover:text-primary">
              Safety Protocols
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="soft-grid relative overflow-hidden border-b border-border/60 pb-16 pt-14 lg:pb-24 lg:pt-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-6xl lg:text-7xl leading-[1.08]">
              See what powers <br />
              <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                your electric ride.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-xl">
              Upload or snap a clear photo of an electric scooter, bike, car, or lithium battery pack. Get instant neural identification, powertrain estimates, cell chemistry, and safety protocols.
            </p>

            {/* Single Prominent CTA Button */}
            <div className="mt-9 flex items-center justify-center">
              <Link to="/scanner">
                <Button
                  size="lg"
                  className="h-14 gap-3 rounded-2xl bg-primary px-9 text-base font-extrabold text-primary-foreground shadow-lg transition-all hover:bg-primary/95 hover:shadow-xl hover:scale-[1.02]"
                >
                  <Camera className="size-5" />
                  Snap my EV / Battery
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>

            {/* Trust and Feature Counters */}
            <div
              id="capabilities"
              className="mt-16 grid grid-cols-2 gap-4 border-t border-border/80 pt-10 sm:grid-cols-4"
            >
              {[
                { label: "Visual Identification", value: "Instant Model ID" },
                { label: "Technical Benchmarks", value: "Volt / kWh / Range" },
                { label: "Cell Chemistry", value: "LFP / NMC / Lifespan" },
                { label: "Safety & Compliance", value: "Thermal & Care Rules" },
              ].map((item) => (
                <div key={item.label} className="text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1.5 text-sm font-extrabold text-ink">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Simple 3-Step Process</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">
            From photo to full diagnostic report in seconds
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Engineered to analyze vehicle geometry, motor form factor, and battery architectures instantly.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Snap or Paste Photo",
              desc: "Take a picture of your electric scooter, e-bike, car, or standalone battery pack, or paste directly with Ctrl+V.",
              icon: <Camera className="size-6 text-primary" />,
            },
            {
              step: "02",
              title: "Neural Vision Analysis",
              desc: "AI identifies the chassis class, powertrain voltage, motor kW rating, and cell chemistry benchmarks in real time.",
              icon: <Cpu className="size-6 text-primary" />,
            },
            {
              step: "03",
              title: "Actionable Insights",
              desc: "Review battery health recommendations, realistic range estimations, compatibility tips, and ask AI follow-up questions.",
              icon: <Sparkles className="size-6 text-primary" />,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative rounded-2xl border border-border bg-surface-raised p-6 shadow-sm hover:border-primary/40 transition-colors"
            >
              <span className="text-3xl font-black text-muted-foreground/30">{item.step}</span>
              <div className="my-4 grid size-12 place-items-center rounded-xl bg-electric-soft">
                {item.icon}
              </div>
              <h3 className="text-lg font-extrabold text-ink">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Big CTA Banner */}
        <div className="mt-16 rounded-3xl bg-ink p-8 sm:p-12 text-center text-primary-foreground shadow-2xl">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Ready to diagnose your electric vehicle or battery?
            </h3>
            <p className="mt-3 text-sm text-sky-200/80">
              Zero guessing, zero unknown placeholders. Get high-fidelity technical estimates and safety guidelines right now.
            </p>
            <div className="mt-8">
              <Link to="/scanner">
                <Button
                  size="lg"
                  className="h-12 gap-2 rounded-xl bg-primary px-8 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-lg"
                >
                  <Camera className="size-4" />
                  Launch Scanner Workbench
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Capabilities Grid */}
      <section id="safety-standards" className="border-t border-border/80 bg-muted/30 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Grounded AI Analysis</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">
              Comprehensive EV Specification Benchmarks
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              What EvSnap decodes from visual contours and electrical topologies:
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <BatteryCharging className="size-5" />,
                title: "Voltage & Capacity",
                desc: "Nominal voltage (36V, 48V, 60V, 72V, 400V) and total Ah/kWh pack estimation.",
              },
              {
                icon: <Gauge className="size-5" />,
                title: "Commute Range",
                desc: "Real-world expected urban range with temperature and payload considerations.",
              },
              {
                icon: <Zap className="size-5" />,
                title: "Peak Motor Output",
                desc: "Hub motor or mid-drive continuous and peak power ratings (Watts / kW).",
              },
              {
                icon: <CircleGauge className="size-5" />,
                title: "Charge Parameters",
                desc: "Standard AC charging duration and smart CC/CV fast charge profiles.",
              },
              {
                icon: <Leaf className="size-5" />,
                title: "Cell Chemistry",
                desc: "Identification of Lithium-ion NMC, LFP, or prismatic cell modules.",
              },
              {
                icon: <Activity className="size-5" />,
                title: "Lifecycle Retainment",
                desc: "Projected 80% capacity retention across standard charge cycle spans.",
              },
              {
                icon: <ShieldCheck className="size-5" />,
                title: "Thermal Safety",
                desc: "Operational guidelines for washing, outdoor parking, and temperature thresholds.",
              },
              {
                icon: <CheckCircle2 className="size-5" />,
                title: "Hardware Highlights",
                desc: "Brake system, suspension configuration, and regenerative braking integration.",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-surface-raised p-5 shadow-xs transition-colors hover:border-primary/30"
              >
                <div className="grid size-10 place-items-center rounded-xl bg-electric-soft text-primary mb-3.5">
                  {card.icon}
                </div>
                <h3 className="text-sm font-extrabold text-ink">{card.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 text-center sm:flex-row sm:text-left lg:px-8">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="EvSnap" className="size-5 rounded-md" />
            <p className="text-xs font-bold text-ink">EvSnap</p>
            <span className="text-xs text-muted-foreground">— Visual Intelligence for Electric Mobility</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} EvSnap. All diagnostic specifications are benchmark estimates.
          </p>
        </div>
      </footer>
    </main>
  );
}