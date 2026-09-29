import { useState, useEffect } from "react";
import { KeyRound, Check, ExternalLink, Trash2, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "electrolens_gemini_api_key";

export function getStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) || "";
}

export function setStoredApiKey(key: string): void {
  if (typeof window === "undefined") return;
  if (key.trim()) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function ApiKeyDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  triggerVariant = "outline",
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerVariant?: "outline" | "ghost" | "default";
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;

  const [apiKey, setApiKey] = useState("");
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const stored = getStoredApiKey();
    setApiKey(stored);
    setHasSavedKey(!!stored);
  }, [open]);

  const handleSave = () => {
    setStoredApiKey(apiKey);
    setHasSavedKey(!!apiKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setOpen(false);
    }, 1200);
  };

  const handleClear = () => {
    setStoredApiKey("");
    setApiKey("");
    setHasSavedKey(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size="sm"
          className="h-8 gap-1.5 rounded-lg text-xs font-semibold"
        >
          <KeyRound className="size-3.5 text-primary" />
          <span>Gemini API Key</span>
          {hasSavedKey && <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <div className="grid size-8 place-items-center rounded-lg bg-electric-soft">
              <KeyRound className="size-4" />
            </div>
            <DialogTitle className="text-base font-extrabold text-ink">
              Configure Google Gemini API Key
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Add your own Gemini API key for instant, unlimited visual analysis and AI chat diagnostics.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-2">
            <label className="text-xs font-bold text-ink">Gemini API Key</label>
            <div className="relative">
              <Input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono text-xs pr-8"
              />
              {apiKey && (
                <button
                  type="button"
                  onClick={() => setApiKey("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Your key is saved locally in your browser and used securely to perform scans.
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/40 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between font-semibold text-ink">
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                Need a free Gemini API Key?
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
              >
                Get Key in Google AI Studio
                <ExternalLink className="size-3" />
              </a>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Google AI Studio provides free API keys with generous usage quotas for Gemini models.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={handleSave}
              className="flex-1 gap-2 font-bold text-xs"
              disabled={savedSuccess}
            >
              {savedSuccess ? (
                <>
                  <Check className="size-4 text-emerald-300" />
                  Key Saved Successfully!
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" />
                  Save API Key
                </>
              )}
            </Button>
            {hasSavedKey && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleClear}
                title="Remove saved key"
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
