import React from 'react';
import {
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
  TextAlign,
  FontWeight,
} from '../../../../helpers/constants/design-system';
import { AvatarToken, Box, Text } from '../../../component-library';
import { formatWithThreshold } from '../token-cell/token-cell';

export const DefiPositions = ({
  suppliedTokens,
  positionType,
}: {
  suppliedTokens: any[];
  positionType: 'Supplied' | 'Rewards' | 'Borrows';
}) => {
  return (
    <>
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        paddingBottom={2}
        style={{ borderBottom: '1px solid #e0e0e0' }}
      >
        <Box textAlign={TextAlign.Left}>
          <Text
            as="span"
            paddingInlineStart={1}
            paddingInlineEnd={1}
            fontWeight={FontWeight.Medium}
          >
            {positionType}
          </Text>
        </Box>
        <Box textAlign={TextAlign.Center}>
          <Text
            as="span"
            paddingInlineStart={1}
            paddingInlineEnd={1}
            fontWeight={FontWeight.Medium}
          >
            Amount
          </Text>
        </Box>
        <Box textAlign={TextAlign.Right}>
          <Text
            as="span"
            paddingInlineStart={1}
            paddingInlineEnd={1}
            fontWeight={FontWeight.Medium}
          >
            Value
          </Text>
        </Box>
      </Box>
      {/* Token Rows */}
      <Box
        style={{ flex: '2' }}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={2}
      >
        {suppliedTokens.map(
          (token) =>
            token && (
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                key={token.address}
              >
                {/* Token Details */}
                <Box
                  style={{ flex: '1' }}
                  display={Display.Flex}
                  gap={2}
                  alignItems={AlignItems.center}
                >
                  <AvatarToken name={token.name} src={token.iconUrl} />

                  <Text>{token.symbol}</Text>
                </Box>
                {/* Amount */}
                <Box style={{ flex: '1' }} textAlign={TextAlign.Center}>
                  <Text>{token.balance.toFixed(2)}</Text>
                </Box>
                {/* Value */}
                <Box style={{ flex: '1' }} textAlign={TextAlign.Right}>
                  <Text>
                    {formatWithThreshold(
                      token.balance * token.price,
                      0.01,
                      'en-US',
                      {
                        style: 'currency',
                        currency: 'USD',
                      },
                    )}
                  </Text>
                </Box>
              </Box>
            ),
        )}
      </Box>
    </>
  );
};