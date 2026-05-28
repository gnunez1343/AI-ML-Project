"""Transcription service — Deepgram Nova-2 or realistic mock."""
import json
import os
from pathlib import Path

# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------

TranscriptSegment = dict  # {speaker, text, start, end}


# ---------------------------------------------------------------------------
# Mock transcript — realistic ~4-minute therapy session
# ---------------------------------------------------------------------------

MOCK_TRANSCRIPT_SEGMENTS: list[TranscriptSegment] = [
    {"speaker": "therapist", "text": "Good to see you today. How have you been feeling since our last session?", "start": 0.0, "end": 5.8},
    {"speaker": "patient", "text": "Honestly, it's been a tough week. I've been having a lot of trouble sleeping, and I keep thinking about everything that went wrong at work.", "start": 6.2, "end": 14.5},
    {"speaker": "therapist", "text": "I'm sorry to hear that. Can you tell me more about what's been happening at work?", "start": 15.0, "end": 19.2},
    {"speaker": "patient", "text": "My manager criticized my presentation in front of the whole team. I just felt so humiliated. I keep replaying it over and over in my head.", "start": 19.8, "end": 29.4},
    {"speaker": "therapist", "text": "That sounds really painful — being criticized publicly can feel very destabilizing. When you replay that moment, what feelings come up for you?", "start": 30.0, "end": 38.5},
    {"speaker": "patient", "text": "Mostly shame, I think. And this feeling that I'm just not good enough, that I never will be. It's like this voice in my head that won't stop.", "start": 39.2, "end": 48.6},
    {"speaker": "therapist", "text": "That inner critic sounds quite loud right now. We've talked before about where that voice comes from — do you notice any connection to patterns from earlier in your life?", "start": 49.1, "end": 58.9},
    {"speaker": "patient", "text": "Yeah, I mean, my dad was always really hard to please. Nothing was ever good enough for him. I guess I internalized that a lot.", "start": 59.5, "end": 68.2},
    {"speaker": "therapist", "text": "That's an important insight. That critical voice learned its script a long time ago. How's your mood been overall — on a scale of 1 to 10?", "start": 69.0, "end": 77.5},
    {"speaker": "patient", "text": "Maybe a 4? I've had some moments where I felt okay, especially when I was out walking on Saturday. But mostly it's been low.", "start": 78.0, "end": 87.3},
    {"speaker": "therapist", "text": "A 4 — that's difficult. Have you been able to use any of the grounding exercises we practiced last time?", "start": 87.9, "end": 94.5},
    {"speaker": "patient", "text": "I tried the breathing one a couple of times. It helped a little in the moment but the anxiety came back pretty quickly.", "start": 95.1, "end": 103.7},
    {"speaker": "therapist", "text": "That's actually good — the fact that it offered some relief, even briefly, means the technique is working. With practice, the relief tends to last longer. How's your appetite been?", "start": 104.3, "end": 114.0},
    {"speaker": "patient", "text": "Not great. I've been skipping meals sometimes. I just don't feel hungry and cooking feels like too much effort.", "start": 114.6, "end": 122.1},
    {"speaker": "therapist", "text": "Appetite changes can be an important signal. No thoughts of harming yourself or not wanting to be here?", "start": 122.7, "end": 129.0},
    {"speaker": "patient", "text": "No, nothing like that. I just feel stuck and tired, not like I want to hurt myself.", "start": 129.6, "end": 136.4},
    {"speaker": "therapist", "text": "Good, I'm glad to hear that. Let's think about what might help you feel a bit more supported this week. What's one small thing that felt good recently, even for a moment?", "start": 137.0, "end": 146.5},
    {"speaker": "patient", "text": "The walk on Saturday, like I said. And I called my sister and we laughed a lot. That helped.", "start": 147.1, "end": 154.3},
    {"speaker": "therapist", "text": "Those are really meaningful — connection and movement. I'd like to suggest making those a priority this week. Can you commit to one walk and one call with your sister?", "start": 155.0, "end": 164.8},
    {"speaker": "patient", "text": "Yeah, I think I can do that. It sounds manageable.", "start": 165.4, "end": 169.9},
    {"speaker": "therapist", "text": "Wonderful. And I want us to keep working on challenging that inner critic. For homework, I'd like you to try writing down one situation where the critical voice shows up and see if you can find evidence that contradicts it.", "start": 170.5, "end": 184.2},
    {"speaker": "patient", "text": "Okay. Like a thought record?", "start": 184.8, "end": 186.9},
    {"speaker": "therapist", "text": "Exactly — just like we've done here together. You're doing important work. Same time next week?", "start": 187.5, "end": 194.3},
    {"speaker": "patient", "text": "Yes, same time works for me. Thank you.", "start": 194.9, "end": 197.8},
]

MOCK_RAW_TEXT = " ".join(seg["text"] for seg in MOCK_TRANSCRIPT_SEGMENTS)


# ---------------------------------------------------------------------------
# Deepgram transcription
# ---------------------------------------------------------------------------

async def _transcribe_with_deepgram(audio_path: str) -> tuple[list[TranscriptSegment], str]:
    """Call Deepgram Nova-2 with speaker diarization."""
    try:
        import httpx
    except ImportError:
        raise RuntimeError("httpx is required for Deepgram transcription")

    api_key = os.environ["DEEPGRAM_API_KEY"]
    audio_bytes = Path(audio_path).read_bytes()
    suffix = Path(audio_path).suffix.lower()
    content_type_map = {".wav": "audio/wav", ".mp3": "audio/mpeg", ".m4a": "audio/mp4"}
    content_type = content_type_map.get(suffix, "audio/wav")

    url = "https://api.deepgram.com/v1/listen"
    params = {
        "model": "nova-2",
        "diarize": "true",
        "smart_format": "true",
        "punctuate": "true",
        "keywords": [
            "CBT", "DBT", "EMDR", "trauma", "anxiety", "depression",
            "PTSD", "bipolar", "schema", "attachment", "dissociation",
            "suicidal", "self-harm", "medication", "SSRIs", "benzodiazepine",
        ],
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            url,
            headers={"Authorization": f"Token {api_key}", "Content-Type": content_type},
            params=params,
            content=audio_bytes,
        )
        resp.raise_for_status()
        data = resp.json()

    segments: list[TranscriptSegment] = []
    raw_words: list[str] = []

    channels = data.get("results", {}).get("channels", [])
    if channels:
        for word in channels[0].get("alternatives", [{}])[0].get("words", []):
            speaker_id = word.get("speaker", 0)
            speaker = "therapist" if speaker_id == 0 else "patient"
            text = word.get("punctuated_word", word.get("word", ""))
            raw_words.append(text)

            # Group consecutive same-speaker words into utterances
            if segments and segments[-1]["speaker"] == speaker:
                segments[-1]["text"] += " " + text
                segments[-1]["end"] = word.get("end", 0.0)
            else:
                segments.append({
                    "speaker": speaker,
                    "text": text,
                    "start": word.get("start", 0.0),
                    "end": word.get("end", 0.0),
                })

    raw_text = " ".join(raw_words)
    return segments, raw_text


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def transcribe_audio(audio_path: str) -> tuple[list[TranscriptSegment], str]:
    """Transcribe audio file. Uses Deepgram if API key available, else mock."""
    deepgram_key = os.environ.get("DEEPGRAM_API_KEY", "").strip()
    if deepgram_key:
        return await _transcribe_with_deepgram(audio_path)

    # Mock mode — return realistic transcript after brief delay
    import asyncio
    await asyncio.sleep(0.5)  # simulate processing
    return MOCK_TRANSCRIPT_SEGMENTS, MOCK_RAW_TEXT
