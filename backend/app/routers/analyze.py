import logging
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import AnalyzeRequest, AnalysisResult
from app.services.rag import retrieve_evidence
from app.services.vision import analyze_multimodal_crop_input
from app.services.reasoning import synthesize_analysis_result
from app.services.db import save_analysis_result

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Analysis"])

MAX_IMAGE_SIZE_MB = 10

@router.post(
    "/analyze",
    response_model=AnalysisResult,
    status_code=status.HTTP_200_OK,
    summary="Analyze crop symptoms and retrieve evidence-backed diagnosis support"
)
async def analyze_crop(request: AnalyzeRequest) -> AnalysisResult:
    """
    POST /api/analyze
    Receives AnalyzeRequest payload containing image data URL, text description, voice transcription, language, and crop type.
    Retrieves evidence via RAG pipeline, runs multimodal analysis, synthesizes structured result, and stores history.
    """
    try:
        # Input validation
        if not request.imageDataUrl and not request.textDescription and not request.transcription:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one input (image, text description, or voice transcription) must be provided."
            )

        # Check payload size limits
        if request.imageDataUrl and len(request.imageDataUrl) > MAX_IMAGE_SIZE_MB * 1024 * 1024 * 1.37:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Image upload size exceeds maximum allowed limit of {MAX_IMAGE_SIZE_MB}MB."
            )

        # 1. RAG Evidence Retrieval
        query_text = f"{request.textDescription or ''} {request.transcription or ''}".strip()
        crop_name = request.cropType or "unknown"
        evidence_sources = retrieve_evidence(query=query_text, crop_type=crop_name)

        # 2. Multimodal LLM Vision Analysis
        evidence_summary = "\n".join([f"- [{s.title}]: {s.snippet}" for s in evidence_sources])
        llm_analysis = analyze_multimodal_crop_input(
            image_data_url=request.imageDataUrl,
            text_description=request.textDescription,
            transcription=request.transcription,
            crop_type=crop_name,
            evidence_text=evidence_summary
        )

        # 3. Decision Support Synthesis
        result = synthesize_analysis_result(
            req=request,
            sources=evidence_sources,
            llm_output=llm_analysis
        )

        # 4. Save to database / memory
        save_analysis_result(result)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during crop analysis: {e}", exc_info=True)
        # Return graceful degraded error response rather than raw 500 crash
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your crop analysis request. Please try again."
        )
