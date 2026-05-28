'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  fileName?: string;
  onFile: (content: string, name: string) => void;
  onClear: () => void;
}

export function FileUpload({ fileName, onFile, onClear }: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = (e.target?.result as string) || '';
        onFile(content.slice(0, 50000), file.name);
      };
      reader.readAsText(file);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  if (fileName) {
    return (
      <div className="flex items-center gap-3 p-3 bg-veda-orange-light border border-veda-orange/20 rounded-[10px]">
        <div className="w-8 h-8 rounded-[7px] bg-veda-orange/10 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-veda-orange" />
        </div>
        <span className="flex-1 text-[13px] font-medium text-veda-gray-700 truncate">
          {fileName}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="w-6 h-6 rounded-full bg-veda-gray-200 hover:bg-veda-gray-300 flex items-center justify-center transition-colors shrink-0"
        >
          <X className="w-3 h-3 text-veda-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative flex flex-col items-center justify-center gap-3 py-8 px-6',
        'border-2 border-dashed rounded-[12px] cursor-pointer',
        'transition-all duration-200',
        isDragActive
          ? 'border-veda-orange bg-veda-orange-light scale-[1.01]'
          : 'border-veda-gray-200 bg-veda-gray-50 hover:border-veda-orange/50 hover:bg-veda-orange-light/40'
      )}
    >
      <input {...getInputProps()} />

      <div
        className={cn(
          'w-12 h-12 rounded-[12px] flex items-center justify-center transition-colors',
          isDragActive ? 'bg-veda-orange/10' : 'bg-veda-gray-100'
        )}
      >
        <Upload
          className={cn(
            'w-5 h-5 transition-colors',
            isDragActive ? 'text-veda-orange' : 'text-veda-gray-400'
          )}
          strokeWidth={1.5}
        />
      </div>

      <div className="text-center">
        <p className="text-[13px] font-medium text-veda-gray-700 mb-0.5">
          {isDragActive ? 'Drop file here' : 'Choose a file or drag & drop it here'}
        </p>
        <p className="text-[11.5px] text-veda-gray-400">TXT, PDF up to 10MB</p>
      </div>

      <button
        type="button"
        className={cn(
          'px-4 py-1.5 rounded-[8px] border text-[12.5px] font-medium transition-all duration-150',
          'border-veda-gray-300 text-veda-gray-600 bg-white hover:border-veda-orange/50 hover:text-veda-orange hover:bg-veda-orange-light/50',
          'active:scale-[0.97]'
        )}
      >
        Browse Files
      </button>

      <p className="text-[11px] text-veda-gray-400 mt-1">
        Upload your document to base questions on its content
      </p>
    </div>
  );
}
