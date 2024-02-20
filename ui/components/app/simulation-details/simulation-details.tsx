import React, { useEffect, useState } from 'react';
import {
  SimulationBalanceChanges,
  SimulationData,
  SimulationERC1155TransferSingleEvent,
  SimulationERC20TransferEvent,
  SimulationERC721TransferEvent,
  SimulationEvent,
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
    const tokenAddresses = Object.values(simulationData.events)
      .map((event) => event)
      .flat()
      .map((event: SimulationEvent) => event.contractAddress);

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

function getBalanceRowData(
  address: Hex,
  balanceChanges: SimulationBalanceChanges,
  fromAddress: Hex,
): RowData | null {
  if (address !== fromAddress) {
    return null;
  }

  const balanceChange = balanceChanges[address];
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
  fromAddress: Hex,
  token: Token,
  transfer: SimulationERC20TransferEvent,
): RowData | null {
  if (![transfer.from, transfer.to].includes(fromAddress)) {
    return null;
  }

  const symbol = token?.symbol || 'Token';
  const decimals = token?.decimals ? parseInt(token.decimals, 10) : 18;
  const isGain = transfer.to === fromAddress;
  const message = isGain ? 'You gain' : 'You lose';
  const valueAddress = transfer.contractAddress;

  const amount = new Numeric(transfer.value, 16)
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
  fromAddress: Hex,
  token: Token,
  transfer: SimulationERC721TransferEvent,
): RowData | null {
  if (![transfer.from, transfer.to].includes(fromAddress)) {
    return null;
  }

  const name = token?.name || 'NFT';
  const tokenId = hexToDecimal(transfer.tokenId);
  const isGain = transfer.to === fromAddress;
  const message = isGain ? 'You gain' : 'You lose';
  const value = `${name} #${tokenId}`;
  const valueAddress = transfer.contractAddress;

  return {
    isGain,
    message,
    sortValue: `2#${token?.name}`,
    value,
    valueAddress,
  };
}

function getERC1155TransferRowData(
  fromAddress: Hex,
  token: Token,
  transfer: SimulationERC1155TransferSingleEvent,
): RowData | null {
  if (![transfer.from, transfer.to].includes(fromAddress)) {
    return null;
  }

  const name = token?.name || 'NFT';
  const tokenId = hexToDecimal(transfer.id);
  const isGain = transfer.to === fromAddress;
  const message = isGain ? 'You gain' : 'You lose';
  const value = `${name} #${tokenId} x ${hexToDecimal(transfer.value)}`;
  const valueAddress = transfer.contractAddress;

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

export default function SimulationDetails({
  fromAddress,
  simulationData,
}: SimulationDetailsProps) {
  const { isLoading, tokens } = useTokens(fromAddress, simulationData);

  const balanceRowData = Object.keys(simulationData.balanceChanges).map(
    (address) =>
      getBalanceRowData(
        address as Hex,
        simulationData.balanceChanges,
        fromAddress as Hex,
      ),
  );

  const erc20TransferRows = (simulationData.events.erc20Transfer ?? []).map(
    (e) =>
      getERC20TransferRowData(fromAddress as Hex, tokens[e.contractAddress], e),
  );

  const erc721TransferRows = (simulationData.events.erc721Transfer ?? []).map(
    (e) =>
      getERC721TransferRowData(
        fromAddress as Hex,
        tokens[e.contractAddress],
        e,
      ),
  );

  const erc1155TransferRows = (
    simulationData.events.erc1155TransferSingle ?? []
  ).map((e) =>
    getERC1155TransferRowData(fromAddress as Hex, tokens[e.contractAddress], e),
  );

  const rows = sortRows(
    [
      ...balanceRowData,
      ...erc20TransferRows,
      ...erc721TransferRows,
      ...erc1155TransferRows,
    ].filter((row) => row !== null) as RowData[],
  );

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
      {isLoading ? (
        <div
          style={{ display: 'flex', padding: '20px', justifyContent: 'center' }}
        >
          <PulseLoader />
        </div>
      ) : (
        rows.map((row, index) => (
          <Row
            key={index}
            isGain={row.isGain}
            message={row.message}
            value={row.value}
            valueAddress={row.valueAddress}
          />
        ))
      )}
    </Box>
  );
}
