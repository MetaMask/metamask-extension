import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import { log } from 'loglevel';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import Box from '../../../ui/box';
import {
  Text,
  Button,
  BUTTON_SIZES,
  BUTTON_VARIANT,
  ButtonIcon,
  IconName,
  Icon,
  IconSize,
} from '../../../component-library';
import {
  AlignItems,
  DISPLAY,
  FLEX_DIRECTION,
  JustifyContent,
  Size,
  TextVariant,
  TextAlign,
  IconColor,
} from '../../../../helpers/constants/design-system';

import HoldToRevealButton from '../../hold-to-reveal-button';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';

const HoldToLockNFTModal = ({
  nft,
  action,
  onLongPressed,
  hideModal,
  willHide = true,
}) => {
  const t = useI18nContext();

  const trackEvent = useContext(MetaMetricsContext);

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

  return (
    <Box
      className="hold-to-lock-nft-modal"
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      justifyContent={JustifyContent.flexStart}
      padding={6}
    >
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        marginBottom={6}
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
              as="span"
            >
              {`${nft.name} #${nft.tokenId}`}
            </Text>,
          ])}
        </Text>

        {willHide && (
          <ButtonIcon
            className="hold-to-lock-nft-modal__close"
            iconName={IconName.Close}
            size={Size.SM}
            onClick={() => {
              // TODO: track event
              // trackEvent({
              //   category: MetaMetricsEventCategory.Keys,
              //   event: MetaMetricsEventName.SrpHoldToRevealCloseClicked,
              //   properties: {
              //     key_type: MetaMetricsEventKeyType.Srp,
              //   },
              // });
              handleCancel();
            }}
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
          lockingAction ? 'Lock' : 'Unlock',
          'NFT',
        ])}
        onLongPressed={unlock}
        marginLeft="auto"
        marginRight="auto"
      />
    </Box>
  );
};

HoldToLockNFTModal.propTypes = {
  nft: PropTypes.object.isRequired,
  action: PropTypes.string.isRequired,
  // The function to be executed after the hold to reveal long press has been completed
  onLongPressed: PropTypes.func.isRequired,
  hideModal: PropTypes.func,
  willHide: PropTypes.bool,
};

export default withModalProps(HoldToLockNFTModal);
