import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import { Side, TickSize, Token } from '@polymarket/clob-client';
import {
  Box,
  Button,
  ButtonVariant,
  Text,
} from '../../../components/component-library';
import PredictNavigation from '../predict.navigation';

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
import { usePolymarket } from '../usePolymarket';
import { Market } from '../types';

const CLOB_ENDPOINT = 'https://clob.polymarket.com';

const PredictContainer = () => {
  const { marketId } = useParams<{ marketId: string }>();
  const [market, setMarket] = useState<Market | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const { placeOrder } = usePolymarket();

  const getMarket = useCallback(async () => {
    if (!marketId) {
      return;
    }

    const response = await fetch(`${CLOB_ENDPOINT}/markets/${marketId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const marketData = await response.json();
    console.log('marketData', marketData);
    setMarket(marketData);
  }, [marketId]);

  useEffect(() => {
    getMarket();
  }, [getMarket, marketId]);

  const getTimeRemaining = () => {
    if (!market?.end_date_iso) {
      return '';
    }
    const endDate = new Date(market.end_date_iso);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days}D left`;
  };

  const isYesToken = (token: Token) => {
    return token.outcome === 'Yes';
  };

  const isNoToken = (token: Token) => {
    return token.outcome === 'No';
  };

  const isYesNoToken = (token: Token) => {
    return isYesToken(token) || isNoToken(token);
  };

  const handleBuy = (token: Token) => {
    console.log(market, token);
    placeOrder({
      tokenId: token.token_id,
      price: token.price,
      size: Number(market?.minimum_order_size),
      tickSize: market?.minimum_tick_size as TickSize,
      side: Side.BUY,
      negRisk: market?.neg_risk || false,
    });
  };

  const getTokenButtonBackgroundColor = (token: Token, index: number) => {
    if (isYesNoToken(token)) {
      return isYesToken(token) ? '#A5FFB0' : '#FFB0B0';
    }
    return index === 0 ? '#A5FFB0' : '#FFB0B0';
  };

  const getTokenTextColor = (token: Token, index: number) => {
    if (isYesNoToken(token)) {
      return isYesToken(token)
        ? TextColor.successDefault
        : TextColor.errorDefault;
    }
    return index === 0 ? TextColor.successDefault : TextColor.errorDefault;
  };

  return (
    <Page className="main-container" data-testid="remote-mode">
      <Box backgroundColor={BackgroundColor.backgroundAlternative} padding={4}>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          textAlign={TextAlign.Center}
          marginBottom={2}
        >
          <Text variant={TextVariant.headingMd}>Place bet</Text>
          <Text variant={TextVariant.bodySm}>
            Select an amount and the outcome you think will happen to bet on
            this prediction market.
          </Text>
        </Box>
        <PredictNavigation />
        <Box
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
            marginBottom={2}
          >
            <img
              src={market?.icon || './images/logo/metamask-fox.svg'}
              alt="Market"
              style={{ width: 40, height: 40, borderRadius: '50%' }}
            />
            <Box>
              <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Bold}>
                {market?.question || 'Loading...'}
              </Text>
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.primaryDefault}
              >
                {getTimeRemaining()}
              </Text>
            </Box>
            <Box marginLeft="auto" textAlign={TextAlign.Right}>
              <Text variant={TextVariant.bodyMd}>$4.6M Vol.</Text>
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.primaryDefault}
              >
                2M voters
              </Text>
            </Box>
          </Box>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
            marginTop={1}
          >
            {market?.tokens.map((token: Token, index: number) => {
              return (
                <Text
                  key={token.token_id}
                  color={getTokenTextColor(token, index)}
                  fontWeight={FontWeight.Bold}
                >
                  {`${((token.price || 0) * 100).toFixed(1)}% ${token.outcome}`}
                </Text>
              );
            })}
          </Box>
        </Box>
        <Box
          backgroundColor={BackgroundColor.backgroundDefault}
          borderRadius={BorderRadius.SM}
          padding={4}
          marginBottom={3}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            alignItems={AlignItems.center}
            gap={2}
          >
            <img
              src={'./images/icon-usdc.png'}
              alt="USDC"
              style={{ width: 28, height: 28 }}
            />
            <Text variant={TextVariant.headingMd} fontWeight={FontWeight.Bold}>
              USDC
            </Text>
            <Box marginLeft="auto">
              <Text
                variant={TextVariant.headingMd}
                fontWeight={FontWeight.Bold}
              >
                {selectedAmount}
              </Text>
            </Box>
          </Box>
        </Box>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          gap={2}
          marginBottom={4}
          paddingBottom={8}
        >
          <Button
            variant={ButtonVariant.Secondary}
            width={BlockSize.OneFourth}
            onClick={() => setSelectedAmount(10)}
            backgroundColor={BackgroundColor.backgroundDefault}
            borderWidth={selectedAmount === 10 ? 1 : 0}
            borderColor={
              selectedAmount === 10 ? BorderColor.primaryAlternative : undefined
            }
          >
            $10
          </Button>
          <Button
            variant={ButtonVariant.Secondary}
            width={BlockSize.OneFourth}
            onClick={() => setSelectedAmount(50)}
            backgroundColor={BackgroundColor.backgroundDefault}
            borderWidth={selectedAmount === 50 ? 1 : 0}
            borderColor={
              selectedAmount === 50 ? BorderColor.primaryAlternative : undefined
            }
          >
            $50
          </Button>
          <Button
            variant={ButtonVariant.Secondary}
            width={BlockSize.OneFourth}
            onClick={() => setSelectedAmount(100)}
            backgroundColor={BackgroundColor.backgroundDefault}
            borderWidth={selectedAmount === 100 ? 1 : 0}
            borderColor={
              selectedAmount === 100
                ? BorderColor.primaryAlternative
                : undefined
            }
          >
            $100
          </Button>
          <Button
            variant={ButtonVariant.Secondary}
            width={BlockSize.OneFourth}
            onClick={() => setSelectedAmount(0)}
            backgroundColor={BackgroundColor.backgroundDefault}
            borderWidth={selectedAmount === 0 ? 1 : 0}
            borderColor={
              selectedAmount === 0 ? BorderColor.primaryAlternative : undefined
            }
            disabled={true}
          >
            Other
          </Button>
        </Box>
        <Box display={Display.Flex} flexDirection={FlexDirection.Row} gap={2}>
          {market?.tokens.map((token: Token, index: number) => {
            return (
              <Button
                key={token.token_id}
                style={{
                  backgroundColor: getTokenButtonBackgroundColor(token, index),
                  flex: 1,
                }}
                onClick={() => handleBuy(token)}
                color={TextColor.textDefault}
              >
                {`Buy ${token.outcome} (${token.price}¢)`}
              </Button>
            );
          })}
        </Box>
      </Box>
    </Page>
  );
};

export default PredictContainer;
