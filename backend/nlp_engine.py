import spacy
import re
from typing import List, Dict, Any, Tuple
from sentence_transformers import SentenceTransformer, util
import torch

# Load models
nlp = spacy.load("en_core_web_sm")
embedder = SentenceTransformer('all-MiniLM-L6-v2')

# Comprehensive Biased language dictionary
BIASED_TERMS = {
    "masculine": {
        "ninja": "skilled professional",
        "rockstar": "exceptional candidate",
        "guru": "expert",
        "assertive": "proactive",
        "competitive": "motivated",
        "dominant": "leadership-oriented",
        "leader": "collaborator/leader",
        "aggressive": "direct",
        "ambitious": "goal-oriented",
        "powerful": "effective",
        "strong": "capable",
        "bold": "confident"
    },
    "feminine": {
        "supportive": "collaborative",
        "nurturing": "mentoring",
        "agreeable": "cooperative",
        "sensitive": "empathetic",
        "warm": "personable",
        "caring": "dedicated",
        "sweet": "pleasant",
        "gentle": "tactful"
    },
    "age-related": {
        "digital native": "tech-savvy",
        "young": "energetic",
        "recent graduate": "entry-level candidate",
        "youthful": "innovative",
        "millennial": "generation",
        "old school": "experienced",
        "energetic": "motivated",
        "new to the workforce": "early-career"
    },
    "university-bias": {
        "ivy league": "reputable institution",
        "top-tier school": "accredited institution",
        "prestigious university": "qualified education",
        "elite college": "respected institution",
        "harvard": "any accredited university",
        "MIT": "technical training",
        "stanford": "recognized institution",
        "ivy": "any university"
    },
    "disability": {
        "able-bodied": "candidate",
        "normal": "standard",
        "healthy": "qualified",
        "physically fit": "capable"
    },
    "nationality": {
        "native english speaker": "fluent in english",
        "american": "local",
        "foreign": "international",
        "accent": "communication style"
    },
    "other": {
        "best": "strong",
        "perfect": "qualified",
        "ideal": "suitable candidate"
    }
}

# Words that should NOT filter out resumes
SAFE_RESUME_KEYWORDS = [
    "gap", "career change", "self-taught", "bootcamp", "non-traditional",
    "alternative education", "online degree", "sabbatical", "freelance",
    "contract", "part-time", "entry-level", "junior", "no experience",
    "learning", "grew up", "cultural", "diverse", "minority", "woman",
    "international", "immigrant", "first-generation", "non-english",
    "homeschool", "disability", "accommodations", "neurodivergent"
]

class NLPEngine:
    @staticmethod
    def audit_job_description(text: str) -> Tuple[str, Dict[str, Any]]:
        """
        Audits job description for biased language.
        Removes biased terms and provides suggestions.
        """
        bias_flags = []
        cleaned_text = text
        
        for category, terms in BIASED_TERMS.items():
            for term, alternative in terms.items():
                pattern = re.compile(rf"\b{term}\b", re.IGNORECASE)
                matches = pattern.finditer(text)
                for match in matches:
                    if {
                        "term": term,
                        "category": category,
                        "alternative": alternative
                    } not in bias_flags:
                        bias_flags.append({
                            "term": term,
                            "category": category,
                            "alternative": alternative
                        })
                cleaned_text = pattern.sub(alternative, cleaned_text)
                    
        return cleaned_text, {"flags": bias_flags}

    @staticmethod
    def anonymize_resume(text: str) -> str:
        """
        Anonymizes sensitive PII from resume.
        Replaces names, organizations, locations, schools with placeholders.
        Does NOT filter based on resume content.
        """
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
    def check_resume_safety(text: str) -> Dict[str, Any]:
        """
        Checks if resume should be ACCEPTED based on safe keywords.
        Returns dict with acceptance status and reasoning.
        Does NOT discard resumes for having career gaps, non-traditional education, etc.
        """
        lower_text = text.lower()
        matched_safe_keywords = []
        
        for keyword in SAFE_RESUME_KEYWORDS:
            if keyword.lower() in lower_text:
                matched_safe_keywords.append(keyword)
        
        # ALWAYS accept resumes - no filtering
        return {
            "should_accept": True,
            "reason": "All resumes are accepted. Non-traditional paths are valued.",
            "safe_keywords_found": matched_safe_keywords,
            "message": "Resume will not be filtered based on career path or education type."
        }

    @staticmethod
    def extract_skills(text: str) -> List[str]:
        """
        Extracts skills from text without filtering.
        Does NOT discard candidates based on skill choices.
        """
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
        """
        Matches candidate skills to job requirements WITHOUT bias.
        Scores based on skill relevance only.
        """
        if not candidate_skills:
            return {
                "score": 0.0, 
                "matched_skills": [], 
                "missing_skills": [],
                "note": "No skills extracted"
            }
            
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
        
        matched = [s for s in candidate_skills if s in jd_skills]
        missing = [s for s in jd_skills if s not in candidate_skills]
        
        return {
            "score": round(score, 2),
            "matched_skills": matched,
            "missing_skills": missing,
            "message": f"Matched {len(matched)} skills. No discrimination applied.",
            "note": "All resumes scored fairly regardless of background or education source."
        }

    @staticmethod
    def detect_university_bias(text: str) -> Dict[str, Any]:
        """
        Detects if text contains university-based discrimination.
        Returns warning if specific schools are required.
        """
        prestigious_schools = [
            "harvard", "yale", "mit", "stanford", "princeton", "penn",
            "dartmouth", "cornell", "columbia", "duke", "northwestern",
            "carnegie mellon", "caltech", "jhu", "ucl", "oxford", "cambridge",
            "ivy league", "ivy league schools", "top-tier", "elite"
        ]
        
        lower_text = text.lower()
        found_bias = []
        
        for school in prestigious_schools:
            if re.search(rf"\b{school}\b", lower_text, re.IGNORECASE):
                found_bias.append(school)
        
        return {
            "has_university_bias": len(found_bias) > 0,
            "schools_found": found_bias,
            "recommendation": "Remove school name requirements. Focus on skills and experience instead."
            if found_bias else "No university bias detected"
        }

    @staticmethod
    def detect_gender_bias_advanced(text: str) -> Dict[str, Any]:
        """
        Advanced gender bias detection in job descriptions.
        Identifies pronouns, stereotypes, and gendered language.
        """
        male_pronouns = ["he", "him", "his"]
        female_pronouns = ["she", "her", "hers"]
        
        lower_text = text.lower()
        male_count = sum(lower_text.count(p) for p in male_pronouns)
        female_count = sum(lower_text.count(p) for p in female_pronouns)
        
        gender_stereotypes = {
            "masculine_traits": ["aggressive", "powerful", "dominant", "assertive", "competitive"],
            "feminine_traits": ["nurturing", "supportive", "sweet", "caring", "sensitive"]
        }
        
        male_trait_count = sum(
            len(re.findall(rf"\b{trait}\b", lower_text, re.IGNORECASE))
            for trait in gender_stereotypes["masculine_traits"]
        )
        female_trait_count = sum(
            len(re.findall(rf"\b{trait}\b", lower_text, re.IGNORECASE))
            for trait in gender_stereotypes["feminine_traits"]
        )
        
        bias_score = (male_trait_count + female_trait_count) / max(1, len(lower_text.split())) * 100
        
        return {
            "gender_bias_score": round(bias_score, 2),
            "male_pronoun_count": male_count,
            "female_pronoun_count": female_count,
            "male_trait_count": male_trait_count,
            "female_trait_count": female_trait_count,
            "has_gender_bias": bias_score > 10,
            "recommendation": "Use neutral pronouns and avoid gendered language." if bias_score > 10 else "Good gender neutrality"
        }
