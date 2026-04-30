import React, { useMemo } from 'react';
import { isValidAddress } from 'ethereumjs-util';
import { useSelector } from 'react-redux';

import { isSnapId } from '@metamask/snaps-utils';
import {
  TypedDataUtils,
  SignTypedDataVersion,
} from '@metamask/eth-sig-util';
import { ConfirmInfoAlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { parseTypedDataMessage } from '../../../../../../../shared/lib/transaction.utils';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowDivider,
  ConfirmInfoRowText,
  ConfirmInfoRowUrl,
} from '../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { ConfirmInfoExpandableRow } from '../../../../../../components/app/confirm/info/row/expandable-row';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { SignatureRequestType } from '../../../../types/confirm';
import { useGetTokenStandardAndDetails } from '../../../../hooks/useGetTokenStandardAndDetails';
import {
  isOrderSignatureRequest,
  isPermitSignatureRequest,
} from '../../../../utils';
import { useConfirmContext } from '../../../../context/confirm';
import { useTypesSignSimulationEnabledInfo } from '../../../../hooks/useTypesSignSimulationEnabledInfo';
import { ConfirmInfoRowTypedSignData } from '../../row/typed-sign-data/typedSignData';
import { NetworkRow } from '../shared/network-row/network-row';
import { SigningInWithRow } from '../shared/sign-in-with-row/sign-in-with-row';
import { TypedSignV4Simulation } from './typed-sign-v4-simulation';
import { computeEIP712Digest } from '../../../../../../../shared/lib/digest';
import { selectShowERC8213Digests } from '../../../../selectors/preferences';

const useTokenContract = () => {
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();

  if (!currentConfirmation?.msgParams) {
    return { chainId: '' };
  }

  const {
    domain: { verifyingContract },
    message: { spender },
  } = parseTypedDataMessage(currentConfirmation.msgParams.data as string);

  const isPermit = isPermitSignatureRequest(currentConfirmation);
  const isOrder = isOrderSignatureRequest(currentConfirmation);
  const tokenContract = isPermit || isOrder ? verifyingContract : undefined;
  const chainId = currentConfirmation.chainId as string;

  return { tokenContract, verifyingContract, spender, isPermit, chainId };
};

const EIP712DigestSection: React.FC = () => {
  const t = useI18nContext();
  const showDigests = useSelector(selectShowERC8213Digests);
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();

  const digests = useMemo(() => {
    if (!showDigests || !currentConfirmation?.msgParams?.data) {
      return null;
    }

    try {
      const msgData = currentConfirmation.msgParams.data as string;
      const parsedData = parseTypedDataMessage(msgData);

      const sanitizedData = TypedDataUtils.sanitizeData(
        parsedData as Parameters<typeof TypedDataUtils.sanitizeData>[0],
      );

      const domainSeparatorHex = TypedDataUtils.hashStruct(
        'EIP712Domain',
        sanitizedData.domain,
        sanitizedData.types,
        SignTypedDataVersion.V4,
      ).toString('hex');

      const messageHashHex = TypedDataUtils.hashStruct(
        sanitizedData.primaryType as string,
        sanitizedData.message,
        sanitizedData.types,
        SignTypedDataVersion.V4,
      ).toString('hex');

      const eip712Digest = computeEIP712Digest(
        domainSeparatorHex,
        messageHashHex,
      );

      return {
        eip712Digest,
        domainHash: `0x${domainSeparatorHex}`,
        messageHash: `0x${messageHashHex}`,
      };
    } catch {
      return null;
    }
  }, [showDigests, currentConfirmation]);

  if (!digests) {
    return null;
  }

  return (
    <ConfirmInfoSection data-testid="eip712-digest-section">
      <ConfirmInfoRow
        label={t('eip712Digest')}
        copyEnabled
        copyText={digests.eip712Digest}
        data-testid="eip712-digest-row"
      >
        <ConfirmInfoRowText text={digests.eip712Digest} />
      </ConfirmInfoRow>
      <ConfirmInfoExpandableRow
        label={t('domainHash')}
        copyEnabled
        copyText={digests.domainHash}
        data-testid="eip712-domain-hash-row"
        content={
          <ConfirmInfoRow
            label={t('messageHash')}
            copyEnabled
            copyText={digests.messageHash}
            data-testid="eip712-message-hash-row"
          >
            <ConfirmInfoRowText text={digests.messageHash} />
          </ConfirmInfoRow>
        }
      >
        <ConfirmInfoRowText text={digests.domainHash} />
      </ConfirmInfoExpandableRow>
    </ConfirmInfoSection>
  );
};

const TypedSignInfo: React.FC = () => {
  const t = useI18nContext();
  const isSimulationSupported = useTypesSignSimulationEnabledInfo();
  const { tokenContract, verifyingContract, spender, isPermit, chainId } =
    useTokenContract();
  const { decimalsNumber } = useGetTokenStandardAndDetails(
    tokenContract,
    chainId,
  );

  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();
  if (!currentConfirmation?.msgParams) {
    return null;
  }

  const toolTipMessage = isSnapId(currentConfirmation.msgParams.origin)
    ? t('requestFromInfoSnap')
    : t('requestFromInfo');
  const msgData = currentConfirmation.msgParams?.data as string;

  return (
    <>
      {isSimulationSupported && <TypedSignV4Simulation />}
      <ConfirmInfoSection data-testid="confirmation_request-section">
        {isPermit && (
          <>
            <ConfirmInfoAlertRow
              alertKey={RowAlertKey.Spender}
              ownerId={currentConfirmation.id}
              label={t('spender')}
            >
              <ConfirmInfoRowAddress address={spender} chainId={chainId} />
            </ConfirmInfoAlertRow>
            <ConfirmInfoRowDivider />
          </>
        )}
        <NetworkRow />
        <ConfirmInfoAlertRow
          alertKey={RowAlertKey.RequestFrom}
          ownerId={currentConfirmation.id}
          label={t('requestFrom')}
          tooltip={toolTipMessage}
        >
          <ConfirmInfoRowUrl url={currentConfirmation.msgParams.origin} />
        </ConfirmInfoAlertRow>
        {isValidAddress(verifyingContract) && (
          <ConfirmInfoAlertRow
            alertKey={RowAlertKey.InteractingWith}
            ownerId={currentConfirmation.id}
            label={t('interactingWith')}
            tooltip={t('interactingWithTransactionDescription')}
          >
            <ConfirmInfoRowAddress
              address={verifyingContract}
              chainId={chainId}
            />
          </ConfirmInfoAlertRow>
        )}
        <SigningInWithRow />
      </ConfirmInfoSection>
      <ConfirmInfoSection data-testid="confirmation_message-section">
        <ConfirmInfoRow
          label={t('message')}
          collapsed={isSimulationSupported}
          copyEnabled
          copyText={JSON.stringify(parseTypedDataMessage(msgData ?? {}))}
        >
          <ConfirmInfoRowTypedSignData
            data={msgData}
            tokenDecimals={decimalsNumber}
            chainId={chainId}
          />
        </ConfirmInfoRow>
      </ConfirmInfoSection>
      <EIP712DigestSection />
    </>
  );
};

export default TypedSignInfo;
