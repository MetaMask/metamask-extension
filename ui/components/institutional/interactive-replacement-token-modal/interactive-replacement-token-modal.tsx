import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ICustodianType } from '@metamask-institutional/types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { hideModal } from '../../../store/actions';
import { getSelectedInternalAccount } from '../../../selectors/accounts';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  Text,
  ModalHeader,
  ModalContent,
} from '../../component-library';

import {
  BlockSize,
  BackgroundColor,
  Display,
  FlexWrap,
  FlexDirection,
  BorderRadius,
  FontWeight,
  TextAlign,
  AlignItems,
} from '../../../helpers/constants/design-system';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

type State = {
  metamask: {
    interactiveReplacementToken?: { url: string };
    mmiConfiguration: { custodians: ICustodianType[] };
    custodyAccountDetails: { [address: string]: { custodianName?: string } };
  };
};

const InteractiveReplacementTokenModal: React.FC = () => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();

  const url = useSelector(
    (state: State) => state.metamask.interactiveReplacementToken?.url,
  );
  const custodians = useSelector(
    (state: State) => state.metamask.mmiConfiguration.custodians,
  );
  const address = useSelector(getSelectedInternalAccount)?.address || '';
  const custodyAccountDetails = useSelector(
    (state: State) =>
      state.metamask.custodyAccountDetails[toChecksumHexAddress(address)],
  );

  const custodianName = custodyAccountDetails?.custodianName;
  const custodian = custodians.find(
    (item) => item.envName === custodianName,
  ) || { displayName: '', iconUrl: null };

  const handleSubmit = () => {
    if (url) {
      global.platform.openTab({ url });

      trackEvent({
        category: MetaMetricsEventCategory.MMI,
        event: MetaMetricsEventName.InteractiveReplacementTokenButtonClicked,
      });
    }
  };

  const handleClose = () => {
    dispatch(hideModal());
  };

  return (
    <Modal isOpen onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <Box padding={4}>
          <ModalHeader onClose={handleClose}>
            {t('custodyRefreshTokenModalTitle')}
          </ModalHeader>
          {
            // @ts-expect-error: todo: Merge MetaMask Institutional PR 778 to fix this
            custodian.iconUrl ? (
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                alignItems={AlignItems.center}
                paddingTop={5}
              >
                <Box display={Display.Block} textAlign={TextAlign.Center}>
                  <img
                    // @ts-expect-error: todo: Merge MetaMask Institutional 778 PR to fix this
                    src={custodian.iconUrl}
                    width={45}
                    alt={custodian.displayName}
                  />
                </Box>
              </Box>
            ) : (
              <Box display={Display.Block} textAlign={TextAlign.Center}>
                <Text>{custodian.displayName}</Text>
              </Box>
            )
          }
          <Box
            width={BlockSize.Full}
            backgroundColor={BackgroundColor.backgroundDefault}
            display={Display.Flex}
            flexWrap={FlexWrap.Wrap}
            flexDirection={FlexDirection.Column}
            borderRadius={BorderRadius.SM}
            data-testid="interactive-replacement-token-modal"
          >
            <Text
              as="p"
              paddingTop={4}
              paddingBottom={6}
              textAlign={TextAlign.Left}
            >
              {t('custodyRefreshTokenModalDescription', [
                custodian.displayName,
              ])}
            </Text>
            <Text as="p" fontWeight={FontWeight.Medium}>
              {t('custodyRefreshTokenModalSubtitle')}
            </Text>
            <Text
              as="p"
              paddingTop={4}
              paddingBottom={6}
              textAlign={TextAlign.Left}
            >
              {t('custodyRefreshTokenModalDescription1')}
            </Text>
            <Text as="p" paddingBottom={6} textAlign={TextAlign.Left}>
              {t('custodyRefreshTokenModalDescription2')}
            </Text>
            <Button onClick={handleSubmit}>
              {custodian.displayName || 'Custodian'}
            </Button>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default InteractiveReplacementTokenModal;
