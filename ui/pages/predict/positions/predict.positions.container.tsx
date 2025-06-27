import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { Side } from '@polymarket/clob-client';
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
import PredictNavigation from '../predict.navigation';

import { getSelectedInternalAccount } from '../../../selectors';
import { usePolymarket } from '../usePolymarket';
import { UserPosition } from '../types';
import { CLOB_ENDPOINT, DATA_API_ENDPOINT } from '../utils';

const PredictContainer = () => {
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemingPosition, setRedeemingPosition] =
    useState<UserPosition | null>(null);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const { placeOrder, redeemPosition } = usePolymarket();

  const getPositions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${DATA_API_ENDPOINT}/positions?limit=10&user=${selectedAccount.address}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      const positionsData = await response.json();
      console.log(positionsData);
      setPositions(positionsData);
    } catch (error) {
      console.error('Error fetching positions:', error);
      setPositions([]);
    } finally {
      setLoading(false);
    }
  };

  // Call getTrades on mount
  useEffect(() => {
    getPositions();
  }, []);

  const handleSell = async (position: UserPosition) => {
    console.log(position);
    const tickSize = await fetch(
      `${CLOB_ENDPOINT}/tick-size?token_id=${position.asset}`,
    );
    const tickSizeData = await tickSize.json();
    if (!tickSizeData) {
      console.error('No tick size found');
      return;
    }
    placeOrder({
      tokenId: position.asset,
      price: position.curPrice,
      size: position.size,
      tickSize: tickSizeData.minimum_tick_size,
      side: Side.SELL,
      negRisk: position.negativeRisk,
    });
  };

  const handleRedeem = async (position: UserPosition) => {
    setRedeemingPosition(position);
    await redeemPosition(position);
    await getPositions();
    setRedeemingPosition(null);
  };

  return (
    <Page className="main-container" data-testid="remote-mode">
      <Box backgroundColor={BackgroundColor.backgroundAlternative} padding={4}>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          textAlign={TextAlign.Center}
        >
          <Text variant={TextVariant.headingMd}>Positions</Text>
          <Text variant={TextVariant.bodySm}>Your current positions.</Text>
        </Box>
        <PredictNavigation />
        {loading && (
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
        )}
        {positions &&
          positions.length > 0 &&
          positions.map((position: UserPosition) => {
            return (
              <Box
                key={`${position.outcomeIndex}-${position.asset}`}
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
                  justifyContent={JustifyContent.spaceBetween}
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
                  justifyContent={JustifyContent.spaceBetween}
                >
                  <Box
                    display={Display.Flex}
                    flexDirection={FlexDirection.Row}
                    gap={2}
                  >
                    <Box
                      display={Display.Flex}
                      flexDirection={FlexDirection.Column}
                      justifyContent={JustifyContent.spaceBetween}
                      alignItems={AlignItems.center}
                    >
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
                        {position.curPrice === null
                          ? '...'
                          : `${Math.round(position.curPrice * 100)}¢`}
                      </Text>
                    </Box>
                  </Box>

                  <Box
                    display={Display.Flex}
                    flexDirection={FlexDirection.Row}
                    gap={2}
                  >
                    {position.redeemable && (
                      <Button
                        variant={ButtonVariant.Primary}
                        style={{ marginLeft: 'auto' }}
                        onClick={() => handleRedeem(position)}
                        loading={redeemingPosition?.asset === position.asset}
                      >
                        Redeem
                      </Button>
                    )}
                    <Button
                      variant={ButtonVariant.Primary}
                      style={{ marginLeft: 'auto' }}
                      onClick={() => handleSell(position)}
                    >
                      Sell
                    </Button>
                  </Box>
                </Box>
              </Box>
            );
          })}
        {!loading && positions.length === 0 && <Text>No positions found.</Text>}
      </Box>
    </Page>
  );
};

export default PredictContainer;
