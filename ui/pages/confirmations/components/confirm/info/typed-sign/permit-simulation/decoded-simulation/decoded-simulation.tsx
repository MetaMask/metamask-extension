import React from 'react';
import {
  DecodingDataChangeType,
  DecodingDataStateChange,
} from '@metamask/signature-controller';
import { Hex } from '@metamask/utils';

import { TokenStandard } from '../../../../../../../../../shared/constants/transaction';
import {
  Box,
  Text,
} from '../../../../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../../hooks/useI18nContext';
import { SignatureRequestType } from '../../../../../../types/confirm';
import { useConfirmContext } from '../../../../../../context/confirm';
import StaticSimulation from '../../../shared/static-simulation/static-simulation';
import PermitSimulationValueDisplay from '../value-display/value-display';

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
  stateChange,
  chainId,
}: {
  stateChange: DecodingDataStateChange;
  chainId: Hex;
}) => {
  const t = useI18nContext();
  const { assetType, changeType, amount, contractAddress, tokenID } =
    stateChange;
  return (
    <Box>
      <Text
        variant={TextVariant.bodyMdMedium}
        color={TextColor.inherit}
        marginLeft={2}
      >
        {getStateChangeLabelMap(t, changeType)}
      </Text>
      {(assetType === TokenStandard.ERC20 ||
        assetType === TokenStandard.ERC721) && (
        <PermitSimulationValueDisplay
          tokenContract={contractAddress}
          value={amount}
          chainId={chainId}
          tokenId={tokenID}
          credit={changeType === DecodingDataChangeType.Receive}
          debit={changeType === DecodingDataChangeType.Transfer}
        />
      )}
    </Box>
  );
};

const DecodedSimulation: React.FC<object> = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();
  const chainId = currentConfirmation.chainId as Hex;
  const { decodingLoading, decodingData } = currentConfirmation;

  const stateChangeFragment = (decodingData?.stateChanges ?? []).map(
    (change: DecodingDataStateChange) => (
      <StateChangeRow stateChange={change} chainId={chainId} />
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
