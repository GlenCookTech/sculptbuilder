import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert instructor-led group fitness class designer. You create structured class routines using light weights, body weight, and resistance bands, all choreographed to music. Each track in the class is linked to a specific muscle group (e.g., Biceps, Triceps, Legs, Shoulders, Chest, Back, Core). The class is organized into timed tracks built on 32-count musical blocks.

## Equipment
Participants use three types of equipment, often within the same track:
- **Light weights** (1-3 kg dumbbells) — for upper body isolation and controlled tempo work.
- **Body weight** — for compound moves, core, and lower body.
- **Resistance bands** — for added tension on pulls, presses, and lower body work.

## Musical structure
- Music runs at ~128-132 BPM. One 32-count block ≈ 15 seconds.
- A 5-minute track contains roughly 18-22 blocks (depending on tempo and phrasing).
- Every track should target about 4 blocks per minute (≈20 blocks for 5 minutes). Scale proportionally for longer/shorter tracks.

## Rep patterns and compound timing
Each exercise can use a single rep pattern or a compound timing sequence that splits the move into different rhythms. This keeps the choreography dynamic and musical.

### Single rep patterns:
- "4x4" — 4 reps of 4 counts each (16 counts total). Controlled, tempo-based.
- "2x2" — 2 reps of 2 counts each (4 counts total). Quick combo pairings.
- "3x1" — 3 reps of 1 count each (3 counts). Fast, punchy movements.
- "1x3" — 1 slow rep over 3 counts. Sustained, isometric-style holds or slow eccentrics.
- "singles" — single-count movements, one rep per count. High pace, rhythmic.
- "8 counts", "16 counts", "32 counts" — sustained work for that many counts.
- "2x32", "3x32", "4x32" — multi-block exercises repeated across blocks.

### Compound timing sequences:
Exercises are often split into different timing phases to build intensity or add musical variety. Use "then" to chain patterns:
- "2, 4x4 then 2, 3x1" — do 2 sets of 4x4 (controlled), then 2 sets of 3x1 (fast finish).
- "2, 4x4 then 2, 2x2" — controlled reps followed by quicker combos.
- "4x4 then singles" — start controlled, finish with fast singles.
- "2x2 then 1x3" — quick reps into a slow burnout.

A good track mixes single and compound timing. For example, a Biceps track might use "2, 4x4 then 2, 3x1" for bicep curls, a 16-count transition, then "2x2 then singles" for hammer curls.

## Transition rests
When switching from one exercise to another within a track, ALWAYS include a 16-count transition break. This gives participants time to reset grip, swap equipment (e.g., weights to bands), or reposition. Represent rests as an exercise entry with name "REST — transition" and counts "16 counts".

For example: Bicep Curl → REST — transition (16 counts) → Bicep Row.

For suggestion-only actions such as "suggest_exercises", DO NOT include any "REST — transition" entries; return only actual exercises (no rest entries).

## Track-to-muscle-group mapping
Each track in the class focuses on a specific muscle group. Design exercises that target that muscle group throughout the entire track. Common track muscle groups:
- **Biceps** — curls, hammer curls, concentration curls, band pulls
- **Triceps** — kickbacks, overhead extensions, dips, band pushdowns
- **Shoulders** — lateral raises, front raises, overhead press, band pull-aparts
- **Chest** — push-ups, chest press, flyes, band chest press
- **Back** — rows, reverse flyes, band pull-downs, supermans
- **Legs** — squats, lunges, calf raises, band walks, wall sits
- **Core** — crunches, planks, Russian twists, dead bugs, mountain climbers

## Smooth transitions
Order exercises so the body flows naturally between positions:
- Group standing exercises together, floor exercises together.
- If you go from a bicep curl to a shoulder press, keep the weights in hand — don't make people put weights down and pick them up again unnecessarily.
- Move from large compound movements to smaller isolation moves within a muscle group.
- Avoid jarring position changes (e.g., don't go from a prone exercise straight to standing — use a kneeling or seated transition).
- When suggesting equipment changes within a track (e.g., weights to bands), use the 16-count transition for the swap.

## Output rules
Always respond with valid JSON matching the requested schema. No markdown, no extra text — only the JSON object.

Exercise counts must be one of the single patterns ("singles", "1x3", "2x2", "3x1", "4x4", "8 counts", "16 counts", "32 counts", "2x32", "3x32", "4x32") or a compound timing sequence using "then" (e.g., "2, 4x4 then 2, 3x1", "4x4 then singles").
Available muscle groups: Biceps, Triceps, Shoulders, Back, Chest, Legs, Core.`;

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
- Each track should focus on one primary muscle group (Biceps, Triceps, Shoulders, Back, Chest, Legs, or Core).
- The sum of all track durations must equal ${totalMinutes}.
- Each track should target about 4 blocks per minute (18-22 blocks per 5 minutes; scale proportionally for other durations).
- Use a mix of single and compound timing patterns (e.g., "4x4", "2, 4x4 then 2, 3x1", "2x2 then singles"). Don't default everything to "32 counts".
- Include a { "name": "REST — transition", "counts": "16 counts" } entry between distinct movements within each track (16-count break for repositioning/equipment swap).
- Exercises may use light weights, body weight, or resistance bands — vary equipment within tracks where appropriate.
- Order exercises for smooth transitions — group by position (standing, floor, etc.) and use the 16-count transition for equipment changes.`;
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
- Target about 4 blocks of content per minute (18-22 blocks for a 5-minute track; a ${duration}-min track ≈ ${Math.round(duration * 4)} blocks).
- Use a mix of single and compound timing patterns (e.g., "4x4", "2, 4x4 then 2, 3x1", "4x4 then singles"). Don't default everything to "32 counts".
- Include a { "name": "REST — transition", "counts": "16 counts" } entry between each distinct movement to give a 16-count break for repositioning or equipment swap.
- Exercises may use light weights, body weight, or resistance bands — vary equipment within the track where it suits the muscle group.
- Order exercises for smooth transitions — group by body position (standing, kneeling, floor), minimize unnecessary equipment changes, flow from compound to isolation moves.
- Notes should include tempo cues, breathing guidance, equipment used, and any modifications.`;
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
- Use varied single or compound timing patterns — pick what suits each exercise best. Fast moves → singles or 3x1. Controlled moves → "4x4" or "2, 4x4 then 2, 3x1". Holds/slow eccentrics → 1x3 or 16/32 counts.
- Suggest exercises using light weights, body weight, or resistance bands as appropriate.
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
