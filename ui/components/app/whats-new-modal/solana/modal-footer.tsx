import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { ModalFooterProps } from '../../../../../shared/notifications';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  AlignItems,
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { hasCreatedSolanaAccount } from '../../../../selectors';
import { selectIsAccountSyncingReadyToBeDispatched } from '../../../../selectors/identity/backup-and-sync';
import { getLastSelectedSolanaAccount } from '../../../../selectors/multichain';
import { setSelectedAccount } from '../../../../store/actions';
import {
  ModalFooter as BaseModalFooter,
  Box,
  Button,
  ButtonLink,
  ButtonLinkSize,
  ButtonSize,
  ButtonVariant,
} from '../../../component-library';

const SOLANA_FEATURE = 'solana';
const CREATE_SOLANA_ACCOUNT_ACTION = 'create-solana-account';
const GOT_IT_ACTION = 'got-it';

export const SolanaModalFooter = ({ onAction, onCancel }: ModalFooterProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const isLoading = !useSelector(selectIsAccountSyncingReadyToBeDispatched);
  const hasSolanaAccount = useSelector(hasCreatedSolanaAccount);
  const selectedSolanaAccount = useSelector(getLastSelectedSolanaAccount);
  const { trackEvent } = useContext(MetaMetricsContext);

  const handleCreateSolanaAccount = async () => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WhatsNewClicked,
      properties: {
        feature: SOLANA_FEATURE,
        action: CREATE_SOLANA_ACCOUNT_ACTION,
      },
    });
    await onAction();
  };

  const handleViewSolanaAccount = async () => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WhatsNewClicked,
      properties: {
        feature: SOLANA_FEATURE,
        action: GOT_IT_ACTION,
      },
    });
    onCancel();

    if (hasSolanaAccount && selectedSolanaAccount) {
      dispatch(setSelectedAccount(selectedSolanaAccount.address));
    }
  };

  let buttonTestId = 'create-solana-account-button';
  if (isLoading) {
    buttonTestId = 'loading-solana-account-button';
  } else if (hasSolanaAccount) {
    buttonTestId = 'view-solana-account-button';
  }

  let buttonText = t('createSolanaAccount');
  if (isLoading) {
    buttonText = '';
  } else if (hasSolanaAccount) {
    buttonText = t('viewSolanaAccount');
  }

  return (
    <>
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        <ButtonLink
          size={ButtonLinkSize.Sm}
          textProps={{
            alignItems: AlignItems.center,
          }}
          as="a"
          externalLink
          href={ZENDESK_URLS.SOLANA_ACCOUNTS}
        >
          {t('learnMoreAboutSolanaAccounts')}
        </ButtonLink>
      </Box>
      <BaseModalFooter paddingTop={2} data-testid="solana-modal-footer">
        <Button
          block
          size={ButtonSize.Md}
          variant={ButtonVariant.Primary}
          data-testid={buttonTestId}
          loading={isLoading}
          disabled={isLoading}
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={
            hasSolanaAccount
              ? handleViewSolanaAccount
              : handleCreateSolanaAccount
          }
        >
          {buttonText}
        </Button>
        <Button
          block
          size={ButtonSize.Sm}
          variant={ButtonVariant.Link}
          data-testid="not-now-button"
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={onCancel}
        >
          {t('notNow')}
        </Button>
      </BaseModalFooter>
    </>
  );
};
