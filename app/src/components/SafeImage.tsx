// Renders an image with lazy loading and error handling so one bad image doesn't crash the app.

import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export function SafeImage({ src, alt, className, loading = 'lazy' }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 text-gray-500 ${className ?? ''}`}
        title="Image could not be loaded"
      >
        <ImageOff className="w-8 h-8" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setFailed(true)}
    />
  );
}
