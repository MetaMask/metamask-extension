import React, { useState } from 'react';
import classnames from 'classnames';
import {
  Box,
  BoxProps,
  Button,
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
import { ThemeType } from '../../../../shared/constants/preferences';
import { Skeleton } from '../../../components/component-library/skeleton';
import CancelMembershipModal from './cancel-membership-modal';

const TransactionShield = () => {
  const [isLoading] = useState(false);
  const [isCancelMembershipModalOpen, setIsCancelMembershipModalOpen] =
    useState(false);
  const [isActiveMembership, setIsActiveMembership] = useState(true);

  const shieldDetails = [
    {
      icon: IconName.ShieldLock,
      title: 'Covers $10,000 in transaction protection',
      description: 'Secures your assets from risky transactions',
    },
    {
      icon: IconName.Flash,
      title: 'Priority support',
      description: 'Get faster, dedicated support anytime',
    },
  ];

  const rowsStyleProps: BoxProps<'div'> = {
    display: Display.Flex,
    backgroundColor: BackgroundColor.backgroundSection,
    padding: 4,
  };

  const buttonRow = (label: string, onClick: () => void) => {
    return (
      <Box
        as="button"
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

  const billingDetails = (key: string, value: string) => {
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

  return (
    <Box
      className="transaction-shield-page"
      height={BlockSize.Full}
      width={BlockSize.Full}
      flexDirection={FlexDirection.Column}
      padding={4}
    >
      <Box className="transaction-shield-page__container" marginBottom={4}>
        <Box
          className={classnames(
            'transaction-shield-page__row transaction-shield-page__membership',
            {
              'transaction-shield-page__membership--loading': isLoading,
              'transaction-shield-page__membership--inactive':
                !isActiveMembership,
            },
          )}
          {...rowsStyleProps}
          data-theme={
            isLoading || !isActiveMembership ? undefined : ThemeType.dark
          }
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
                    ? 'Active membership'
                    : 'Inactive membership'}
                </Text>
                {isActiveMembership && (
                  <Tag
                    label="Free Trial"
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
                Membership ID: #SnJnwxwr1booC7
              </Text>
            )}
          </Box>
          {!isActiveMembership && (
            <Box>
              <Button
                size={ButtonSize.Sm}
                onClick={() => {
                  setIsActiveMembership(true);
                }}
              >
                Resubscribe
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
        {buttonRow('View full benefits', () => {
          console.log('View full benefits');
        })}
        {isActiveMembership &&
          buttonRow('Submit a case', () => {
            console.log('Submit a case');
          })}
        {isActiveMembership &&
          buttonRow('Cancel membership', () => {
            setIsCancelMembershipModalOpen(true);
          })}
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
            <Text variant={TextVariant.headingSm}>Billing details</Text>
          )}
          {billingDetails('Next billing', 'Apr 18, 2024')}
          {billingDetails('Charges', '8 USDT/month (Monthly)')}
          {billingDetails('Billing account', '0x187...190')}
          {billingDetails('Payment method', 'USDT')}
        </Box>
        {buttonRow('View billing history', () => {
          console.log('View billing history');
        })}
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
