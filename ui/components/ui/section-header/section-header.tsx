import React from 'react';
import { Box, Text, twMerge } from '@metamask/design-system-react';

export type SectionHeaderProps = {
  label: string;
  className?: string;
};

export const SectionHeader = ({
  label,
  className,
}: SectionHeaderProps): React.JSX.Element => (
  <Box className={twMerge('px-4 py-2 bg-background-default', className)}>
    <Text className="text-sm text-alternative">{label}</Text>
  </Box>
);
