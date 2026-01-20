import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import Confusable from '../../ui/confusable';
import {
  Box,
  Text,
  Icon,
  IconName,
  BadgeWrapper,
  AvatarNetwork,
  AvatarNetworkSize,
} from '../../component-library';
import {
  TextAlign,
  TextVariant,
  FlexDirection,
  Display,
  BlockSize,
  BackgroundColor,
  TextColor,
  AlignItems,
  IconColor,
} from '../../../helpers/constants/design-system';
import { PreferredAvatar } from '../../app/preferred-avatar';
import { shortenAddress } from '../../../helpers/utils/util';
import Tooltip from '../../ui/tooltip';
import { I18nContext } from '../../../contexts/i18n';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import { getImageForChainId } from '../../../selectors/multichain';

type AddressListItemProps = {
  address: string;
  label: string;
  chainId: string;
  useConfusable?: boolean;
  isDuplicate?: boolean;
  onClick: () => void;
};

export const AddressListItem = ({
  address,
  label,
  chainId,
  useConfusable = false,
  isDuplicate = false,
  onClick,
}: AddressListItemProps) => {
  const t = useContext(I18nContext);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);

  let displayName: string | React.ReactNode = shortenAddress(address);
  if (label) {
    displayName = label;
    if (useConfusable) {
      displayName = <Confusable input={label} />;
    }
  }

  return (
    <Box
      display={Display.Flex}
      padding={4}
      as="button"
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
      }}
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.transparent}
      className="address-list-item gap-4"
      alignItems={AlignItems.center}
    >
      <Box display={Display.Flex}>
        <BadgeWrapper
          badge={
            <AvatarNetwork
              size={AvatarNetworkSize.Xs}
              name={allNetworks?.[chainId as Hex]?.name}
              src={getImageForChainId(chainId)}
              backgroundColor={BackgroundColor.backgroundDefault}
              borderWidth={2}
            />
          }
        >
          <PreferredAvatar address={address} className="flex" />
        </BadgeWrapper>
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        style={{ overflow: 'hidden' }}
      >
        <Text
          variant={TextVariant.bodyMdMedium}
          padding={0}
          width={BlockSize.Full}
          textAlign={TextAlign.Left}
          className="address-list-item__label"
          data-testid="address-list-item-label"
          style={{ overflow: 'hidden' }}
          ellipsis
        >
          {displayName}
        </Text>
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
          ellipsis
          data-testid="address-list-item-address"
          as="div"
          display={Display.Flex}
        >
          <Tooltip title={address} position="bottom">
            {shortenAddress(address)}
          </Tooltip>
        </Text>
      </Box>
      {isDuplicate && (
        <Box className="address-list-item__duplicate-contact-warning-icon">
          <Tooltip title={t('duplicateContactTooltip')} position="top">
            <Icon name={IconName.Danger} color={IconColor.warningDefault} />
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};
