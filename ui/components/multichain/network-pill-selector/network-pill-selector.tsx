import React, {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from 'react';
import classnames from 'clsx';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  SensitiveText,
  Skeleton,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import { getNetworkIcon } from '../../../../shared/lib/network.utils';
import { getPreferences } from '../../../../shared/lib/selectors/preferences';
import { useFormatters } from '../../../hooks/useFormatters';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getSelectableChainId,
  useHomeNetworkFilter,
} from '../../app/assets/asset-list/asset-list-control-bar/use-home-network-filter';
import { getHiddenPillCount } from './get-hidden-pill-count';
import { useNetworkPillBalances } from './use-network-pill-balances';

const PILL_CLASS_NAME =
  'flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border-0 px-4 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-default';

const PILL_UNSELECTED_CLASS_NAME = 'bg-muted text-default hover:bg-muted-hover';

type NetworkPillProps = {
  name: string;
  balance?: string;
  isSelected: boolean;
  isHidden?: boolean;
  privacyMode: boolean;
  icon: React.ReactNode;
  onClick: () => void;
  testId: string;
};

type ShowNetworksToggleProps = {
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
  buttonRef: Ref<HTMLButtonElement>;
};

const NetworkPill = ({
  name,
  balance,
  isSelected,
  isHidden = false,
  privacyMode,
  icon,
  onClick,
  testId,
}: NetworkPillProps) => (
  <button
    type="button"
    className={classnames(
      PILL_CLASS_NAME,
      isSelected
        ? 'bg-icon-default text-background-default'
        : PILL_UNSELECTED_CLASS_NAME,
      isHidden && 'order-1',
    )}
    aria-pressed={isSelected}
    onClick={onClick}
    data-network-pill=""
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

const ShowNetworksToggle = ({
  label,
  isExpanded,
  onToggle,
  buttonRef,
}: ShowNetworksToggleProps) => (
  <button
    ref={buttonRef}
    type="button"
    className={classnames(PILL_CLASS_NAME, PILL_UNSELECTED_CLASS_NAME)}
    aria-expanded={isExpanded}
    onClick={onToggle}
    data-testid="network-pill-toggle"
  >
    <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
      {label}
    </Text>
    <Icon
      name={isExpanded ? IconName.ArrowUp : IconName.ArrowDown}
      size={IconSize.Md}
      color={IconColor.IconDefault}
    />
  </button>
);

/**
 * Network selector for the fullscreen design. Offers the same default networks
 * as the network filter dropdown, and selects them the same way, with each
 * pill showing the account's balance on that network. Networks the selected
 * account can't use are excluded. Collapsed, it shows one row of pills with a
 * "Show all" toggle. Expanded, it shows all pills with a "Show fewer" toggle.
 */
export const NetworkPillSelector = () => {
  const t = useI18nContext();
  const { formatCurrency } = useFormatters();
  const { privacyMode } = useSelector(getPreferences);
  const {
    defaultNetworks,
    handleSelectAllDefaultNetworks,
    handleSelectNetwork,
    hasOnlyDefaultNetworks,
    isAllDefaultSelected,
    isNetworkDisabled,
    isNetworkSelected,
  } = useHomeNetworkFilter();
  const networks = useMemo(
    () => defaultNetworks.filter((network) => !isNetworkDisabled(network)),
    [defaultNetworks, isNetworkDisabled],
  );
  const { balanceByChainId, total, currency, isLoading } =
    useNetworkPillBalances(networks);

  const [isExpanded, setIsExpanded] = useState(false);
  const [hiddenCount, setHiddenCount] = useState(0);
  const pillsRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // How many trailing pills to drop so the rest plus the toggle, fit on one row
  useLayoutEffect(() => {
    const pills = pillsRef.current;
    if (!pills || isExpanded) {
      return undefined;
    }
    const measure = () => {
      const gap = Number.parseFloat(getComputedStyle(pills).columnGap);
      const next = getHiddenPillCount(
        Array.from(
          pills.querySelectorAll<HTMLElement>('[data-network-pill]'),
          (pill) => pill.offsetWidth,
        ),
        pills.clientWidth,
        Number.isFinite(gap) ? gap : 0,
        toggleRef.current?.offsetWidth ?? 0,
      );
      setHiddenCount((current) => (current === next ? current : next));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(pills);

    // Watch each pill: a balance update can widen one without resizing the
    // row, and a stale count would inert a visible pill or leave a clipped one
    // in the tab order.
    pills
      .querySelectorAll<HTMLElement>('[data-network-pill]')
      .forEach((pill) => observer.observe(pill));
    if (toggleRef.current) {
      observer.observe(toggleRef.current);
    }
    return () => observer.disconnect();
  }, [isExpanded, isLoading, networks, hiddenCount]);

  // Wrapped pills are always the trailing ones. While collapsed they are only
  // clipped, so make them inert to keep them out of the tab order and out of
  // what screen readers read.
  const pillCount = networks.length + 1;
  const isPillHidden = (index: number) =>
    !isExpanded && index >= pillCount - hiddenCount;

  const format = useMemo(
    () => (amount?: number) =>
      amount === undefined ? undefined : formatCurrency(amount, currency),
    [formatCurrency, currency],
  );

  if (isLoading) {
    return (
      <div
        className="flex gap-2 px-4 py-2"
        data-testid="network-pill-selector-skeleton"
      >
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-10 w-28 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-2" data-testid="network-pill-selector">
      <div
        ref={pillsRef}
        className={classnames(
          'flex min-w-0 flex-wrap gap-2',
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
        {networks.map((network, index) => (
          <NetworkPill
            key={network.chainId}
            name={network.name}
            balance={format(balanceByChainId[network.chainId])}
            isSelected={isNetworkSelected(network)}
            isHidden={isPillHidden(index + 1)}
            privacyMode={privacyMode}
            icon={
              <AvatarNetwork
                name={network.name}
                src={getNetworkIcon(network)}
                size={AvatarNetworkSize.Sm}
                className="rounded-full"
              />
            }
            onClick={() => handleSelectNetwork(network.chainId, 'Network Pill')}
            testId={`network-pill-${getSelectableChainId(network)}`}
          />
        ))}
        {hiddenCount > 0 && (
          <ShowNetworksToggle
            label={
              isExpanded ? t('showFewer') : t('showAllNetworks', [pillCount])
            }
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded((expanded) => !expanded)}
            buttonRef={toggleRef}
          />
        )}
      </div>
    </div>
  );
};
