import { useState, type ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackLabel?: string;
}

export function ImageWithFallback({ fallbackLabel = 'Image unavailable', className = '', ...props }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`image-fallback ${className}`} role="img" aria-label={fallbackLabel}>
        <ImageOff aria-hidden="true" />
        <span>{fallbackLabel}</span>
      </div>
    );
  }

  return <img className={className} {...props} onError={() => setFailed(true)} />;
}
