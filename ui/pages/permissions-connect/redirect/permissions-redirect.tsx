import React, { useMemo } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import ConnectionAnimation from './connection-animation';

type SubjectMetadata = {
  extensionId?: string | null;
  iconUrl?: string | null;
  subjectType?: string;
  name: string;
  origin: string;
};

type PermissionsRedirectProps = {
  subjectMetadata?: SubjectMetadata;
  isConnected?: boolean;
  onAnimationComplete?: () => void;
};

export default function PermissionsRedirect({
  subjectMetadata,
  isConnected = false,
  onAnimationComplete,
}: PermissionsRedirectProps) {
  // Capture the icon URL from metadata - this won't change once the component is mounted
  const iconUrl = useMemo(
    () => subjectMetadata?.iconUrl,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <Box
      className="permissions-redirect flex h-full w-full"
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Center}
      alignItems={BoxAlignItems.Center}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
    >
      <ConnectionAnimation
        iconUrl={iconUrl}
        isConnected={isConnected}
        onConnectedAnimationComplete={onAnimationComplete}
      />
    </Box>
  );
}

export { PermissionsRedirect };
export type { PermissionsRedirectProps, SubjectMetadata };
