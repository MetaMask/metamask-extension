import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
  Box,
  Button,
  ButtonVariant,
  Text,
} from '../../../components/component-library';

import { Page } from '../../../components/multichain/pages/page';
import {
  Display,
  FlexDirection,
  BorderRadius,
  BackgroundColor,
  JustifyContent,
  TextVariant,
  TextColor,
  TextAlign,
  AlignItems,
} from '../../../helpers/constants/design-system';

import { getSelectedInternalAccount } from '../../../selectors';
import { usePolymarket } from '../usePolymarket';
import { Side } from '../types';

const CLOB_ENDPOINT = 'https://clob.polymarket.com';
const DATA_API_ENDPOINT = 'https://data-api.polymarket.com';

const PredictContainer = () => {
  const [marketData, setMarketData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const { placeOrder } = usePolymarket();

  const getTrades = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${DATA_API_ENDPOINT}/positions?limit=5&user=${selectedAccount.address}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      const tradesData = await response.json();
      setMarketData(tradesData);
    } catch (error) {
      console.error('Error fetching trades:', error);
      setMarketData([]);
    } finally {
      setLoading(false);
    }
  };

  // Call getTrades on mount
  useEffect(() => {
    getTrades();
  }, []);

  const handleSell = async (trade: any) => {
    console.log(trade);
    const tickSize = await fetch(
      `${CLOB_ENDPOINT}/tick-size?token_id=${trade.asset}`,
    );
    const tickSizeData = await tickSize.json();
    console.log(tickSizeData);
    if (!tickSizeData) {
      console.error('No tick size found');
      return;
    }
    placeOrder({
      tokenId: trade.asset,
      price: trade.curPrice,
      size: trade.size,
      tickSize: tickSizeData.minimum_tick_size,
      side: Side.SELL,
    });
  };

  return (
    <Page className="main-container" data-testid="remote-mode">
      <Box backgroundColor={BackgroundColor.backgroundAlternative} padding={4}>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          textAlign={TextAlign.Center}
          marginBottom={4}
        >
          <Text variant={TextVariant.headingMd}>Positions</Text>
          <Text variant={TextVariant.bodySm}>
            Your current and historic predictions.
          </Text>
        </Box>
        {loading ? (
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
            padding={8}
          >
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
            >
              Loading positions...
            </Text>
          </Box>
        ) : marketData && marketData.length > 0 ? (
          marketData.map((position: any) => {
            return (
              <Box
                key={position.transactionHash}
                backgroundColor={BackgroundColor.backgroundDefault}
                borderRadius={BorderRadius.LG}
                padding={4}
                marginBottom={4}
              >
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Row}
                  alignItems={AlignItems.center}
                  gap={3}
                >
                  <img
                    src={position.icon}
                    alt={position.title}
                    style={{ width: 48, height: 48, borderRadius: 8 }}
                  />
                  <Box>
                    <Text variant={TextVariant.headingSm}>
                      {position.title}
                    </Text>
                    <Text
                      variant={TextVariant.bodySm}
                      color={TextColor.textAlternative}
                    >
                      {position.outcome} {Math.round(position.avgPrice * 100)}¢
                    </Text>
                    <Text
                      variant={TextVariant.bodySm}
                      color={TextColor.textAlternative}
                    >
                      {position.size} shares
                    </Text>
                  </Box>
                  <Box marginLeft="auto" textAlign={TextAlign.Right}>
                    <Text variant={TextVariant.headingMd}>
                      ${position.currentValue.toFixed(2)}
                    </Text>
                    <Text
                      color={
                        position.cashPnl < 0
                          ? TextColor.errorDefault
                          : TextColor.successDefault
                      }
                    >
                      {position.cashPnl < 0 ? '' : '+'}$
                      {position.cashPnl.toFixed(2)} (
                      {position.cashPnl < 0 ? '' : '+'}
                      {position.percentRealizedPnl.toFixed(2)}%)
                    </Text>
                  </Box>
                </Box>
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Row}
                  alignItems={AlignItems.center}
                  gap={3}
                  marginTop={2}
                >
                  <Box>
                    <Text
                      variant={TextVariant.bodySm}
                      color={TextColor.textAlternative}
                    >
                      Avg
                    </Text>
                    <Text variant={TextVariant.headingSm}>
                      {Math.round(position.avgPrice * 100)}¢
                    </Text>
                  </Box>
                  <Box>
                    <Text
                      variant={TextVariant.bodySm}
                      color={TextColor.textAlternative}
                    >
                      Now
                    </Text>
                    <Text variant={TextVariant.headingSm}>
                      {position.curPrice != null
                        ? Math.round(position.curPrice * 100) + '¢'
                        : '...'}
                    </Text>
                  </Box>
                  <Button
                    variant={ButtonVariant.Primary}
                    style={{ marginLeft: 'auto' }}
                    onClick={() => handleSell(position)}
                  >
                    Sell
                  </Button>
                </Box>
              </Box>
            );
          })
        ) : (
          <Text>No positions found.</Text>
        )}
      </Box>
    </Page>
  );
};

export default PredictContainer;
