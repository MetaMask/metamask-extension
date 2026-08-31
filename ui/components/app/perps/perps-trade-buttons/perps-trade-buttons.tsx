import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Icon,
  IconColor,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import { BlockSize } from '../../../../helpers/constants/design-system';
import IconButton from '../../../ui/icon-button';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsEligibility } from '../../../../hooks/perps/usePerpsEligibility';
// Imported from the module, not the `hooks/perps` barrel: hosts that render
// these buttons partially mock that barrel, which would leave the hook
// undefined.
import { usePerpsEventTracking } from '../../../../hooks/perps/usePerpsEventTracking';
import { useSelectedAccountComplianceGate } from '../../compliance';
import { PERPS_ORDER_ENTRY_ROUTE } from '../../../../helpers/constants/routes';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import { PerpsGeoBlockModal } from '../perps-geo-block-modal';

export type PerpsTradeButtonsProps = {
  /** The Perps market name to trade (e.g. 'ETH'), as returned by the provider */
  marketSymbol: string;
  /** Prefix applied to button class names and test ids (e.g. 'token', 'coin') */
  classPrefix?: string;
};

/**
 * Long / Short action buttons shown on the asset page for tokens with a
 * matching Perps market. Clicks run through the compliance gate and the Perps
 * geo-eligibility check (showing the geo-block modal when restricted) before
 * navigating to the Perps order entry screen with the side preselected,
 * matching the mobile Token Details actions.
 *
 * @param props - The component props
 * @param props.marketSymbol - The Perps market name to trade
 * @param props.classPrefix - Prefix for button class names and test ids
 */
export const PerpsTradeButtons = ({
  marketSymbol,
  classPrefix = 'token',
}: PerpsTradeButtonsProps) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { isEligible } = usePerpsEligibility();
  const { gate } = useSelectedAccountComplianceGate();
  const { track } = usePerpsEventTracking();
  const [isGeoBlockModalOpen, setIsGeoBlockModalOpen] = useState(false);

  const handleTradeClick = useCallback(
    (direction: 'long' | 'short') => {
      gate(() => {
        if (!isEligible) {
          setIsGeoBlockModalOpen(true);
          return;
        }
        track(MetaMetricsEventName.PerpsUiInteraction, {
          [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
            PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
          [PERPS_EVENT_PROPERTY.BUTTON_TYPE]:
            PERPS_EVENT_VALUE.BUTTON_CLICKED.TRADE,
          [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
            PERPS_EVENT_VALUE.BUTTON_LOCATION.ASSET_DETAILS,
          [PERPS_EVENT_PROPERTY.ASSET]: marketSymbol,
          [PERPS_EVENT_PROPERTY.DIRECTION]: direction,
        });
        const params = new URLSearchParams({ direction, mode: 'new' });
        navigate(
          `${PERPS_ORDER_ENTRY_ROUTE}/${encodeURIComponent(marketSymbol)}?${params.toString()}`,
        );
      }).catch((error: unknown) => {
        console.error(error);
      });
    },
    [gate, isEligible, marketSymbol, navigate, track],
  );

  const handleLongClick = useCallback(
    () => handleTradeClick('long'),
    [handleTradeClick],
  );
  const handleShortClick = useCallback(
    () => handleTradeClick('short'),
    [handleTradeClick],
  );

  return (
    <>
      <IconButton
        className={`${classPrefix}-overview__button`}
        Icon={
          <Icon
            name={IconName.TrendUp}
            color={IconColor.IconAlternative}
            size={IconSize.Md}
          />
        }
        label={t('perpsLong')}
        data-testid={`${classPrefix}-overview-long`}
        onClick={handleLongClick}
        width={BlockSize.Full}
      />
      <IconButton
        className={`${classPrefix}-overview__button`}
        Icon={
          <Icon
            name={IconName.TrendDown}
            color={IconColor.IconAlternative}
            size={IconSize.Md}
          />
        }
        label={t('perpsShort')}
        data-testid={`${classPrefix}-overview-short`}
        onClick={handleShortClick}
        width={BlockSize.Full}
      />
      <PerpsGeoBlockModal
        isOpen={isGeoBlockModalOpen}
        onClose={() => setIsGeoBlockModalOpen(false)}
      />
    </>
  );
};

export default PerpsTradeButtons;
