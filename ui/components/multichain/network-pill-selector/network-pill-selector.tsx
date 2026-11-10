import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import classnames from 'clsx';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Icon,
  IconColor,
  IconName,
  IconSize,
  SensitiveText,
  Text,
  TextButton,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import { getNetworkIcon } from '../../../../shared/lib/network.utils';
import { getPreferences } from '../../../../shared/lib/selectors/preferences';
import { getChainIdToNetworkImageUrlMap } from '../../../selectors/config-registry/config-registry';
import { useFormatters } from '../../../hooks/useFormatters';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getSelectableChainId,
  useHomeNetworkFilter,
} from '../../app/assets/asset-list/asset-list-control-bar/use-home-network-filter';
import { useNetworkPillBalances } from './use-network-pill-balances';

type NetworkPillProps = {
  name: string;
  balance?: string;
  isSelected: boolean;
  isDisabled?: boolean;
  isHidden?: boolean;
  privacyMode: boolean;
  icon: React.ReactNode;
  onClick: () => void;
  testId: string;
};

const NetworkPill = ({
  name,
  balance,
  isSelected,
  isDisabled = false,
  isHidden = false,
  privacyMode,
  icon,
  onClick,
  testId,
}: NetworkPillProps) => (
  <button
    type="button"
    className={classnames(
      'flex h-10 shrink-0 items-center gap-2 rounded-full border-0 px-4',
      'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-default',
      isSelected
        ? 'bg-icon-default text-background-default'
        : 'bg-muted text-default hover:bg-muted-hover',
      isDisabled ? 'cursor-default opacity-50' : 'cursor-pointer',
    )}
    aria-pressed={isSelected}
    disabled={isDisabled}
    onClick={onClick}
    data-testid={testId}
    // React 18 has no `inert` prop; the empty attribute is what enables it
    {...(isHidden ? ({ inert: '' } as object) : {})}
  >
    {icon}
    <Text
      variant={TextVariant.BodyXs}
      color={isSelected ? TextColor.Inherit : TextColor.TextAlternative}
    >
      {name}
    </Text>
    {balance !== undefined && (
      <SensitiveText
        variant={TextVariant.BodySm}
        color={TextColor.Inherit}
        isHidden={privacyMode}
      >
        {balance}
      </SensitiveText>
    )}
  </button>
);

/**
 * Network selector for the fullscreen design. Offers the same default networks
 * as the network filter dropdown, and selects them the same way, with each
 * pill showing the account's balance on that network. Collapsed it shows one
 * full row of pills; expanded it wraps.
 */
export const NetworkPillSelector = () => {
  const t = useI18nContext();
  const { formatCurrency } = useFormatters();
  const { privacyMode } = useSelector(getPreferences);
  const networkImageUrls = useSelector(getChainIdToNetworkImageUrlMap);
  const {
    defaultNetworks,
    handleSelectAllDefaultNetworks,
    handleSelectNetwork,
    hasOnlyDefaultNetworks,
    isAllDefaultSelected,
    isNetworkDisabled,
    isNetworkSelected,
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

  // Wrapped pills are always the trailing ones. While collapsed they are only
  // clipped, so make them inert to keep them out of the tab order and out of
  // what screen readers read.
  const pillCount = defaultNetworks.length + 1;
  const isPillHidden = (index: number) =>
    !isExpanded && index >= pillCount - hiddenCount;

  const format = useMemo(
    () => (amount?: number) =>
      amount === undefined ? undefined : formatCurrency(amount, currency),
    [formatCurrency, currency],
  );

  return (
    <div
      className="flex flex-col gap-2 px-4 py-2"
      data-testid="network-pill-selector"
    >
      <div
        ref={pillsRef}
        className={classnames(
          'flex flex-wrap gap-2',
          !isExpanded && 'max-h-10 overflow-hidden',
        )}
      >
        <NetworkPill
          name={
            hasOnlyDefaultNetworks ? t('allNetworks') : t('allDefaultNetworks')
          }
          balance={format(total)}
          isSelected={isAllDefaultSelected}
          privacyMode={privacyMode}
          icon={
            <Icon
              name={IconName.Global}
              size={IconSize.Md}
              color={
                isAllDefaultSelected
                  ? IconColor.IconInverse
                  : IconColor.IconAlternative
              }
            />
          }
          isHidden={isPillHidden(0)}
          onClick={handleSelectAllDefaultNetworks}
          testId="network-pill-all-default"
        />
        {defaultNetworks.map((network, index) => {
          const disabled = isNetworkDisabled(network);
          return (
            <NetworkPill
              key={network.chainId}
              name={network.name}
              balance={format(balanceByChainId[network.chainId])}
              isSelected={isNetworkSelected(network)}
              isDisabled={disabled}
              isHidden={isPillHidden(index + 1)}
              privacyMode={privacyMode}
              icon={
                <AvatarNetwork
                  name={network.name}
                  src={getNetworkIcon(network, networkImageUrls)}
                  size={AvatarNetworkSize.Sm}
                  className="rounded-full"
                />
              }
              onClick={() => handleSelectNetwork(network.chainId)}
              testId={`network-pill-${getSelectableChainId(network)}`}
            />
          );
        })}
      </div>
      {hiddenCount > 0 && (
        <div className="flex justify-center">
          <TextButton
            className="w-auto"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((expanded) => !expanded)}
            data-testid="network-pill-toggle"
          >
            {isExpanded
              ? t('showFewerNetworks')
              : t('showMoreNetworks', [hiddenCount])}
          </TextButton>
        </div>
      )}
    </div>
  );
};
