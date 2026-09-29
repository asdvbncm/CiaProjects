import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import {
  Activity,
  ArrowLeft,
  BatteryCharging,
  Bot,
  Check,
  ChevronRight,
  CircleGauge,
  ClipboardPaste,
  Cpu,
  Gauge,
  ImagePlus,
  Info,
  Leaf,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { DiagnosticSkeleton } from "@/components/diagnostic-skeleton";
import { sanitizeAndEnrichAnalysis, type Analysis } from "@/lib/ev-benchmarks";

type ChatMessage = { id: string; role: "user" | "assistant"; text: string };

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "EV Scanner Studio — EvSnap" },
      { name: "description", content: "Instant visual diagnostic scanner for electric vehicles and battery packs." },
    ],
  }),
  component: ScannerPage,
});

const suggestions = [
  "How can I maximize this battery's lifecycle?",
  "What is the recommended charging schedule?",
  "Is this suitable for daily highway or hill commuting?",
  "What are the key safety precautions when washing or storing it?",
];

function ScannerPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const chatInput = useRef<HTMLTextAreaElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatStatus, setChatStatus] = useState<"ready" | "submitted">("ready");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Revoke object URLs cleanly
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Focus chat input on open
  useEffect(() => {
    let timer: number | undefined;
    if (chatOpen) {
      timer = window.setTimeout(() => chatInput.current?.focus(), 250);
    }
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [chatOpen, chatStatus]);

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 3500);
  };

  // Direct analysis execution function
  const runAnalysis = useCallback(async (imageFile: File) => {
    setIsAnalyzing(true);
    setError("");
    setAnalysis(null);
    setMessages([]);

    try {
      const form = new FormData();
      form.append("image", imageFile);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: form,
      });

      const payload = (await response.json()) as { analysis?: Partial<Analysis>; error?: string };

      if (!response.ok || !payload.analysis) {
        throw new Error(payload.error || "The scan could not be completed. Please try again.");
      }

      // Guaranteed zero unknown values with intelligent sanitizer
      const cleanData = sanitizeAndEnrichAnalysis(payload.analysis);
      setAnalysis(cleanData);
      showToast("Diagnostic analysis complete!");
    } catch (reason) {
      const errMsg = reason instanceof Error ? reason.message : "The scan could not be completed.";
      setError(errMsg);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Process incoming file (from browse, drop, or paste)
  const handleIncomingFile = useCallback(
    (incoming?: File, autoScan = true) => {
      if (!incoming) return;
      if (!incoming.type.startsWith("image/")) {
        setError("Please upload a valid JPG, PNG, or WebP image.");
        return;
      }
      if (incoming.size > 10 * 1024 * 1024) {
        setError("Please choose an image smaller than 10 MB.");
        return;
      }

      if (preview) URL.revokeObjectURL(preview);
      const url = URL.createObjectURL(incoming);
      setFile(incoming);
      setPreview(url);
      setError("");

      if (autoScan) {
        runAnalysis(incoming);
      }
    },
    [preview, runAnalysis]
  );

  // Global Clipboard Paste listener (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && item.type.startsWith("image/")) {
          const pastedFile = item.getAsFile();
          if (pastedFile) {
            e.preventDefault();
            showToast("Pasted image detected! Starting scan...");
            handleIncomingFile(pastedFile, true);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleIncomingFile]);

  const resetScan = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setAnalysis(null);
    setMessages([]);
    setError("");
  };

  const ask = async (text: string) => {
    const question = text.trim();
    if (!question || !analysis || chatStatus === "submitted") return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", text: question };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setChatStatus("submitted");

    try {
      const response = await fetch("/api/scan-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          analysis,
          history: messages.map(({ role, text: messageText }) => ({ role, text: messageText })),
        }),
      });
      const payload = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok || !payload.answer) throw new Error(payload.error || "AI could not answer that question.");
      setMessages([...nextMessages, { id: crypto.randomUUID(), role: "assistant", text: payload.answer }]);
    } catch (reason) {
      setMessages([
        ...nextMessages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: reason instanceof Error ? reason.message : "AI could not answer that question.",
        },
      ]);
    } finally {
      setChatStatus("ready");
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground antialiased selection:bg-electric-soft selection:text-ink">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white shadow-2xl animate-in slide-in-from-top-3">
          <Sparkles className="size-4 text-electric" />
          {toastMessage}
        </div>
      )}

      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <img src="/favicon.svg" alt="EvSnap" className="size-9 rounded-xl shadow-sm" />
              <div>
                <p className="text-[15px] font-extrabold tracking-tight text-ink">
                  EvSnap
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Diagnostic Studio
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-accent transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Split-Layout Diagnostic Workbench */}
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              EV & Battery Diagnostic Workbench
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Upload photo, drag & drop, or press <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono font-bold text-foreground">Ctrl + V</kbd> to inspect any electric vehicle or battery.
            </p>
          </div>

          {preview && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetScan}
              className="gap-2 font-bold text-xs"
            >
              <RotateCcw className="size-3.5" />
              Reset & Snap Another
            </Button>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInput}
          className="hidden"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const chosen = e.target.files?.[0];
            if (chosen) handleIncomingFile(chosen, true);
          }}
        />

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          {/* LEFT SIDE: Image Upload / Preview / Safety Panel */}
          <div className="space-y-6">
            <div className="scan-shadow rounded-2xl border border-border bg-surface-raised p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-ink">Image Inspector</h2>
                  <p className="text-xs text-muted-foreground">Drop photo or press Ctrl + V</p>
                </div>
                {preview && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resetScan}
                    className="h-8 gap-1.5 text-xs font-semibold"
                  >
                    <RotateCcw className="size-3" /> New Image
                  </Button>
                )}
              </div>

              {/* Interactive Upload Box / Live Preview */}
              <div
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e: DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const dropped = e.dataTransfer.files[0];
                  if (dropped) handleIncomingFile(dropped, true);
                }}
                className={`relative grid min-h-[360px] place-items-center overflow-hidden rounded-xl border-2 border-dashed transition-all ${
                  isDragging
                    ? "border-primary bg-electric-soft/60"
                    : preview
                    ? "border-border bg-ink/95"
                    : "border-border/80 bg-background hover:border-primary/50 hover:bg-electric-soft/20"
                }`}
              >
                {preview ? (
                  <div className="relative size-full min-h-[360px] flex items-center justify-center p-3">
                    <img
                      src={preview}
                      alt="Uploaded EV or battery"
                      className="max-h-[380px] w-full object-contain rounded-lg"
                    />
                    <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-lg bg-ink/85 p-3 text-primary-foreground backdrop-blur-md">
                      <div className="truncate pr-2">
                        <p className="truncate text-xs font-semibold">{file?.name || "Pasted vehicle image"}</p>
                        <p className="text-[10px] text-sky-300">
                          {isAnalyzing ? "Scanning image features..." : "Diagnostic ready"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => fileInput.current?.click()}
                          className="h-8 text-xs font-bold"
                        >
                          Change
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="destructive"
                          onClick={resetScan}
                          aria-label="Remove image"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInput.current?.click()}
                    className="flex max-w-sm cursor-pointer flex-col items-center p-6 text-center"
                  >
                    <span className="mb-4 grid size-16 place-items-center rounded-2xl bg-electric-soft text-primary shadow-sm">
                      <ImagePlus className="size-8" />
                    </span>
                    <span className="text-lg font-extrabold text-ink">Drop your image here</span>
                    <span className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      or click to browse your device <br />
                      <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs font-mono font-medium text-foreground">
                        <ClipboardPaste className="size-3 text-primary" /> Press Ctrl + V to paste
                      </span>
                    </span>
                    <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-ink/90">
                      <Upload className="size-3.5" /> Choose Image file
                    </span>
                  </div>
                )}
              </div>

              {/* Error Callout */}
              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs font-medium text-destructive">
                  <Info className="mt-0.5 size-4 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold">Diagnostic Notice</p>
                    <p className="mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Manual Re-trigger button if needed */}
              {file && !isAnalyzing && !analysis && (
                <Button
                  onClick={() => runAnalysis(file)}
                  size="lg"
                  className="mt-4 h-12 w-full gap-2 text-sm font-bold shadow-md"
                >
                  <Zap className="size-4" /> Run AI Diagnostic
                </Button>
              )}

              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Processed with high-resolution neural vision. No photos are retained.
              </p>
            </div>

            {/* Left Column Safety Guidance Box (Shown when analyzed) */}
            {analysis && (
              <div id="safety-standards" className="rounded-2xl bg-ink p-6 text-primary-foreground shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl bg-sky-500/20 text-sky-300">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">Safety & Maintenance Guidance</h3>
                    <p className="text-xs text-sky-200/80">Tailored operational safety rules</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {analysis.maintenance_and_safety.map((item, idx) => (
                    <div key={idx} className="flex gap-3 text-xs leading-relaxed text-primary-foreground/80">
                      <Check className="mt-0.5 size-4 shrink-0 text-sky-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDE: Diagnostic Data Output / Skeleton Loading / Idle State */}
          <div>
            {/* STATE 1: LOADING SKELETON */}
            {isAnalyzing && <DiagnosticSkeleton />}

            {/* STATE 2: SCAN COMPLETE (DATA OUTPUT) */}
            {!isAnalyzing && analysis && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Vehicle Header Card */}
                <div className="rounded-2xl border border-border bg-surface-raised p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-electric-soft px-3 py-1 text-[11px] font-extrabold text-primary">
                          {analysis.detected_type.replaceAll("_", " ")}
                        </span>
                      </div>
                      <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                        {analysis.title_name}
                      </h2>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetScan}
                      className="gap-2 font-bold"
                    >
                      <RotateCcw className="size-3.5" />
                      New Scan
                    </Button>
                  </div>

                  {/* Visual Assessment summary */}
                  <div className="mt-4 rounded-xl bg-muted/60 p-4 border border-border/60">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      Visual Assessment & Overview
                    </p>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-foreground">
                      {analysis.overview_summary}
                    </p>
                  </div>
                </div>

                {/* 4 Core Stat Cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <StatCard
                    icon={<BatteryCharging className="size-5" />}
                    label="Voltage / Capacity"
                    value={analysis.specs.voltage_capacity}
                  />
                  <StatCard
                    icon={<Gauge className="size-5" />}
                    label="Estimated Range"
                    value={analysis.specs.estimated_range}
                  />
                  <StatCard
                    icon={<Zap className="size-5" />}
                    label="Peak Power"
                    value={analysis.specs.peak_power_output}
                  />
                  <StatCard
                    icon={<CircleGauge className="size-5" />}
                    label="Charging Time"
                    value={analysis.specs.charging_time}
                  />

                  {/* Chemistry Card spanning full width */}
                  <div className="sm:col-span-2 rounded-2xl border border-border bg-surface-raised p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-primary">
                        <span className="grid size-9 place-items-center rounded-xl bg-electric-soft">
                          <Leaf className="size-5" />
                        </span>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Cell Chemistry & Lifespan
                          </p>
                          <p className="text-base font-extrabold text-ink">
                            {analysis.specs.chemistry_type}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase text-muted-foreground">
                        Estimated Benchmark
                      </span>
                    </div>
                    <div className="mt-2 rounded-lg bg-background p-3 text-xs font-semibold text-muted-foreground border border-border/70">
                      ⚡ Expected Lifecycle: <span className="text-foreground font-bold">{analysis.specs.lifecycle_span}</span>
                    </div>
                  </div>

                  {/* Likely Compatibility */}
                  <InfoCard title="Likely Compatibility" icon={<ChevronRight className="size-4" />}>
                    <List items={analysis.compatibility} />
                  </InfoCard>

                  {/* Key Features */}
                  <InfoCard title="Key Features" icon={<Activity className="size-4" />}>
                    <List items={analysis.key_features} />
                  </InfoCard>

                  {/* Advantages */}
                  <InfoCard title="Advantages" icon={<Check className="size-4" />}>
                    <List items={analysis.pros_and_cons.pros} positive />
                  </InfoCard>

                  {/* Watch-outs */}
                  <InfoCard title="Watch-outs & Considerations" icon={<Info className="size-4" />}>
                    <List items={analysis.pros_and_cons.cons} />
                  </InfoCard>
                </div>

                {/* Floating Ask AI Button */}
                <div className="pt-2">
                  <Button
                    onClick={() => setChatOpen(true)}
                    size="lg"
                    className="scan-shadow h-12 w-full gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/95"
                  >
                    <MessageCircle className="size-4" />
                    Ask AI Specialist about this {analysis.title_name}
                  </Button>
                </div>
              </div>
            )}

            {/* STATE 3: IDLE / AWAITING IMAGE */}
            {!isAnalyzing && !analysis && (
              <div className="rounded-2xl border border-dashed border-border bg-surface-raised p-8 text-center sm:p-12">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-electric-soft text-primary shadow-sm">
                  <Cpu className="size-8" />
                </div>
                <h3 className="mt-5 text-xl font-extrabold text-ink">Diagnostic Engine Ready</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Paste an EV image with <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono font-bold text-foreground">Ctrl + V</kbd> or choose a photo on the left. The neural analyzer will decode full powertrain specs, cell chemistry, and safety protocols instantly.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2 text-left">
                  {[
                    { title: "Powertrain & Voltage", desc: "Estimated nominal volts, Ah capacity & kWh benchmarks" },
                    { title: "Range & Motor Output", desc: "Realistic urban commute range & peak kW power" },
                    { title: "Cell Chemistry & Life", desc: "Lithium NMC/LFP classification & cycle retention" },
                    { title: "Safety & Charging", desc: "Standard charging time & essential battery precautions" },
                  ].map((feat, i) => (
                    <div key={i} className="rounded-xl border border-border/80 bg-background p-3.5">
                      <p className="text-xs font-extrabold text-ink">{feat.title}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Contextual Chat Sheet */}
      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-lg">
          <SheetHeader className="border-b border-border p-5 pr-14">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-ink text-sky-300 shadow-sm">
                <Bot className="size-5" />
              </div>
              <div>
                <SheetTitle className="text-base font-extrabold">EvSnap Specialist</SheetTitle>
                <SheetDescription className="text-xs">
                  Grounded in current scan: {analysis?.title_name || "EV Diagnostic"}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="gap-5 p-5">
              {messages.length === 0 && (
                <div className="py-6">
                  <p className="text-lg font-extrabold text-ink">What would you like to know?</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    Ask technical questions about battery life, safety tips, charging compatibility, or performance.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => ask(suggestion)}
                        className="h-auto whitespace-normal rounded-lg py-2 text-left text-xs font-semibold"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent
                    className={
                      message.role === "user" ? "bg-primary text-primary-foreground font-medium" : ""
                    }
                  >
                    <MessageResponse>{message.text}</MessageResponse>
                  </MessageContent>
                </Message>
              ))}
              {chatStatus === "submitted" && (
                <Message from="assistant">
                  <MessageContent>
                    <Shimmer>Consulting EV knowledge base...</Shimmer>
                  </MessageContent>
                </Message>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="border-t border-border bg-background p-4">
            <PromptInput onSubmit={({ text }) => ask(text)}>
              <PromptInputTextarea
                ref={chatInput}
                placeholder="Ask about this vehicle or battery..."
                className="min-h-20 text-xs"
              />
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit status={chatStatus} disabled={chatStatus === "submitted"} />
              </PromptInputFooter>
            </PromptInput>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Always verify critical high-voltage specifications with vehicle manufacturer documentation.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5 shadow-sm transition-all hover:border-primary/30">
      <div className="mb-4 flex items-center justify-between text-primary">
        <span className="grid size-9 place-items-center rounded-xl bg-electric-soft shadow-xs">
          {icon}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
          Estimated Benchmark
        </span>
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-lg font-extrabold leading-tight text-ink">{value}</p>
    </div>
  );
}

function InfoCard({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-surface-raised p-5 shadow-sm ${className}`}>
      <div className="mb-3.5 flex items-center gap-2 text-primary">
        <span className="grid size-7 place-items-center rounded-lg bg-electric-soft">{icon}</span>
        <h3 className="text-sm font-extrabold text-ink">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function List({ items, positive = false }: { items: string[]; positive?: boolean }) {
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
          <span
            className={`mt-1 size-1.5 shrink-0 rounded-full ${
              positive ? "bg-emerald-500" : "bg-primary"
            }`}
          />
          <span className="text-foreground/90 font-medium">{item}</span>
        </div>
      ))}
    </div>
  );
}
