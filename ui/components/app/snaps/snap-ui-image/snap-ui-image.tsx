import React from 'react';

export type SnapUIImageProps = {
  value: string;
};

export const SnapUIImage = ({ value }: SnapUIImageProps) => {
  const src = `data:image/svg+xml;utf8,${encodeURIComponent(value)}`;

  return <img style={{ marginTop: '4px', marginBottom: '4px' }} src={src} />;
};
