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

export const getStateChangeToolip = (
  stateChangeList: DecodingDataStateChanges | null,
  stateChange: DecodingDataStateChange,
  t: ReturnType<typeof useI18nContext>,
): string | undefined => {
  if (stateChange.changeType === DecodingDataChangeType.Receive) {
    if (
      stateChangeList?.some(
        (change) =>
          change.changeType === DecodingDataChangeType.Listing &&
          change.assetType === TokenStandard.ERC721,
      )
    ) {
      return t('signature_decoding_list_nft_tooltip');
    }
    if (
      stateChange.assetType === TokenStandard.ERC721 &&
      stateChangeList?.some(
        (change) => change.changeType === DecodingDataChangeType.Bidding,
      )
    ) {
      return t('signature_decoding_bid_nft_tooltip');
    }
  }
  return undefined;
};

const getStateChangeLabelMap = (
  t: ReturnType<typeof useI18nContext>,
  changeType: string,
) =>
  ({
    [DecodingDataChangeType.Transfer]: t('permitSimulationChange_transfer'),
    [DecodingDataChangeType.Receive]: t('permitSimulationChange_receive'),
    [DecodingDataChangeType.Approve]: t('permitSimulationChange_approve'),
    [DecodingDataChangeType.Revoke]: t('permitSimulationChange_revoke'),
    [DecodingDataChangeType.Bidding]: t('permitSimulationChange_bidding'),
    [DecodingDataChangeType.Listing]: t('permitSimulationChange_listing'),
  }[changeType]);

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
  const tooltip = getStateChangeToolip(stateChangeList, stateChange, t);
  const canDisplayValueAsUnlimited =
    assetType === TokenStandard.ERC20 &&
    (changeType === DecodingDataChangeType.Approve ||
      changeType === DecodingDataChangeType.Revoke);
  return (
    <ConfirmInfoRow
      label={shouldDisplayLabel ? getStateChangeLabelMap(t, changeType) : ''}
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
          credit={changeType === DecodingDataChangeType.Receive}
          debit={changeType === DecodingDataChangeType.Transfer}
          canDisplayValueAsUnlimited={canDisplayValueAsUnlimited}
        />
      )}
      {assetType === 'NATIVE' && (
        <NativeValueDisplay
          value={amount}
          chainId={chainId}
          credit={changeType === DecodingDataChangeType.Receive}
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
    const stateChangesGrouped: Record<string, DecodingDataStateChange[]> = (
      decodingData?.stateChanges ?? []
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
      isCollapsed={decodingLoading || !stateChangeFragment.length}
    />
  );
};

export default DecodedSimulation;
