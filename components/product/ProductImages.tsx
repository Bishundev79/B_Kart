'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ProductImage } from '@/types/database';

interface ProductImagesProps {
  images: ProductImage[];
  productName: string;
}

export function ProductImages({ images, productName }: ProductImagesProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
        <span className="text-muted-foreground">No images</span>
      </div>
    );
  }

  const selectedImage = images[selectedIndex];

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Main image */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted group">
          <DialogTrigger asChild>
            <button className="relative w-full h-full cursor-zoom-in">
              <Image
                src={selectedImage.url}
                alt={selectedImage.alt_text || productName}
                fill
                className="object-cover transition-transform hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {/* Zoom indicator overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                <ZoomIn className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </button>
          </DialogTrigger>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 md:opacity-70 z-10"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 md:opacity-70 z-10"
                onClick={goToNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <DialogContent className="max-w-4xl p-0">
          <div className="relative aspect-square w-full">
            <Image
              src={selectedImage.url}
              alt={selectedImage.alt_text || productName}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Thumbnail gallery */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                index === selectedIndex
                  ? 'border-primary'
                  : 'border-transparent hover:border-muted-foreground/50'
              )}
            >
              <Image
                src={image.url}
                alt={image.alt_text || `${productName} ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
