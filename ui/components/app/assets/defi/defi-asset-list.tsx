import React from 'react';
import { TokenWithFiatAmount } from '../types';
import TokenCell from '../token-cell';
import { defiData } from '../../../../pages/defi/components/data';


function getDefiTokenCell(data: any): TokenWithFiatAmount[] {
  return Object.keys(data).flatMap((chainId) =>
    Object.keys(data[chainId as keyof typeof data].protocols).map(
      (protocolId) => {
        const chainData = data[chainId as keyof typeof data];
        const protocol = chainData.protocols[
          protocolId as keyof typeof chainData.protocols
        ] as any;

        return {
          address: protocolId as '0x' & string,
          title: protocol.protocolDetails.name,
          symbol: protocol.protocolDetails.name,
          tokenFiatAmount: protocol.aggregatedMarketValue,
          image: protocol.protocolDetails.iconUrl,
          primary: protocol.aggregatedMarketValue,
          secondary: protocol.aggregatedMarketValue,
          decimals: protocol.aggregatedMarketValue,
          chainId: chainId as '0x' & string,
        };
      },
    ),
  );
}

const DeFi = ({
  onClickDefi,
}: {
  onClickDefi: (chainId: string, protocolId: string) => void;
}) => {
  return (
    <>
      {getDefiTokenCell(defiData).map((token) => (
        <TokenCell
          key={`${token.chainId}-${token.address}`}
          token={token}
          privacyMode={false}
          showPrimaryDisplay={false}
          onClick={onClickDefi}
        />
      ))}
    </>
  );
};

export default DeFi;
