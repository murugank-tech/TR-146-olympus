from sqlalchemy import Column, Integer, String, Float, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    anonymized_id = Column(String, unique=True, index=True)
    resume_text = Column(Text)
    skills = Column(JSON)
    projects = Column(JSON)
    project_score = Column(Float, default=0.0)
    project_summary = Column(Text, default="")
    experience_years = Column(Float)
    demographic_info = Column(JSON) # Hidden from evaluation, used only for fairness audit
    created_at = Column(DateTime, default=datetime.utcnow)

    evaluations = relationship("Evaluation", back_populates="candidate")

class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text)
    cleaned_description = Column(Text)
    bias_flags = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    evaluations = relationship("Evaluation", back_populates="job_description")

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    job_id = Column(Integer, ForeignKey("job_descriptions.id"))
    skill_score = Column(Float)
    project_score = Column(Float)
    test_score = Column(Float)
    final_score = Column(Float)
    explanation = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="evaluations")
    job_description = relationship("JobDescription", back_populates="evaluations")

class FairnessAudit(Base):
    __tablename__ = "fairness_audits"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("job_descriptions.id"))
    demographic_group = Column(String)
    selection_rate = Column(Float)
    disparate_impact_ratio = Column(Float)
    bias_flag = Column(Integer) # 1 if biased, 0 otherwise
    created_at = Column(DateTime, default=datetime.utcnow)
