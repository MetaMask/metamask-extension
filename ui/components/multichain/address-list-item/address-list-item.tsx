import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import Confusable from '../../ui/confusable';
import {
  AvatarAccount,
  Box,
  AvatarAccountVariant,
  Text,
  AvatarAccountSize,
  Icon,
  IconName,
} from '../../component-library';
import {
  TextAlign,
  TextVariant,
  FlexDirection,
  BorderColor,
  Display,
  BlockSize,
  BackgroundColor,
  TextColor,
  AlignItems,
  IconColor,
} from '../../../helpers/constants/design-system';
import { getUseBlockie } from '../../../selectors';
import { shortenAddress } from '../../../helpers/utils/util';
import Tooltip from '../../ui/tooltip';
import { I18nContext } from '../../../contexts/i18n';

type AddressListItemProps = {
  address: string;
  label: string;
  useConfusable?: boolean;
  isDuplicate?: boolean;
  onClick: () => void;
};

export const AddressListItem = ({
  address,
  label,
  useConfusable = false,
  isDuplicate = false,
  onClick,
}: AddressListItemProps) => {
  const t = useContext(I18nContext);

  const useBlockie = useSelector(getUseBlockie);
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
      className="address-list-item"
      alignItems={AlignItems.center}
    >
      <AvatarAccount
        borderColor={BorderColor.transparent}
        size={AvatarAccountSize.Md}
        address={address}
        variant={
          useBlockie
            ? AvatarAccountVariant.Blockies
            : AvatarAccountVariant.Jazzicon
        }
        marginInlineEnd={2}
      />
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
