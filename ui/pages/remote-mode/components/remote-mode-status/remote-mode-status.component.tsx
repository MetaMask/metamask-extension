import React from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';

import {
  Display,
  JustifyContent,
  IconColor,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../components/component-library';
import { isRemoteModeSupported } from '../../../../helpers/utils/remote-mode';

export default function RemoteModeStatus(internalAccount: InternalAccount) {
  // todo: add check (and maybe replace this) that account the has valid delegation
  const isRemoteMode = isRemoteModeSupported(internalAccount);

  return (
    <Box display={Display.Flex} justifyContent={JustifyContent.flexEnd}>
      <Icon
        name={IconName.Info}
        size={IconSize.Sm}
        color={IconColor.iconAlternativeSoft}
        marginRight={1}
        marginTop={1}
      />
      <Text color={TextColor.textAlternativeSoft} variant={TextVariant.bodySm}>
        Remote Mode: {isRemoteMode ? 'On' : 'Off'}
      </Text>
    </Box>
  );
}
