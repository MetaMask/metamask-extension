import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
  AvatarTokenSize,
} from '@metamask/design-system-react';
import type { PerpsMarketData } from '@metamask/perps-controller';
import { PERPS_MARKET_EXPANDED_ROUTE } from '../../../../helpers/constants/routes';
import { getChangeColor, filterMarketsByQuery } from '../utils';
import { PerpsTokenLogo } from '../perps-token-logo';

export type PerpsMarketSelectorProps = {
  /** All available markets */
  markets: PerpsMarketData[];
  /** Currently selected symbol */
  currentSymbol: string;
  /** Current market price (formatted string from market data) */
  currentPrice?: string;
};

/**
 * PerpsMarketSelector — compact trigger + searchable dropdown for switching
 * between perps markets in the expanded trading view.
 */
export const PerpsMarketSelector: React.FC<PerpsMarketSelectorProps> = ({
  markets,
  currentSymbol,
  currentPrice,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredMarkets = useMemo(
    () => (query ? filterMarketsByQuery(markets, query) : markets),
    [markets, query],
  );

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        // Focus search input when opening
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      return !prev;
    });
    setQuery('');
  }, []);

  const handleSelect = useCallback(
    (symbol: string) => {
      setIsOpen(false);
      setQuery('');
      if (symbol !== currentSymbol) {
        navigate(`${PERPS_MARKET_EXPANDED_ROUTE}/${encodeURIComponent(symbol)}`);
      }
    },
    [currentSymbol, navigate],
  );

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    // Close only if focus leaves the entire container
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsOpen(false);
      setQuery('');
    }
  }, []);

  return (
    <div
      ref={containerRef}
      onBlur={handleBlur}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '6px 10px',
          cursor: 'pointer',
          color: 'inherit',
        }}
      >
        <PerpsTokenLogo symbol={currentSymbol} size={AvatarTokenSize.Sm} />
        <Text
          variant={TextVariant.bodyMdMedium}
          color={TextColor.textDefault}
          fontWeight={FontWeight.Medium}
          style={{ whiteSpace: 'nowrap' }}
        >
          {currentSymbol}-PERP
        </Text>
        {currentPrice && (
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
            style={{ whiteSpace: 'nowrap' }}
          >
            {currentPrice}
          </Text>
        )}
        <Icon
          name={isOpen ? IconName.ArrowUp : IconName.ArrowDown}
          size={IconSize.Xs}
          color={IconColor.iconAlternative}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 100,
            background: 'var(--color-background-default)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            width: '280px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          {/* Search */}
          <div style={{ padding: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '6px',
                padding: '6px 10px',
              }}
            >
              <Icon
                name={IconName.Search}
                size={IconSize.Sm}
                color={IconColor.iconAlternative}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search markets…"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'inherit',
                  fontSize: '13px',
                  flex: 1,
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Market list */}
          <div
            style={{
              maxHeight: '320px',
              overflowY: 'auto',
              paddingBottom: '4px',
            }}
          >
            {filteredMarkets.length === 0 ? (
              <Box
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.Center}
                justifyContent={BoxJustifyContent.Center}
                style={{ padding: '16px' }}
              >
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textAlternative}
                >
                  No markets found
                </Text>
              </Box>
            ) : (
              filteredMarkets.map((market) => {
                const isSelected =
                  market.symbol.toLowerCase() === currentSymbol.toLowerCase();
                const changeColor = getChangeColor(market.change24hPercent);

                return (
                  <button
                    key={market.symbol}
                    type="button"
                    onClick={() => handleSelect(market.symbol)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      padding: '8px 12px',
                      background: isSelected
                        ? 'rgba(255,255,255,0.06)'
                        : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'inherit',
                      textAlign: 'left',
                      gap: '8px',
                    }}
                  >
                    <PerpsTokenLogo symbol={market.symbol} size={AvatarTokenSize.Sm} />
                    <Box
                      flexDirection={BoxFlexDirection.Column}
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      <Text
                        variant={TextVariant.bodySmMedium}
                        color={TextColor.textDefault}
                        fontWeight={FontWeight.Medium}
                      >
                        {market.symbol}
                      </Text>
                      <Text
                        variant={TextVariant.bodyXs}
                        color={TextColor.textAlternative}
                      >
                        {market.name}
                      </Text>
                    </Box>
                    <Box flexDirection={BoxFlexDirection.Column} alignItems={BoxAlignItems.FlexEnd}>
                      <Text
                        variant={TextVariant.bodySmMedium}
                        color={TextColor.textDefault}
                        fontWeight={FontWeight.Medium}
                      >
                        {market.price}
                      </Text>
                      <Text
                        variant={TextVariant.bodyXs}
                        style={{ color: changeColor }}
                      >
                        {market.change24hPercent}
                      </Text>
                    </Box>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
