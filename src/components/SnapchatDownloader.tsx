import React, { useState } from 'react';
import { Search, Download, Play, Eye, Clock, User, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface StoryFormat {
  url: string;
  width: number;
  height: number;
  ext: string;
  filesize: number;
  quality: string;
}

interface Story {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  upload_date: string;
  view_count: number;
  formats: StoryFormat[];
  best_quality: StoryFormat | null;
  type?: 'story' | 'spotlight';
}

interface StoriesResponse {
  username: string;
  profile_url: string;
  avatar?: string;
  stories: Story[];
  spotlight: Story[];
  total_count: number;
  spotlight_count?: number;
}

interface SingleStoryResponse {
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  uploader: string;
  upload_date: string;
  view_count: number;
  platform: string;
  formats: StoryFormat[];
}

const SnapchatDownloader = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stories, setStories] = useState<StoriesResponse | null>(null);
  const [singleStory, setSingleStory] = useState<SingleStoryResponse | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const isSnapchatUrl = (text: string) => {
    return text.includes('snapchat.com') || text.includes('t.snapchat.com');
  };

  const handleSearch = async () => {
    if (!input.trim()) {
      toast.error('Please enter a Snapchat username or URL');
      return;
    }

    setLoading(true);
    setStories(null);
    setSingleStory(null);

    try {
      const endpoint = isSnapchatUrl(input) ? '/api/snapchat/single' : '/api/snapchat/stories';
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: input.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        if (isSnapchatUrl(input)) {
          setSingleStory(result.data);
          toast.success('Story loaded successfully!');
        } else {
          setStories(result.data);
          const totalItems = (result.data.stories?.length || 0) + (result.data.spotlight?.length || 0);
          toast.success(`Found ${totalItems} items! (${result.data.stories?.length || 0} stories, ${result.data.spotlight?.length || 0} spotlight videos)`);
        }
      } else {
        toast.error(result.message || 'Failed to fetch stories');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Network error. Make sure the backend server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (downloadUrl: string, filename: string, storyId?: string) => {
    if (storyId) {
      setDownloadingId(storyId);
    }

    try {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed');
    } finally {
      if (storyId) {
        setDownloadingId(null);
      }
    }
  };

  const handleVideoPlay = (storyId: string, videoUrl: string) => {
    setPlayingVideo(storyId);
    // Create video element and play
    const video = document.createElement('video');
    video.src = videoUrl;
    video.controls = true;
    video.autoplay = true;
    video.style.position = 'fixed';
    video.style.top = '50%';
    video.style.left = '50%';
    video.style.transform = 'translate(-50%, -50%)';
    video.style.zIndex = '9999';
    video.style.maxWidth = '90vw';
    video.style.maxHeight = '90vh';
    video.style.backgroundColor = 'black';
    
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
    overlay.style.zIndex = '9998';
    
    overlay.onclick = () => {
      document.body.removeChild(overlay);
      document.body.removeChild(video);
      setPlayingVideo(null);
    };
    
    document.body.appendChild(overlay);
    document.body.appendChild(video);
  };

  const handleSnapchatRedirect = (snapchatUrl: string) => {
    window.open(snapchatUrl, '_blank');
    toast.info('Opening in Snapchat...');
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'Unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderStoryCard = (story: Story, isSpotlight = false) => (
    <Card key={story.id} className="backdrop-blur-md bg-white/10 border-white/20 overflow-hidden hover:bg-white/20 transition-all duration-300">
      <div className="relative group">
        <img
          src={story.thumbnail || 'https://via.placeholder.com/300x400?text=No+Thumbnail'}
          alt={story.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            onClick={() => story.best_quality && handleVideoPlay(story.id, story.best_quality.url)}
            className="bg-white/20 hover:bg-white/40 text-white border-white/30"
            size="lg"
          >
            <Play className="w-8 h-8" />
          </Button>
        </div>
        <div className="absolute top-2 right-2 flex gap-2">
          <Badge className="bg-black/50 text-white">
            {formatDuration(story.duration)}
          </Badge>
          {isSpotlight && (
            <Badge className="bg-yellow-500/80 text-black">
              <Sparkles className="w-3 h-3 mr-1" />
              Spotlight
            </Badge>
          )}
        </div>
        {playingVideo === story.id && (
          <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center">
            <span className="text-white font-semibold">Playing...</span>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="text-white font-semibold mb-2 truncate">
          {story.title}
        </h3>
        
        <div className="flex items-center gap-2 mb-3 text-white/70 text-sm">
          <Eye className="w-4 h-4" />
          <span>{story.view_count?.toLocaleString() || 0} views</span>
          <Clock className="w-4 h-4 ml-2" />
          <span>{story.upload_date}</span>
        </div>

        <div className="flex gap-2 mb-2">
          <Button
            onClick={() => story.best_quality && handleVideoPlay(story.id, story.best_quality.url)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            size="sm"
          >
            <Play className="w-4 h-4 mr-2" />
            Play
          </Button>
          <Button
            onClick={() => {
              if (story.best_quality) {
                handleDownload(
                  story.best_quality.url,
                  `${story.title}.${story.best_quality.ext}`,
                  story.id
                );
              }
            }}
            disabled={!story.best_quality || downloadingId === story.id}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {downloadingId === story.id ? 'Downloading...' : 'Download'}
          </Button>
        </div>

        {/* Snapchat Redirect Button */}
        {(story as any).snapchat_url && (
          <Button
            onClick={() => handleSnapchatRedirect((story as any).snapchat_url)}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            size="sm"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in Snapchat
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Snapchat Story Downloader
          </h1>
          <p className="text-white/80 text-lg">
            Download Snapchat stories and spotlight videos by entering a username or story URL
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8 backdrop-blur-md bg-white/10 border-white/20">
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter Snapchat username (e.g., john_doe) or story URL"
                  className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 text-lg py-6"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-6 text-lg"
              >
                {loading ? 'Loading...' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Single Story Display */}
        {singleStory && (
          <Card className="mb-8 backdrop-blur-md bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-2xl flex items-center gap-2">
                <User className="w-6 h-6" />
                {singleStory.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="relative">
                  <img
                    src={singleStory.thumbnail || 'https://via.placeholder.com/300x400?text=No+Thumbnail'}
                    alt={singleStory.title}
                    className="w-full h-80 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                    <Play className="w-16 h-16 text-white" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDuration(singleStory.duration)}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      <Eye className="w-4 h-4 mr-1" />
                      {singleStory.view_count?.toLocaleString() || 0} views
                    </Badge>
                  </div>
                  
                  <div className="text-white">
                    <p><strong>Uploader:</strong> {singleStory.uploader}</p>
                    <p><strong>Upload Date:</strong> {singleStory.upload_date}</p>
                    {singleStory.description && (
                      <p><strong>Description:</strong> {singleStory.description}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-white font-semibold">Available Formats:</h4>
                    {singleStory.formats.map((format, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/10 p-3 rounded-lg">
                        <div className="text-white">
                          <span className="font-medium">{format.quality}</span>
                          <span className="text-white/70 ml-2">
                            ({format.ext.toUpperCase()}, {formatFileSize(format.filesize)})
                          </span>
                        </div>
                        <Button
                          onClick={() => handleDownload(format.url, `${singleStory.title}.${format.ext}`)}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stories and Spotlight Display */}
        {stories && (
          <div className="space-y-8">
            {/* User Profile Header */}
            <Card className="backdrop-blur-md bg-white/10 border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-pink-500 to-yellow-500 flex items-center justify-center">
                    {stories.avatar ? (
                      <img src={stories.avatar} alt={stories.username} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">@{stories.username}</h2>
                    <p className="text-white/70">
                      {stories.stories?.length || 0} Stories • {stories.spotlight?.length || 0} Spotlight Videos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stories Section */}
            {stories.stories && stories.stories.length > 0 && (
              <div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <Clock className="w-6 h-6" />
                    Stories ({stories.stories.length})
                  </h3>
                  <p className="text-white/80">Recent stories from @{stories.username}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {stories.stories.map((story) => renderStoryCard(story, false))}
                </div>
              </div>
            )}

            {/* Spotlight Section */}
            {stories.spotlight && stories.spotlight.length > 0 && (
              <div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                    Spotlight Highlights ({stories.spotlight.length})
                  </h3>
                  <p className="text-white/80">Popular spotlight videos from @{stories.username}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {stories.spotlight.map((story) => renderStoryCard(story, true))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!stories && !singleStory && !loading && (
          <Card className="backdrop-blur-md bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-2xl">How to Use</CardTitle>
            </CardHeader>
            <CardContent className="text-white/80 space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2">For Username Search:</h4>
                <p>Enter a Snapchat username (e.g., "john_doe") to see all available stories and spotlight videos from that user.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">For Single Story Download:</h4>
                <p>Paste a direct Snapchat story URL to download that specific story.</p>
              </div>
              <div className="bg-yellow-500/20 p-4 rounded-lg">
                <p className="text-yellow-200">
                  <strong>New Features:</strong> Play videos in runtime, download in multiple formats, view stories and spotlight content separately, and open content directly in Snapchat app.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SnapchatDownloader;
