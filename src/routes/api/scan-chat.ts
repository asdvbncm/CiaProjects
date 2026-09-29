import { createFileRoute } from "@tanstack/react-router";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const chatSchema = z.object({
  question: z.string().trim().min(1),
  analysis: z.record(z.unknown()),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string() })).max(20),
});

export const Route = createFileRoute("/api/scan-chat")({
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

          const input = chatSchema.parse(await request.json());
          const ai = new GoogleGenAI({ apiKey });
          
          const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
          let answer = "";
          let lastErr: unknown;

          for (const model of modelsToTry) {
            try {
              const response = await ai.models.generateContent({
                model,
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: `You are EvSnap, an EV and battery specialist. Answer using the scan data below. Be concise, practical, safety-conscious, and explicitly say when a fact cannot be confirmed from the scan.\n\nSCAN DATA:\n${JSON.stringify(
                          input.analysis
                        )}\n\nRECENT CHAT:\n${input.history
                          .map((m) => `${m.role}: ${m.text}`)
                          .join("\n")}\n\nQUESTION: ${input.question}`,
                      },
                    ],
                  },
                ],
              });
              if (response.text) {
                answer = response.text;
                break;
              }
            } catch (e) {
              lastErr = e;
              continue;
            }
          }

          if (!answer) {
            throw lastErr || new Error("The AI returned an empty answer.");
          }

          return Response.json({ answer });
        } catch (error) {
          const message = error instanceof Error ? error.message : "The question could not be answered.";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});