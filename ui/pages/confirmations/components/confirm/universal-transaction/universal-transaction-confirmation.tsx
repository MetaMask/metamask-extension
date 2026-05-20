import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { providerErrors } from '@metamask/rpc-errors';

import { calcTokenAmount } from '../../../../../../shared/lib/transactions-controller-utils';
import { ConfirmInfoRow } from '../../../../../components/app/confirm/info/row/row';
import { ConfirmInfoSection } from '../../../../../components/app/confirm/info/row/section';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
} from '../../../../../components/component-library';
import {
  Footer as PageFooter,
  Page,
} from '../../../../../components/multichain/pages/page';
import PulseLoader from '../../../../../components/ui/pulse-loader';
import { getIntlLocale } from '../../../../../ducks/locale/locale';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  rejectPendingApproval,
  resolvePendingApproval,
} from '../../../../../store/actions';
import { usePendingMultichainTransaction } from '../../../hooks/usePendingMultichainTransaction';
import { formatAmount } from '../../simulation-details/formatAmount';
import SendHeadingLayout from '../info/shared/send-heading-layout/send-heading-layout';

export function UniversalTransactionConfirmation() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const pendingTx = usePendingMultichainTransaction(id);
  const t = useI18nContext();
  const locale = useSelector(getIntlLocale);

  if (!pendingTx) {
    return (
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        height={BlockSize.Screen}
      >
        <PulseLoader />
      </Box>
    );
  }

  const handleConfirm = () => {
    if (id) {
      dispatch(resolvePendingApproval(id, {}));
    }
  };

  const handleReject = () => {
    if (id) {
      dispatch(
        rejectPendingApproval(
          id,
          providerErrors.userRejectedRequest().serialize(),
        ),
      );
    }
  };

  const nativeAssetTransferValue = calcTokenAmount(
    pendingTx.value,
    pendingTx.assetDecimals,
  );
  const roundedTransferValue = formatAmount(locale, nativeAssetTransferValue);

  const NetworkImage = (
    <AvatarToken name={pendingTx.assetSymbol} size={AvatarTokenSize.Xl} />
  );

  const NativeAssetAmount = (
    <Box paddingBottom={1}>
      <Text variant={TextVariant.headingLg} color={TextColor.inherit}>
        {`${roundedTransferValue} ${pendingTx.assetSymbol}`}
      </Text>
    </Box>
  );

  return (
    <Page className="confirm_wrapper">
      <Box padding={4}>
        <Text
          variant={TextVariant.headingLg}
          paddingTop={4}
          paddingBottom={2}
          textAlign={TextAlign.Center}
        >
          {t('send')}
        </Text>

        <SendHeadingLayout image={NetworkImage}>
          {NativeAssetAmount}
        </SendHeadingLayout>

        <ConfirmInfoSection>
          <ConfirmInfoRow label={t('transactionFlowNetwork')}>
            {pendingTx.chainNamespace === 'solana' ? 'Solana' : pendingTx.chain}
          </ConfirmInfoRow>
          <ConfirmInfoRow label={t('origin')}>{pendingTx.origin}</ConfirmInfoRow>
          <ConfirmInfoRow label={t('from')}>{pendingTx.from}</ConfirmInfoRow>
          <ConfirmInfoRow label={t('to')}>{pendingTx.to}</ConfirmInfoRow>
          <ConfirmInfoRow label={t('estimatedFee')}>
            {pendingTx.feeRaw
              ? `${formatAmount(
                  locale,
                  calcTokenAmount(pendingTx.feeRaw, pendingTx.assetDecimals),
                )} ${pendingTx.assetSymbol}`
              : ''}
          </ConfirmInfoRow>
        </ConfirmInfoSection>
      </Box>

      <PageFooter
        className="confirm-footer_page-footer"
        flexDirection={FlexDirection.Column}
      >
        <Box display={Display.Flex} flexDirection={FlexDirection.Row} gap={4}>
          <Button
            block
            data-testid="confirm-footer-cancel-button"
            onClick={handleReject}
            size={ButtonSize.Lg}
            variant={ButtonVariant.Secondary}
          >
            {t('cancel')}
          </Button>
          <Button
            block
            data-testid="confirm-footer-button"
            onClick={handleConfirm}
            size={ButtonSize.Lg}
          >
            {t('confirm')}
          </Button>
        </Box>
      </PageFooter>
    </Page>
  );
}
