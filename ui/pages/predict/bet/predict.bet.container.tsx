import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

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

const CLOB_ENDPOINT = 'https://clob.polymarket.com';

const PredictContainer = () => {
  const { marketId } = useParams<{ marketId: string }>();
  const [marketData, setMarketData] = useState<any>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(10);

  const getMarket = async () => {
    if (!marketId) return;

    const response = await fetch(`${CLOB_ENDPOINT}/markets/${marketId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const marketData = await response.json();
    setMarketData(marketData);
  };

  useEffect(() => {
    getMarket();
  }, [marketId]);

  const getTimeRemaining = () => {
    if (!marketData?.end_date_iso) return '';
    const endDate = new Date(marketData.end_date_iso);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days}D left`;
  };

  const yesToken = marketData?.tokens?.find(
    (token: any) => token.outcome === 'Yes',
  );
  const noToken = marketData?.tokens?.find(
    (token: any) => token.outcome === 'No',
  );

  const handleBuyNo = () => {
    console.log(yesToken);
  };

  const handleBuyYes = () => {
    console.log(noToken);
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
          <Text variant={TextVariant.headingMd}>Place bet</Text>
          <Text variant={TextVariant.bodySm}>
            Select an amount and the outcome you think will happen to bet on
            this prediction market.
          </Text>
        </Box>
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
              src={
                marketData?.icon ||
                './images/logo/metamask-fox.svg'
              }
              alt="Market"
              style={{ width: 40, height: 40, borderRadius: '50%' }}
            />
            <Box>
              <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Bold}>
                {marketData?.question || 'Loading...'}
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
            <Text color={TextColor.successDefault} fontWeight={FontWeight.Bold}>
              {`${((yesToken?.price || 0) * 100).toFixed(1)}% YES`}
            </Text>
            <Text color={TextColor.errorDefault} fontWeight={FontWeight.Bold}>
              {`NO ${((noToken?.price || 0) * 100).toFixed(1)}%`}
            </Text>
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
          <Button
            style={{ backgroundColor: '#FFB0B0', flex: 1 }}
            onClick={handleBuyNo}
            color={TextColor.textDefault}
          >
            Buy no ({noToken?.price}¢)
          </Button>
          <Button
            style={{ backgroundColor: '#A5FFB0', flex: 1 }}
            onClick={handleBuyYes}
            color={TextColor.textDefault}
          >
            Buy yes ({yesToken?.price}¢)
          </Button>
        </Box>
      </Box>
    </Page>
  );
};

export default PredictContainer;
