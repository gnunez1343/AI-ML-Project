"""Sessions API — core product loop endpoints."""
import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.auth import get_current_user
from app.database import get_db
from app.models.patient import Patient
from app.models.session import Note, Session, Transcript
from app.models.user import User
from app.services.note_generation import generate_soap_note
from app.services.transcription import transcribe_audio

router = APIRouter(prefix="/sessions", tags=["sessions"])

UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_AUDIO_TYPES = {
    "audio/wav", "audio/wave", "audio/x-wav",
    "audio/mpeg", "audio/mp3",
    "audio/mp4", "audio/x-m4a", "audio/m4a",
    "audio/ogg", "audio/webm",
    "application/octet-stream",  # browsers sometimes send this
}
MAX_AUDIO_BYTES = 200 * 1024 * 1024  # 200 MB


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class PatientResponse(BaseModel):
    id: str
    name: str


class TranscriptSegment(BaseModel):
    speaker: str
    text: str
    start: float
    end: float


class TranscriptResponse(BaseModel):
    id: str
    segments: list[TranscriptSegment]
    raw_text: str


class NoteResponse(BaseModel):
    id: str
    subjective: str
    objective: str
    assessment: str
    plan: str
    status: str
    approved_at: Optional[str]


class SessionResponse(BaseModel):
    id: str
    patient: PatientResponse
    session_type: str
    status: str
    duration_seconds: Optional[int]
    created_at: str
    updated_at: str
    transcript: Optional[TranscriptResponse]
    note: Optional[NoteResponse]


class SessionListItem(BaseModel):
    id: str
    patient_name: str
    session_type: str
    status: str
    duration_seconds: Optional[int]
    created_at: str
    has_note: bool


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class CreateSessionRequest(BaseModel):
    patient_name: str
    session_type: str = "individual"


class UpdateNoteRequest(BaseModel):
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _serialize_session(s: Session) -> SessionResponse:
    transcript_resp: Optional[TranscriptResponse] = None
    if s.transcript:
        try:
            segments_raw = json.loads(s.transcript.content)
        except (json.JSONDecodeError, TypeError):
            segments_raw = []
        transcript_resp = TranscriptResponse(
            id=s.transcript.id,
            segments=[TranscriptSegment(**seg) for seg in segments_raw],
            raw_text=s.transcript.raw_text,
        )

    note_resp: Optional[NoteResponse] = None
    if s.note:
        note_resp = NoteResponse(
            id=s.note.id,
            subjective=s.note.subjective,
            objective=s.note.objective,
            assessment=s.note.assessment,
            plan=s.note.plan,
            status=s.note.status,
            approved_at=s.note.approved_at.isoformat() if s.note.approved_at else None,
        )

    return SessionResponse(
        id=s.id,
        patient=PatientResponse(id=s.patient.id, name=s.patient.name),
        session_type=s.session_type,
        status=s.status,
        duration_seconds=s.duration_seconds,
        created_at=s.created_at.isoformat(),
        updated_at=s.updated_at.isoformat(),
        transcript=transcript_resp,
        note=note_resp,
    )


async def _get_session_or_404(
    session_id: str, clinician_id: str, db: AsyncSession
) -> Session:
    result = await db.execute(
        select(Session)
        .options(
            selectinload(Session.patient),
            selectinload(Session.transcript),
            selectinload(Session.note),
        )
        .where(Session.id == session_id, Session.clinician_id == clinician_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


# ---------------------------------------------------------------------------
# POST /api/sessions — create session
# ---------------------------------------------------------------------------

@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: CreateSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    patient_name = body.patient_name.strip()
    if not patient_name:
        raise HTTPException(status_code=422, detail="patient_name is required")

    session_type = body.session_type.lower()
    allowed_types = ["individual", "couples", "family", "group", "intake"]
    if session_type not in allowed_types:
        raise HTTPException(status_code=422, detail=f"session_type must be one of {allowed_types}")

    # Find or create patient for this clinician
    result = await db.execute(
        select(Patient).where(
            Patient.clinician_id == current_user.id,
            Patient.name == patient_name,
        )
    )
    patient = result.scalar_one_or_none()
    if not patient:
        patient = Patient(clinician_id=current_user.id, name=patient_name)
        db.add(patient)
        await db.flush()  # get patient.id

    session = Session(
        clinician_id=current_user.id,
        patient_id=patient.id,
        session_type=session_type,
        status="recording",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    # Reload with relationships
    return _serialize_session(await _get_session_or_404(session.id, current_user.id, db))


# ---------------------------------------------------------------------------
# GET /api/sessions — list sessions
# ---------------------------------------------------------------------------

@router.get("", response_model=list[SessionListItem])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SessionListItem]:
    result = await db.execute(
        select(Session)
        .options(
            selectinload(Session.patient),
            selectinload(Session.note),
        )
        .where(Session.clinician_id == current_user.id)
        .order_by(Session.created_at.desc())
    )
    sessions = result.scalars().all()

    return [
        SessionListItem(
            id=s.id,
            patient_name=s.patient.name,
            session_type=s.session_type,
            status=s.status,
            duration_seconds=s.duration_seconds,
            created_at=s.created_at.isoformat(),
            has_note=s.note is not None,
        )
        for s in sessions
    ]


# ---------------------------------------------------------------------------
# GET /api/sessions/{id} — session detail
# ---------------------------------------------------------------------------

@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    session = await _get_session_or_404(session_id, current_user.id, db)
    return _serialize_session(session)


# ---------------------------------------------------------------------------
# POST /api/sessions/{id}/upload — upload audio
# ---------------------------------------------------------------------------

@router.post("/{session_id}/upload", response_model=SessionResponse)
async def upload_audio(
    session_id: str,
    file: UploadFile = File(...),
    duration_seconds: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    session = await _get_session_or_404(session_id, current_user.id, db)

    # Validate content type
    content_type = (file.content_type or "").lower()
    filename = (file.filename or "").lower()
    valid_ext = filename.endswith((".wav", ".mp3", ".m4a", ".ogg", ".webm"))
    if content_type not in ALLOWED_AUDIO_TYPES and not valid_ext:
        raise HTTPException(
            status_code=422,
            detail="Invalid file type. Supported formats: WAV, MP3, M4A, OGG, WebM",
        )

    # Read and size-check
    audio_bytes = await file.read()
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file exceeds 200MB limit")

    # Save to disk
    ext = Path(file.filename or "audio.wav").suffix or ".wav"
    filename_safe = f"{uuid.uuid4()}{ext}"
    dest = UPLOAD_DIR / filename_safe
    dest.write_bytes(audio_bytes)

    # Delete previous audio file if exists
    if session.audio_file_path:
        old_path = Path(session.audio_file_path)
        if old_path.exists():
            old_path.unlink(missing_ok=True)

    session.audio_file_path = str(dest)
    session.status = "processing"
    if duration_seconds:
        session.duration_seconds = duration_seconds
    session.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(session)

    return _serialize_session(await _get_session_or_404(session.id, current_user.id, db))


# ---------------------------------------------------------------------------
# POST /api/sessions/{id}/transcribe — run transcription
# ---------------------------------------------------------------------------

@router.post("/{session_id}/transcribe", response_model=SessionResponse)
async def transcribe_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    session = await _get_session_or_404(session_id, current_user.id, db)

    if not session.audio_file_path:
        # Mock mode: allow transcription without audio for demo purposes
        audio_path = ""
    else:
        audio_path = session.audio_file_path

    # Run transcription (or mock)
    segments, raw_text = await transcribe_audio(audio_path)

    # Upsert transcript
    if session.transcript:
        session.transcript.content = json.dumps(segments)
        session.transcript.raw_text = raw_text
    else:
        transcript = Transcript(
            session_id=session.id,
            content=json.dumps(segments),
            raw_text=raw_text,
        )
        db.add(transcript)

    session.status = "processing"
    session.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return _serialize_session(await _get_session_or_404(session.id, current_user.id, db))


# ---------------------------------------------------------------------------
# POST /api/sessions/{id}/generate-note — generate SOAP note
# ---------------------------------------------------------------------------

@router.post("/{session_id}/generate-note", response_model=SessionResponse)
async def generate_note(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    session = await _get_session_or_404(session_id, current_user.id, db)

    # Get raw transcript text
    if session.transcript:
        raw_text = session.transcript.raw_text
    else:
        raw_text = ""  # will use mock content

    # Count previous sessions for this patient to estimate session number
    result = await db.execute(
        select(Session).where(
            Session.clinician_id == current_user.id,
            Session.patient_id == session.patient_id,
        )
    )
    all_patient_sessions = result.scalars().all()
    session_number = len(all_patient_sessions)

    soap = await generate_soap_note(
        transcript_text=raw_text,
        patient_name=session.patient.name,
        session_type=session.session_type,
        session_number=session_number,
    )

    # Upsert note
    if session.note:
        session.note.subjective = soap.subjective
        session.note.objective = soap.objective
        session.note.assessment = soap.assessment
        session.note.plan = soap.plan
        session.note.status = "draft"
        session.note.updated_at = datetime.now(timezone.utc)
    else:
        note = Note(
            session_id=session.id,
            subjective=soap.subjective,
            objective=soap.objective,
            assessment=soap.assessment,
            plan=soap.plan,
            status="draft",
        )
        db.add(note)

    session.status = "draft"
    session.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return _serialize_session(await _get_session_or_404(session.id, current_user.id, db))


# ---------------------------------------------------------------------------
# PATCH /api/sessions/{id}/note — update note (clinician edits)
# ---------------------------------------------------------------------------

@router.patch("/{session_id}/note", response_model=SessionResponse)
async def update_note(
    session_id: str,
    body: UpdateNoteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    session = await _get_session_or_404(session_id, current_user.id, db)

    if not session.note:
        raise HTTPException(status_code=404, detail="No note found for this session")

    if body.subjective is not None:
        session.note.subjective = body.subjective
    if body.objective is not None:
        session.note.objective = body.objective
    if body.assessment is not None:
        session.note.assessment = body.assessment
    if body.plan is not None:
        session.note.plan = body.plan

    session.note.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return _serialize_session(await _get_session_or_404(session.id, current_user.id, db))


# ---------------------------------------------------------------------------
# POST /api/sessions/{id}/approve — approve note
# ---------------------------------------------------------------------------

@router.post("/{session_id}/approve", response_model=SessionResponse)
async def approve_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    session = await _get_session_or_404(session_id, current_user.id, db)

    if not session.note:
        raise HTTPException(status_code=422, detail="Cannot approve: no note exists for this session")

    now = datetime.now(timezone.utc)
    session.note.status = "approved"
    session.note.approved_at = now
    session.note.updated_at = now
    session.status = "approved"
    session.updated_at = now
    await db.commit()

    return _serialize_session(await _get_session_or_404(session.id, current_user.id, db))
