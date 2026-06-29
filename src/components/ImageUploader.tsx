import React, { useState, useRef } from 'react';
import { UploadCloud, Camera, AlertCircle, Check } from 'lucide-react';

interface ImageUploaderProps {
  currentImageUrl?: string;
  onUploadSuccess: (url: string) => void;
  label?: string;
  aspectRatio?: 'square' | 'video' | 'any';
}

export default function ImageUploader({ 
  currentImageUrl, 
  onUploadSuccess, 
  label = 'Fazer upload de imagem',
  aspectRatio = 'square'
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido (PNG, JPG, etc).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('A imagem deve ter no máximo 10MB.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // ImgBB API call with user-provided key
      const response = await fetch(`https://api.imgbb.com/1/upload?key=87be1f85110bb10116ff30980c8b60c2`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do servidor.');
      }

      const result = await response.json();
      if (result && result.data && result.data.url) {
        onUploadSuccess(result.data.url);
      } else {
        throw new Error('Formato de resposta inválido do servidor de imagens.');
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setError(err.message || 'Erro ao fazer upload da imagem. Verifique sua conexão.');
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      {label && (
        <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">
          {label}
        </span>
      )}

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={triggerFileSelect}
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-6 text-center group ${
          isDragging 
            ? 'border-amber-500 bg-amber-500/5' 
            : 'border-white/10 bg-[#131316] hover:border-amber-500/50 hover:bg-[#16161B]'
        } ${
          aspectRatio === 'square' ? 'aspect-square max-w-[160px]' : 'w-full min-h-[140px]'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/*"
          className="hidden"
        />

        {currentImageUrl && !isUploading ? (
          <div className="absolute inset-0 w-full h-full group/preview">
            <img 
              src={currentImageUrl} 
              alt="Uploaded Preview" 
              className="w-full h-full object-cover transition-transform duration-300 group-hover/preview:scale-105"
            />
            {/* Overlay on Hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1">
              <Camera className="w-5 h-5 text-amber-500 animate-bounce" />
              <span className="text-[10px] text-white font-mono font-medium">Alterar Imagem</span>
            </div>
            
            {/* Small success corner pill */}
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500/90 flex items-center justify-center shadow-lg">
              <Check className="w-3 h-3 text-black font-bold" />
            </div>
          </div>
        ) : isUploading ? (
          <div className="flex flex-col items-center justify-center gap-3">
            {/* Animated spinner */}
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-2 border-white/5" />
              <div className="absolute inset-0 rounded-full border-2 border-t-amber-500 animate-spin" />
            </div>
            <span className="text-[10px] text-amber-500 font-mono font-medium tracking-wide">Enviando...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-colors">
              <UploadCloud className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
            </div>
            <p className="text-[11px] font-medium text-gray-300">
              Arraste ou <span className="text-amber-500 group-hover:underline">escolha</span>
            </p>
            <p className="text-[9px] text-gray-500">Max 10MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-rose-400 text-[10px] bg-rose-500/10 p-2 rounded-lg border border-rose-500/10 mt-1 animate-pulse">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
