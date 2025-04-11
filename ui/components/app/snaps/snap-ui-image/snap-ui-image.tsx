// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';

export type SnapUIImageProps = {
  value: string;
  style?: React.CSSProperties;
  width?: string;
  height?: string;
  borderRadius?: string;
};

export const SnapUIImage = ({
  value,
  width,
  height,
  style,
  borderRadius,
}: SnapUIImageProps) => {
  const src = `data:image/svg+xml;utf8,${encodeURIComponent(value)}`;

  return (
    <img
      className="snap-ui-renderer__image"
      data-testid="snaps-ui-image"
      src={src}
      width={width}
      height={height}
      style={{ ...style, borderRadius }}
    />
  );
};
