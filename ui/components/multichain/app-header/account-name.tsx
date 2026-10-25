import React from 'react';
import { Box, Text, TextVariant } from '@metamask/design-system-react';

type AccountNameProps = {
  name: string;
};

/**
 * The selected account's name, for the fullscreen design header. Unlike
 * `AccountPicker` it is plain text: not a button and without the caret, since
 * accounts are switched from the side nav.
 *
 * @param props - The component props.
 * @param props.name - The account name.
 */
export const AccountName = ({ name }: AccountNameProps) => (
  <Box className="min-w-0 px-2">
    <Text
      variant={TextVariant.HeadingMd}
      ellipsis
      data-testid="app-header-account-name"
    >
      {name}
    </Text>
  </Box>
);
