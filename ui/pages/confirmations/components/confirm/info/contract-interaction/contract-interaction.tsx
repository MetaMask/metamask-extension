import { TransactionMeta } from '@metamask/transaction-controller';
import { isValidAddress } from 'ethereumjs-util';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EditGasModes } from '../../../../../../../shared/constants/gas';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowText,
  ConfirmInfoRowUrl,
} from '../../../../../../components/app/confirm/info/row';
import {
  Box,
  Icon,
  IconName,
  Text,
} from '../../../../../../components/component-library';
import { GasFeeContextProvider } from '../../../../../../contexts/gasFee';
import { TransactionModalContextProvider } from '../../../../../../contexts/transaction-modal';
import {
  BackgroundColor,
  BorderRadius,
  IconColor,
  OverflowWrap,
  TextVariant,
} from '../../../../../../helpers/constants/design-system';
import { useCopyToClipboard } from '../../../../../../hooks/useCopyToClipboard';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import {
  currentConfirmationSelector,
  getCustomNonceValue,
  getKnownMethodData,
  getNextSuggestedNonce,
  getUseCurrencyRateCheck,
  getUseNonceField,
  use4ByteResolutionSelector,
} from '../../../../../../selectors';
import {
  getContractMethodData,
  showModal,
  updateCustomNonce,
  getNextNonce,
} from '../../../../../../store/actions';
import AdvancedGasFeePopover from '../../../advanced-gas-fee-popover';
import ConfirmGasDisplayRedesign from '../../../confirm-gas-display/confirm-gas-display-redesign';
import EditGasFeePopover from '../../../edit-gas-fee-popover';
import EditGasPopover from '../../../edit-gas-popover/edit-gas-popover.component';
import FeeDetailsComponent from '../../../fee-details-component/fee-details-component';
import { SimulationDetails } from '../../../simulation-details';
import CopyRawData from '../../../transaction-decoding/components/ui/copy-raw-data';
import { useSupportsEIP1559 } from '../../hooks';
import Tooltip from '../../../../../../components/ui/tooltip';
import { getCustomTxParamsData } from '../../../../confirm-approve/confirm-approve.util';
import { parseStandardTokenTransactionData } from '../../../../../../../shared/modules/transaction.utils';
import { getTokenAddressParam } from '../../../../../../helpers/utils/token-util';

const ContractInteractionInfo: React.FC = () => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  if (!currentConfirmation?.txParams) {
    return null;
  }

  const dispatch = useDispatch();

  // 4 bytes resolution

  const use4ByteResolution = useSelector(use4ByteResolutionSelector);
  if (use4ByteResolution) {
    dispatch(getContractMethodData(currentConfirmation.txParams?.data));
  }

  const knownMethodData =
    useSelector((state) =>
      getKnownMethodData(state, currentConfirmation.txParams?.data),
    ) || {};

  // / 4 bytes resolution

  // Gas
  const [userAcknowledgedGasMissing, setUserAcknowledgedGasMissing] =
    React.useState(true);

  const [showCustomizeGasPopover, setShowCustomizeGasPopover] =
    React.useState(false);

  const closeCustomizeGasPopover = () => setShowCustomizeGasPopover(false);

  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);

  const { supportsEIP1559 } = useSupportsEIP1559(currentConfirmation);

  const useNonceField = useSelector(getUseNonceField);
  const nextNonce = useSelector(getNextSuggestedNonce);
  const customNonceValue = useSelector(getCustomNonceValue);

  const openModal = () =>
    dispatch(
      showModal({
        name: 'CUSTOMIZE_NONCE',
        useNonceField,
        nextNonce,
        customNonceValue,
        updateCustomNonce,
        getNextNonce,
      }),
    );

  // TODO pnf: What is it that we want for the data field?
  const getDataField = (rawData: string | undefined): string => {
    if (rawData) {
      const tokenData = parseStandardTokenTransactionData(rawData);

      if (tokenData) {
        let spender = getTokenAddressParam(tokenData);

        if (spender) {
          if (spender.startsWith('0x')) {
            spender = spender.substring(2);
          }
          const [signature, tokenValue] = rawData.split(spender);

          return `${signature}${spender}`;
        }
      }
    }
    return '';
  };

  const dataField = getDataField(currentConfirmation.txParams.data);

  const [copied, handleCopy] = useCopyToClipboard();

  return (
    <>
      <GasFeeContextProvider transaction={currentConfirmation}>
        <TransactionModalContextProvider>
          <Box
            backgroundColor={BackgroundColor.backgroundDefault}
            borderRadius={BorderRadius.MD}
            padding={2}
            marginBottom={4}
          >
            <SimulationDetails
              simulationData={currentConfirmation.simulationData}
              transactionId={currentConfirmation.id}
            />
          </Box>
          {/* Contract interaction section */}
          <Box
            backgroundColor={BackgroundColor.backgroundDefault}
            borderRadius={BorderRadius.MD}
            padding={2}
            marginBottom={4}
          >
            {currentConfirmation.origin ? (
              <ConfirmInfoRow
                label={t('requestFrom')}
                tooltip={t('requestFromInfo')}
              >
                <ConfirmInfoRowUrl url={currentConfirmation.origin} />
              </ConfirmInfoRow>
            ) : null}
            {currentConfirmation.txParams.to &&
              isValidAddress(currentConfirmation.txParams.to) && (
                <ConfirmInfoRow label={t('interactingWith')}>
                  <ConfirmInfoRowAddress
                    address={currentConfirmation.txParams.to}
                  />
                </ConfirmInfoRow>
              )}
            {knownMethodData?.name && (
              <ConfirmInfoRow label={'Method'}>
                <ConfirmInfoRowText text={knownMethodData.name} />
              </ConfirmInfoRow>
            )}
          </Box>
          <Box
            backgroundColor={BackgroundColor.backgroundDefault}
            borderRadius={BorderRadius.MD}
            padding={2}
            marginBottom={4}
          >
            <ConfirmGasDisplayRedesign
              userAcknowledgedGasMissing={userAcknowledgedGasMissing}
            />
            <FeeDetailsComponent
              useCurrencyRateCheck={useCurrencyRateCheck}
              txData={currentConfirmation}
            />
          </Box>
          {/* legacy popover */}
          {!supportsEIP1559 && showCustomizeGasPopover && (
            <EditGasPopover
              onClose={closeCustomizeGasPopover}
              mode={EditGasModes.modifyInPlace}
              transaction={currentConfirmation}
            />
          )}
          {/* 1559 popover and custom gas popover */}
          {supportsEIP1559 && (
            <>
              <EditGasFeePopover />
              <AdvancedGasFeePopover />
            </>
          )}

          <Box
            backgroundColor={BackgroundColor.backgroundDefault}
            borderRadius={BorderRadius.MD}
            padding={2}
            marginBottom={4}
          >
            <ConfirmInfoRow label={'Nonce'} tooltip={'Nonce tooltip text'}>
              <ConfirmInfoRowText text={`${nextNonce}`} />
              {useNonceField ? (
                <Icon
                  name={IconName.Edit}
                  color={IconColor.iconDefault}
                  onClick={() => (openModal as () => void)?.()}
                />
              ) : null}
            </ConfirmInfoRow>

            {dataField ? (
              <ConfirmInfoRow label={'Data'} tooltip={'Data tooltip text'}>
                <ConfirmInfoRowText text={dataField} />
              </ConfirmInfoRow>
            ) : null}

            <ConfirmInfoRow label={'Hex'} tooltip={'Hex tooltip text'}>
              <ConfirmInfoRowText
                text={currentConfirmation.txParams.data || ''}
              />
            </ConfirmInfoRow>

            <Tooltip
              position="right"
              title={copied ? t('copiedExclamation') : ''}
            >
              <button
                onClick={() => {
                  (handleCopy as (text: string) => void)?.(
                    currentConfirmation.txParams.data || '',
                  );
                }}
                className="copy-raw-data__button"
              >
                <div className="copy-raw-data__icon">
                  <Icon
                    name={copied ? IconName.CopySuccess : IconName.Copy}
                    color={IconColor.iconDefault}
                  />
                </div>
                <div className="copy-raw-data__label">
                  {t('copyRawTransactionData')}
                </div>
              </button>
            </Tooltip>
          </Box>
        </TransactionModalContextProvider>
      </GasFeeContextProvider>
    </>
  );
};

export default ContractInteractionInfo;
