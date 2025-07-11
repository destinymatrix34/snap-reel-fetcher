
# Snapchat Story Downloader

A comprehensive web application for downloading Snapchat stories, similar to storyclone.com.

## Features

- **Username Search**: Enter a Snapchat username to fetch all available stories
- **URL Download**: Paste a direct Snapchat story URL to download specific content  
- **Modern UI**: Beautiful gradient design with responsive layout
- **Story Grid**: Display stories in an organized grid with thumbnails
- **Multiple Formats**: Choose from different video qualities for download
- **Real-time Feedback**: Toast notifications and loading states

## Project Structure

```
├── backend/              # Flask API server
│   ├── app.py           # Main Flask application
│   ├── requirements.txt # Python dependencies
│   └── README.md        # Backend setup instructions
├── src/                 # React frontend
│   ├── components/      # UI components
│   ├── pages/          # Page components
│   └── ...             # Other frontend files
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend folder:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the Flask server:
```bash
python app.py
```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:8080`

## Usage

1. **For Username Search**: Enter a Snapchat username (e.g., "john_doe") to see all available stories
2. **For URL Download**: Paste a direct Snapchat story URL to download that specific story
3. **Download**: Click the download button on any story to save it to your device

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/snapchat/stories` - Get all stories from a username
- `POST /api/snapchat/single` - Download single story from URL
- `POST /api/snapchat/download` - Get download URL for a story

## Technologies Used

### Backend
- Flask - Python web framework
- yt-dlp - Video downloading library
- Flask-CORS - Cross-origin resource sharing

### Frontend
- React - UI framework
- TypeScript - Type safety
- Tailwind CSS - Styling
- shadcn/ui - UI components
- Lucide React - Icons
- Sonner - Toast notifications

## Notes

- The backend uses yt-dlp for extracting Snapchat story information
- Demo stories are provided when real extraction fails for testing purposes
- The application includes proper error handling and user feedback
- All downloads are handled client-side for better performance
