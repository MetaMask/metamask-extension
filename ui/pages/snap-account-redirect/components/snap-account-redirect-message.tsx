import React from 'react';
import { Display, TextVariant } from '../../../helpers/constants/design-system';
import { Box, Text } from '../../../components/component-library';
import { SnapAccountRedirectProps } from '../snap-account-redirect';
import { SnapDelineator } from '../../../components/app/snaps/snap-delineator';
import UrlDisplayBox from './url-display-box';

const SnapAccountRedirectMessage = ({
  snapName,
  url,
  message,
  onSubmit,
}: Pick<
  SnapAccountRedirectProps,
  'snapName' | 'url' | 'message' | 'onSubmit'
>) => {
  /* eslint-disable no-negated-condition */
  return (
    <SnapDelineator
      data-testid="snap-account-redirect-message-container"
      snapName={snapName}
    >
      {message !== '' ? (
        <Text
          variant={TextVariant.bodyMd}
          data-testid="snap-account-redirect-message"
        >
          {message}
        </Text>
      ) : null}
      {url.length > 0 ? (
        <Box paddingTop={2} display={Display.Flex}>
          <UrlDisplayBox url={url} onSubmit={onSubmit} />
        </Box>
      ) : null}
    </SnapDelineator>
  );
};

export default React.memo(SnapAccountRedirectMessage);
