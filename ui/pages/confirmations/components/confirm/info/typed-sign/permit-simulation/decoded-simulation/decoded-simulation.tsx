import React from 'react';
import {
  DecodingDataChangeType,
  DecodingDataStateChange,
  DecodingDataStateChanges,
} from '@metamask/signature-controller';
import { Hex } from '@metamask/utils';

import { TokenStandard } from '../../../../../../../../../shared/constants/transaction';
import { ConfirmInfoRow } from '../../../../../../../../components/app/confirm/info/row';
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
}: {
  stateChangeList: DecodingDataStateChanges | null;
  stateChange: DecodingDataStateChange;
  chainId: Hex;
}) => {
  const t = useI18nContext();
  const { assetType, changeType, amount, contractAddress, tokenID } =
    stateChange;
  const tooltip = getStateChangeToolip(stateChangeList, stateChange, t);
  return (
    <ConfirmInfoRow
      label={getStateChangeLabelMap(t, changeType)}
      tooltip={tooltip}
    >
      {(assetType === TokenStandard.ERC20 ||
        assetType === TokenStandard.ERC721) && (
        <TokenValueDisplay
          tokenContract={contractAddress}
          value={amount}
          chainId={chainId}
          tokenId={tokenID}
          credit={changeType === DecodingDataChangeType.Receive}
          debit={changeType === DecodingDataChangeType.Transfer}
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

  const stateChangeFragment = (decodingData?.stateChanges ?? []).map(
    (change: DecodingDataStateChange) => (
      <StateChangeRow
        stateChangeList={decodingData?.stateChanges ?? []}
        stateChange={change}
        chainId={chainId}
      />
    ),
  );

  return (
    <StaticSimulation
      title={t('simulationDetailsTitle')}
      titleTooltip={t('simulationDetailsTitleTooltip')}
      simulationElements={stateChangeFragment}
      isLoading={decodingLoading}
    />
  );
};

export default DecodedSimulation;
