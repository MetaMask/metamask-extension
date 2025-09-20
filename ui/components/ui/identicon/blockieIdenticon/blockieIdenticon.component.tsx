import React, { useEffect, useState } from 'react';

type BlockieIdenticonProps = {
  address: string;
  diameter: number;
  alt?: string;
  borderRadius?: string | number;
};

const BlockieIdenticon = ({
  address,
  diameter,
  alt = '',
  borderRadius,
}: BlockieIdenticonProps) => {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    const loadBlo = async () => {
      const { blo } = await import('blo');
      setSrc(blo(address));
    };
    loadBlo();
  }, [address]);

  return (
    <img
      src={src}
      height={diameter}
      width={diameter}
      style={{
        borderRadius,
      }}
      alt={alt}
    />
  );
};

export default BlockieIdenticon;
