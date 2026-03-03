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
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { toChecksumHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { PreferredAvatar } from '../../../preferred-avatar';
import NameDetails from '../../../name/name-details/name-details';
import { TrustSignalDisplayState } from '../../../../../hooks/useTrustSignals';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../../../app/scripts/lib/util';

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

function useMiddleTruncation(text: string) {
  const display = useMemo(() => getTruncatedAddress(text), [text]);
  return { display };
}

const TrustIcon = ({
  displayState,
  image,
  address,
}: {
  displayState: TrustSignalDisplayState;
  image?: string;
  address: string;
}) => {
  switch (displayState) {
    case TrustSignalDisplayState.Malicious:
      return (
        <Icon
          name={IconName.Danger}
          size={IconSize.Sm}
          color={IconColor.ErrorDefault}
          style={{ flexShrink: 0 }}
        />
      );
    case TrustSignalDisplayState.Verified:
      return (
        <Icon
          name={IconName.VerifiedFilled}
          size={IconSize.Sm}
          color={IconColor.InfoDefault}
          style={{ flexShrink: 0 }}
        />
      );
    case TrustSignalDisplayState.Unknown:
      return (
        <Icon
          name={IconName.Question}
          size={IconSize.Sm}
          style={{ flexShrink: 0 }}
        />
      );
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
    const { display } = useMiddleTruncation(hexAddress);

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
        <TrustIcon
          displayState={displayState}
          image={image}
          address={hexAddress}
        />
        {name && isClickable && (
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextDefault}
            className="confirm-info-row-address-display__clickable"
            asChild
          >
            <button
              type="button"
              style={{ whiteSpace: 'nowrap', flex: 1 }}
              onClick={handleClick}
              data-testid="confirm-info-row-display-name"
            >
              {name}
            </button>
          </Text>
        )}
        {name && !isClickable && (
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextDefault}
            data-testid="confirm-info-row-display-name"
            style={{ whiteSpace: 'nowrap', flex: 1 }}
          >
            {name}
          </Text>
        )}
        {!name && isClickable && (
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextDefault}
            className="confirm-info-row-address-display__clickable"
            asChild
          >
            <button
              type="button"
              style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}
              onClick={handleClick}
              data-testid="confirm-info-row-display-name"
            >
              {display}
            </button>
          </Text>
        )}
        {!name && !isClickable && (
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextDefault}
            data-testid="confirm-info-row-display-name"
            asChild
          >
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {display}
            </span>
          </Text>
        )}
        {showAvatar && (
          <PreferredAvatar
            address={hexAddress}
            size={AvatarAccountSize.Sm}
            style={{ flexShrink: 0 }}
          />
        )}
      </Box>
    );
  },
);
