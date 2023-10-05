import React from 'react';
import {
  Display,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Box, TextField, Text } from '../../../components/component-library';
import { SnapAccountRedirectProps } from '../snap-account-redirect';
import { SnapDelineator } from '../../../components/app/snaps/snap-delineator';
import RedirectUrlIcon from './redirect-url-icon';

const SnapAccountRedirectMessage = ({
  snapName,
  url,
  message,
}: Pick<SnapAccountRedirectProps, 'snapName' | 'url' | 'message'>) => {
  return (
    <SnapDelineator snapName={snapName}>
      <Text variant={TextVariant.bodySm}>{message}</Text>
      <Box paddingTop={2} display={Display.Flex}>
        <TextField
          id="snap-account-redirect-url"
          value={url}
          autoComplete={false}
          autoFocus={false}
          readOnly
          margin="normal"
          largeLabel
          startAccessory={null}
          endAccessory={<RedirectUrlIcon url={url} />}
          inputProps={{
            color: TextColor.primaryDefault,
          }}
          truncate={false}
          className=""
          defaultValue=""
          disabled={false}
          error={false}
          inputRef={null}
          maxLength={undefined}
          name=""
          placeholder=""
          required={false}
          testId=""
          type="text"
          onBlur={null}
          onChange={null}
          onClick={null}
          onFocus={null}
        />
      </Box>
    </SnapDelineator>
  );
};

export default React.memo(SnapAccountRedirectMessage);
