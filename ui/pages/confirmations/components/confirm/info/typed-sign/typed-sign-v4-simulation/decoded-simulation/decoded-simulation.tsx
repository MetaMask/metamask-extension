import React, { useMemo } from 'react';
import {
  DecodingDataChangeType,
  DecodingDataStateChange,
  DecodingDataStateChanges,
} from '@metamask/signature-controller';
import { Hex } from '@metamask/utils';

import { TokenStandard } from '../../../../../../../../../shared/constants/transaction';
import { ConfirmInfoRow } from '../../../../../../../../components/app/confirm/info/row';
import { Text } from '../../../../../../../../components/component-library';
import { useI18nContext } from '../../../../../../../../hooks/useI18nContext';
import { SignatureRequestType } from '../../../../../../types/confirm';
import { useConfirmContext } from '../../../../../../context/confirm';
import StaticSimulation from '../../../shared/static-simulation/static-simulation';
import TokenValueDisplay from '../value-display/value-display';
import NativeValueDisplay from '../native-value-display/native-value-display';

export enum StateChangeType {
  NFTListingReceive = 'NFTListingReceive',
  NFTBiddingReceive = 'NFTBiddingReceive',
}

export const getStateChangeType = (
  stateChangeList: DecodingDataStateChanges | null,
  stateChange: DecodingDataStateChange,
): StateChangeType | undefined => {
  if (stateChange.changeType === DecodingDataChangeType.Receive) {
    if (
      stateChangeList?.some(
        (change) =>
          change.changeType === DecodingDataChangeType.Listing &&
          change.assetType === TokenStandard.ERC721,
      )
    ) {
      return StateChangeType.NFTListingReceive;
    }
    if (
      stateChange.assetType === TokenStandard.ERC721 &&
      stateChangeList?.some(
        (change) => change.changeType === DecodingDataChangeType.Bidding,
      )
    ) {
      return StateChangeType.NFTBiddingReceive;
    }
  }
  return undefined;
};

export const getStateChangeToolip = (
  nftTransactionType: StateChangeType | undefined,
  t: ReturnType<typeof useI18nContext>,
): string | undefined => {
  if (nftTransactionType === StateChangeType.NFTListingReceive) {
    return t('signature_decoding_list_nft_tooltip');
  } else if (nftTransactionType === StateChangeType.NFTBiddingReceive) {
    return t('signature_decoding_bid_nft_tooltip');
  }
  return undefined;
};

const stateChangeOrder = {
  [DecodingDataChangeType.Transfer]: 1,
  [DecodingDataChangeType.Listing]: 2,
  [DecodingDataChangeType.Approve]: 3,
  [DecodingDataChangeType.Revoke]: 4,
  [DecodingDataChangeType.Bidding]: 5,
  [DecodingDataChangeType.Receive]: 6,
};

const getStateChangeLabelMap = (
  t: ReturnType<typeof useI18nContext>,
  changeType: string,
  stateChangeType?: StateChangeType,
) => {
  return {
    [DecodingDataChangeType.Transfer]: t('permitSimulationChange_transfer'),
    [DecodingDataChangeType.Receive]:
      stateChangeType === StateChangeType.NFTListingReceive
        ? t('permitSimulationChange_nft_listing')
        : t('permitSimulationChange_receive'),
    [DecodingDataChangeType.Approve]: t('permitSimulationChange_approve'),
    [DecodingDataChangeType.Revoke]: t('permitSimulationChange_revoke2'),
    [DecodingDataChangeType.Bidding]: t('permitSimulationChange_bidding'),
    [DecodingDataChangeType.Listing]: t('permitSimulationChange_listing'),
  }[changeType];
};

const StateChangeRow = ({
  stateChangeList,
  stateChange,
  chainId,
  shouldDisplayLabel,
}: {
  stateChangeList: DecodingDataStateChanges | null;
  stateChange: DecodingDataStateChange;
  chainId: Hex;
  shouldDisplayLabel: boolean;
}) => {
  const t = useI18nContext();
  const { assetType, changeType, amount, contractAddress, tokenID } =
    stateChange;
  const nftTransactionType = getStateChangeType(stateChangeList, stateChange);
  const tooltip = getStateChangeToolip(nftTransactionType, t);
  const canDisplayValueAsUnlimited =
    assetType === TokenStandard.ERC20 &&
    (changeType === DecodingDataChangeType.Approve ||
      changeType === DecodingDataChangeType.Revoke);
  return (
    <ConfirmInfoRow
      label={
        shouldDisplayLabel
          ? getStateChangeLabelMap(t, changeType, nftTransactionType)
          : ''
      }
      tooltip={tooltip}
    >
      {(assetType === TokenStandard.ERC20 ||
        assetType === TokenStandard.ERC721 ||
        assetType === TokenStandard.ERC1155) && (
        <TokenValueDisplay
          tokenContract={contractAddress}
          value={amount}
          chainId={chainId}
          tokenId={tokenID}
          credit={
            nftTransactionType !== StateChangeType.NFTListingReceive &&
            changeType === DecodingDataChangeType.Receive
          }
          debit={changeType === DecodingDataChangeType.Transfer}
          canDisplayValueAsUnlimited={canDisplayValueAsUnlimited}
        />
      )}
      {assetType === 'NATIVE' && (
        <NativeValueDisplay
          value={amount}
          chainId={chainId}
          credit={
            nftTransactionType !== StateChangeType.NFTListingReceive &&
            changeType === DecodingDataChangeType.Receive
          }
          debit={changeType === DecodingDataChangeType.Transfer}
        />
      )}
    </ConfirmInfoRow>
  );
};

const DecodedSimulation: React.FC<object> = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();
  const chainId = currentConfirmation.chainId as Hex;
  const { decodingLoading, decodingData } = currentConfirmation;

  const stateChangeFragment = useMemo(() => {
    const orderedStateChanges = decodingData?.stateChanges?.sort((c1, c2) =>
      stateChangeOrder[c1.changeType] > stateChangeOrder[c2.changeType]
        ? 1
        : -1,
    );
    const stateChangesGrouped: Record<string, DecodingDataStateChange[]> = (
      orderedStateChanges ?? []
    ).reduce<Record<string, DecodingDataStateChange[]>>(
      (result, stateChange) => {
        result[stateChange.changeType] = [
          ...(result[stateChange.changeType] ?? []),
          stateChange,
        ];
        return result;
      },
      {},
    );

    return Object.entries(stateChangesGrouped).flatMap(([_, changeList]) =>
      changeList.map((change: DecodingDataStateChange, index: number) => (
        <StateChangeRow
          stateChangeList={decodingData?.stateChanges ?? []}
          stateChange={change}
          chainId={chainId}
          shouldDisplayLabel={index === 0}
        />
      )),
    );
  }, [decodingData?.stateChanges]);

  return (
    <StaticSimulation
      title={t('simulationDetailsTitle')}
      titleTooltip={t('simulationDetailsTitleTooltip')}
      simulationElements={
        stateChangeFragment.length ? (
          stateChangeFragment
        ) : (
          <Text>{t('simulationDetailsUnavailable')}</Text>
        )
      }
      isLoading={decodingLoading}
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      isCollapsed={decodingLoading || !stateChangeFragment.length}
    />
  );
};

export default DecodedSimulation;
