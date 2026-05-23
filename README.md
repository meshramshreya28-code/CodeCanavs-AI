# 🚀 CodeCanvas AI — UI/UX Analyzer

> An AI-powered tool that analyzes any website's UI & UX quality in seconds using Google Gemini Vision + Playwright screenshots.

![CodeCanvas AI](https://codecanavs-ai-1.onrender.com)

---

## ✨ Features

- 🌐 **Live Website Screenshot** — captures any URL using headless Chromium via Playwright
- 🧠 **AI-Powered Analysis** — sends screenshot to Google Gemini 2.5 Flash for deep UI/UX evaluation
- 📊 **UI & UX Scores** — get scores out of 100 for both UI quality and UX experience
- 💡 **Design Suggestions** — actionable improvement recommendations
- ♿ **Accessibility Issues** — highlights contrast, alt text, and other a11y problems
- 🎨 **Color Palette Detection** — extracts dominant colors from the website
- 📝 **Analysis History** — tracks all previously analyzed URLs in the session
- 🌌 **3D Animated Background** — Three.js powered interactive background with mouse parallax

---

## 🛠️ Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| React + Vite | UI framework |
| Framer Motion | Animations |
| Three.js | 3D background |
| Recharts | Score donut chart |
| Axios | API calls |

### Backend
| Tech | Purpose |
|------|---------|
| FastAPI | REST API |
| Playwright | Headless browser screenshots |
| Google Gemini 2.5 Flash | AI vision analysis |
| Python-dotenv | Environment config |

### Deployment
- **Frontend** → Render Static Site
- **Backend** → Render Web Service

---

## 🚀 Live Demo

🔗 **[codecanavs-ai-1.onrender.com](https://codecanavs-ai-1.onrender.com)**

> ⚠️ Hosted on Render free tier — first request may take 30–60s to wake up the backend.

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- A [Google Gemini API key](https://aistudio.google.com)

### 1. Clone the repo

```bash
git clone https://github.com/meshramshreya28-code/CodeCanavs-AI.git
cd CodeCanavs-AI
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
playwright install chromium
```

Create a `.env` file in the `backend/` folder:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend:

```bash
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## 📁 Project Structure

```
CodeCanavs-AI/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env                     # API keys (not committed)
│   ├── routes/
│   │   └── screenshot.py        # /analyze/url endpoint
│   └── services/
│       ├── screenshot_service.py  # Playwright screenshot logic
│       └── gemini_service.py      # Gemini AI analysis
│
└── frontend/
    ├── src/
    │   ├── App.jsx              # Main React component
    │   └── App.css              # Styles
    └── package.json
```

---

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Your Google Gemini API key from [aistudio.google.com](https://aistudio.google.com) |

---

## 📸 How It Works

1. User enters a website URL
2. Backend launches headless Chromium via Playwright and takes a screenshot
3. Screenshot is sent to Google Gemini 2.5 Flash Vision API
4. Gemini analyzes the UI/UX and returns structured JSON scores
5. Frontend displays scores, suggestions, and a donut chart

---

## 🙌 Author

**Shreya Meshram**  
Built with ❤️ using React, FastAPI, and Google Gemini AI

---

## 📄 License

MIT License — feel free to use and modify!