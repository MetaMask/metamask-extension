import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Position } from '@metamask/perps-controller';
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
import { usePerpsPositionForAsset } from '../../../../hooks/perps/usePerpsPositionForAsset';
import {
  AccessRestrictedProvider,
  useSelectedAccountComplianceGate,
} from '../../compliance';
import { PERPS_ORDER_ENTRY_ROUTE } from '../../../../helpers/constants/routes';
import { PERPS_EVENT_VALUE } from '../../../../../shared/constants/perps-events';
import { captureException } from '../../../../../shared/lib/sentry';
import { getPositionDirection } from '../utils';
import { PerpsGeoBlockModal } from '../perps-geo-block-modal';
import {
  PERPS_TOAST_KEYS,
  PerpsToastProvider,
  usePerpsToast,
} from '../perps-toast';

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

/**
 * Resolves the order entry mode for a Long / Short tap.
 *
 * Tapping the side the account is already positioned on continues that
 * position, so it opens order entry in `modify` mode — the same entry point as
 * Add exposure on the Perps market detail page, which pre-fills the position's
 * leverage and TP/SL rather than reading as a brand new trade. Cross-margin
 * positions cannot be increased from order entry, and the opposite side is a
 * genuinely new (reducing or flipping) order, so both stay on `new`.
 *
 * @param direction - The side the user tapped
 * @param position - The account's open position on this market, when one exists
 * @returns The `mode` query param for the order entry route
 */
const resolveOrderMode = (
  direction: 'long' | 'short',
  position: Position | undefined,
): 'new' | 'modify' => {
  if (!position || position.leverage?.type === 'cross') {
    return 'new';
  }
  return getPositionDirection(position.size) === direction ? 'modify' : 'new';
};

const PerpsTradeButtonsContent = ({
  marketSymbol,
  classPrefix = 'token',
}: PerpsTradeButtonsProps) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { isEligible } = usePerpsEligibility();
  const { gate } = useSelectedAccountComplianceGate();
  const { position } = usePerpsPositionForAsset(marketSymbol);
  const { replacePerpsToastByKey } = usePerpsToast();
  const [isGeoBlockModalOpen, setIsGeoBlockModalOpen] = useState(false);
  const isGatePendingRef = useRef(false);

  const handleTradeClick = useCallback(
    (direction: 'long' | 'short') => {
      if (isGatePendingRef.current) {
        return;
      }
      isGatePendingRef.current = true;

      // Match mobile Token Details: no PerpsUiInteraction on Long/Short tap;
      // navigate when eligible, otherwise show the geo-block notice (which
      // emits PERPS_SCREEN_VIEWED with SOURCE=asset_detail_screen).
      gate(() => {
        if (!isEligible) {
          setIsGeoBlockModalOpen(true);
          return;
        }
        const params = new URLSearchParams({
          direction,
          mode: resolveOrderMode(direction, position),
        });
        navigate(
          `${PERPS_ORDER_ENTRY_ROUTE}/${encodeURIComponent(marketSymbol)}?${params.toString()}`,
        );
      })
        .catch((error: unknown) => {
          captureException(error);
          replacePerpsToastByKey({ key: PERPS_TOAST_KEYS.TRADE_ENTRY_FAILED });
        })
        .finally(() => {
          isGatePendingRef.current = false;
        });
    },
    [
      gate,
      isEligible,
      marketSymbol,
      navigate,
      position,
      replacePerpsToastByKey,
    ],
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
 * The compliance gate is asynchronous, so a tap while one is still pending is
 * ignored rather than stacking a second check, and the gate is released in
 * `finally` (as mobile does) so a rejection cannot wedge the row. A rejection
 * also reports to Sentry and raises an error toast: the user tapped and got no
 * order form, so it must not be console-only.
 *
 * Navigation accounts for any position the account already holds on the market
 * (see {@link resolveOrderMode}), so continuing an existing position opens
 * order entry in `modify` mode instead of a new-order form.
 *
 * Wraps itself in {@link AccessRestrictedProvider} and {@link PerpsToastProvider}
 * so it can be rendered on non-Perps hosts (token detail / coin overview) that
 * do not already provide those contexts — without the toast provider a failed
 * compliance gate would have nowhere to report itself.
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
    <PerpsToastProvider>
      <PerpsTradeButtonsContent
        marketSymbol={marketSymbol}
        classPrefix={classPrefix}
      />
    </PerpsToastProvider>
  </AccessRestrictedProvider>
);

export default PerpsTradeButtons;
