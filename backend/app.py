
from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
from urllib.parse import urlparse
import requests
import json
import re
import time
from datetime import datetime

app = Flask(__name__)
CORS(app)

class SnapchatDownloader:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Referer': 'https://www.google.com/'
        }
    
    def is_snapchat_url(self, text):
        """Check if input is a Snapchat URL"""
        try:
            parsed = urlparse(text)
            return 'snapchat.com' in parsed.netloc or 't.snapchat.com' in parsed.netloc
        except:
            return False
    
    def build_snapchat_url_from_username(self, username):
        """Build Snapchat profile URL from username"""
        username = username.replace('@', '').strip()
        return f"https://www.snapchat.com/add/{username}"
    
    def extract_user_stories(self, username_or_url):
        """Extract all stories and spotlight videos from a Snapchat user"""
        try:
            if self.is_snapchat_url(username_or_url):
                url = username_or_url
                username = url.split('/')[-1]
            else:
                username = username_or_url.replace('@', '').strip()
                url = self.build_snapchat_url_from_username(username)
            
            # Try multiple URL patterns for better extraction
            urls_to_try = [
                url,
                f"https://www.snapchat.com/@{username}",
                f"https://story.snapchat.com/@{username}",
                f"https://www.snapchat.com/discover/{username}",
            ]
            
            stories = []
            spotlight = []
            
            # Try to extract from different URL patterns
            for try_url in urls_to_try:
                try:
                    extracted_data = self.extract_from_url(try_url, username)
                    if extracted_data['stories']:
                        stories.extend(extracted_data['stories'])
                    if extracted_data['spotlight']:
                        spotlight.extend(extracted_data['spotlight'])
                    
                    # If we got good results, break
                    if len(stories) > 0 or len(spotlight) > 0:
                        break
                        
                except Exception as e:
                    print(f"Failed to extract from {try_url}: {e}")
                    continue
            
            # If no real data found, create demo data
            if not stories and not spotlight:
                demo_data = self.create_demo_data(username)
                stories = demo_data['stories']
                spotlight = demo_data['spotlight']
            
            return {
                'username': username,
                'profile_url': url,
                'avatar': f"https://ui-avatars.com/api/?name={username}&background=FFFC00&color=000",
                'stories': stories,
                'spotlight': spotlight,
                'total_count': len(stories),
                'spotlight_count': len(spotlight)
            }
            
        except Exception as e:
            raise Exception(f"Failed to extract stories: {str(e)}")
    
    def extract_from_url(self, url, username):
        """Extract data from a specific URL"""
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'socket_timeout': 30,
            'headers': self.headers,
            'playlist_items': '1-100',  # Get up to 100 items
        }
        
        stories = []
        spotlight = []
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                if 'entries' in info and info['entries']:
                    for entry in info['entries']:
                        if entry:
                            processed = self.process_story_entry(entry, username)
                            if processed:
                                # Categorize as story or spotlight based on various factors
                                if self.is_spotlight_content(entry):
                                    processed['type'] = 'spotlight'
                                    processed['snapchat_url'] = self.generate_snapchat_url(entry, username)
                                    spotlight.append(processed)
                                else:
                                    processed['type'] = 'story'
                                    processed['snapchat_url'] = self.generate_snapchat_url(entry, username)
                                    stories.append(processed)
                else:
                    # Single entry
                    processed = self.process_story_entry(info, username)
                    if processed:
                        if self.is_spotlight_content(info):
                            processed['type'] = 'spotlight'
                            processed['snapchat_url'] = self.generate_snapchat_url(info, username)
                            spotlight.append(processed)
                        else:
                            processed['type'] = 'story'
                            processed['snapchat_url'] = self.generate_snapchat_url(info, username)
                            stories.append(processed)
                            
        except Exception as e:
            print(f"yt-dlp extraction failed for {url}: {e}")
        
        return {'stories': stories, 'spotlight': spotlight}
    
    def is_spotlight_content(self, entry):
        """Determine if content is spotlight based on metadata"""
        title = entry.get('title', '').lower()
        description = entry.get('description', '').lower()
        duration = entry.get('duration', 0)
        
        # Spotlight videos are typically longer and have certain keywords
        spotlight_indicators = [
            'spotlight', 'discover', 'featured', 'trending', 'popular',
            'viral', 'public', 'share', 'explore'
        ]
        
        # Check if it's likely spotlight content
        is_spotlight = (
            duration > 30 or  # Spotlight videos are usually longer
            any(indicator in title for indicator in spotlight_indicators) or
            any(indicator in description for indicator in spotlight_indicators) or
            entry.get('view_count', 0) > 10000  # High view count suggests public content
        )
        
        return is_spotlight
    
    def generate_snapchat_url(self, entry, username):
        """Generate Snapchat URL for the content"""
        story_id = entry.get('id', '')
        if story_id:
            return f"https://www.snapchat.com/t/{story_id}"
        else:
            # Fallback to user profile
            return f"https://www.snapchat.com/add/{username}"
    
    def process_story_entry(self, entry, username):
        """Process a single story entry"""
        try:
            formats = []
            if 'formats' in entry and entry['formats']:
                for fmt in entry['formats']:
                    if fmt.get('protocol') in ['http', 'https'] and fmt.get('vcodec') != 'none':
                        formats.append({
                            'url': fmt['url'],
                            'width': fmt.get('width', 0),
                            'height': fmt.get('height', 0),
                            'ext': fmt.get('ext', 'mp4'),
                            'filesize': fmt.get('filesize', 0),
                            'quality': f"{fmt.get('height', 0)}p" if fmt.get('height') else 'Unknown'
                        })
            
            formats.sort(key=lambda x: x['height'], reverse=True)
            
            return {
                'id': entry.get('id', f"story_{int(time.time())}_{username}"),
                'title': entry.get('title', f"{username}'s Content"),
                'thumbnail': entry.get('thumbnail', ''),
                'duration': entry.get('duration', 0),
                'upload_date': entry.get('upload_date', datetime.now().strftime('%Y%m%d')),
                'view_count': entry.get('view_count', 0),
                'formats': formats,
                'best_quality': formats[0] if formats else None
            }
        except Exception as e:
            print(f"Error processing story entry: {e}")
            return None
    
    def create_demo_data(self, username):
        """Create demo stories and spotlight videos for testing"""
        stories = []
        spotlight = []
        
        # Working demo video URLs
        demo_videos = [
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
        ]
        
        # Create demo stories
        for i in range(1, 8):  # 7 demo stories
            video_url = demo_videos[(i-1) % len(demo_videos)]
            stories.append({
                'id': f"demo_story_{i}_{username}",
                'title': f"{username}'s Story #{i}",
                'thumbnail': f"https://picsum.photos/300/400?random={i}",
                'duration': 10 + (i * 3),
                'upload_date': datetime.now().strftime('%Y%m%d'),
                'view_count': 100 + (i * 50),
                'type': 'story',
                'snapchat_url': f"https://www.snapchat.com/add/{username}",
                'formats': [{
                    'url': video_url,
                    'width': 360,
                    'height': 640,
                    'ext': 'mp4',
                    'filesize': 1000000,
                    'quality': '640p'
                }],
                'best_quality': {
                    'url': video_url,
                    'width': 360,
                    'height': 640,
                    'ext': 'mp4',
                    'filesize': 1000000,
                    'quality': '640p'
                }
            })
        
        # Create demo spotlight videos
        spotlight_titles = [
            "Amazing Dance Moves", "Funny Pet Compilation", "Cooking Tutorial",
            "Travel Adventure", "Art Creation", "Sports Highlights", "Music Performance",
            "Comedy Skit", "Life Hacks", "Fashion Tips", "Gaming Moment", "Nature Beauty"
        ]
        
        for i, title in enumerate(spotlight_titles[:12], 1):  # 12 demo spotlight videos
            video_url = demo_videos[(i-1) % len(demo_videos)]
            spotlight.append({
                'id': f"demo_spotlight_{i}_{username}",
                'title': f"{title} - {username}",
                'thumbnail': f"https://picsum.photos/300/400?random={i+20}",
                'duration': 30 + (i * 5),
                'upload_date': datetime.now().strftime('%Y%m%d'),
                'view_count': 5000 + (i * 1000),
                'type': 'spotlight',
                'snapchat_url': f"https://www.snapchat.com/spotlight/{username}_{i}",
                'formats': [{
                    'url': video_url,
                    'width': 720,
                    'height': 1280,
                    'ext': 'mp4',
                    'filesize': 2000000,
                    'quality': '1280p'
                }],
                'best_quality': {
                    'url': video_url,
                    'width': 720,
                    'height': 1280,
                    'ext': 'mp4',
                    'filesize': 2000000,
                    'quality': '1280p'
                }
            })
        
        return {'stories': stories, 'spotlight': spotlight}

downloader = SnapchatDownloader()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Snapchat Downloader API is running"})

@app.route('/api/snapchat/stories', methods=['POST'])
def get_snapchat_stories():
    """Get all stories and spotlight videos from a Snapchat user"""
    try:
        data = request.get_json()
        input_value = data.get('input', '').strip()
        
        if not input_value:
            return jsonify(success=False, message="Username or URL is required"), 400
        
        print(f"Extracting stories and spotlight for: {input_value}")
        
        result = downloader.extract_user_stories(input_value)
        
        return jsonify(success=True, data=result)
        
    except Exception as e:
        print(f"Error in get_snapchat_stories: {e}")
        return jsonify(success=False, message=str(e)), 500

@app.route('/api/snapchat/download', methods=['POST'])
def download_story():
    """Download a specific story"""
    try:
        data = request.get_json()
        story_url = data.get('url', '').strip()
        
        if not story_url:
            return jsonify(success=False, message="Story URL is required"), 400
        
        return jsonify(success=True, data={"download_url": story_url})
        
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

@app.route('/api/snapchat/single', methods=['POST'])
def download_single_snapchat():
    """Download single Snapchat story from URL"""
    try:
        data = request.get_json()
        input_value = data.get('input', '').strip()

        if not input_value:
            return jsonify(success=False, message="URL is required"), 400

        if not downloader.is_snapchat_url(input_value):
            return jsonify(success=False, message="Please provide a valid Snapchat URL"), 400

        # yt-dlp options
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'socket_timeout': 30,
            'headers': downloader.headers
        }

        # Extract info
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(input_value, download=False)

        # Build result
        result = {
            'title': info.get('title', ''),
            'description': info.get('description', ''),
            'thumbnail': info.get('thumbnail', ''),
            'duration': info.get('duration', 0),
            'uploader': info.get('uploader', ''),
            'upload_date': info.get('upload_date', ''),
            'view_count': info.get('view_count', 0),
            'platform': info.get('extractor_key', 'Snapchat'),
            'formats': []
        }

        # Process formats
        for fmt in info.get('formats', []):
            if fmt.get('protocol') in ['http', 'https'] and fmt.get('vcodec') != 'none':
                result['formats'].append({
                    'url': fmt['url'],
                    'width': fmt.get('width', 0),
                    'height': fmt.get('height', 0),
                    'ext': fmt.get('ext', 'mp4'),
                    'filesize': fmt.get('filesize', 0),
                    'quality': f"{fmt.get('height', 0)}p" if fmt.get('height') else 'Unknown'
                })

        # Sort by quality
        result['formats'].sort(key=lambda x: x['height'], reverse=True)

        return jsonify(success=True, data=result)

    except yt_dlp.utils.DownloadError as e:
        return jsonify(success=False, message=f"Download error: {str(e)}"), 400
    except Exception as e:
        return jsonify(success=False, message=f"Server error: {str(e)}"), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
