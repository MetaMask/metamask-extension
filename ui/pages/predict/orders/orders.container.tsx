import React, { useEffect, useState } from 'react';

import { Box, Button, Text } from '../../../components/component-library';

import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import PredictNavigation from '../predict.navigation';
import { usePolymarket } from '../usePolymarket';
import { CLOB_ENDPOINT } from '../utils';
import { Page } from '../../../components/multichain/pages/page';

export const OrdersContainer = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { createL2Headers, cancelOrder, getMarketTitles } = usePolymarket();
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [cancelingOrder, setCancelingOrder] = useState<string | null>(null);

  const getOrders = async () => {
    try {
      setLoading(true);
      const l2Headers = await createL2Headers({
        method: 'GET',
        requestPath: `/data/orders`,
      });
      const response = await fetch(`${CLOB_ENDPOINT}/data/orders`, {
        method: 'GET',
        headers: l2Headers,
      });
      const ordersData = await response.json();
      console.log('ordersData', ordersData);
      setOrders(ordersData.data);
      if (ordersData.data.length > 0) {
        const marketTitles = await getMarketTitles();
        setTitles(marketTitles);
        console.log('marketTitles', marketTitles);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (endDateString: string) => {
    if (!endDateString) {
      return '';
    }
    const endDate = new Date(endDateString);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days}D left`;
  };

  const handleCancelOrder = async (orderId: string) => {
    console.log('orderId', orderId);
    setCancelingOrder(orderId);
    await cancelOrder(orderId);
    await getOrders();
    setCancelingOrder(null);
  };

  useEffect(() => {
    getOrders();
  }, []);

  return (
    <Page className="main-container" data-testid="predict-orders">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        padding={4}
        backgroundColor={BackgroundColor.backgroundAlternative}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          textAlign={TextAlign.Center}
        >
          <Text variant={TextVariant.headingMd}>Orders</Text>
          <Text variant={TextVariant.bodySm}>Your current orders.</Text>
        </Box>
        <PredictNavigation />
        <Box>
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
                Loading orders...
              </Text>
            </Box>
          )}
          {orders &&
            orders.length > 0 &&
            orders.map((order) => {
              return (
                <Box
                  key={order.id}
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
                    <Box
                      display={Display.Flex}
                      flexDirection={FlexDirection.Column}
                      gap={1}
                    >
                      <Text variant={TextVariant.headingSm}>
                        {titles[order.market] || 'Market'}
                      </Text>
                      <Text variant={TextVariant.bodySm}>
                        {order.outcome} -{' '}
                        {order.expiration === '0'
                          ? 'No expiration'
                          : getDaysLeft(order.expiration)}
                      </Text>
                    </Box>
                  </Box>
                  <Box
                    display={Display.Flex}
                    flexDirection={FlexDirection.Row}
                    alignItems={AlignItems.center}
                    justifyContent={JustifyContent.spaceBetween}
                    gap={3}
                    marginTop={2}
                  >
                    <Box>
                      <Text variant={TextVariant.bodySm}>${order.price}</Text>
                      <Text variant={TextVariant.bodySm}>
                        {order.original_size} shares
                      </Text>
                    </Box>
                  </Box>
                  <Box
                    display={Display.Flex}
                    flexDirection={FlexDirection.Row}
                    gap={2}
                    marginTop={2}
                    width={BlockSize.Full}
                  >
                    <Button
                      style={{
                        width: '100%',
                        flex: 1,
                        backgroundColor: '#393939',
                        color: 'white',
                      }}
                      onClick={() => {
                        handleCancelOrder(order.id);
                      }}
                      loading={cancelingOrder === order.id}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              );
            })}
          {!loading && orders && orders.length === 0 && (
            <Text>No orders found.</Text>
          )}
        </Box>
      </Box>
    </Page>
  );
};

export default OrdersContainer;
