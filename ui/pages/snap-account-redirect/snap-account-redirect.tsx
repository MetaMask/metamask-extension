import React from 'react';
import { Box } from '../../components/component-library';
import {
  AlignItems,
  BlockSize,
  BorderStyle,
  Display,
  FlexDirection,
} from '../../helpers/constants/design-system';
import SnapAuthorshipHeader from '../../components/app/snaps/snap-authorship-header';
import { SnapAccountRedirectContent } from './components';

export interface SnapAccountRedirectProps {
  url: string;
  snapId: string;
  snapName: string;
  isBlockedUrl: boolean;
  message: string;
  onSubmit?: () => void;
}

const SnapAccountRedirect = ({
  url,
  snapId,
  snapName,
  isBlockedUrl,
  message,
  onSubmit,
}: SnapAccountRedirectProps) => {
  return (
    <Box
      className="create-snap-account-page"
      height={BlockSize.Full}
      width={BlockSize.Full}
      borderStyle={BorderStyle.none}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
    >
      <SnapAuthorshipHeader snapId={snapId} />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        height={BlockSize.Full}
        paddingLeft={4}
        paddingRight={4}
      >
        <SnapAccountRedirectContent
          url={url}
          onSubmit={onSubmit}
          snapId={snapId}
          snapName={snapName}
          isBlockedUrl={isBlockedUrl}
          message={message}
        />
      </Box>
    </Box>
  );
};

export default SnapAccountRedirect;
