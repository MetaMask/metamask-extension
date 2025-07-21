import React from 'react';

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

type RemoteModeStatusProps = {
  enabled?: boolean;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function RemoteModeStatus({ enabled }: RemoteModeStatusProps) {
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
        Remote Mode: {enabled ? 'On' : 'Off'}
      </Text>
    </Box>
  );
}
