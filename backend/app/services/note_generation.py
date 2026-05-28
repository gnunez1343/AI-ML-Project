"""SOAP note generation — GPT-4o or realistic mock."""
import os
from dataclasses import dataclass


@dataclass
class SOAPNote:
    subjective: str
    objective: str
    assessment: str
    plan: str


# ---------------------------------------------------------------------------
# Mock SOAP note — realistic behavioral health documentation
# ---------------------------------------------------------------------------

MOCK_SOAP: SOAPNote = SOAPNote(
    subjective=(
        "The patient presents today reporting a difficult week, characterized by persistent insomnia, "
        "low mood, and intrusive rumination about a workplace incident in which the patient's manager "
        "criticized a presentation in front of colleagues. The patient described feeling humiliated and "
        "endorsed significant shame, along with a pervasive belief of inadequacy ('I'm not good enough '). "
        "The patient linked this self-critical cognition to early developmental experiences with a highly "
        "critical parental figure. Current mood rated 4/10. Appetite is decreased, with meal skipping "
        "reported. The patient denied suicidal ideation, homicidal ideation, and self-harm urges. "
        "Positive coping noted: the patient engaged in a walk on Saturday and had a supportive phone "
        "call with a sibling, both of which provided temporary mood improvement. Diaphragmatic breathing "
        "exercises (previously introduced) were attempted with partial benefit."
    ),
    objective=(
        "The patient appeared alert and oriented x3, with grooming and hygiene within normal limits. "
        "Affect was constricted and dysthymic, congruent with reported mood. Speech was normal in rate, "
        "rhythm, and volume. Thought process was linear and goal-directed. No perceptual disturbances "
        "elicited. Judgment and insight appeared fair to good, with demonstrated capacity to reflect on "
        "cognitive patterns. Session duration: approximately 50 minutes, individual psychotherapy. "
        "Therapeutic modality: Cognitive Behavioral Therapy (CBT) with psychodynamic elements."
    ),
    assessment=(
        "The patient continues to meet criteria consistent with the following diagnoses:\n\n"
        "• F33.1 — Major Depressive Disorder, Recurrent, Moderate: Persistent low mood (4/10), "
        "insomnia, decreased appetite, and anhedonia consistent with moderate episode severity.\n\n"
        "• F41.1 — Generalized Anxiety Disorder: Ongoing ruminative worry, difficulty with sleep "
        "onset, and intolerance of uncertainty.\n\n"
        "Formulation: The patient demonstrates a core schema of inadequacy reinforced by early "
        "parental criticism. The recent workplace incident activated this schema, triggering an "
        "acute depressive and anxious response. Protective factors include interpersonal support "
        "(sibling), engagement in physical activity, and strong therapeutic alliance. Risk level "
        "is currently LOW — no active suicidal ideation or self-harm. Clinical trajectory is "
        "guarded but with meaningful engagement in treatment."
    ),
    plan=(
        "1. Continue weekly individual CBT sessions.\n\n"
        "2. Homework assigned: Thought record — patient will identify one situation this week "
        "in which the self-critical inner voice is activated, document the automatic thought, "
        "emotional response, and generate evidence for and against the belief.\n\n"
        "3. Behavioral activation: Patient committed to (a) one outdoor walk and (b) one phone "
        "call with sibling prior to next appointment.\n\n"
        "4. Continue diaphragmatic breathing practice — increase frequency to 2x daily for "
        "5 minutes to build automaticity of the response.\n\n"
        "5. Monitor sleep hygiene; review stimulus control techniques at next session if "
        "insomnia persists.\n\n"
        "6. Medication: None currently prescribed; will reassess need if depressive symptoms "
        "worsen or do not improve with psychotherapy within 4-6 weeks.\n\n"
        "7. Safety plan reviewed — patient verbalized understanding and denies current risk. "
        "Next session scheduled in one week."
    ),
)


# ---------------------------------------------------------------------------
# GPT-4o note generation
# ---------------------------------------------------------------------------

SOAP_SYSTEM_PROMPT = """You are a clinical documentation assistant for behavioral health practitioners. 
You produce SOAP notes that are clinically accurate, empathetic in tone, and suitable for inclusion 
in an electronic health record (EHR). Your notes adhere to standard behavioral health documentation 
practices and comply with HIPAA-appropriate clinical language."""

SOAP_USER_TEMPLATE = """Generate a SOAP note for the following therapy session.

Patient: {patient_name}
Session Type: {session_type}
Session Number: {session_number}

Transcript:
{transcript}

Instructions:
- Write a complete SOAP note with four clearly delineated sections: Subjective, Objective, Assessment, Plan.
- Subjective: Summarize what the patient reported — presenting concerns, mood rating (if given), symptoms, relevant history mentioned, coping attempts.
- Objective: Describe observable clinical findings — appearance, affect, cognition, speech, thought process, any behavioral observations. Include session duration and modality.
- Assessment: Clinical formulation and diagnosis codes. Include relevant ICD-10 codes with descriptions (e.g., F33.1 Major Depressive Disorder, Recurrent, Moderate). Comment on risk level (low/moderate/high) based on the session content.
- Plan: Specific, numbered action items — homework assigned, next session timing, any medication considerations, behavioral strategies, safety plan if relevant.
- Use the patient's first name naturally throughout.
- Reference specific details from the transcript to make the note concrete.
- Write in a clinical but empathetic register — avoid jargon overload.

Return ONLY a JSON object with these exact keys: subjective, objective, assessment, plan (all strings).
No markdown fences, no extra fields."""


async def _generate_with_gpt4o(
    transcript_text: str,
    patient_name: str,
    session_type: str,
    session_number: int = 1,
) -> SOAPNote:
    """Call GPT-4o to generate the SOAP note."""
    try:
        from openai import AsyncOpenAI
    except ImportError:
        raise RuntimeError("openai package is required for AI note generation")

    import json

    client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

    prompt = SOAP_USER_TEMPLATE.format(
        patient_name=patient_name,
        session_type=session_type,
        session_number=session_number,
        transcript=transcript_text[:12000],  # fit within context window
    )

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SOAP_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=2048,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content or "{}"
    data = json.loads(content)

    return SOAPNote(
        subjective=data.get("subjective", ""),
        objective=data.get("objective", ""),
        assessment=data.get("assessment", ""),
        plan=data.get("plan", ""),
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def generate_soap_note(
    transcript_text: str,
    patient_name: str,
    session_type: str,
    session_number: int = 1,
) -> SOAPNote:
    """Generate SOAP note. Uses GPT-4o if OPENAI_API_KEY available, else mock."""
    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if openai_key:
        return await _generate_with_gpt4o(
            transcript_text, patient_name, session_type, session_number
        )

    # Mock mode — personalize with patient name
    import asyncio
    await asyncio.sleep(0.3)  # simulate processing

    # Lightly personalize the mock note
    name_first = patient_name.split()[0] if patient_name else "the patient"
    subj = MOCK_SOAP.subjective.replace("The patient", name_first.title(), 1)

    return SOAPNote(
        subjective=subj,
        objective=MOCK_SOAP.objective,
        assessment=MOCK_SOAP.assessment,
        plan=MOCK_SOAP.plan,
    )
