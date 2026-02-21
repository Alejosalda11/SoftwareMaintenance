// Hotel Maintenance Pro - Image Upload Component

import { useState, useRef } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RepairImage } from '@/types';

interface ImageUploadProps {
  images: RepairImage[];
  onChange: (images: RepairImage[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onChange, maxImages = 10 }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    
    const newImages: RepairImage[] = [];
    const remainingSlots = maxImages - images.length;
    
    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          const base64 = await convertFileToBase64(file);
          newImages.push({
            type: 'before', // Default to 'before', user can change it
            url: base64,
            uploadedAt: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error converting image:', error);
        }
      }
    }
    
    if (newImages.length > 0) {
      onChange([...images, ...newImages]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const toggleImageType = (index: number) => {
    const newImages = [...images];
    newImages[index] = {
      ...newImages[index],
      type: newImages[index].type === 'before' ? 'after' : 'before'
    };
    onChange(newImages);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Photos ({images.length}/{maxImages})</label>
        {images.length > 0 && (
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              Before: {images.filter(img => img.type === 'before').length}
            </Badge>
            <Badge variant="outline" className="text-xs">
              After: {images.filter(img => img.type === 'after').length}
            </Badge>
          </div>
        )}
      </div>

      {canAddMore && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleInputChange}
            className="hidden"
          />
          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop images here, or{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-gray-500">
            Supports JPG, PNG, GIF (max {maxImages} images)
          </p>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                <img
                  src={image.url}
                  alt={`${image.type} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute top-1 left-1">
                <Badge
                  variant={image.type === 'before' ? 'default' : 'secondary'}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleImageType(index)}
                >
                  {image.type === 'before' ? 'Before' : 'After'}
                </Badge>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
