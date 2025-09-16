import React, { useMemo, useState } from 'react';
import classnames from 'classnames';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  BoxProps,
  Button,
  ButtonLink,
  ButtonSize,
  Icon,
  IconName,
  IconSize,
  Tag,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  BorderStyle,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Skeleton } from '../../../components/component-library/skeleton';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Tooltip from '../../../components/ui/tooltip';
import CancelMembershipModal from './cancel-membership-modal';

const MEMBERSHIP_ERROR_STATES = {
  INSUFFICIENT_TOKEN_BALANCE: 'insufficient_token_balance',
  DECLINED_CARD_PAYMENT: 'declined_card_payment',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  MEMBERSHIP_ENDING: 'membership_ending',
} as const;

type MembershipErrorState =
  (typeof MEMBERSHIP_ERROR_STATES)[keyof typeof MEMBERSHIP_ERROR_STATES];

const TransactionShield = () => {
  const t = useI18nContext();
  const [isLoading] = useState(false);
  const [isCancelMembershipModalOpen, setIsCancelMembershipModalOpen] =
    useState(false);
  const [isActiveMembership, setIsActiveMembership] = useState(true);
  const [membershipErrorState] = useState<MembershipErrorState | null>(
    MEMBERSHIP_ERROR_STATES.INSUFFICIENT_TOKEN_BALANCE,
  );

  const shieldDetails = [
    {
      icon: IconName.ShieldLock,
      title: t('shieldTxDetails1Title'),
      description: t('shieldTxDetails1Description'),
    },
    {
      icon: IconName.Flash,
      title: t('shieldTxDetails2Title'),
      description: t('shieldTxDetails2Description'),
    },
  ];

  const rowsStyleProps: BoxProps<'div'> = {
    display: Display.Flex,
    backgroundColor: BackgroundColor.backgroundSection,
    padding: 4,
  };

  const membershipErrorDetails: Record<
    MembershipErrorState,
    {
      description: string;
      severity: BannerAlertSeverity;
    }
  > = {
    [MEMBERSHIP_ERROR_STATES.INSUFFICIENT_TOKEN_BALANCE]: {
      description: t('shieldTxMembershipErrorInsufficientTokenBalance', [
        <ButtonLink
          key="update-payment"
          onClick={() => {
            console.log('update payment');
          }}
        >
          {t('shieldTxMembershipErrorUpdatePayment')}
        </ButtonLink>,
      ]),
      severity: BannerAlertSeverity.Danger,
    },
    [MEMBERSHIP_ERROR_STATES.DECLINED_CARD_PAYMENT]: {
      description: t('shieldTxMembershipErrorDeclinedCard', [
        <ButtonLink
          key="update-payment"
          onClick={() => {
            console.log('update payment');
          }}
        >
          {t('shieldTxMembershipErrorUpdatePayment')}
        </ButtonLink>,
      ]),
      severity: BannerAlertSeverity.Danger,
    },
    [MEMBERSHIP_ERROR_STATES.INSUFFICIENT_FUNDS]: {
      description: t('shieldTxMembershipErrorInsufficientFunds', [
        'April 18',
        <ButtonLink
          key="update-payment"
          onClick={() => {
            console.log('update payment');
          }}
        >
          {t('shieldTxMembershipErrorUpdatePayment')}
        </ButtonLink>,
      ]),
      severity: BannerAlertSeverity.Warning,
    },
    [MEMBERSHIP_ERROR_STATES.MEMBERSHIP_ENDING]: {
      description: t('shieldTxMembershipErrorMembershipEnding', [
        'April 18',
        <ButtonLink
          key="renew-now"
          onClick={() => {
            console.log('renew now');
          }}
        >
          {t('shieldTxMembershipErrorRenewNow')}
        </ButtonLink>,
      ]),
      severity: BannerAlertSeverity.Warning,
    },
  };

  const buttonRow = (label: string, onClick: () => void, id?: string) => {
    return (
      <Box
        as="button"
        data-testid={id}
        className="transaction-shield-page__row"
        {...rowsStyleProps}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
        width={BlockSize.Full}
        onClick={onClick}
      >
        {isLoading ? (
          <Skeleton width="50%" height={20} />
        ) : (
          <Text variant={TextVariant.bodyMdMedium}>{label}</Text>
        )}
        {isLoading ? (
          <Skeleton width={24} height={24} borderRadius={BorderRadius.full} />
        ) : (
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Lg}
            color={IconColor.iconAlternativeSoft}
          />
        )}
      </Box>
    );
  };

  const billingDetails = (key: string, value: string | React.ReactNode) => {
    return (
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        gap={2}
        justifyContent={JustifyContent.spaceBetween}
      >
        {isLoading ? (
          <Skeleton width="40%" height={24} />
        ) : (
          <Text variant={TextVariant.bodyMdMedium}>{key}</Text>
        )}
        {isLoading ? (
          <Skeleton width="30%" height={24} />
        ) : (
          <Text variant={TextVariant.bodyMdMedium}>{value}</Text>
        )}
      </Box>
    );
  };

  const paymentMethod = useMemo(() => {
    if (
      membershipErrorState ===
      MEMBERSHIP_ERROR_STATES.INSUFFICIENT_TOKEN_BALANCE
    ) {
      return (
        <Tooltip
          position="top"
          title={t('shieldTxMembershipErrorInsufficientTokenBalanceTooltip')}
        >
          <ButtonLink
            startIconName={IconName.Danger}
            danger
            onClick={() => {
              console.log('Insufficient USDT');
            }}
          >
            {t('shieldTxMembershipErrorInsufficientToken', ['USDT'])}
          </ButtonLink>
        </Tooltip>
      );
    }
    if (
      membershipErrorState === MEMBERSHIP_ERROR_STATES.DECLINED_CARD_PAYMENT
    ) {
      return (
        <Tooltip
          position="top"
          title={t('shieldTxMembershipErrorDeclinedCardTooltip')}
        >
          <ButtonLink
            startIconName={IconName.Danger}
            danger
            onClick={() => {
              console.log('Update card details');
            }}
          >
            {t('shieldTxMembershipErrorUpdateCardDetails')}
          </ButtonLink>
        </Tooltip>
      );
    }
    if (membershipErrorState === MEMBERSHIP_ERROR_STATES.INSUFFICIENT_FUNDS) {
      return (
        <ButtonLink
          startIconName={IconName.Danger}
          startIconProps={{
            color: IconColor.warningDefault,
          }}
          color={TextColor.warningDefault}
          onClick={() => {
            console.log('Insufficient funds');
          }}
        >
          USDT
        </ButtonLink>
      );
    }
    if (membershipErrorState === MEMBERSHIP_ERROR_STATES.MEMBERSHIP_ENDING) {
      return (
        <ButtonLink
          startIconName={IconName.Danger}
          startIconProps={{
            color: IconColor.warningDefault,
          }}
          color={TextColor.warningDefault}
          onClick={() => {
            console.log('Membership ending');
          }}
        >
          {t('shieldTxMembershipErrorInsufficientToken', ['USDT'])}
        </ButtonLink>
      );
    }
    return 'USDT';
  }, [membershipErrorState, t]);

  return (
    <Box
      className="transaction-shield-page"
      data-testid="transaction-shield-page"
      width={BlockSize.Full}
      flexDirection={FlexDirection.Column}
      padding={4}
    >
      {membershipErrorState !== null && (
        <BannerAlert
          severity={membershipErrorDetails[membershipErrorState].severity}
          marginBottom={4}
          descriptionProps={{
            variant: TextVariant.bodySm,
          }}
        >
          {membershipErrorDetails[membershipErrorState].description}
        </BannerAlert>
      )}

      <Box className="transaction-shield-page__container" marginBottom={4}>
        <Box
          className={classnames(
            'transaction-shield-page__row transaction-shield-page__membership',
            {
              'transaction-shield-page__membership--loading': isLoading,
              'transaction-shield-page__membership--inactive':
                !isActiveMembership && !isLoading,
              'transaction-shield-page__membership--active':
                isActiveMembership && !isLoading,
            },
          )}
          {...rowsStyleProps}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Box
            width={BlockSize.Full}
            gap={isLoading ? 2 : 0}
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
          >
            {isLoading ? (
              <Skeleton width="60%" height={20} />
            ) : (
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                gap={3}
              >
                <Text
                  variant={TextVariant.bodyMdBold}
                  className="transaction-shield-page__membership-text"
                >
                  {isActiveMembership
                    ? t('shieldTxMembershipActive')
                    : t('shieldTxMembershipInactive')}
                </Text>
                {isActiveMembership && (
                  <Tag
                    label={t('shieldTxMembershipFreeTrial')}
                    labelProps={{
                      variant: TextVariant.bodySmMedium,
                      color: TextColor.textAlternativeSoft,
                    }}
                    borderStyle={BorderStyle.none}
                    borderRadius={BorderRadius.SM}
                    backgroundColor={BackgroundColor.backgroundMuted}
                  />
                )}
              </Box>
            )}
            {isLoading ? (
              <Skeleton width="60%" height={16} />
            ) : (
              <Text
                variant={TextVariant.bodyXs}
                className="transaction-shield-page__membership-text"
              >
                {t('shieldTxMembershipId')}: 9s6XKzkNRiz8i3
              </Text>
            )}
          </Box>
          {!isActiveMembership && (
            <Box>
              <Button
                data-testid="shield-tx-membership-resubscribe-button"
                size={ButtonSize.Sm}
                onClick={() => {
                  setIsActiveMembership(true);
                }}
              >
                {t('shieldTxMembershipResubscribe')}
              </Button>
            </Box>
          )}
        </Box>

        <Box
          className="transaction-shield-page__row"
          {...rowsStyleProps}
          flexDirection={FlexDirection.Column}
          paddingTop={2}
          paddingBottom={2}
        >
          {shieldDetails.map((detail, index) => (
            <Box
              key={index}
              display={Display.Flex}
              alignItems={AlignItems.center}
              gap={2}
              paddingTop={2}
              paddingBottom={2}
            >
              {isLoading ? (
                <Skeleton
                  width={32}
                  height={32}
                  borderRadius={BorderRadius.full}
                  style={{ flexShrink: 0 }}
                />
              ) : (
                <Icon name={detail.icon} size={IconSize.Xl} />
              )}
              <Box
                width={BlockSize.Full}
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                gap={isLoading ? 2 : 0}
              >
                {isLoading ? (
                  <Skeleton width="100%" height={18} />
                ) : (
                  <Text variant={TextVariant.bodySmBold}>{detail.title}</Text>
                )}
                {isLoading ? (
                  <Skeleton width="100%" height={18} />
                ) : (
                  <Text
                    variant={TextVariant.bodySm}
                    color={TextColor.textAlternative}
                  >
                    {detail.description}
                  </Text>
                )}
              </Box>
            </Box>
          ))}
        </Box>
        {buttonRow(t('shieldTxMembershipViewFullBenefits'), () => {
          // todo: link to benefits page
        })}
        {isActiveMembership &&
          buttonRow(t('shieldTxMembershipSubmitCase'), () => {
            // todo: link to submit claim page
          })}
        {isActiveMembership &&
          buttonRow(
            t('shieldTxMembershipCancel'),
            () => {
              setIsCancelMembershipModalOpen(true);
            },
            'shield-tx-membership-cancel-button',
          )}
      </Box>

      <Box className="transaction-shield-page__container">
        <Box
          className="transaction-shield-page__row"
          {...rowsStyleProps}
          flexDirection={FlexDirection.Column}
          gap={2}
        >
          {isLoading ? (
            <Skeleton width="60%" height={24} />
          ) : (
            <Text variant={TextVariant.headingSm}>
              {t('shieldTxMembershipBillingDetails')}
            </Text>
          )}
          {billingDetails(
            t('shieldTxMembershipBillingDetailsNextBilling'),
            'Apr 18, 2024',
          )}
          {billingDetails(
            t('shieldTxMembershipBillingDetailsCharges'),
            '8 USDT/month (Monthly)',
          )}
          {billingDetails(
            t('shieldTxMembershipBillingDetailsBillingAccount'),
            '0x187...190',
          )}
          {billingDetails(
            t('shieldTxMembershipBillingDetailsPaymentMethod'),
            paymentMethod,
          )}
        </Box>
        {buttonRow(
          t('shieldTxMembershipBillingDetailsViewBillingHistory'),
          () => {
            // todo: link to billing history page
          },
        )}
      </Box>
      {isCancelMembershipModalOpen && (
        <CancelMembershipModal
          onClose={() => setIsCancelMembershipModalOpen(false)}
          onConfirm={() => {
            setIsActiveMembership(false);
            setIsCancelMembershipModalOpen(false);
          }}
        />
      )}
    </Box>
  );
};

export default TransactionShield;
