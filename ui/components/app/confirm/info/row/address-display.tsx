import React, { memo, useCallback, useMemo, useState } from 'react';
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

import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../../../shared/lib/environment-type';
import { toChecksumHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { TrustSignalDisplayState } from '../../../../../hooks/useTrustSignals';
import { PreferredAvatar } from '../../../preferred-avatar';
import NameDetails from '../../../name/name-details/name-details';

const ELLIPSIS = '\u2026';

/** Truncation config: [prefix chars to show, suffix chars to show] */
const TRUNCATION_CONFIG = {
  full: [Infinity, Infinity] as const,
  truncated: [14, 10] as const,
} as const;

function getTruncatedAddress(text: string): string {
  const environmentType = getEnvironmentType();
  const [prefixLen, suffixLen] =
    environmentType === ENVIRONMENT_TYPE_FULLSCREEN
      ? TRUNCATION_CONFIG.full
      : TRUNCATION_CONFIG.truncated;

  if (text.length <= prefixLen + suffixLen + 1) {
    return text;
  }

  return `${text.slice(0, prefixLen)}${ELLIPSIS}${text.slice(-suffixLen)}`;
}

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
    const display = useMemo(
      () => getTruncatedAddress(hexAddress),
      [hexAddress],
    );

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
          <TextButton
            size={TextButtonSize.BodyMd}
            onClick={handleClick}
            className="hover:bg-transparent active:bg-transparent"
            data-testid="confirm-info-row-display-name"
          >
            {name}
          </TextButton>
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
          <span className="address-display-no-name">
            <TextButton
              size={TextButtonSize.BodyMd}
              onClick={handleClick}
              className="hover:bg-transparent active:bg-transparent whitespace-nowrap"
              data-testid="confirm-info-row-display-name"
            >
              {display}
            </TextButton>
          </span>
        )}
        {!name && !isClickable && (
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextDefault}
            ellipsis
            data-testid="confirm-info-row-display-name"
          >
            {display}
          </Text>
        )}
        {showAvatar && (
          <PreferredAvatar address={hexAddress} size={AvatarAccountSize.Sm} />
        )}
      </Box>
    );
  },
);
