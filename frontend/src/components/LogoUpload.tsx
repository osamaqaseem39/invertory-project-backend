import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from '../i18n/i18nContext';

interface LogoUploadProps {
  onLogoSelect: (file: File) => void;
  currentLogo?: string;
  disabled?: boolean;
}

const LogoUpload: React.FC<LogoUploadProps> = ({ onLogoSelect, currentLogo, disabled }) => {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(currentLogo || null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Pass file to parent
      onLogoSelect(file);
    }
  }, [onLogoSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.webp']
    },
    maxFiles: 1,
    disabled,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive
            ? 'border-blue-500 bg-blue-50 scale-105'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Logo preview"
              className="mx-auto max-h-32 object-contain"
            />
            <p className="text-sm text-gray-600">
              {t.branding?.dragToReplace || 'Drag a new logo to replace, or click to browse'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div>
              <p className="text-base font-medium text-gray-900">
                {isDragActive
                  ? (t.branding?.dropHere || 'Drop logo here')
                  : (t.branding?.dragOrClick || 'Drag & drop your logo, or click to browse')
                }
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {t.branding?.logoFormats || 'PNG, JPG, SVG up to 10MB'}
              </p>
            </div>
          </div>
        )}
      </div>

      {preview && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPreview(null);
          }}
          disabled={disabled}
          className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-50 
                     border border-red-300 rounded-lg hover:bg-red-100
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.branding?.removeLogo || 'Remove Logo'}
        </button>
      )}
    </div>
  );
};

export default LogoUpload;





