import React from 'react';

type PartnerLinkProps = {
  text: string;
  url: string;
};

export const PartnerLink: React.FC<PartnerLinkProps> = ({ text, url }) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: 'var(--color-primary-default)',
        cursor: 'pointer',
      }}
    >
      {text}
    </a>
  );
};
