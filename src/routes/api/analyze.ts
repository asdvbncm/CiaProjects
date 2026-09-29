import { createFileRoute } from "@tanstack/react-router";
import { GoogleGenAI } from "@google/genai";
import { sanitizeAndEnrichAnalysis } from "@/lib/ev-benchmarks";

const ANALYSIS_PROMPT = `You are a world-class electric vehicle and lithium battery engineer. 
Analyze the supplied image carefully and classify it as an electric vehicle/e-scooter/e-bike, a battery pack/cell module, or electric car.

Return ONLY valid JSON matching this exact shape:
{
  "detected_type": "SCOOTER_OR_EV" | "BATTERY_PACK" | "ELECTRIC_CAR" | "ELECTRIC_BIKE",
  "title_name": "string (Exact brand & model if identifiable, or descriptive classification e.g. Electroride ZL Pro)",
  "confidence_rating": "High" | "Medium" | "Low",
  "overview_summary": "string (2-3 sentences of clear visual and technical summary)",
  "specs": {
    "voltage_capacity": "string (e.g. 60V / 24–30Ah (~1.4–1.8 kWh))",
    "chemistry_type": "string (e.g. Lithium-ion (NMC / LFP High Density))",
    "estimated_range": "string (e.g. 55–75 km per charge)",
    "peak_power_output": "string (e.g. 1.8 kW – 2.5 kW Peak BLDC Hub)",
    "charging_time": "string (e.g. 4.5–6.0 Hours (Standard 220V AC))",
    "lifecycle_span": "string (e.g. 800–1,200 Full Charge Cycles)"
  },
  "compatibility": ["string", "string", "string"],
  "key_features": ["string", "string", "string", "string"],
  "pros_and_cons": {
    "pros": ["string", "string", "string"],
    "cons": ["string", "string", "string"]
  },
  "maintenance_and_safety": ["string", "string", "string", "string"]
}

CRITICAL RULES:
1. NEVER output "Unknown", "N/A", "Undetermined", or empty strings in any specification or field.
2. If exact specifications are not visibly printed on the badge, provide realistic, highly educated engineering estimates and typical industry benchmarks based on the visible form factor, wheel size, chassis class, and scooter/battery category.
3. Keep specifications detailed with standard electrical & automotive units (V, Ah, kWh, km, kW, Hours, Cycles).
4. Provide practical, accurate safety guidelines and compatibility insights tailored to the visual evidence.`;

async function generateWithFallback(ai: GoogleGenAI, bytes: string, mimeType: string) {
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  let lastError: unknown;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { data: bytes, mimeType } },
              { text: ANALYSIS_PROMPT },
            ],
          },
        ],
        config: { responseMimeType: "application/json" },
      });
      if (response.text) return response.text;
    } catch (err) {
      lastError = err;
      // If error is not a model-not-found error, retry with next model
      continue;
    }
  }

  throw lastError || new Error("Failed to generate content with available Gemini models.");
}

function safeMessage(error: unknown) {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("api_key_invalid") || msg.includes("api key not valid") || msg.includes("unauthenticated")) {
      return "Gemini API key is invalid. Please check your API key in the top settings.";
    }
    if (msg.includes("resource has been exhausted") || msg.includes("quota")) {
      return "Gemini API rate limit or quota exceeded. Please try again shortly or use your own API key.";
    }
    return `AI Scan Error: ${error.message}`;
  }
  return "The scan could not be completed. Please try another clear image.";
}

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const apiKey = process.env["GEMINI_API_KEY"];

          if (!apiKey) {
            return Response.json(
              { error: "Service configuration error. Please contact support." },
              { status: 503 }
            );
          }

          const form = await request.formData();
          const image = form.get("image");
          if (!(image instanceof File) || !image.type.startsWith("image/")) {
            return Response.json({ error: "Please upload a valid image." }, { status: 400 });
          }
          if (image.size > 10 * 1024 * 1024) {
            return Response.json({ error: "Please choose an image smaller than 10 MB." }, { status: 400 });
          }

          const bytes = Buffer.from(await image.arrayBuffer()).toString("base64");
          const ai = new GoogleGenAI({ apiKey });
          const text = await generateWithFallback(ai, bytes, image.type);

          let parsedRaw: any = {};
          try {
            parsedRaw = JSON.parse(text);
          } catch {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsedRaw = JSON.parse(jsonMatch[0]);
            }
          }

          const enriched = sanitizeAndEnrichAnalysis(parsedRaw);
          return Response.json({ analysis: enriched });
        } catch (error) {
          return Response.json({ error: safeMessage(error) }, { status: 500 });
        }
      },
    },
  },
});