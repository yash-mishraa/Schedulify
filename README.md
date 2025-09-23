# Schedulify - AI-Powered Automatic Timetable Generator

A modern web application that generates optimized, clash-free timetables for schools and colleges using AI genetic algorithms.

## 🚀 Features

- **AI-Powered Optimization**: Uses genetic algorithms to create optimal timetables
- **Real-time Updates**: Firebase integration for instant synchronization
- **Clash-free Scheduling**: Intelligent conflict resolution
- **Custom Constraints**: Flexible rule-based scheduling
- **Export Options**: PDF and Excel export functionality
- **Modern UI**: Beautiful, responsive interface with Shadcn/UI
- **Multi-tenant**: Support for multiple institutions

## 🛠️ Technology Stack

### Backend (Python)
- **FastAPI**: High-performance Python web framework
- **Firebase Admin SDK**: Real-time database and authentication
- **Genetic Algorithm**: AI-powered optimization
- **Pandas**: Data processing and Excel export
- **Matplotlib**: PDF generation

### Frontend (JavaScript)
- **Next.js**: React framework for production
- **Shadcn/UI**: Modern component library
- **Firebase Client SDK**: Real-time updates
- **Tailwind CSS**: Utility-first CSS framework

## 📁 Project Structure

schedulify/
├── backend/ # Python FastAPI backend
├── frontend/ # Next.js frontend
├── README.md
└── .gitignore


## 🚀 Quick Start

### Backend Setup

1. Navigate to backend directory:
cd backend

2. Create virtual environment:
python3 -m venv venv

3. Activate virtual environment:
source venv/bin/activate

4. Install dependencies:
pip install -r requirements.txt

### Frontend Setup

1. Navigate to frontend directory:
cd frontend

2. Install dependencies:
npm install


3. Set up environment variables:
cp .env.local.example .env.local

Edit .env.local with your Firebase and API credentials


4. Run the development server:
npm run dev


## 📝 Configuration

### Environment Variables

#### Backend (.env)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_CLIENT_ID=your-client-id


#### Frontend (.env.local)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_API_URL=http://localhost:8000


## 🚀 Deployment

### Backend Deployment (Railway/Render)
- Deploy the `backend/` folder to Railway or Render
- Add environment variables in deployment settings
- Use `uvicorn app.main:app --host 0.0.0.0 --port $PORT` as start command

### Frontend Deployment (Vercel)
- Deploy the `frontend/` folder to Vercel
- Add environment variables in Vercel settings
- Update `NEXT_PUBLIC_API_URL` to your deployed backend URL

## 📖 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Firebase for real-time database capabilities
- FastAPI for the excellent Python web framework
- Next.js and Vercel for frontend development and deployment
- Shadcn/UI for beautiful components

---

**Built with ❤️ for educational institutions worldwide**
