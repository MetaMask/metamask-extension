import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { BoxProps } from '../../component-library';
import {
  Box,
  ButtonLink,
  ButtonLinkSize,
  IconName,
} from '../../component-library';
import { AlignItems, Display } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getCurrentNetwork, getSelectedAccount } from '../../../selectors';
import { ReceiveModal } from '../receive-modal';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import { getCurrentLocale } from '../../../ducks/locale/locale';

export const ReceiveTokenLink: React.FC<BoxProps<'div'>> = ({
  ...props
}): JSX.Element => {
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();
  const currentNetwork = useSelector(getCurrentNetwork);
  const currentLocale = useSelector(getCurrentLocale);
  const { address: selectedAddress } = useSelector(getSelectedAccount);

  const [showReceiveModal, setShowReceiveModal] = useState(false);

  useEffect(() => {
    trackEvent({
      event: MetaMetricsEventName.EmptyReceiveBannerDisplayed,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        chain_id: currentNetwork.chainId,
        locale: currentLocale,
        network: currentNetwork.nickname,
        referrer: ORIGIN_METAMASK,
      },
    });
  }, []);

  return (
    <>
      {showReceiveModal && (
        <ReceiveModal
          address={selectedAddress}
          onClose={() => setShowReceiveModal(false)}
        />
      )}
      <Box display={Display.Flex} alignItems={AlignItems.center} {...props}>
        <ButtonLink
          size={ButtonLinkSize.Md}
          startIconName={IconName.Add}
          onClick={() => {
            setShowReceiveModal(true);
          }}
        >
          {t('receiveTokensCamelCase')}
        </ButtonLink>
      </Box>
    </>
  );
};
