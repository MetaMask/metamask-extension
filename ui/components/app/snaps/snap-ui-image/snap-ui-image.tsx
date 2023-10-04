import React from 'react';

export type SnapUIImageProps = {
  value: string;
};

export const SnapUIImage = ({ value }: SnapUIImageProps) => {
  const src = `data:image/svg+xml;utf8,${encodeURIComponent(value)}`;

  return <img src={src} />;
};
