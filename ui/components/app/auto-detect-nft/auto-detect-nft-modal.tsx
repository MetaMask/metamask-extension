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
import { setOpenSeaEnabled, setUseNftDetection } from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getProviderConfig } from '../../../ducks/metamask/metamask';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';

type AutoDetectNftModalProps = {
  isOpen: boolean;
  onClose: (arg: boolean) => void;
};
function AutoDetectNftModal({ isOpen, onClose }: AutoDetectNftModalProps) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const { chainId } = useSelector(getProviderConfig);

  const handleNftAutoDetection = useCallback(
    (val) => {
      trackEvent({
        event: val
          ? MetaMetricsEventName.NftAutoDetectionEnableModal
          : MetaMetricsEventName.NftAutoDetectionDisableModal,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          chain_id: chainId,
          referrer: ORIGIN_METAMASK,
        },
      });
      if (val) {
        dispatch(setOpenSeaEnabled(val));
        dispatch(setUseNftDetection(val));
      }
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
      className="mm-modal__custom-scrollbar auto-detect-in-modal"
      data-testid="auto-detect-nft-modal"
      autoFocus={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
        >
          {t('enableNftAutoDetection')}
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
          <Text
            variant={TextVariant.bodyMd}
            textAlign={TextAlign.Justify}
            padding={0}
          >
            {t('allowMetaMaskToDetectNFTs')}
            <Box textAlign={TextAlign.Justify} paddingLeft={2}>
              <Text variant={TextVariant.inherit} as="li" paddingTop={2}>
                {t('immediateAccessToYourNFTs')}
              </Text>
              <Text variant={TextVariant.inherit} as="li">
                {t('effortlesslyNavigateYourDigitalAssets')}
              </Text>
              <Text variant={TextVariant.inherit} as="li">
                {t('diveStraightIntoUsingYourNFTs')}
              </Text>
            </Box>
          </Text>
        </ModalBody>
        <ModalFooter
          onSubmit={() => handleNftAutoDetection(true)}
          submitButtonProps={{
            children: t('allow'),
            block: true,
          }}
          onCancel={() => handleNftAutoDetection(false)}
          cancelButtonProps={{
            children: t('notRightNow'),
            block: true,
          }}
        />
      </ModalContent>
    </Modal>
  );
}

export default AutoDetectNftModal;
