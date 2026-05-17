# 🚀 CodeCanvas AI

CodeCanvas AI is an AI-powered UI/UX website analyzer built with React, FastAPI, and Playwright.

It analyzes website interfaces and provides:

* 🎨 UI Score
* 🧠 UX Score
* 💡 Improvement Suggestions
* 📊 Visual Analytics
* ✨ Modern Interactive Dashboard

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* Axios
* Recharts
* Framer Motion

### Backend

* FastAPI
* Python
* Playwright
* Uvicorn

---

## ⚙️ Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend

python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt
playwright install

uvicorn main:app --reload
```

---

## 🌐 Local URLs

Frontend:

```bash
http://localhost:5173
```

Backend:

```bash
http://127.0.0.1:8000
```

---

## � Render Deployment

### Backend (FastAPI - Web Service)

**Build Command:**
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Environment Variables:**
```
PYTHON_VERSION=3.11
```

---

### Frontend (React/Vite - Static Site)

**Build Command:**
```bash
npm install && npm run build
```

**Publish Directory:**
```
dist
```

**Environment Variables:**
```
VITE_BACKEND_URL=https://your-backend-url.onrender.com
```

---

## �👩‍💻 Author

Shreya Meshram

Built with ❤️ using React & FastAPI.