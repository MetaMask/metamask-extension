import React from 'react';
import { Box, Text, twMerge } from '@metamask/design-system-react';

export type SectionHeaderProps = {
  label: string;
  className?: string;
};

export const SectionHeader = ({
  label,
  className,
}: SectionHeaderProps): JSX.Element => (
  <Box className={twMerge('px-4 pt-3 pb-1 bg-background-default', className)}>
    <Text className="text-sm text-alternative">{label}</Text>
  </Box>
);
