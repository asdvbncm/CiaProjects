import { Skeleton } from "@/components/ui/skeleton";
import { Zap, BatteryCharging, Gauge, CircleGauge, Leaf, ShieldCheck, Sparkles, Cpu } from "lucide-react";
import { useEffect, useState } from "react";

const STEPS = [
  "Scanning visual contours & identifying model...",
  "Estimating powertrain voltage & battery capacity...",
  "Benchmarking range & peak motor output...",
  "Verifying cell chemistry & thermal safety profiles...",
  "Finalizing diagnostic report...",
];

export function DiagnosticSkeleton() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header bar loading */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-electric-soft/60 via-background to-electric-soft/40 p-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md animate-pulse">
            <Cpu className="size-5 animate-spin" style={{ animationDuration: "3s" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                <Sparkles className="size-3 animate-pulse" /> Neural AI Diagnostic in progress
              </span>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-foreground transition-all duration-300">
              {STEPS[activeStep]}
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(95, (activeStep + 1) * 22)}%` }}
          />
        </div>
      </div>

      {/* 4 Stat Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { icon: <BatteryCharging className="size-4" />, label: "Voltage / Capacity" },
          { icon: <Gauge className="size-4" />, label: "Estimated Range" },
          { icon: <Zap className="size-4" />, label: "Peak Power" },
          { icon: <CircleGauge className="size-4" />, label: "Charging Time" },
        ].map((item, idx) => (
          <div key={idx} className="rounded-xl border border-border bg-surface-raised p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <span className="grid size-8 place-items-center rounded-lg bg-electric-soft">
                  {item.icon}
                </span>
                <span className="text-xs font-bold uppercase text-muted-foreground">{item.label}</span>
              </div>
              <Skeleton className="h-4 w-14 rounded-full" />
            </div>
            <Skeleton className="h-7 w-3/4 rounded-lg" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        ))}

        {/* Chemistry card skeleton */}
        <div className="sm:col-span-2 rounded-xl border border-border bg-surface-raised p-5 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <span className="grid size-8 place-items-center rounded-lg bg-electric-soft">
              <Leaf className="size-4" />
            </span>
            <span className="text-xs font-bold uppercase text-muted-foreground">Cell Chemistry & Lifecycle</span>
          </div>
          <Skeleton className="h-6 w-2/3 rounded-lg" />
          <Skeleton className="h-4 w-1/3 rounded" />
        </div>

        {/* Feature / compatibility skeletons */}
        <div className="rounded-xl border border-border bg-surface-raised p-5 space-y-3">
          <Skeleton className="h-5 w-32 rounded" />
          <div className="space-y-2 pt-1">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-4/6 rounded" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-raised p-5 space-y-3">
          <Skeleton className="h-5 w-32 rounded" />
          <div className="space-y-2 pt-1">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-4/6 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
