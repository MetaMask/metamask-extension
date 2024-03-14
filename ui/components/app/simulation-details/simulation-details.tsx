import React, { useEffect, useState } from 'react';
import {
  SimulationBalanceChange,
  SimulationData,
  SimulationTokenBalanceChange,
  SimulationTokenStandard,
} from '@metamask/transaction-controller';
import { NameType } from '@metamask/name-controller';
import { Hex } from '@metamask/utils';
import { Numeric } from '../../../../shared/modules/Numeric';
import { getTokenStandardAndDetails } from '../../../store/actions';
import Name from '../name/name';
import { Box } from '../../component-library';
import {
  AlignItems,
  BlockSize,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
} from '../../../helpers/constants/design-system';
import { EtherDenomination } from '../../../../shared/constants/common';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import PulseLoader from '../../ui/pulse-loader/pulse-loader';

export interface SimulationDetailsProps {
  fromAddress: string;
  simulationData: SimulationData;
}

type Token = Awaited<ReturnType<typeof getTokenStandardAndDetails>>;

type RowData = {
  isGain: boolean;
  message: string;
  sortValue: string;
  value: string;
  valueAddress?: Hex;
};

function useTokens(fromAddress: string, simulationData: SimulationData) {
  const [tokens, setTokens] = useState<Record<string, Token>>({});
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const tokenAddresses = [
      ...new Set(
        (simulationData?.tokenBalanceChanges ?? []).map(
          (tokenBalanceChange) => tokenBalanceChange.address,
        ),
      ),
    ];

    const tokenPromise = tokenAddresses.map((address) =>
      getTokenStandardAndDetails(
        address,
        fromAddress,
        undefined as unknown as string,
      ),
    );

    Promise.all(tokenPromise).then((allTokenData) => {
      setTokens(
        allTokenData.reduce(
          (result, tokenData, index) => ({
            ...result,
            [tokenAddresses[index]]: tokenData,
          }),
          {},
        ),
      );

      setLoading(false);
    });
  }, [fromAddress, simulationData]);

  return { isLoading, tokens };
}

function Row({
  isGain,
  message,
  value,
  valueAddress,
}: {
  isGain: boolean;
  message: string;
  value: string;
  valueAddress?: Hex;
}) {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      style={{ minHeight: '48px' }}
      alignItems={AlignItems.center}
    >
      <span>{message}</span>
      <Box
        flexDirection={FlexDirection.Row}
        display={Display.Flex}
        alignItems={AlignItems.center}
        textAlign={TextAlign.Left}
        gap={2}
        height={BlockSize.Full}
        color={isGain ? TextColor.successDefault : TextColor.errorDefault}
      >
        {value}
        {valueAddress ? (
          <Name
            type={NameType.ETHEREUM_ADDRESS}
            value={valueAddress}
            iconOnly
          />
        ) : null}
      </Box>
    </Box>
  );
}

function getBalanceRowData(balanceChange: SimulationBalanceChange): RowData {
  const isGain = !balanceChange.isDecrease;

  const amount = new Numeric(
    balanceChange.difference,
    16,
    EtherDenomination.WEI,
  )
    .toDenomination(EtherDenomination.ETH)
    .round(6)
    .toBase(10)
    .toString();

  const value = `${amount} ETH`;
  const message = isGain ? 'You gain' : 'You lose';

  return { isGain, message, sortValue: '', value };
}

function getERC20TransferRowData(
  token: Token,
  tokenBalanceChange: SimulationTokenBalanceChange,
): RowData {
  const symbol = token?.symbol || 'Token';
  const decimals = token?.decimals ? parseInt(token.decimals, 10) : 18;
  const isGain = !tokenBalanceChange.isDecrease;
  const message = isGain ? 'You gain' : 'You lose';
  const valueAddress = tokenBalanceChange.address;

  const amount = new Numeric(tokenBalanceChange.difference, 16)
    .shiftedBy(decimals)
    .round(6)
    .toBase(10)
    .toString();

  const value = `${amount} ${symbol}`;

  return {
    isGain,
    message,
    sortValue: `1#${token?.symbol}`,
    value,
    valueAddress,
  };
}

function getERC721TransferRowData(
  token: Token,
  tokenBalanceChange: SimulationTokenBalanceChange,
): RowData {
  const name = token?.name || 'NFT';
  const tokenId = hexToDecimal(tokenBalanceChange.id as string);
  const isGain = !tokenBalanceChange.isDecrease;
  const message = isGain ? 'You gain' : 'You lose';
  const value = `${name} #${tokenId}`;
  const valueAddress = tokenBalanceChange.address;

  return {
    isGain,
    message,
    sortValue: `2#${token?.name}`,
    value,
    valueAddress,
  };
}

function getERC1155TransferRowData(
  token: Token,
  tokenBalanceChange: SimulationTokenBalanceChange,
): RowData {
  const name = token?.name || 'NFT';
  const tokenId = hexToDecimal(tokenBalanceChange.id as string);
  const isGain = !tokenBalanceChange.isDecrease;
  const message = isGain ? 'You gain' : 'You lose';
  const value = `${name} #${tokenId} x ${hexToDecimal(
    tokenBalanceChange.difference,
  )}`;
  const valueAddress = tokenBalanceChange.address;

  return {
    isGain,
    message,
    sortValue: `3#${token?.name}`,
    value,
    valueAddress,
  };
}

function sortRows(rows: RowData[]): RowData[] {
  return rows.sort((a, b) => {
    if (a.isGain && !b.isGain) {
      return -1;
    }

    return a.sortValue.localeCompare(b.sortValue);
  });
}

function getRows(
  tokens: Record<string, Token>,
  simulationData: SimulationData,
) {
  const rows = [];

  if (simulationData.nativeBalanceChange) {
    rows.push(getBalanceRowData(simulationData.nativeBalanceChange));
  }

  simulationData.tokenBalanceChanges.forEach((tokenBalanceChange) => {
    if (tokenBalanceChange.standard === SimulationTokenStandard.erc20) {
      rows.push(
        getERC20TransferRowData(
          tokens[tokenBalanceChange.address],
          tokenBalanceChange,
        ),
      );
    } else if (tokenBalanceChange.standard === SimulationTokenStandard.erc721) {
      rows.push(
        getERC721TransferRowData(
          tokens[tokenBalanceChange.address],
          tokenBalanceChange,
        ),
      );
    } else if (
      tokenBalanceChange.standard === SimulationTokenStandard.erc1155
    ) {
      rows.push(
        getERC1155TransferRowData(
          tokens[tokenBalanceChange.address],
          tokenBalanceChange,
        ),
      );
    }
  });

  return sortRows(rows);
}

export default function SimulationDetails({
  fromAddress,
  simulationData,
}: SimulationDetailsProps) {
  const { isLoading, tokens } = useTokens(fromAddress, simulationData);

  if (isLoading || !simulationData) {
    return (
      <div
        style={{ display: 'flex', padding: '20px', justifyContent: 'center' }}
      >
        <PulseLoader />
      </div>
    );
  }

  if (simulationData.error) {
    return simulationData.error.message;
  }

  const rows = getRows(tokens, simulationData);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={1}
      borderRadius={BorderRadius.MD}
      borderColor={BorderColor.borderDefault}
      padding={3}
      margin={4}
    >
      {rows.map((row, index) => (
        <Row
          key={index}
          isGain={row.isGain}
          message={row.message}
          value={row.value}
          valueAddress={row.valueAddress}
        />
      ))}
    </Box>
  );
}
