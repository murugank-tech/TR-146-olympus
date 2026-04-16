from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import uuid
import PyPDF2
import docx
from typing import List, Dict, Any

from .database import SessionLocal, engine, get_db
from . import models, schemas
from .nlp_engine import NLPEngine

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bias-Free AI Hiring System")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_from_file(file: UploadFile) -> str:
    content = ""
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext == ".pdf":
        pdf_reader = PyPDF2.PdfReader(file.file)
        for page in pdf_reader.pages:
            content += page.extract_text()
    elif file_ext == ".docx":
        doc = docx.Document(file.file)
        for para in doc.paragraphs:
            content += para.text + "\n"
    elif file_ext == ".txt":
        content = file.file.read().decode("utf-8")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format")
    
    return content

@app.post("/audit-jd", response_model=schemas.JDResponse)
def audit_jd(title: str = Form(...), description: str = Form(...), db: Session = Depends(get_db)):
    cleaned_desc, bias_flags = NLPEngine.audit_job_description(description)
    
    db_jd = models.JobDescription(
        title=title,
        description=description,
        cleaned_description=cleaned_desc,
        bias_flags=bias_flags
    )
    db.add(db_jd)
    db.commit()
    db.refresh(db_jd)
    return db_jd

@app.post("/upload-resume")
def upload_resume(
    file: UploadFile = File(...), 
    demographic_group: str = Form(...),
    db: Session = Depends(get_db)
):
    text = extract_text_from_file(file)
    anonymized_text = NLPEngine.anonymize_resume(text)
    skills = NLPEngine.extract_skills(text)
    
    anonymized_id = f"CAND-{uuid.uuid4().hex[:8].upper()}"
    
    db_candidate = models.Candidate(
        anonymized_id=anonymized_id,
        resume_text=anonymized_text,
        skills={"skills": skills},
        projects=[], # To be filled via separate logic or manual entry
        experience_years=0.0, # Heuristic would be needed here
        demographic_info={"group": demographic_group}
    )
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)
    
    return {"message": "Resume uploaded and anonymized", "candidate_id": db_candidate.id, "anonymized_id": anonymized_id}

@app.post("/evaluate")
def evaluate_candidate(candidate_id: int, job_id: int, db: Session = Depends(get_db)):
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    jd = db.query(models.JobDescription).filter(models.JobDescription.id == job_id).first()
    
    if not candidate or not jd:
        raise HTTPException(status_code=404, detail="Candidate or Job Description not found")
        
    match_results = NLPEngine.match_skills(candidate.skills.get("skills", []), jd.cleaned_description)
    
    skill_score = match_results["score"]
    project_score = 0.0 # Placeholder for Project Intelligence Scorer
    test_score = 0.0 # Placeholder for Adaptive Skill Test Engine
    
    final_score = (skill_score * 0.7) + (project_score * 0.15) + (test_score * 0.15)
    
    explanation = f"Matched skills: {', '.join(match_results['matched_skills'][:5])}. "
    explanation += f"Missing critical areas: {', '.join(match_results['missing_skills'][:3])}."
    
    db_eval = models.Evaluation(
        candidate_id=candidate_id,
        job_id=job_id,
        skill_score=skill_score,
        project_score=project_score,
        test_score=test_score,
        final_score=final_score,
        explanation=explanation
    )
    db.add(db_eval)
    db.commit()
    db.refresh(db_eval)
    
    return db_eval

@app.post("/generate-test")
def generate_test(job_id: int, db: Session = Depends(get_db)):
    jd = db.query(models.JobDescription).filter(models.JobDescription.id == job_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="Job Description not found")
    
    # Simple rule-based test generation
    skills = NLPEngine.extract_skills(jd.cleaned_description)
    test_questions = []
    for skill in skills[:3]:
        test_questions.append({
            "question": f"Explain the core concepts of {skill} and how you've applied it.",
            "type": "open-ended",
            "skill": skill
        })
    
    return {"job_id": job_id, "questions": test_questions}

@app.post("/score-projects")
def score_projects(candidate_id: int, projects: List[Dict[str, Any]], db: Session = Depends(get_db)):
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # Complexity scoring based on tech stack count and description length
    total_score = 0
    for p in projects:
        stack_score = len(p.get("tech_stack", [])) * 10
        desc_score = len(p.get("description", "")) / 10
        total_score += (stack_score + desc_score)
        
    avg_score = min(100, total_score / max(1, len(projects)))
    
    candidate.projects = projects
    db.commit()
    
    return {"candidate_id": candidate_id, "project_score": avg_score}

@app.get("/rankings/{job_id}", response_model=List[schemas.EvaluationResponse])
def get_rankings(job_id: int, db: Session = Depends(get_db)):
    return db.query(models.Evaluation).filter(models.Evaluation.job_id == job_id).order_by(models.Evaluation.final_score.desc()).all()

@app.get("/fairness-report/{job_id}")
def get_fairness_report(job_id: int, db: Session = Depends(get_db)):
    evaluations = db.query(models.Evaluation).filter(models.Evaluation.job_id == job_id).all()
    if not evaluations:
        return []
        
    # Group evaluations by demographic group
    groups = {}
    total_candidates = len(evaluations)
    
    for ev in evaluations:
        cand = db.query(models.Candidate).filter(models.Candidate.id == ev.candidate_id).first()
        group = cand.demographic_info.get("group", "Unknown")
        if group not in groups:
            groups[group] = {"selected": 0, "total": 0}
        groups[group]["total"] += 1
        # Consider "selected" if score > 70
        if ev.final_score >= 70:
            groups[group]["selected"] += 1
            
    # Reference group (usually the one with highest selection rate)
    rates = {g: (info["selected"] / info["total"] if info["total"] > 0 else 0) for g, info in groups.items()}
    if not rates:
        return []
        
    ref_group = max(rates, key=rates.get)
    ref_rate = rates[ref_group]
    
    report = []
    for group, rate in rates.items():
        dir_ratio = rate / ref_rate if ref_rate > 0 else 1.0
        bias_flag = 1 if dir_ratio < 0.8 else 0
        
        audit = models.FairnessAudit(
            job_id=job_id,
            demographic_group=group,
            selection_rate=rate,
            disparate_impact_ratio=dir_ratio,
            bias_flag=bias_flag
        )
        db.add(audit)
        report.append({
            "group": group,
            "selection_rate": round(rate, 2),
            "dir": round(dir_ratio, 2),
            "bias_flag": bias_flag
        })
        
    db.commit()
    return report

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
