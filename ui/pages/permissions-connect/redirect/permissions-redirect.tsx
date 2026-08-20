import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import ConnectionAnimation, {
  ConnectionAnimationHandle,
} from './connection-animation';

type SubjectMetadata = {
  extensionId?: string | null;
  iconUrl?: string | null;
  subjectType?: string;
  name: string;
  origin: string;
};

type PermissionsRedirectProps = {
  subjectMetadata?: SubjectMetadata;
  onAnimationComplete?: () => void;
};

export type PermissionsRedirectHandle = {
  triggerConnected: () => void;
};

const PermissionsRedirect = forwardRef<
  PermissionsRedirectHandle,
  PermissionsRedirectProps
>(({ subjectMetadata, onAnimationComplete }, ref) => {
  const animationRef = useRef<ConnectionAnimationHandle>(null);
  const [cachedSubjectMetadata, setCachedSubjectMetadata] = useState<
    SubjectMetadata | undefined
  >(subjectMetadata);
  const hasTriggeredConnectedRef = useRef(false);

  useEffect(() => {
    if (subjectMetadata && subjectMetadata.origin) {
      setCachedSubjectMetadata(subjectMetadata);
    }
  }, [subjectMetadata]);

  useImperativeHandle(
    ref,
    () => ({
      triggerConnected: () => {
        if (hasTriggeredConnectedRef.current) {
          return;
        }
        hasTriggeredConnectedRef.current = true;
        animationRef.current?.triggerConnected();
      },
    }),
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
        ref={animationRef}
        iconUrl={cachedSubjectMetadata?.iconUrl}
        onConnectedAnimationComplete={onAnimationComplete}
      />
    </Box>
  );
});

PermissionsRedirect.displayName = 'PermissionsRedirect';

export default PermissionsRedirect;
export { PermissionsRedirect };
export type { PermissionsRedirectProps, SubjectMetadata };
