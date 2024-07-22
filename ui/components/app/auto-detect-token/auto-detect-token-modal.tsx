import React, { useCallback, useContext } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  Box,
  Text,
  ModalBody,
  ModalFooter,
  ButtonVariant,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  AlignItems,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
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
  setShowTokenAutodetectModalOnUpgrade: (arg: boolean) => void;
};
function AutoDetectTokenModal({
  isOpen,
  onClose,
  setShowTokenAutodetectModalOnUpgrade,
}: AutoDetectTokenModalProps) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const { chainId } = useSelector(getProviderConfig);
  const locale = useSelector(getCurrentLocale);

  const handleTokenAutoDetection = useCallback(
    (val) => {
      trackEvent({
        event: val
          ? MetaMetricsEventName.TokenAutoDetectionEnableModal
          : MetaMetricsEventName.TokenAutoDetectionDisableModal,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          chain_id: chainId,
          locale,
          referrer: ORIGIN_METAMASK,
        },
      });
      dispatch(setUseTokenDetection(val));
      onClose(val);
      setShowTokenAutodetectModalOnUpgrade(val);
    },
    [dispatch],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onClose(true)}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
      className="mm-modal__custom-scrollbar auto-detect-in-modal"
      data-testid="auto-detect-token-modal"
      autoFocus={false}
    >
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{ className: 'auto-detect-in-modal__dialog' }}
      >
        <ModalHeader
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
        >
          {t('enableTokenAutoDetection')}
        </ModalHeader>
        <ModalBody
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          paddingLeft={4}
          paddingRight={4}
        >
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            borderRadius={BorderRadius.SM}
          >
            <img src="/images/wallet-alpha.png" />
          </Box>
          <Text variant={TextVariant.bodyMd}>
            {t('allowMetaMaskToDetectTokens')}
            <Box paddingLeft={2}>
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
        </ModalBody>
        <ModalFooter
          onSubmit={() => handleTokenAutoDetection(true)}
          submitButtonProps={{
            children: t('allow'),
            block: true,
          }}
          onCancel={() => handleTokenAutoDetection(false)}
          cancelButtonProps={{
            children: t('notRightNow'),
            variant: ButtonVariant.Link,
            block: true,
          }}
          containerProps={{ flexDirection: FlexDirection.ColumnReverse }}
        />
      </ModalContent>
    </Modal>
  );
}

export default AutoDetectTokenModal;
