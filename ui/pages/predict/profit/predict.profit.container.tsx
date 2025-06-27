import React, { useEffect, useState } from 'react';

import { useSelector } from 'react-redux';
import { Box, Text } from '../../../components/component-library';

import { Page } from '../../../components/multichain/pages/page';
import {
  BackgroundColor,
  BorderRadius,
  Color,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import PredictNavigation from '../predict.navigation';
import { CLOB_ENDPOINT, DATA_API_ENDPOINT } from '../utils';
import { getSelectedAccount } from '../../../selectors';
import { Activity } from '../types';
import { Link } from '@material-ui/core';

const PredictContainer = () => {
  const account = useSelector(getSelectedAccount);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  const [spent, setSpent] = useState<number>(0);
  const [earns, setEarns] = useState<number>(0);
  const [pnl, setPnl] = useState<number>(0);

  const getActivity = async () => {
    setLoading(true);
    const response = await fetch(
      `${DATA_API_ENDPOINT}/activity/?limit=100&sortDirection=DESC&user=${account.address}`,
    );
    const responseData = await response.json();
    console.log(responseData);
    setActivity(responseData);

    const spentData = responseData.reduce((acc: number, item: Activity) => {
      if (item.type === 'TRADE') {
        if (item.side === 'BUY') {
          return acc + item.usdcSize;
        }
      }
      return acc;
    }, 0);
    setSpent(spentData);

    const earnsData = responseData.reduce((acc: number, item: Activity) => {
      if (item.type === 'TRADE') {
        if (item.side === 'SELL') {
          return acc + item.usdcSize;
        }
      }
      if (item.type === 'REDEEM') {
        return acc + item.usdcSize;
      }
      return acc;
    }, 0);
    setEarns(earnsData);

    setPnl(earnsData - spentData);

    setLoading(false);
  };

  useEffect(() => {
    getActivity();
  }, []);

  return (
    <Page className="main-container" data-testid="remote-mode">
      <Box backgroundColor={BackgroundColor.backgroundAlternative} padding={4}>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          textAlign={TextAlign.Center}
        >
          <Text variant={TextVariant.headingMd}>Profit and Loss</Text>
          <Text variant={TextVariant.bodySm}>
            Track your profit and loss for your predictions.
          </Text>
        </Box>
        <PredictNavigation />
        {loading && (
          <Box display={Display.Flex} flexDirection={FlexDirection.Row} gap={4}>
            <Text variant={TextVariant.bodySm}>Loading...</Text>
          </Box>
        )}
        {!loading && (
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={4}
          >
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              gap={4}
              justifyContent={JustifyContent.center}
            >
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                gap={1}
              >
                <Text
                  variant={TextVariant.headingSm}
                  color={TextColor.errorDefault}
                >
                  Spent
                </Text>
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.errorDefault}
                >
                  ${spent.toFixed(2)}
                </Text>
              </Box>
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                justifyContent={JustifyContent.center}
                gap={1}
              >
                <Text
                  variant={TextVariant.headingSm}
                  color={TextColor.successDefault}
                >
                  Earns
                </Text>
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.successDefault}
                >
                  ${earns.toFixed(2)}
                </Text>
              </Box>
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                gap={1}
                justifyContent={JustifyContent.center}
              >
                <Text
                  variant={TextVariant.headingSm}
                  color={
                    pnl > 0 ? TextColor.successDefault : TextColor.errorDefault
                  }
                >
                  Profit
                </Text>
                <Text
                  variant={TextVariant.bodySm}
                  color={
                    pnl > 0 ? TextColor.successDefault : TextColor.errorDefault
                  }
                >
                  {pnl > 0 ? '' : '-'}${Math.abs(pnl).toFixed(2)}
                </Text>
              </Box>
            </Box>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={2}
            >
              {activity.map((item) => (
                <Box
                  key={item.transactionHash}
                  backgroundColor={BackgroundColor.backgroundDefault}
                  borderRadius={BorderRadius.LG}
                  padding={4}
                >
                  <Box
                    display={Display.Flex}
                    flexDirection={FlexDirection.Row}
                    justifyContent={JustifyContent.spaceBetween}
                    gap={1}
                  >
                    <Box>
                      <Text variant={TextVariant.headingSm}>{item.title}</Text>
                      <Text
                        variant={TextVariant.bodyXs}
                        color={TextColor.textAlternative}
                      >
                        {new Date(item.timestamp).toLocaleString()}
                      </Text>
                    </Box>
                    <Link
                      href={`https://polygonscan.com/tx/${item.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      See on Polygonscan
                    </Link>
                  </Box>
                  <Box
                    display={Display.Flex}
                    flexDirection={FlexDirection.Column}
                  >
                    <Box
                      display={Display.Flex}
                      flexDirection={FlexDirection.Row}
                    >
                      <Text variant={TextVariant.bodySm}>{item.type}</Text>
                      {item.side && (
                        <Text variant={TextVariant.bodySm}>: {item.side}</Text>
                      )}
                    </Box>
                    <Text
                      variant={TextVariant.bodySm}
                      color={
                        item.side === 'BUY'
                          ? TextColor.errorDefault
                          : TextColor.successDefault
                      }
                    >
                      ${item.usdcSize.toFixed(2)}
                    </Text>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Page>
  );
};

export default PredictContainer;
