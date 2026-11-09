import React, { memo, useCallback, useState } from 'react';
import { NameType } from '@metamask/name-controller';
import {
  AvatarAccountSize,
  AvatarToken,
  AvatarTokenSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
  FontWeight,
} from '@metamask/design-system-react';

import { toChecksumHexAddress } from '../../../../../../shared/lib/hexstring-utils';
import { TrustSignalDisplayState } from '../../../../../hooks/useTrustSignals';
import { PreferredAvatar } from '../../../preferred-avatar';
import NameDetails from '../../../name/name-details/name-details';
import {
  ADDRESS_END_CHARS,
  StartTruncatedText,
} from '../../../../ui/start-truncated-text';

const TrustIcon = ({
  displayState,
  image,
}: {
  displayState: TrustSignalDisplayState;
  image?: string;
}) => {
  switch (displayState) {
    case TrustSignalDisplayState.Malicious:
      return (
        <Icon
          name={IconName.Danger}
          size={IconSize.Sm}
          color={IconColor.ErrorDefault}
        />
      );
    case TrustSignalDisplayState.Verified:
      return (
        <Icon
          name={IconName.VerifiedFilled}
          size={IconSize.Sm}
          color={IconColor.InfoDefault}
        />
      );
    case TrustSignalDisplayState.Unknown:
      return <Icon name={IconName.Question} size={IconSize.Sm} />;
    default:
      if (image) {
        return <AvatarToken src={image} size={AvatarTokenSize.Xs} />;
      }
      return null;
  }
};

export type ConfirmInfoRowAddressDisplayProps = {
  address: string;
  chainId: string;
  name: string | null;
  isAccount: boolean;
  image?: string;
  displayState: TrustSignalDisplayState;
  showAvatar?: boolean;
};

export const ConfirmInfoRowAddressDisplay = memo(
  ({
    address,
    chainId,
    name,
    isAccount,
    image,
    displayState,
    showAvatar = true,
  }: ConfirmInfoRowAddressDisplayProps) => {
    const hexAddress = toChecksumHexAddress(address);

    const [modalOpen, setModalOpen] = useState(false);

    const isClickable = !isAccount;

    const handleClick = useCallback(() => {
      if (!isClickable) {
        return;
      }
      setModalOpen(true);
    }, [isClickable]);

    const handleModalClose = useCallback(() => {
      setModalOpen(false);
    }, []);

    return (
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
      >
        {modalOpen && (
          <NameDetails
            value={hexAddress}
            type={NameType.ETHEREUM_ADDRESS}
            variation={chainId}
            onClose={handleModalClose}
          />
        )}
        {name && <TrustIcon displayState={displayState} image={image} />}
        {name && isClickable && (
          <span className="address-display-clickable">
            <TextButton
              size={TextButtonSize.BodyMd}
              onClick={handleClick}
              className="min-w-0 hover:bg-transparent active:bg-transparent"
              data-testid="confirm-info-row-display-name"
            >
              {name}
            </TextButton>
          </span>
        )}
        {name && !isClickable && (
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextDefault}
            data-testid="confirm-info-row-display-name"
          >
            {name}
          </Text>
        )}
        {!name && isClickable && (
          <span className="address-display-clickable min-w-0 flex-1">
            <TextButton
              size={TextButtonSize.BodyMd}
              onClick={handleClick}
              className="min-w-0 flex-1 justify-start hover:bg-transparent active:bg-transparent"
              data-testid="confirm-info-row-display-name"
            >
              <Text
                asChild
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.Inherit}
              >
                <StartTruncatedText
                  text={hexAddress}
                  endChars={ADDRESS_END_CHARS}
                  className="flex-1"
                />
              </Text>
            </TextButton>
          </span>
        )}
        {!name && !isClickable && (
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextDefault}
            className="min-w-0 flex-1"
            data-testid="confirm-info-row-display-name"
          >
            <StartTruncatedText
              text={hexAddress}
              endChars={ADDRESS_END_CHARS}
            />
          </Text>
        )}
        {showAvatar && (
          <PreferredAvatar address={hexAddress} size={AvatarAccountSize.Sm} />
        )}
      </Box>
    );
  },
);
