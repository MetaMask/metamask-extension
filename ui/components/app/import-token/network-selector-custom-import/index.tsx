import React from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonBase,
  IconColor,
  IconName,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { getImageForChainId } from '../../../../selectors/multichain';

export const NetworkSelectorCustomImport = ({
  title,
  buttonDataTestId,
  chainId,
  onSelectNetwork,
}: {
  title: string;
  buttonDataTestId: string;
  chainId: string;
  onSelectNetwork: () => void;
}) => {
  const networkImageUrl = chainId ? getImageForChainId(chainId) : undefined;

  return (
    <ButtonBase
      type="button"
      className="h-12 w-full justify-between rounded-xl border border-muted bg-muted px-4 font-normal text-left hover:bg-muted active:scale-100"
      onClick={onSelectNetwork}
      data-testid={buttonDataTestId}
      startAccessory={
        <Box className="flex min-w-0 items-center gap-2">
          {chainId ? (
            <AvatarNetwork
              key={networkImageUrl ?? chainId}
              name={title}
              src={networkImageUrl}
              size={AvatarNetworkSize.Xs}
              className="shrink-0 rounded-md"
            />
          ) : null}
          <Text variant={TextVariant.BodyMd} ellipsis>
            {title}
          </Text>
        </Box>
      }
      endIconName={IconName.ArrowDown}
      endIconProps={{ color: IconColor.IconDefault }}
    />
  );
};

export default NetworkSelectorCustomImport;
