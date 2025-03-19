import React, { useMemo } from 'react';

import TokenCell from '../token-cell';

import { getSelectedAccount } from '../../../../selectors';
import { useSelector } from 'react-redux';

import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import PulseLoader from '../../../ui/pulse-loader';
import { Box } from '../../../component-library/box';
import { DeFiPositionsControllerState } from '../../../../DeFiPositionsController/DeFiPositionsController';
import { GroupedPositions } from '../../../../DeFiPositionsController/group-positions';

export type DefiState = {
  metamask: DeFiPositionsControllerState;
};

const extractIconGroup = (
  protocolPositions: GroupedPositions['protocols'][keyof GroupedPositions['protocols']],
) => {
  return Object.values(protocolPositions.positionTypes).flatMap(
    (displayTokens) =>
      displayTokens.positions.flatMap((nestedToken) =>
        nestedToken.flatMap((token) =>
          token.tokens.map((underlying) => ({
            symbol: underlying.symbol,
            avatarValue: underlying.iconUrl,
          })),
        ),
      ),
  );
};

export function getDefiPositions(
  state: DefiState,
): DeFiPositionsControllerState['allDeFiPositions'] {
  return state?.metamask?.allDeFiPositions;
}

const LoadingState = () => (
  <Box
    display={Display.Flex}
    flexDirection={FlexDirection.Column}
    alignItems={AlignItems.center}
    justifyContent={JustifyContent.center}
  >
    <PulseLoader />
  </Box>
);

const DeFi = ({
  onClickDefi,
}: {
  onClickDefi: (chainId: string, protocolId: string) => void;
}) => {
  const defiPositions = useSelector(getDefiPositions);
  const selectedAccount = useSelector(getSelectedAccount);
  const defiData = selectedAccount
    ? defiPositions?.[selectedAccount.address]
    : null;

  const defiElements = useMemo(() => {
    if (!defiData) return [];
    return Object.entries(defiData).flatMap(([chainId, chainData]) =>
      Object.entries(chainData.protocols).map(([protocolId, protocol]) => {
        const iconGroup = extractIconGroup(protocol);
        return (
          <TokenCell
            key={`${chainId}-${protocolId}`}
            location="DefiTab"
            token={{
              protocolId,
              address: '0x',
              title: protocol.protocolDetails.name,
              symbol: protocol.protocolDetails.name,
              tokenFiatAmount: protocol.aggregatedMarketValue,
              image: protocol.protocolDetails.iconUrl,
              primary: protocol.aggregatedMarketValue.toString(),
              secondary: protocol.aggregatedMarketValue,
              decimals: 10,
              chainId: chainId as '0x' & string,
              iconGroup,
            }}
            privacyMode={false}
            onClick={onClickDefi}
          />
        );
      }),
    );
  }, [defiData]);
  return <>{defiData ? defiElements : <LoadingState />}</>;
};

export default DeFi;
