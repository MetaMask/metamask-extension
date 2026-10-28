import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import classnames from 'clsx';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  ButtonBaseSize,
  ButtonFilter,
  Icon,
  IconName,
  IconSize,
  SensitiveText,
  Text,
  TextButton,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import { getNetworkIcon } from '../../../../../shared/lib/network.utils';
import { getPreferences } from '../../../../../shared/lib/selectors/preferences';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getSelectableChainId,
  useHomeNetworkFilter,
} from '../asset-list/asset-list-control-bar/use-home-network-filter';
import { useNetworkPillBalances } from './use-network-pill-balances';

type NetworkPillProps = {
  name: string;
  balance: string;
  isSelected: boolean;
  isDisabled: boolean;
  privacyMode: boolean;
  icon: React.ReactNode;
  onClick: () => void;
  title?: string;
  testId: string;
};

const NetworkPill = ({
  name,
  balance,
  isSelected,
  isDisabled,
  privacyMode,
  icon,
  onClick,
  title,
  testId,
}: NetworkPillProps) => (
  <ButtonFilter
    size={ButtonBaseSize.Lg}
    // ButtonBase is full width by default.
    className={classnames(
      'w-auto shrink-0',
      !isSelected && !isDisabled && 'hover:bg-muted-hover',
    )}
    isActive={isSelected}
    isDisabled={isDisabled}
    aria-pressed={isSelected}
    startAccessory={icon}
    onClick={onClick}
    title={title}
    data-testid={testId}
  >
    <span className="inline-flex items-center gap-2">
      <Text
        variant={TextVariant.BodyMd}
        color={isSelected ? TextColor.Inherit : TextColor.TextAlternative}
      >
        {name}
      </Text>
      <SensitiveText
        variant={TextVariant.BodyMd}
        color={TextColor.Inherit}
        isHidden={privacyMode}
      >
        {balance}
      </SensitiveText>
    </span>
  </ButtonFilter>
);

/**
 * Network selector for the fullscreen design. Offers the same default networks
 * as the network filter dropdown, and selects them the same way, with each
 * pill showing the account's balance on that network. Collapsed it is one
 * line; expanded it wraps.
 */
export const NetworkPillSelector = () => {
  const t = useI18nContext();
  const { formatCurrency } = useFormatters();
  const { privacyMode } = useSelector(getPreferences);
  const {
    defaultNetworks,
    getDisabledTooltip,
    handleSelectAllDefaultNetworks,
    handleSelectNetwork,
    hasOnlyDefaultNetworks,
    isAllDefaultSelected,
    isNetworkDisabled,
    isNetworkSelected,
    isPending,
  } = useHomeNetworkFilter();
  const { balanceByChainId, total, currency } =
    useNetworkPillBalances(defaultNetworks);

  const [isExpanded, setIsExpanded] = useState(false);
  const [hiddenCount, setHiddenCount] = useState(0);
  const pillsRef = useRef<HTMLDivElement>(null);

  // Pills that wrap below the first row are the ones hidden when collapsed.
  useLayoutEffect(() => {
    const pills = pillsRef.current;
    if (!pills) {
      return undefined;
    }
    const measure = () => {
      const [first, ...rest] = Array.from(pills.children) as HTMLElement[];
      setHiddenCount(
        first
          ? rest.filter((pill) => pill.offsetTop > first.offsetTop).length
          : 0,
      );
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(pills);
    return () => observer.disconnect();
  }, [defaultNetworks.length]);

  const format = useMemo(
    () => (amount: number) => formatCurrency(amount, currency),
    [formatCurrency, currency],
  );

  return (
    <div
      className="flex items-start gap-4 px-4 py-2"
      data-testid="network-pill-selector"
    >
      <div
        ref={pillsRef}
        className={classnames(
          'flex min-w-0 flex-1 flex-wrap gap-2',
          !isExpanded && 'max-h-12 overflow-hidden',
        )}
      >
        <NetworkPill
          name={
            hasOnlyDefaultNetworks ? t('allNetworks') : t('allDefaultNetworks')
          }
          balance={format(total)}
          isSelected={isAllDefaultSelected}
          isDisabled={isPending}
          privacyMode={privacyMode}
          icon={<Icon name={IconName.Global} size={IconSize.Md} />}
          onClick={handleSelectAllDefaultNetworks}
          testId="network-pill-all-default"
        />
        {defaultNetworks.map((network) => {
          const disabled = isNetworkDisabled(network);
          return (
            <NetworkPill
              key={network.chainId}
              name={network.name}
              balance={format(balanceByChainId[network.chainId] ?? 0)}
              isSelected={isNetworkSelected(network)}
              isDisabled={isPending || disabled}
              privacyMode={privacyMode}
              icon={
                <AvatarNetwork
                  name={network.name}
                  src={getNetworkIcon(network)}
                  size={AvatarNetworkSize.Sm}
                />
              }
              onClick={() => handleSelectNetwork(network.chainId)}
              title={getDisabledTooltip(disabled)}
              testId={`network-pill-${getSelectableChainId(network)}`}
            />
          );
        })}
      </div>
      {hiddenCount > 0 && (
        <TextButton
          // Align with the first row of pills; ButtonBase is full width by default.
          className="h-12 w-auto shrink-0"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((expanded) => !expanded)}
          data-testid="network-pill-toggle"
        >
          {isExpanded
            ? t('showFewerNetworks')
            : t('showMoreNetworks', [hiddenCount])}
        </TextButton>
      )}
    </div>
  );
};
