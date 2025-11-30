'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Star, Loader2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useProductStore } from '@/stores/productStore';
import type { ProductImage } from '@/types/database';

interface ProductImageUploadProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: () => void;
}

export function ProductImageUpload({
  productId,
  images,
  onImagesChange,
}: ProductImageUploadProps) {
  const { toast } = useToast();
  const { addProductImage, deleteProductImage } = useProductStore();
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setUploading(true);
      const supabase = createClient();

      try {
        for (const file of acceptedFiles) {
          // Validate file
          if (!file.type.startsWith('image/')) {
            toast({
              title: 'Invalid file type',
              description: `${file.name} is not an image.`,
              variant: 'destructive',
            });
            continue;
          }

          if (file.size > 5 * 1024 * 1024) {
            toast({
              title: 'File too large',
              description: `${file.name} is larger than 5MB.`,
              variant: 'destructive',
            });
            continue;
          }

          // Upload to Supabase Storage
          const fileExt = file.name.split('.').pop();
          const fileName = `${productId}/${Date.now()}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            toast({
              title: 'Upload failed',
              description: `Failed to upload ${file.name}.`,
              variant: 'destructive',
            });
            continue;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(uploadData.path);

          // Add to database
          const isPrimary = images.length === 0;
          const result = await addProductImage(productId, {
            url: urlData.publicUrl,
            alt_text: file.name,
            is_primary: isPrimary,
          });

          if (!result.success) {
            toast({
              title: 'Error',
              description: result.error || 'Failed to save image.',
              variant: 'destructive',
            });
          }
        }

        onImagesChange();
        toast({
          title: 'Images uploaded',
          description: `${acceptedFiles.length} image(s) uploaded successfully.`,
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: 'Upload failed',
          description: 'An error occurred while uploading images.',
          variant: 'destructive',
        });
      } finally {
        setUploading(false);
      }
    },
    [productId, images.length, addProductImage, onImagesChange, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxSize: 5 * 1024 * 1024,
    disabled: uploading,
  });

  const handleDelete = async (imageId: string) => {
    setDeletingId(imageId);

    const result = await deleteProductImage(productId, imageId);

    if (result.success) {
      onImagesChange();
      toast({
        title: 'Image deleted',
        description: 'The image has been removed.',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete image.',
        variant: 'destructive',
      });
    }

    setDeletingId(null);
  };

  const handleSetPrimary = async (imageId: string) => {
    // TODO: Implement set primary functionality via API
    toast({
      title: 'Coming soon',
      description: 'Set primary image functionality will be added.',
    });
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary',
          uploading && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">
              {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              or click to select files (max 5MB each)
            </p>
          </div>
        )}
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images
            .sort((a, b) => {
              if (a.is_primary) return -1;
              if (b.is_primary) return 1;
              return a.sort_order - b.sort_order;
            })
            .map((image) => (
              <Card key={image.id} className="group relative overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-square">
                    <Image
                      src={image.url}
                      alt={image.alt_text || 'Product image'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />

                    {/* Primary badge */}
                    {image.is_primary && (
                      <div className="absolute left-2 top-2">
                        <div className="flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
                          <Star className="h-3 w-3 fill-current" />
                          Primary
                        </div>
                      </div>
                    )}

                    {/* Actions overlay */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      {!image.is_primary && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSetPrimary(image.id)}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(image.id)}
                        disabled={deletingId === image.id}
                      >
                        {deletingId === image.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
