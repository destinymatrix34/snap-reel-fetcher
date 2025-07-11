
# Snapchat Downloader Backend

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the Flask server:
```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/snapchat/stories` - Get all stories from a user
- `POST /api/snapchat/single` - Download single story from URL
- `POST /api/snapchat/download` - Get download URL for a story

## Usage

Send POST requests with JSON body containing `input` field with username or URL.
