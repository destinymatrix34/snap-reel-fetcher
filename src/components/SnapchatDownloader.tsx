
import React, { useState } from 'react';
import { Search, Download, Play, Eye, Clock, User } from 'lucide-react';
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
}

interface StoriesResponse {
  username: string;
  profile_url: string;
  stories: Story[];
  total_count: number;
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
          toast.success(`Found ${result.data.total_count} stories!`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Snapchat Story Downloader
          </h1>
          <p className="text-white/80 text-lg">
            Download Snapchat stories by entering a username or story URL
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

        {/* Stories Grid */}
        {stories && (
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">
                @{stories.username}'s Stories
              </h2>
              <p className="text-white/80">
                Found {stories.total_count} stories
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {stories.stories.map((story) => (
                <Card key={story.id} className="backdrop-blur-md bg-white/10 border-white/20 overflow-hidden">
                  <div className="relative">
                    <img
                      src={story.thumbnail || 'https://via.placeholder.com/300x400?text=No+Thumbnail'}
                      alt={story.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-black/50 text-white">
                        {formatDuration(story.duration)}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="text-white font-semibold mb-2 truncate">
                      {story.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-3 text-white/70 text-sm">
                      <Eye className="w-4 h-4" />
                      <span>{story.view_count?.toLocaleString() || 0} views</span>
                    </div>

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
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {downloadingId === story.id ? 'Downloading...' : 'Download'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                <p>Enter a Snapchat username (e.g., "john_doe") to see all available stories from that user.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">For Single Story Download:</h4>
                <p>Paste a direct Snapchat story URL to download that specific story.</p>
              </div>
              <div className="bg-yellow-500/20 p-4 rounded-lg">
                <p className="text-yellow-200">
                  <strong>Note:</strong> Make sure the backend server is running on port 5000 for the downloader to work properly.
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
