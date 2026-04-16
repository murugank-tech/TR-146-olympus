import spacy
import re
from typing import List, Dict, Any, Tuple
from sentence_transformers import SentenceTransformer, util
import torch

# Load models
nlp = spacy.load("en_core_web_sm")
embedder = SentenceTransformer('all-MiniLM-L6-v2')

# Biased language dictionary
BIASED_TERMS = {
    "masculine": {
        "ninja": "skilled professional",
        "rockstar": "exceptional candidate",
        "guru": "expert",
        "assertive": "proactive",
        "competitive": "motivated",
        "dominant": "leadership-oriented",
        "leader": "collaborator/leader"
    },
    "feminine": {
        "supportive": "collaborative",
        "nurturing": "mentoring",
        "agreeable": "cooperative",
        "sensitive": "empathetic"
    },
    "age-related": {
        "digital native": "tech-savvy",
        "young": "energetic",
        "recent graduate": "entry-level candidate",
        "youthful": "innovative"
    }
}

class NLPEngine:
    @staticmethod
    def audit_job_description(text: str) -> Tuple[str, Dict[str, Any]]:
        bias_flags = []
        cleaned_text = text
        
        for category, terms in BIASED_TERMS.items():
            for term, alternative in terms.items():
                pattern = re.compile(rf"\b{term}\b", re.IGNORECASE)
                if pattern.search(text):
                    bias_flags.append({
                        "term": term,
                        "category": category,
                        "alternative": alternative
                    })
                    cleaned_text = pattern.sub(alternative, cleaned_text)
                    
        return cleaned_text, {"flags": bias_flags}

    @staticmethod
    def anonymize_resume(text: str) -> str:
        doc = nlp(text)
        anonymized_text = text
        
        # Remove names, organizations (colleges), and locations
        entities_to_remove = ["PERSON", "ORG", "GPE", "LOC", "FAC"]
        
        # Sort entities by start index in reverse to avoid offset issues during replacement
        entities = sorted(doc.ents, key=lambda x: x.start_char, reverse=True)
        
        for ent in entities:
            if ent.label_ in entities_to_remove:
                anonymized_text = (
                    anonymized_text[:ent.start_char] 
                    + f"[{ent.label_}]" 
                    + anonymized_text[ent.end_char:]
                )
        
        # Also remove emails and phone numbers using regex
        anonymized_text = re.sub(r'\S+@\S+', '[EMAIL]', anonymized_text)
        anonymized_text = re.sub(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', '[PHONE]', anonymized_text)
        
        return anonymized_text

    @staticmethod
    def extract_skills(text: str) -> List[str]:
        # Simple extraction based on capitalized words or specific patterns
        # In a real app, this would use a more sophisticated NER model for skills
        doc = nlp(text)
        skills = []
        for token in doc:
            if token.pos_ in ["PROPN", "NOUN"] and len(token.text) > 2:
                # Basic heuristic: words that look like technical skills
                if re.match(r'^[A-Z][a-z]+|[A-Z]{2,}$', token.text):
                    skills.append(token.text)
        return list(set(skills))

    @staticmethod
    def match_skills(candidate_skills: List[str], job_description: str) -> Dict[str, Any]:
        if not candidate_skills:
            return {"score": 0.0, "matched": [], "missing": []}
            
        jd_doc = nlp(job_description)
        jd_skills = NLPEngine.extract_skills(job_description)
        
        # Use Sentence Transformers for semantic similarity
        cand_text = " ".join(candidate_skills)
        jd_text = job_description
        
        cand_embedding = embedder.encode(cand_text, convert_to_tensor=True)
        jd_embedding = embedder.encode(jd_text, convert_to_tensor=True)
        
        cosine_score = util.pytorch_cos_sim(cand_embedding, jd_embedding).item()
        
        # Cap score between 0 and 100
        score = max(0, min(100, cosine_score * 100))
        
        return {
            "score": round(score, 2),
            "matched_skills": [s for s in candidate_skills if s in jd_skills],
            "missing_skills": [s for s in jd_skills if s not in candidate_skills]
        }
