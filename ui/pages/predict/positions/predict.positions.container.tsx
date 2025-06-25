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
  FontWeight,
  TextColor,
  TextAlign,
  AlignItems,
  BlockSize,
  BorderColor,
} from '../../../helpers/constants/design-system';

import {
  getSelectedInternalAccount,
} from '../../../selectors';


const CLOB_ENDPOINT = 'https://clob.polymarket.com';
const DATA_API_ENDPOINT = 'https://data-api.polymarket.com';

const PredictContainer = () => {
  const [marketData, setMarketData] = useState<any[]>([]);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const selectedAccount = useSelector(getSelectedInternalAccount);

  const getTrades = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${DATA_API_ENDPOINT}/trades?limit=5&user=0x33a90b4f8a9cccFe19059B0954e3F052D93eFc00`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
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

  // Fetch current price for each trade
  useEffect(() => {
    if (!marketData || marketData.length === 0) return;
    const fetchPrices = async () => {
      const prices: Record<string, number | null> = {};
      await Promise.all(
        marketData.map(async (trade: any) => {
          try {
            const res = await fetch(`${CLOB_ENDPOINT}/price?token_id=${trade.asset}&side=${trade.side}`);
            const data = await res.json();
            prices[trade.transactionHash] = Number(data.price);
          } catch (e) {
            prices[trade.transactionHash] = null;
          }
        })
      );
      setCurrentPrices(prices);
    };
    fetchPrices();
  }, [marketData]);

  const getProfitLoss = (trade: any) => {
    const currentPrice = currentPrices[trade.transactionHash];
    if (typeof currentPrice !== 'number' || currentPrice === null) return null;
    const entryPrice = trade.price;
    const shares = trade.size;
    let profit = 0;
    if (trade.side === 'SELL') {
      profit = (entryPrice - currentPrice) * shares;
    } else {
      profit = (currentPrice - entryPrice) * shares;
    }
    const percent = (profit / (entryPrice * shares)) * 100;
    return { profit, percent };
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
            <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
              Loading positions...
            </Text>
          </Box>
        ) : marketData && marketData.length > 0 ? (
          marketData.map((trade: any) => {
            const profitLoss = getProfitLoss(trade);
            return (
              <Box
                key={trade.transactionHash}
                backgroundColor={BackgroundColor.backgroundDefault}
                borderRadius={BorderRadius.LG}
                padding={4}
                marginBottom={4}
              >
                <Box display={Display.Flex} flexDirection={FlexDirection.Row} alignItems={AlignItems.center} gap={3}>
                  <img src={trade.icon} alt={trade.title} style={{ width: 48, height: 48, borderRadius: 8 }} />
                  <Box>
                    <Text variant={TextVariant.headingSm}>{trade.title}</Text>
                    <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
                      {trade.outcome} {Math.round(trade.price * 100)}¢
                    </Text>
                    <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
                      {trade.size} shares
                    </Text>
                  </Box>
                  <Box marginLeft="auto" textAlign={TextAlign.Right}>
                    <Text variant={TextVariant.headingMd}>
                      ${(trade.size * trade.price).toFixed(2)}
                    </Text>
                    {profitLoss ? (
                      <Text color={profitLoss.profit < 0 ? TextColor.errorDefault : TextColor.successDefault}>
                        {profitLoss.profit < 0 ? '' : '+'}${profitLoss.profit.toFixed(2)} ({profitLoss.profit < 0 ? '' : '+'}{profitLoss.percent.toFixed(2)}%)
                      </Text>
                    ) : (
                      <Text color={TextColor.textAlternative}>Loading...</Text>
                    )}
                  </Box>
                </Box>
                <Box display={Display.Flex} flexDirection={FlexDirection.Row} alignItems={AlignItems.center} gap={3} marginTop={2}>
                  <Box>
                    <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>Avg</Text>
                    <Text variant={TextVariant.headingSm}>{Math.round(trade.price * 100)}¢</Text>
                  </Box>
                  <Box>
                    <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>Now</Text>
                    <Text variant={TextVariant.headingSm}>
                      {currentPrices[trade.transactionHash] != null
                        ? Math.round(currentPrices[trade.transactionHash]! * 100) + '¢'
                        : '...'}
                    </Text>
                  </Box>
                  <Button variant={ButtonVariant.Primary} style={{ marginLeft: 'auto' }}>
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
