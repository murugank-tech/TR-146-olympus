<<<<<<< HEAD
# TR-146-olympus
=======
# EquiHire: Bias-Free AI Hiring System

A comprehensive AI-powered platform designed to eliminate bias in job descriptions and candidate evaluations, promoting fair and equitable hiring practices.

## 🚀 Features

- **Job Description Auditing**: Automatically scans job postings for biased language using advanced NLP
- **Bias Detection**: Identifies gender, cultural, and discriminatory terms in real-time
- **Candidate Evaluation**: Fair assessment system with skill and project matching
- **Real-time Monitoring**: Dashboard for tracking fairness metrics and system status
- **Modern UI**: Clean, responsive React interface with Tailwind CSS
- **RESTful API**: FastAPI backend for scalable integrations

## 🛠 Tech Stack

### Backend
- **Python 3.11+**
- **FastAPI**: High-performance web framework
- **spaCy**: Natural language processing for bias detection
- **Sentence Transformers**: Semantic similarity for candidate matching
- **SQLAlchemy**: Database ORM
- **PyPDF2 & python-docx**: Document processing

### Frontend
- **React 19**: Modern JavaScript library
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls
- **Recharts**: Data visualization
- **Framer Motion**: Smooth animations

### Database
- **SQLite**: Lightweight database (easily replaceable with PostgreSQL/MySQL)

## 📋 Prerequisites

- Python 3.11 or higher
- Node.js 18+ and npm
- Git

## 🏃‍♂️ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/murugank-tech/TR-146-olympus.git
cd TR-146-olympus
```

### 2. Backend Setup
```bash
# Install Python dependencies
pip install fastapi uvicorn sqlalchemy PyPDF2 python-docx spacy sentence-transformers torch

# Install spaCy language model
python install_models.py

# Start the backend server
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
# Install Node.js dependencies
cd frontend
npm install

# Start the development server
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)

## 📖 API Endpoints

### Job Description Auditing
- `POST /audit-jd`: Audit a job description for bias
  - Body: `title` (string), `description` (string)
  - Returns: Cleaned description and bias flags

### Candidate Management
- `POST /candidates/`: Create a new candidate
- `GET /candidates/`: List all candidates
- `GET /candidates/{id}`: Get candidate details

### Evaluation
- `POST /evaluate`: Evaluate candidate-job fit

## 🎯 Usage

1. **Audit Job Descriptions**: Upload or paste job descriptions to check for biased language
2. **Add Candidates**: Upload resumes (PDF/DOCX/TXT) with demographic info
3. **Monitor Fairness**: View dashboard metrics for bias detection accuracy
4. **Evaluate Matches**: Get fair candidate-job recommendations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint for JavaScript/React
- Write tests for new features
- Update documentation

## 📊 Project Structure

```
TR-146-olympus/
├── backend/
│   ├── main.py          # FastAPI application
│   ├── database.py      # Database configuration
│   ├── models.py        # SQLAlchemy models
│   ├── schemas.py       # Pydantic schemas
│   └── nlp_engine.py    # Bias detection logic
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Main React component
│   │   ├── components/  # Reusable components
│   │   └── assets/      # Images and icons
│   ├── package.json
│   └── vite.config.js
├── install_models.py    # spaCy model installer
├── .gitignore
└── README.md
```

## 🔒 Bias Detection Algorithm

The system uses:
- **spaCy NER**: Named entity recognition
- **Sentence Transformers**: Semantic similarity scoring
- **Custom Bias Dictionary**: Pre-defined biased terms database
- **Context Analysis**: Sentence-level bias detection

## 📈 Future Enhancements

- [ ] Multi-language support
- [ ] Advanced ML models for bias detection
- [ ] Integration with ATS systems
- [ ] Real-time collaboration features
- [ ] Comprehensive analytics dashboard

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- **Murugan** - Project Lead & Backend Developer
- **Collaborators**: Welcome! See contributing guidelines.

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Contact: murugan@example.com

---

**Built for Tensor Hackathon 2026 - Promoting Fair AI in Hiring**
>>>>>>> 2b460d6 (Add comprehensive README.md with project documentation)
