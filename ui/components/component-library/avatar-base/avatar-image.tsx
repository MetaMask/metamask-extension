import React, { useEffect, useState } from 'react';

export type AvatarImageProps = {
  src: string;
  showHalo?: boolean;
  imageClassName: string;
  reducedImageClassName: string;
  blurredImageClassName: string;
  label: string;
};

export function useImageFallback(src?: string): boolean {
  const [showFallback, setShowFallback] = useState(!src);

  useEffect(() => {
    if (!src) {
      setShowFallback(true);
      return undefined;
    }

    let isMounted = true;
    const image = new Image();

    image.onload = () => {
      if (isMounted) {
        setShowFallback(false);
      }
    };
    image.onerror = () => {
      if (isMounted) {
        setShowFallback(true);
      }
    };
    setShowFallback(false);
    image.src = src;

    return () => {
      isMounted = false;
      image.onload = null;
      image.onerror = null;
      image.removeAttribute('src');
    };
  }, [src]);

  return showFallback;
}

export function AvatarImage({
  src,
  showHalo,
  imageClassName,
  reducedImageClassName,
  blurredImageClassName,
  label,
}: AvatarImageProps) {
  const imageStyle = { backgroundImage: `url("${src}")` };

  return (
    <>
      {showHalo && (
        <span
          style={imageStyle}
          className={blurredImageClassName}
          aria-hidden="true"
        />
      )}
      <span
        role="img"
        className={showHalo ? reducedImageClassName : imageClassName}
        style={imageStyle}
        aria-label={label}
      />
    </>
  );
}
