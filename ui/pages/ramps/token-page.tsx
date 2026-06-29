import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Text,
  TextFieldSearch,
  TextFieldSearchSize,
} from '../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import { Content, Header, Page } from '../../components/multichain/pages/page';
import {
  DEFAULT_ROUTE,
  RAMPS_BUILD_QUOTE_ROUTE,
} from '../../helpers/constants/routes';
import useRampsController from '../../hooks/ramps/useRampsController';
import type { RampsToken } from '../../hooks/ramps/types';

/**
 * Token selection page — the first step of the money-movement (buy) flow.
 *
 * The user picks a token here, then continues to the build-quote page. Tapping
 * the selected token on the build-quote page returns here to change it. Mirrors
 * the mobile ramps `TokenSelection` view. Wired to the stubbed
 * `useRampsController` hook; the data layer swaps in unchanged.
 */
function TokenPage() {
  const navigate = useNavigate();
  const { tokens, selectedToken, setSelectedToken } = useRampsController();
  const [search, setSearch] = useState('');

  const query = search.trim().toLowerCase();

  // Top tokens by default; the full list once the user starts searching.
  const visibleTokens = useMemo(() => {
    const source = query
      ? (tokens?.allTokens ?? [])
      : (tokens?.topTokens ?? []);
    if (!query) {
      return source;
    }
    return source.filter(
      (token) =>
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query) ||
        token.assetId.toLowerCase().includes(query),
    );
  }, [query, tokens]);

  const handleSelect = async (token: RampsToken) => {
    await setSelectedToken(token.assetId);
    navigate(RAMPS_BUILD_QUOTE_ROUTE);
  };

  return (
    <Page>
      <Header
        startAccessory={
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Md}
            ariaLabel="Back"
            onClick={() => navigate(DEFAULT_ROUTE)}
          />
        }
      >
        Select a token
      </Header>
      <Content>
        <Box paddingBottom={4}>
          <TextFieldSearch
            size={TextFieldSearchSize.Lg}
            width={BlockSize.Full}
            placeholder="Search by name or symbol"
            value={search}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(event.target.value)
            }
            clearButtonOnClick={() => setSearch('')}
            data-testid="ramps-token-search"
          />
        </Box>

        {visibleTokens.length === 0 ? (
          <Text color={TextColor.textAlternative}>
            No tokens match “{search}”.
          </Text>
        ) : (
          <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
            {visibleTokens.map((token) => {
              const isSelected = token.assetId === selectedToken?.assetId;
              return (
                <Box
                  key={token.assetId}
                  as="button"
                  onClick={() => handleSelect(token)}
                  display={Display.Flex}
                  alignItems={AlignItems.center}
                  justifyContent={JustifyContent.spaceBetween}
                  gap={3}
                  padding={3}
                  borderRadius={BorderRadius.LG}
                  backgroundColor={BackgroundColor.transparent}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  data-testid={`ramps-token-${token.symbol}`}
                >
                  <Box
                    display={Display.Flex}
                    alignItems={AlignItems.center}
                    gap={3}
                  >
                    <AvatarToken
                      name={token.symbol}
                      src={token.iconUrl || undefined}
                      size={AvatarTokenSize.Md}
                    />
                    <Box
                      display={Display.Flex}
                      flexDirection={FlexDirection.Column}
                    >
                      <Text variant={TextVariant.bodyMdMedium}>
                        {token.name}
                      </Text>
                      <Text
                        variant={TextVariant.bodySm}
                        color={TextColor.textAlternative}
                      >
                        {token.symbol}
                      </Text>
                    </Box>
                  </Box>
                  {isSelected ? (
                    <Icon
                      name={IconName.Check}
                      size={IconSize.Md}
                      color={IconColor.primaryDefault}
                    />
                  ) : null}
                </Box>
              );
            })}
          </Box>
        )}
      </Content>
    </Page>
  );
}

export default TokenPage;
