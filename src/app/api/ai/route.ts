import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert sculpt/body-sculpting fitness class designer. You create structured class routines using lightweight dumbbells and bodyweight exercises, organized into timed tracks with 32-count musical structure.

When generating routines or tracks, always respond with valid JSON matching the requested schema. No markdown, no extra text — only the JSON object.

Exercise counts must be one of: "8 counts", "16 counts", "32 counts", "2x32", "3x32", "4x32".
Available muscle groups: Biceps, Triceps, Shoulders, Back, Chest, Quads, Hamstrings, Glutes, Calves, Core, Hip flexors.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    let userPrompt = '';

    if (action === 'generate_routine') {
      const { goal, totalMinutes } = payload;
      userPrompt = `Generate a complete sculpt class routine.
Goal: ${goal}
Total duration: ${totalMinutes} minutes

Respond with JSON:
{
  "name": "routine name",
  "tracks": [
    {
      "name": "track name",
      "duration": <minutes as integer>,
      "muscles": ["muscle1", "muscle2"],
      "exercises": [
        { "name": "exercise name", "counts": "32 counts" }
      ],
      "notes": "coaching cues"
    }
  ]
}

Include a warm-up as the first track and a stretch/cool-down as the last track. The sum of all track durations must equal ${totalMinutes}.`;
    } else if (action === 'generate_track') {
      const { muscles, duration, context } = payload;
      userPrompt = `Generate a single sculpt class track.
Target muscles: ${muscles.join(', ')}
Duration: ${duration} minutes
${context ? `Context: ${context}` : ''}

Respond with JSON:
{
  "name": "track name",
  "duration": ${duration},
  "muscles": ${JSON.stringify(muscles)},
  "exercises": [
    { "name": "exercise name", "counts": "32 counts" }
  ],
  "notes": "coaching cues and form tips"
}

Include 4-7 exercises appropriate for the duration. Use varied counts.`;
    } else if (action === 'suggest_exercises') {
      const { muscles, existingExercises, count } = payload;
      userPrompt = `Suggest ${count || 3} new exercises for a sculpt class track.
Target muscles: ${muscles.join(', ')}
Already in the track: ${existingExercises?.join(', ') || 'none'}

Respond with JSON:
{
  "exercises": [
    { "name": "exercise name", "counts": "32 counts" }
  ]
}

Do not repeat exercises already in the track. Use creative variations.`;
    } else if (action === 'improve_notes') {
      const { trackName, muscles, exercises, currentNotes } = payload;
      userPrompt = `Improve the coaching notes for this sculpt class track.
Track: ${trackName}
Muscles: ${muscles.join(', ')}
Exercises: ${exercises.map((e: { name: string }) => e.name).join(', ')}
Current notes: ${currentNotes || '(empty)'}

Respond with JSON:
{
  "notes": "improved coaching notes with specific cues, tempo guidance, weight recommendations, and modifications"
}

Keep it concise (2-4 sentences). Focus on form cues, breathing, and tempo.`;
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error('AI route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
