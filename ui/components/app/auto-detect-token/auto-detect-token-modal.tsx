import React, { useCallback, useContext } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  Box,
  Text,
  ButtonPrimary,
  ButtonSecondary,
  ButtonPrimarySize,
  ButtonSecondarySize,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { setUseTokenDetection } from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getProviderConfig } from '../../../ducks/metamask/metamask';
import { getCurrentLocale } from '../../../ducks/locale/locale';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';

type AutoDetectTokenModalProps = {
  isOpen: boolean;
  onClose: (arg: boolean) => void;
};
function AutoDetectTokenModal({ isOpen, onClose }: AutoDetectTokenModalProps) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const { chainId } = useSelector(getProviderConfig);

  const handleTokenAutoDetection = useCallback(
    (val) => {
      trackEvent({
        event: val
          ? MetaMetricsEventName.TokenAutoDetectionEnableModal
          : MetaMetricsEventName.TokenAutoDetectionDisableModal,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          chain_id: chainId,
          locale: getCurrentLocale,
          referrer: ORIGIN_METAMASK,
        },
      });
      dispatch(setUseTokenDetection(val));
      onClose(val);
    },
    [dispatch],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onClose(true)}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
      className="mm-modal__custom-scrollbar mm-auto-detect-in-modal"
      autoFocus={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
        >
          Enable token autodetection
        </ModalHeader>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          paddingLeft={4}
          paddingRight={4}
        >
          <Box
            className="image-default"
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            borderRadius={BorderRadius.SM}
          />
          <Text
            variant={TextVariant.bodyMd}
            textAlign={TextAlign.Justify}
            padding={0}
          >
            {t('allowMetaMaskToDetectTokens')}
            <Box textAlign={TextAlign.Justify} paddingLeft={2}>
              <Text variant={TextVariant.inherit} as="li" paddingTop={2}>
                {t('immediateAccessToYourTokens')}
              </Text>
              <Text variant={TextVariant.inherit} as="li">
                {t('effortlesslyNavigateYourDigitalAssets')}
              </Text>
              <Text variant={TextVariant.inherit} as="li">
                {t('diveStraightIntoUsingYourTokens')}
              </Text>
            </Box>
          </Text>
          <Box>
            <Box paddingTop={8}>
              <ButtonPrimary
                onClick={() => handleTokenAutoDetection(true)}
                variant={TextVariant.bodyMd}
                size={ButtonPrimarySize.Md}
                block
              >
                {t('allow')}
              </ButtonPrimary>
            </Box>
            <Box paddingTop={4} paddingBottom={4}>
              <ButtonSecondary
                onClick={() => handleTokenAutoDetection(false)}
                variant={TextVariant.bodyMd}
                size={ButtonSecondarySize.Md}
                block
              >
                {t('notRightNow')}
              </ButtonSecondary>
            </Box>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
}

export default AutoDetectTokenModal;
