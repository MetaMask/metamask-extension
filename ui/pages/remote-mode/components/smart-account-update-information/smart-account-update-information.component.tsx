import React from 'react';

import { InternalAccount } from '@metamask/keyring-internal-api';

import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  AvatarToken,
  AvatarTokenSize,
  Box,
  Text,
  Icon,
  IconName,
  IconSize,
} from '../../../../components/component-library';
import Tooltip from '../../../../components/ui/tooltip';
import {
  AlignItems,
  TextAlign,
  BackgroundColor,
  Display,
  JustifyContent,
  TextColor,
} from '../../../../helpers/constants/design-system';
import Card from '../../../../components/ui/card';

const SmartAccountUpdateInformation = ({
  selectedHardwareAccount,
}: {
  selectedHardwareAccount: InternalAccount;
}) => {
  return (
    <Card backgroundColor={BackgroundColor.backgroundMuted} marginBottom={4}>
      <Box
        display={Display.Flex}
        gap={2}
        paddingBottom={2}
        justifyContent={JustifyContent.spaceBetween}
      >
        <Text>Account</Text>

        <Box
          textAlign={TextAlign.Center}
          backgroundColor={BackgroundColor.primaryMuted}
          style={{
            padding: '4px 8px',
            borderRadius: '16px',
          }}
          display={Display.Flex}
          alignItems={AlignItems.center}
          gap={2}
        >
          <AvatarAccount
            variant={AvatarAccountVariant.Jazzicon}
            address={selectedHardwareAccount.address}
            size={AvatarAccountSize.Xs}
            paddingRight={2}
          />
          <Text>{selectedHardwareAccount.metadata.name}</Text>
        </Box>
      </Box>
      <Box
        display={Display.Flex}
        gap={2}
        paddingBottom={2}
        justifyContent={JustifyContent.spaceBetween}
      >
        <Box display={Display.Flex} gap={2}>
          <Text>Now</Text>
          <Tooltip position="top" title="..." trigger="mouseenter">
            <Icon name={IconName.Info} size={IconSize.Sm} />
          </Tooltip>
        </Box>
        <Text>Standard account (EOA)</Text>
      </Box>
      <Box
        display={Display.Flex}
        gap={2}
        paddingBottom={2}
        justifyContent={JustifyContent.spaceBetween}
      >
        <Box display={Display.Flex} gap={2}>
          <Text>Updating to</Text>
          <Tooltip position="top" title="..." trigger="mouseenter">
            <Icon name={IconName.Info} size={IconSize.Sm} />
          </Tooltip>
        </Box>
        <Text>Smart account</Text>
      </Box>
      <Box
        display={Display.Flex}
        gap={2}
        justifyContent={JustifyContent.spaceBetween}
      >
        <Box display={Display.Flex} gap={2}>
          <Text>Interacting with</Text>
          <Tooltip position="top" title="..." trigger="mouseenter">
            <Icon name={IconName.Info} size={IconSize.Sm} />
          </Tooltip>
        </Box>

        <Box
          textAlign={TextAlign.Center}
          color={TextColor.infoDefault}
          backgroundColor={BackgroundColor.backgroundDefault}
          style={{
            padding: '4px 8px',
            borderRadius: '16px',
            display: 'inline-block',
          }}
          display={Display.Flex}
          alignItems={AlignItems.center}
          gap={2}
        >
          <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
            <AvatarToken
              src="/images/logo/metamask-fox.svg"
              size={AvatarTokenSize.Sm}
              name="metamask-fox"
              padding={1}
            />
            <Text>Smart contract</Text>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default SmartAccountUpdateInformation;
