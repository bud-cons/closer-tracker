import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_TRACKER_MODEL || "claude-sonnet-5";

const FOOD_TOOL = {
  name: "log_food",
  description: "Structured nutrition data read from a food/nutrition-label/tracking-app screenshot.",
  input_schema: {
    type: "object" as const,
    properties: {
      description: { type: "string", description: "Short label for the food or meal, e.g. 'Chicken burrito bowl'." },
      calories: { type: "number", description: "Total calories, kcal." },
      protein: { type: "number", description: "Protein in grams." },
      carbs: { type: "number", description: "Carbohydrates in grams." },
      fat: { type: "number", description: "Fat in grams." },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
      notes: { type: "string", description: "Anything the user should double-check before saving." },
    },
    required: ["description", "calories", "protein", "carbs", "fat", "confidence"],
  },
};

const WORKOUT_TOOL = {
  name: "log_workout",
  description: "Structured workout data read from a fitness-app or wearable workout-summary screenshot.",
  input_schema: {
    type: "object" as const,
    properties: {
      activity: { type: "string", enum: ["BJJ", "Weights", "Walk", "Run", "Other"] },
      durationMinutes: { type: "number" },
      caloriesBurned: { type: "number", description: "Active/exercise calories burned, kcal." },
      intensity: {
        type: "string",
        enum: ["light", "moderate", "vigorous"],
        description: "Omit if intensity can't be inferred.",
      },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
      notes: { type: "string", description: "Anything the user should double-check before saving." },
    },
    required: ["activity", "durationMinutes", "caloriesBurned", "confidence"],
  },
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Screenshot parsing isn't configured. Set ANTHROPIC_API_KEY in the environment." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { type, imageBase64, mediaType } = body;

  if (type !== "food" && type !== "workout") {
    return NextResponse.json({ error: "type must be 'food' or 'workout'" }, { status: 400 });
  }
  if (typeof imageBase64 !== "string" || !imageBase64) {
    return NextResponse.json({ error: "Missing imageBase64" }, { status: 400 });
  }
  const allowedMediaTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (typeof mediaType !== "string" || !allowedMediaTypes.includes(mediaType)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }

  const tool = type === "food" ? FOOD_TOOL : WORKOUT_TOOL;
  const prompt =
    type === "food"
      ? "Read this screenshot (a nutrition label, restaurant menu, or a food-tracking app entry). Extract the total calories and protein/carbs/fat in grams for what was actually eaten. If it's a full day's summary with multiple items, sum the totals. Call the log_food tool with your best reading."
      : "Read this screenshot (a workout summary from a fitness app or wearable, e.g. Apple Watch, Whoop, Garmin, gym app). Extract the activity type, duration in minutes, and calories burned. Map the activity to one of BJJ, Weights, Walk, Run, or Other. Call the log_workout tool with your best reading.";

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        tools: [tool],
        tool_choice: { type: "tool", name: tool.name },
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });
  } catch {
    return NextResponse.json({ error: "Couldn't reach the AI service" }, { status: 502 });
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return NextResponse.json(
      { error: `AI service error (${response.status})`, detail },
      { status: 502 }
    );
  }

  const data = await response.json();
  const toolUse = (data.content ?? []).find(
    (block: { type: string }) => block.type === "tool_use"
  );
  if (!toolUse) {
    return NextResponse.json({ error: "Couldn't read anything from that screenshot" }, { status: 422 });
  }

  return NextResponse.json({ result: toolUse.input });
}
