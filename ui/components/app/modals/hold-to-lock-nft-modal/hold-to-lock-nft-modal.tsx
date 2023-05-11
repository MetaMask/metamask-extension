import PropTypes from 'prop-types';
import React from 'react';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import Box from '../../../ui/box';
import {
  Text,
  ButtonIcon,
  IconName,
  Icon,
  IconSize,
  ButtonIconSize,
  ValidTag,
} from '../../../component-library';
import {
  AlignItems,
  DISPLAY,
  FLEX_DIRECTION,
  JustifyContent,
  TextVariant,
  TextAlign,
  IconColor,
  OverflowWrap,
  BLOCK_SIZES,
} from '../../../../helpers/constants/design-system';

import HoldToRevealButton from '../../hold-to-reveal-button';
import { useI18nContext } from '../../../../hooks/useI18nContext';

interface Props {
  nft: {
    name: string;
    tokenId: string;
  };
  action: string;
  onLongPressed: () => void;
  hideModal: () => void;
  willHide?: boolean;
}

const HoldToLockNFTModal = ({
  nft,
  action,
  onLongPressed,
  hideModal,
  willHide = true,
}: Props) => {
  const t = useI18nContext();

  const lockingAction = action === 'lock';
  const unlock = () => {
    onLongPressed();
    if (willHide) {
      hideModal();
    }
  };

  const handleCancel = () => {
    hideModal();
  };

  const nftTitle = truncate(`${nft.name} #${nft.tokenId}`, {
    charsToKeep: 50,
    showTrailingChars: true,
  });

  return (
    <Box
      className="hold-to-lock-nft-modal"
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      justifyContent={JustifyContent.flexStart}
      padding={6}
      onScroll={(event) => event.preventDefault()}
    >
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        marginBottom={6}
        height={BLOCK_SIZES.FULL}
      >
        <Icon
          name={lockingAction ? IconName.Lock : IconName.LockSlash}
          color={IconColor.iconDefault}
          size={IconSize.Lg}
          marginInlineStart={2}
        />

        <Text variant={TextVariant.bodyMdBold}>
          {t(lockingAction ? 'holdToLockNftTitle' : 'holdToUnlockNftTitle', [
            <Text
              key="hold-to-lock-nft-2"
              variant={TextVariant.bodyMdBold}
              as={ValidTag.Span}
              overflowWrap={OverflowWrap.Anywhere}
            >
              {nftTitle}
            </Text>,
          ])}
        </Text>

        {willHide && (
          <ButtonIcon
            className="hold-to-lock-nft-modal__close"
            iconName={IconName.Close}
            size={ButtonIconSize.Sm}
            onClick={handleCancel}
            ariaLabel={t('close')}
          />
        )}
      </Box>

      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.COLUMN}
        gap={4}
        marginBottom={6}
        alignItems={AlignItems.center}
      >
        <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Center}>
          {t(
            lockingAction
              ? 'holdToLockNftDescription'
              : 'holdToUnlockNftDescription',
          )}
        </Text>
      </Box>
      <HoldToRevealButton
        buttonText={t('holdToToggleLock', [
          lockingAction ? t('lock') : t('unlock'),
          t('nft'),
        ])}
        onLongPressed={unlock}
      />
    </Box>
  );
};

function truncate(
  string: string,
  {
    charsToKeep,
    showTrailingChars,
  }: { charsToKeep: number; showTrailingChars: boolean },
) {
  if (string.length < charsToKeep) {
    return string;
  }
  if (showTrailingChars) {
    return `${string.slice(0, charsToKeep - 3)}...${string.slice(-3)}`;
  }
  return `${string.slice(0, charsToKeep)}...`;
}

HoldToLockNFTModal.propTypes = {
  nft: PropTypes.object.isRequired,
  action: PropTypes.string.isRequired,
  // The function to be executed after the hold to reveal long press has been completed
  onLongPressed: PropTypes.func.isRequired,
  hideModal: PropTypes.func,
  willHide: PropTypes.bool,
};

export default withModalProps(HoldToLockNFTModal);
