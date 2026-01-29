import React, { useState, useEffect, Fragment } from 'react';
import { ChevronLeft, ChevronRight, Calendar, User, FileText } from 'lucide-react';

interface Media {
  url: string;
  location: string;
  type: string;
  name: string;
  mime_type: string;
  thumbnail_url?: string;
}

interface Post {
  id: string;
  timestamp: string;
  month: string;
  creator: string;
  content: {
    text: string;
    media: Media[];
  };
}

interface GalleryData {
  posts: Post[];
}

const STARTING_MONTH = '2022-01';

const Gallery: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<string>(STARTING_MONTH);
  const [galleryData, setGalleryData] = useState<GalleryData>({ posts: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const loadGalleryData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${process.env.PUBLIC_URL}/gallery_data.json`);
        const data = await response.json();
        setGalleryData(data);
      } catch (err) {
        console.error('Error loading gallery data:', err);
        setError('Failed to load gallery data');
      } finally {
        setIsLoading(false);
      }
    };

    loadGalleryData();
  }, []);

  const groupPostsByMonth = (posts: Post[]) => {
    const grouped: { [key: string]: Post[] } = {};
    posts.forEach(post => {
      if (!grouped[post.month]) {
        grouped[post.month] = [];
      }
      grouped[post.month].push(post);
    });
    return grouped;
  };

  const parseText = (text: string) => {
    // Regular expressions for both link formats
    const linkRegex = /<(https?:\/\/[^>|]+?)(?:\|([^>]+?))?>/g;

    // Split the text into parts (links and non-links)
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      // Add any text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }

      // Add the link
      parts.push({
        type: 'link',
        url: match[1],
        display: match[2] || match[1]
      });

      lastIndex = match.index + match[0].length;
    }

    // Add any remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return parts;
  };

  const renderText = (text: string) => {
    const parts = parseText(text);
    return (
      <span>
        {parts.map((part, index) => {
          if (part.type === 'link') {
            return (
              <a
                key={index}
                href={part.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {part.display}
              </a>
            );
          }
          return <Fragment key={index}>{part.content}</Fragment>;
        })}
      </span>
    );
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderMedia = (media: Media) => {
    if (!media) return null;

    // Handle image types including GIFs
    if (['jpg', 'jpeg', 'png', 'gif'].includes(media.type.toLowerCase())) {
      return (
        <div className="relative group">
          <img
            src={`${media.location}`}
            alt={media.name}
            loading="lazy"
            className="w-full h-64 object-cover rounded-lg cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
            onClick={() => setSelectedImage(`${media.location}`)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = 'not-available.png';
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-200 rounded-lg" />
        </div>
      );
    }

    // Handle video content
    if (['mp4', 'mov'].includes(media.type.toLowerCase())) {
      return (
        <div className="relative rounded-lg overflow-hidden">
          <video
            controls
            className="w-full h-64 rounded-lg"
            title={media.name}
          >
            <source src={`${media.location}`} type={media.mime_type} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Handle audio content
    if (['mp3', 'wav', 'm4a'].includes(media.type.toLowerCase())) {
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-lg">♪</span>
            </div>
            <span className="text-sm text-gray-600">{media.name}</span>
          </div>
          <audio
            controls
            className="w-full"
            title={media.name}
          >
            <source src={`${media.location}`} type={media.mime_type} />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    // Handle PDF files
    if (media.name.endsWith('.pdf')) {
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <a
            href={`${media.location}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span>{media.name}</span>
          </a>
        </div>
      );
    }

    // Default fallback for other file types
    return (
      <div className="w-full p-4 bg-gray-50 rounded-lg flex items-center justify-center">
        <span className="text-gray-600">{media.name}</span>
      </div>
    );
  };

  // Image lightbox component
  const ImageLightbox = () => {
    if (!selectedImage) return null;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
        onClick={() => setSelectedImage(null)}
      >
        <div className="relative max-w-7xl max-h-[90vh] mx-4">
          <img
            src={selectedImage}
            alt="Enlarged view"
            className="max-w-full max-h-[90vh] object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white text-xl bg-black bg-opacity-50 w-10 h-10 rounded-full flex items-center justify-center hover:bg-opacity-75"
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  interface MonthNavProps {
    months: string[];
    currentMonth: string | null;
    onChange: (month: string) => void;
  }

  const MonthNav: React.FC<MonthNavProps> = ({ months, currentMonth, onChange }) => (
    <div className="flex items-center justify-between mb-8 sticky top-0 bg-white p-4 shadow-md rounded-lg z-10">
      <button
        onClick={() => {
          const idx = months.indexOf(currentMonth!);
          if (idx > 0) onChange(months[idx - 1]);
        }}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        disabled={currentMonth === months[0]}
      >
        <ChevronLeft className={currentMonth === months[0] ? 'text-gray-300' : 'text-gray-600'} />
      </button>
      <h2 className="text-xl font-semibold">
        {currentMonth ? (() => {
          const [year, month] = currentMonth.split('-');
          return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
          });
        })() : 'All Posts'}
      </h2>
      <button
        onClick={() => {
          const idx = months.indexOf(currentMonth!);
          if (idx < months.length - 1) onChange(months[idx + 1]);
        }}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        disabled={currentMonth === months[months.length - 1]}
      >
        <ChevronRight className={currentMonth === months[months.length - 1] ? 'text-gray-300' : 'text-gray-600'} />
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading gallery...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Show & Tell Gallery</h1>

      <MonthNav
        months={Object.keys(groupPostsByMonth(galleryData.posts)).sort()}
        currentMonth={currentMonth}
        onChange={setCurrentMonth}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {galleryData.posts
          .filter(post => !currentMonth || post.month === currentMonth)
          .map(post => (
            <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center text-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    <span className="font-medium">{post.creator}</span>
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{formatDate(post.timestamp)}</span>
                  </div>
                </div>
              </div>

              {post.content.text && (
                <div className="p-4 text-gray-700">
                  {renderText(post.content.text)}
                </div>
              )}

              {post.content.media && post.content.media.length > 0 && (
                <div className="p-4 grid grid-cols-1 gap-4">
                  {post.content.media.map((media, idx) => (
                    <div key={idx}>
                      {renderMedia(media)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>

      <ImageLightbox />
    </div>
  );
};

export default Gallery;