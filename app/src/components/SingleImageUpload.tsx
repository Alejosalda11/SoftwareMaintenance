// Hotel Maintenance Pro - Single image upload (logo / avatar)

import { useRef } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SingleImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  aspectRatio?: 'square' | 'video';
  className?: string;
}

export function SingleImageUpload({
  value,
  onChange,
  label = 'Image',
  aspectRatio = 'square',
  className = '',
}: SingleImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    try {
      const dataUrl = await convertFileToBase64(file);
      onChange(dataUrl);
    } catch (err) {
      console.error('Error reading image:', err);
    }
    e.target.value = '';
  };

  const isImageUrl = (s: string) =>
    s.length > 100 || s.startsWith('data:') || s.startsWith('http://') || s.startsWith('https://');

  return (
    <div className={className}>
      <label className="text-sm font-medium block mb-2">{label}</label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      <div className="flex items-start gap-3 flex-wrap">
        {value && isImageUrl(value) ? (
          <div className="flex flex-col gap-2">
            <div className="relative group">
              <img
                src={value}
                alt={label}
                className={`rounded-lg border-2 border-gray-200 object-cover bg-gray-100 ${
                  aspectRatio === 'square' ? 'w-24 h-24' : 'w-32 h-20'
                }`}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onChange('')}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Change
            </Button>
          </div>
        ) : (
          <>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-blue-400 hover:bg-blue-50/50 ${
                aspectRatio === 'square' ? 'w-24 h-24' : 'w-32 h-20'
              } border-gray-300`}
            >
              <ImageIcon className="w-8 h-8 text-gray-400" />
              <span className="text-xs text-gray-500 mt-1">Add</span>
            </div>
            <div className="flex flex-col justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload {label.toLowerCase()}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
