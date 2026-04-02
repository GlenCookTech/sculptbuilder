import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert sculpt/body-sculpting fitness class designer. You create structured class routines using lightweight dumbbells and bodyweight exercises, organized into timed tracks built on 32-count musical blocks.

## Musical structure
- Music runs at ~128-132 BPM. One 32-count block ≈ 15 seconds.
- A 5-minute track contains roughly 20-32 blocks (depending on tempo and phrasing).
- Every track should target 20-32 blocks of content per 5 minutes of duration. Scale proportionally for longer/shorter tracks.

## Rep patterns
Vary the rep patterns across a track to keep things dynamic and interesting. Use a healthy mix of:
- "4x4" — 4 reps of 4 counts each (16 counts total). Great for controlled, tempo-based moves.
- "2x2" — 2 reps of 2 counts each (4 counts total). Quick combo pairings.
- "3x1" — 3 reps of 1 count each (3 counts). Fast, punchy movements.
- "1x3" — 1 slow rep over 3 counts. Sustained, isometric-style holds or slow eccentrics.
- "singles" — single-count movements, one rep per count. High pace, rhythmic.
- "8 counts", "16 counts", "32 counts" — sustained work on one exercise for that many counts.
- "2x32", "3x32", "4x32" — multi-block exercises repeated across blocks.

A good track mixes these up. For example, a 5-minute track might open with a 4x4 pattern, move into 2x2 combos, hit some singles for intensity, use a 1x3 for a slow burnout, then finish with a 32-count hold.

## Transition rests
ALWAYS include a 16-count rest between distinct movements (when switching from one exercise to the next). Represent rests as an exercise entry with name "REST — transition" and counts "16 counts". This gives participants time to reset grip, adjust weights, or reposition.

## Smooth transitions
Order exercises so the body flows naturally between positions:
- Group standing exercises together, floor exercises together.
- If you go from a bicep curl to a shoulder press, keep the weights in hand — don't make people put weights down and pick them up again unnecessarily.
- Move from large compound movements to smaller isolation moves within a muscle group.
- Avoid jarring position changes (e.g., don't go from a prone exercise straight to standing — use a kneeling or seated transition).

## Output rules
Always respond with valid JSON matching the requested schema. No markdown, no extra text — only the JSON object.

Exercise counts must be one of: "singles", "1x3", "2x2", "3x1", "4x4", "8 counts", "16 counts", "32 counts", "2x32", "3x32", "4x32".
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
        { "name": "exercise name", "counts": "4x4" }
      ],
      "notes": "coaching cues"
    }
  ]
}

Requirements:
- Include a warm-up as the first track and a stretch/cool-down as the last track.
- The sum of all track durations must equal ${totalMinutes}.
- Each 5-minute track should contain 20-32 blocks of content (scale proportionally for other durations).
- Mix up rep patterns across each track (4x4, 2x2, 3x1, 1x3, singles, 8/16/32 counts, etc.). Don't default everything to "32 counts".
- Include a { "name": "REST — transition", "counts": "16 counts" } entry between distinct movements within each track.
- Order exercises for smooth transitions — group by position (standing, floor, etc.) and keep equipment changes minimal.`;
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
    { "name": "exercise name", "counts": "4x4" }
  ],
  "notes": "coaching cues and form tips"
}

Requirements:
- Target 20-32 blocks of content per 5 minutes of duration (scale proportionally: a ${duration}-min track ≈ ${Math.round((duration / 5) * 26)} blocks).
- Mix up rep patterns: use a variety of 4x4, 2x2, 3x1, 1x3, singles, 8 counts, 16 counts, 32 counts, etc. Don't default everything to "32 counts".
- Include a { "name": "REST — transition", "counts": "16 counts" } entry between each distinct movement to give a 16-count rest for repositioning.
- Order exercises for smooth transitions — group by body position (standing, kneeling, floor), minimize equipment changes, flow from compound to isolation moves.
- Notes should include tempo cues, breathing guidance, and any modifications.`;
    } else if (action === 'suggest_exercises') {
      const { muscles, existingExercises, count } = payload;
      userPrompt = `Suggest ${count || 3} new exercises for a sculpt class track.
Target muscles: ${muscles.join(', ')}
Already in the track: ${existingExercises?.join(', ') || 'none'}

Respond with JSON:
{
  "exercises": [
    { "name": "exercise name", "counts": "4x4" }
  ]
}

Requirements:
- Do not repeat exercises already in the track. Use creative variations.
- Use varied rep patterns (4x4, 2x2, 3x1, 1x3, singles, 8/16/32 counts) — pick what suits each exercise best. Fast moves → singles or 3x1. Controlled moves → 4x4 or 2x2. Holds/slow eccentrics → 1x3 or 16/32 counts.
- Consider what's already in the track and suggest exercises that would transition smoothly from the last listed exercise.`;
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
      max_tokens: 4096,
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
