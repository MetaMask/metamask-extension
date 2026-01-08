import React from 'react';
import {
  AvatarAccountSize,
  Box,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { NameType } from '@metamask/name-controller';
import { useDisplayName } from '../../../../hooks/useDisplayName';
import Identicon from '../../../../components/ui/identicon';
import { PreferredAvatar } from '../../../../components/app/preferred-avatar';

const CryptoAccountDisplay = ({
  payerAddress,
  chainId,
  showIcon = true,
}: {
  payerAddress: string;
  chainId: string;
  showIcon?: boolean;
}) => {
  const { name, icon, image, subtitle } = useDisplayName({
    value: payerAddress,
    type: NameType.ETHEREUM_ADDRESS,
    preferContractSymbol: false,
    variation: chainId,
  });

  const renderIcon = () => {
    // If icon exists, use it (trust signal /unknown)
    if (icon) {
      // need to cast to unknown since the useDisplayname uses old Icon types
      return (
        <Icon
          name={icon.name as unknown as IconName}
          className="crypto-account-display__icon"
          size={IconSize.Sm}
          color={icon.color as unknown as IconColor}
        />
      );
    }

    if (image) {
      return <Identicon address={payerAddress} diameter={16} image={image} />;
    }

    return (
      <PreferredAvatar
        className="rounded-md"
        address={payerAddress}
        size={AvatarAccountSize.Xs}
      />
    );
  };

  const renderAccountName = () => {
    if (subtitle) {
      return (
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {name}, {subtitle}
        </Text>
      );
    }
    return name;
  };

  return (
    <Box className="flex gap-2 items-center">
      {showIcon && renderIcon()}
      {renderAccountName()}
    </Box>
  );
};

export default CryptoAccountDisplay;
