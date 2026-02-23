// Hotel Maintenance Pro - Image Gallery Component for Before/After Display

import { useState } from 'react';
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RepairImage } from '@/types';

interface ImageGalleryProps {
  images: RepairImage[] | string[]; // Support both old and new formats
  damageId: string;
}

export function ImageGallery({ images, damageId: _damageId }: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Normalize images to RepairImage format (ensure type is preserved for before/after)
  const normalizedImages: RepairImage[] = images.length > 0
    ? (typeof images[0] === 'string'
        ? (images as string[]).map(url => ({
            type: 'before' as const,
            url,
            uploadedAt: new Date().toISOString()
          }))
        : (images as RepairImage[]).map((img) => ({
            type: img.type === 'after' ? ('after' as const) : ('before' as const),
            url: img.url,
            uploadedAt: img.uploadedAt ?? new Date().toISOString()
          })))
    : [];

  if (normalizedImages.length === 0) {
    return null;
  }

  const beforeImages = normalizedImages.filter(img => img.type === 'before');
  const afterImages = normalizedImages.filter(img => img.type === 'after');

  const openViewer = (index: number) => {
    setSelectedImageIndex(index);
    setIsViewerOpen(true);
  };

  const closeViewer = () => {
    setIsViewerOpen(false);
    setSelectedImageIndex(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;
    const newIndex = direction === 'next'
      ? (selectedImageIndex + 1) % normalizedImages.length
      : (selectedImageIndex - 1 + normalizedImages.length) % normalizedImages.length;
    setSelectedImageIndex(newIndex);
  };

  return (
    <>
      <div className="mt-4 space-y-4">
        {beforeImages.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Badge variant="default" className="text-xs">Before</Badge>
              <span>{beforeImages.length} photo{beforeImages.length > 1 ? 's' : ''}</span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {beforeImages.map((image, index) => {
                const globalIndex = normalizedImages.indexOf(image);
                return (
                  <div
                    key={`before-${index}`}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-blue-500 transition-colors group"
                    onClick={() => openViewer(globalIndex)}
                  >
                    <img
                      src={image.url}
                      alt={`Before ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {afterImages.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">After</Badge>
              <span>{afterImages.length} photo{afterImages.length > 1 ? 's' : ''}</span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {afterImages.map((image, index) => {
                const globalIndex = normalizedImages.indexOf(image);
                return (
                  <div
                    key={`after-${index}`}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-blue-500 transition-colors group"
                    onClick={() => openViewer(globalIndex)}
                  >
                    <img
                      src={image.url}
                      alt={`After ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          {selectedImageIndex !== null && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
                onClick={closeViewer}
              >
                <X className="w-5 h-5" />
              </Button>
              
              {normalizedImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
                    onClick={() => navigateImage('prev')}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
                    onClick={() => navigateImage('next')}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}
              
              <div className="relative w-full h-[80vh] bg-black flex items-center justify-center">
                <img
                  src={normalizedImages[selectedImageIndex].url}
                  alt={`Image ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white px-3 py-1 rounded">
                <Badge variant={normalizedImages[selectedImageIndex].type === 'before' ? 'default' : 'secondary'}>
                  {normalizedImages[selectedImageIndex].type === 'before' ? 'Before' : 'After'}
                </Badge>
                <span className="ml-2 text-sm">
                  {selectedImageIndex + 1} / {normalizedImages.length}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
