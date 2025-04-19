import React, { useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { setSelectedAccount } from '../../../../store/actions';
import { ModalFooterProps } from '../../../../../shared/notifications';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { hasCreatedSolanaAccount } from '../../../../selectors';
import { getLastSelectedSolanaAccount } from '../../../../selectors/multichain';
import {
  ModalFooter as BaseModalFooter,
  Button,
  ButtonLinkSize,
  ButtonLink,
  ButtonSize,
  ButtonVariant,
  Box,
} from '../../../component-library';
import {
  Display,
  FlexDirection,
  AlignItems,
} from '../../../../helpers/constants/design-system';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';

const SOLANA_FEATURE = 'solana';
const CREATE_SOLANA_ACCOUNT_ACTION = 'create-solana-account';
const GOT_IT_ACTION = 'got-it';

export const SolanaModalFooter = ({ onAction, onCancel }: ModalFooterProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const hasSolanaAccount = useSelector(hasCreatedSolanaAccount);
  const selectedSolanaAccount = useSelector(getLastSelectedSolanaAccount);
  const trackEvent = useContext(MetaMetricsContext);

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
          data-testid={
            hasSolanaAccount
              ? 'view-solana-account-button'
              : 'create-solana-account-button'
          }
          onClick={
            hasSolanaAccount
              ? handleViewSolanaAccount
              : handleCreateSolanaAccount
          }
        >
          {hasSolanaAccount ? t('viewSolanaAccount') : t('createSolanaAccount')}
        </Button>
        <Button
          block
          size={ButtonSize.Sm}
          variant={ButtonVariant.Link}
          data-testid="not-now-button"
          onClick={onCancel}
        >
          {t('notNow')}
        </Button>
      </BaseModalFooter>
    </>
  );
};
