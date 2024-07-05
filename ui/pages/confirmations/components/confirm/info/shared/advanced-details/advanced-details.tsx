import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ConfirmInfoRow,
  ConfirmInfoRowDivider,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
} from '../../../../../../../components/component-library';
import Tooltip from '../../../../../../../components/ui/tooltip';
import { useCopyToClipboard } from '../../../../../../../hooks/useCopyToClipboard';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import {
  currentConfirmationSelector,
  getCustomNonceValue,
  getNextSuggestedNonce,
  getUseNonceField,
} from '../../../../../../../selectors';
import {
  getNextNonce,
  showModal,
  updateCustomNonce,
} from '../../../../../../../store/actions';
import { useKnownMethodDataInTransaction } from '../../hooks/known-method-data-in-transaction';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';

const getMethodDataString = (rawMethodData: {
  name: string;
  params: { type: string }[];
}): string => {
  const paramsStr = rawMethodData.params.map((param) => param.type).join(',');
  const result = `FUNCTION TYPE: ${rawMethodData.name} (${paramsStr})`;

  return result;
};

const NonceDetails = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getNextNonce());
  }, [dispatch]);

  const enableCustomNonce = useSelector(getUseNonceField);
  const nextNonce = useSelector(getNextSuggestedNonce);
  const customNonceValue = useSelector(getCustomNonceValue);

  const openEditNonceModal = () =>
    dispatch(
      showModal({
        name: 'CUSTOMIZE_NONCE',
        customNonceValue,
        nextNonce,
        updateCustomNonce: (value: string) => {
          dispatch(updateCustomNonce(value));
        },
        getNextNonce,
      }),
    );

  const displayedNonce = customNonceValue || nextNonce;

  return (
    <ConfirmInfoRow
      label={t('advancedDetailsNonceDesc')}
      tooltip={t('advancedDetailsNonceTooltip')}
    >
      <ConfirmInfoRowText
        text={`${displayedNonce}`}
        onEditClick={enableCustomNonce ? () => openEditNonceModal() : undefined}
        editIconClassName="edit-nonce-btn"
      />
    </ConfirmInfoRow>
  );
};

const DataDetails = () => {
  const t = useI18nContext();

  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  const { knownMethodData } =
    useKnownMethodDataInTransaction(currentConfirmation);

  if (!knownMethodData?.name) {
    return null;
  }

  const methodDataString = getMethodDataString(knownMethodData);

  return (
    <>
      <ConfirmInfoRowDivider />
      <ConfirmInfoRow label={t('advancedDetailsDataDesc')}>
        <ConfirmInfoRowText text={methodDataString} />
      </ConfirmInfoRow>
    </>
  );
};

const HexDetails = () => {
  const t = useI18nContext();

  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  const [copied, handleCopy] = useCopyToClipboard();

  if (!currentConfirmation?.txParams?.data) {
    return null;
  }

  return (
    <>
      <ConfirmInfoRowDivider />
      <ConfirmInfoRow
        label={t('advancedDetailsHexDesc')}
        copyEnabled
        copyText={currentConfirmation.txParams.data || ''}
      >
        <ConfirmInfoRowText text={currentConfirmation.txParams.data || ''} />
      </ConfirmInfoRow>
      <Box paddingLeft={2}>
        <Tooltip position="right" title={copied ? t('copiedExclamation') : ''}>
          <Button
            onClick={() => {
              (handleCopy as (text: string) => void)?.(
                currentConfirmation.txParams.data || '',
              );
            }}
            variant={ButtonVariant.Link}
            size={ButtonSize.Lg}
            startIconName={copied ? IconName.CopySuccess : IconName.Copy}
          >
            {t('copyRawTransactionData')}
          </Button>
        </Tooltip>
      </Box>
    </>
  );
};

export const AdvancedDetails: React.FC = () => {
  return (
    <ConfirmInfoSection>
      <NonceDetails />
      <DataDetails />
      <HexDetails />
    </ConfirmInfoSection>
  );
};
