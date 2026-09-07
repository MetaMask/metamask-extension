import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsEligibility } from '../../../../hooks/perps/usePerpsEligibility';
import {
  AccessRestrictedProvider,
  useSelectedAccountComplianceGate,
} from '../../compliance';
import { PERPS_ORDER_ENTRY_ROUTE } from '../../../../helpers/constants/routes';
import { PERPS_EVENT_VALUE } from '../../../../../shared/constants/perps-events';
import { PerpsGeoBlockModal } from '../perps-geo-block-modal';

export type PerpsTradeButtonsProps = {
  /** The Perps market name to trade (e.g. 'ETH'), as returned by the provider */
  marketSymbol: string;
  /** Prefix applied to button class names and test ids (e.g. 'token', 'coin') */
  classPrefix?: string;
};

type PerpsActionIconButtonProps = {
  className: string;
  label: string;
  iconName: IconName;
  onClick: () => void;
  'data-testid': string;
};

/**
 * Asset-row action button matching the existing overview icon+label layout,
 * built with design-system primitives.
 *
 * @param props - Button props
 * @param props.className - Extra class names (e.g. overview button class)
 * @param props.label - Visible button label
 * @param props.iconName - Design-system icon
 * @param props.onClick - Click handler
 * @param props.data-testid - Test id for e2e / unit tests
 */
const PerpsActionIconButton = ({
  className,
  label,
  iconName,
  onClick,
  'data-testid': dataTestId,
}: PerpsActionIconButtonProps) => (
  <button
    type="button"
    className={`icon-button ${className} flex w-full flex-col items-center justify-center rounded-lg bg-background-muted px-2 py-3`}
    data-testid={dataTestId}
    onClick={onClick}
  >
    <Icon
      name={iconName}
      color={IconColor.IconAlternative}
      size={IconSize.Md}
    />
    <Text
      variant={TextVariant.BodySm}
      className="icon-button__label"
      style={{ marginTop: '-4px' }}
    >
      {label}
    </Text>
  </button>
);

const PerpsTradeButtonsContent = ({
  marketSymbol,
  classPrefix = 'token',
}: PerpsTradeButtonsProps) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { isEligible } = usePerpsEligibility();
  const { gate } = useSelectedAccountComplianceGate();
  const [isGeoBlockModalOpen, setIsGeoBlockModalOpen] = useState(false);

  const handleTradeClick = useCallback(
    (direction: 'long' | 'short') => {
      // Match mobile Token Details: no PerpsUiInteraction on Long/Short tap;
      // navigate when eligible, otherwise show the geo-block notice (which
      // emits PERPS_SCREEN_VIEWED with SOURCE=asset_detail_screen).
      gate(() => {
        if (!isEligible) {
          setIsGeoBlockModalOpen(true);
          return;
        }
        const params = new URLSearchParams({ direction, mode: 'new' });
        navigate(
          `${PERPS_ORDER_ENTRY_ROUTE}/${encodeURIComponent(marketSymbol)}?${params.toString()}`,
        );
      }).catch((error: unknown) => {
        console.error(error);
      });
    },
    [gate, isEligible, marketSymbol, navigate],
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
      <PerpsActionIconButton
        className={`${classPrefix}-overview__button`}
        iconName={IconName.TrendUp}
        label={t('perpsLong')}
        data-testid={`${classPrefix}-overview-long`}
        onClick={handleLongClick}
      />
      <PerpsActionIconButton
        className={`${classPrefix}-overview__button`}
        iconName={IconName.TrendDown}
        label={t('perpsShort')}
        data-testid={`${classPrefix}-overview-short`}
        onClick={handleShortClick}
      />
      <PerpsGeoBlockModal
        isOpen={isGeoBlockModalOpen}
        onClose={() => setIsGeoBlockModalOpen(false)}
        source={PERPS_EVENT_VALUE.SOURCE.ASSET_DETAIL_SCREEN}
      />
    </>
  );
};

/**
 * Long / Short action buttons shown on the asset page for tokens with a
 * matching Perps market. Clicks run through the compliance gate and the Perps
 * geo-eligibility check (showing the geo-block modal when restricted) before
 * navigating to the Perps order entry screen with the side preselected,
 * matching the mobile Token Details actions.
 *
 * Wraps itself in {@link AccessRestrictedProvider} so it can be rendered on
 * non-Perps hosts (token detail / coin overview) that do not already provide
 * that context.
 *
 * @param props - The component props
 * @param props.marketSymbol - The Perps market name to trade
 * @param props.classPrefix - Prefix for button class names and test ids
 */
export const PerpsTradeButtons = ({
  marketSymbol,
  classPrefix = 'token',
}: PerpsTradeButtonsProps) => (
  <AccessRestrictedProvider>
    <PerpsTradeButtonsContent
      marketSymbol={marketSymbol}
      classPrefix={classPrefix}
    />
  </AccessRestrictedProvider>
);

export default PerpsTradeButtons;
