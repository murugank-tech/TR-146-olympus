from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class CandidateBase(BaseModel):
    anonymized_id: str
    skills: Dict[str, Any]
    projects: List[Dict[str, Any]]
    project_score: float = 0.0
    project_summary: Optional[str] = None
    experience_years: float

class CandidateCreate(CandidateBase):
    resume_text: str
    demographic_info: Dict[str, str]

class CandidateResponse(CandidateBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class JDBase(BaseModel):
    title: str
    description: str

class JDCreate(JDBase):
    pass

class JDResponse(JDBase):
    id: int
    cleaned_description: Optional[str]
    bias_flags: Optional[Dict[str, Any]]
    created_at: datetime
    class Config:
        from_attributes = True

class EvaluationResponse(BaseModel):
    candidate_id: int
    job_id: int
    skill_score: float
    project_score: float
    test_score: float
    final_score: float
    explanation: str

class FairnessAuditResponse(BaseModel):
    job_id: int
    demographic_group: str
    selection_rate: float
    disparate_impact_ratio: float
    bias_flag: int
