import React from 'react';

export const SnapUIImage = ({ image }) => {
  const src = `data:image/svg+xml;utf8,${encodeURIComponent(image)}`;

  return <img src={src} />;
};
