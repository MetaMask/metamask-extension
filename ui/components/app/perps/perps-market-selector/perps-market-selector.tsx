import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AvatarTokenSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonBase,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';
import type { PerpsMarketData } from '@metamask/perps-controller';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  filterMarketsByQuery,
  formatSignedChangePercent,
  getChangeColor,
  getDisplayName,
} from '../utils';
import { PerpsTokenLogo } from '../perps-token-logo';

export type PerpsMarketSelectorProps = {
  /** All available markets */
  markets: PerpsMarketData[];
  /** Currently selected symbol */
  currentSymbol: string;
  /** Callback fired when a different market is selected */
  onMarketSelect: (symbol: string) => void;
};

/**
 * Compact searchable market picker for the expanded trading view.
 *
 * @param options0 - Component props.
 * @param options0.markets - Markets available in the selector.
 * @param options0.currentSymbol - Currently selected market symbol.
 * @param options0.onMarketSelect - Called when the user selects a market.
 */
export const PerpsMarketSelector: React.FC<PerpsMarketSelectorProps> = ({
  markets,
  currentSymbol,
  onMarketSelect,
}) => {
  const t = useI18nContext();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const currentMarket = useMemo(
    () =>
      markets.find(
        (market) => market.symbol.toLowerCase() === currentSymbol.toLowerCase(),
      ),
    [currentSymbol, markets],
  );

  const filteredMarkets = useMemo(
    () => (query ? filterMarketsByQuery(markets, query) : markets),
    [markets, query],
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleMouseDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen((previous) => !previous);
    setQuery('');
  }, []);

  const handleTriggerKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (
        event.key === 'Enter' ||
        event.key === ' ' ||
        event.key === 'ArrowDown'
      ) {
        event.preventDefault();
        setIsOpen(true);
      }
    },
    [],
  );

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        setQuery('');
        triggerRef.current?.focus();
      }
    },
    [],
  );

  const handleSelect = useCallback(
    (nextSymbol: string) => {
      setIsOpen(false);
      setQuery('');
      if (nextSymbol !== currentSymbol) {
        onMarketSelect(nextSymbol);
      }
      triggerRef.current?.focus();
    },
    [currentSymbol, onMarketSelect],
  );

  const displaySymbol = getDisplayName(currentSymbol);

  return (
    <Box ref={containerRef} className="relative min-w-0">
      <ButtonBase
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="!grid h-10 min-w-[192px] max-w-[220px] grid-cols-[24px_minmax(0,1fr)_16px] items-center gap-2 rounded-md border border-border-muted bg-background-muted px-2.5 py-1.5 hover:bg-hover active:bg-pressed"
        data-testid="perps-market-selector-button"
      >
        <PerpsTokenLogo
          symbol={currentSymbol}
          size={AvatarTokenSize.Sm}
          className="shrink-0"
        />
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
          className="min-w-0"
        >
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            className="truncate"
          >
            {displaySymbol}-USD
          </Text>
          {currentMarket?.maxLeverage ? (
            <Text
              variant={TextVariant.BodyXs}
              color={TextColor.TextAlternative}
              className="shrink-0 rounded bg-background-default px-1.5 leading-5"
            >
              {currentMarket.maxLeverage}
            </Text>
          ) : null}
        </Box>
        <Icon
          name={isOpen ? IconName.ArrowUp : IconName.ArrowDown}
          size={IconSize.Xs}
          color={IconColor.IconAlternative}
          className="shrink-0"
        />
      </ButtonBase>

      {isOpen ? (
        <Box
          className="absolute left-0 top-full z-50 mt-1 w-[400px] max-w-[calc(100vw-24px)] overflow-hidden rounded-lg border border-border-muted bg-background-default shadow-lg"
          flexDirection={BoxFlexDirection.Column}
          role="listbox"
          data-testid="perps-market-selector-menu"
        >
          <Box className="border-b border-border-muted px-2.5 py-2.5">
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={2}
              className="min-h-9 rounded-md bg-background-muted px-2.5 py-1.5"
            >
              <Icon
                name={IconName.Search}
                size={IconSize.Sm}
                color={IconColor.IconAlternative}
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={t('perpsSearchMarkets')}
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-default outline-none placeholder:text-alternative"
                data-testid="perps-market-selector-search"
              />
            </Box>
          </Box>

          <Box
            flexDirection={BoxFlexDirection.Column}
            className="max-h-[380px] overflow-y-auto py-1"
          >
            {filteredMarkets.length === 0 ? (
              <Box
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.Center}
                justifyContent={BoxJustifyContent.Center}
                padding={4}
              >
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {t('perpsNoMarketsFound')}
                </Text>
              </Box>
            ) : (
              filteredMarkets.map((market) => {
                const isSelected =
                  market.symbol.toLowerCase() === currentSymbol.toLowerCase();
                const displayChange = formatSignedChangePercent(
                  market.change24hPercent,
                );
                const changeColor = getChangeColor(displayChange);

                return (
                  <ButtonBase
                    key={market.symbol}
                    type="button"
                    onClick={() => handleSelect(market.symbol)}
                    role="option"
                    aria-selected={isSelected}
                    className={twMerge(
                      '!grid min-h-[52px] w-full min-w-0 grid-cols-[24px_minmax(0,1fr)_minmax(92px,auto)_16px] items-center gap-2.5 rounded-none px-2.5 py-1.5 text-left',
                      isSelected
                        ? 'bg-hover'
                        : 'bg-transparent hover:bg-hover active:bg-pressed',
                    )}
                    data-testid={`perps-market-selector-option-${market.symbol}`}
                    isFullWidth
                  >
                    <PerpsTokenLogo
                      symbol={market.symbol}
                      size={AvatarTokenSize.Sm}
                      className="shrink-0"
                    />
                    <Box
                      flexDirection={BoxFlexDirection.Column}
                      alignItems={BoxAlignItems.Start}
                      className="min-w-0 flex-1"
                      gap={1}
                    >
                      <Box
                        flexDirection={BoxFlexDirection.Row}
                        alignItems={BoxAlignItems.Center}
                        gap={1}
                        className="min-w-0 max-w-full"
                      >
                        <Text
                          variant={TextVariant.BodySm}
                          fontWeight={FontWeight.Medium}
                          className="min-w-0 truncate"
                        >
                          {getDisplayName(market.symbol)}
                        </Text>
                        {market.maxLeverage ? (
                          <Text
                            variant={TextVariant.BodyXs}
                            color={TextColor.TextAlternative}
                            className="shrink-0 rounded bg-background-muted px-1.5 leading-5"
                          >
                            {market.maxLeverage}
                          </Text>
                        ) : null}
                      </Box>
                      <Text
                        variant={TextVariant.BodyXs}
                        color={TextColor.TextAlternative}
                        className="max-w-full truncate"
                      >
                        {market.name
                          ? getDisplayName(market.name)
                          : market.volume}
                      </Text>
                    </Box>
                    <Box
                      flexDirection={BoxFlexDirection.Column}
                      alignItems={BoxAlignItems.End}
                      className="min-w-0"
                      gap={1}
                    >
                      <Text
                        variant={TextVariant.BodySm}
                        fontWeight={FontWeight.Medium}
                        className="max-w-[112px] truncate text-right tabular-nums"
                      >
                        {market.price}
                      </Text>
                      <Text
                        variant={TextVariant.BodyXs}
                        color={changeColor}
                        className="whitespace-nowrap text-right tabular-nums"
                      >
                        {displayChange}
                      </Text>
                    </Box>
                    {isSelected ? (
                      <Icon
                        name={IconName.Check}
                        size={IconSize.Sm}
                        color={IconColor.IconDefault}
                        className="shrink-0"
                      />
                    ) : (
                      <Box className="h-4 w-4 shrink-0" />
                    )}
                  </ButtonBase>
                );
              })
            )}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};
