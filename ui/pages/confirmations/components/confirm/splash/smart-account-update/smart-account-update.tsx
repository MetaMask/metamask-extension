import { NameType } from '@metamask/name-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React, { useState } from 'react';

import { SMART_ACCOUNT_INFO_LINK } from '../../../../../../../shared/lib/ui-utils';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import Name from '../../../../../../components/app/name';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
} from '../../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../context/confirm';
import { useSmartAccountActions } from '../../../../hooks/useSmartAccountActions';

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function SmartAccountUpdate() {
  const [acknowledged, setAcknowledged] = useState(false);

  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { chainId, txParams } = currentConfirmation ?? {};
  const { from } = txParams;

  const { handleRejectUpgrade } = useSmartAccountActions();

  if (!currentConfirmation || acknowledged) {
    return null;
  }

  return (
    <Box
      display={Display.Flex}
      backgroundColor={BackgroundColor.overlayDefault}
      color={TextColor.primaryDefault}
      className="smart-account-update__wrapper"
    >
      <Box
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.MD}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        margin={4}
        padding={4}
        className="smart-account-update__inner"
      >
        <img
          width="100%"
          src="./images/smart-transactions/smart-account-update.svg"
        />
        <Text fontWeight={FontWeight.Medium} variant={TextVariant.headingLg}>
          {t('smartAccountSplashTitle')}
        </Text>
        <Box display={Display.Flex} alignItems={AlignItems.center}>
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMd}
            marginInlineEnd={2}
          >
            {t('smartAccountRequestFor')}
          </Text>
          <Name
            value={from}
            type={NameType.ETHEREUM_ADDRESS}
            preferContractSymbol
            variation={chainId}
          />
        </Box>
        <Box display={Display.Flex} alignItems={AlignItems.flexStart}>
          <img width="24px" src="./images/speedometer.svg" />
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            marginInlineStart={2}
          >
            <Text
              color={TextColor.textDefault}
              variant={TextVariant.bodyMd}
              fontWeight={FontWeight.Medium}
            >
              {t('smartAccountBetterTransaction')}
            </Text>
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMd}
              fontWeight={FontWeight.Normal}
            >
              {t('smartAccountBetterTransactionDescription')}
            </Text>
          </Box>
        </Box>
        <Box display={Display.Flex} alignItems={AlignItems.flexStart}>
          <img width="24px" src="./images/petrol-pump.svg" />
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            marginInlineStart={2}
          >
            <Text
              color={TextColor.textDefault}
              variant={TextVariant.bodyMd}
              fontWeight={FontWeight.Medium}
            >
              {t('smartAccountPayToken')}
            </Text>
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMd}
              fontWeight={FontWeight.Normal}
            >
              {t('smartAccountPayTokenDescription')}
            </Text>
          </Box>
        </Box>
        <Box display={Display.Flex} alignItems={AlignItems.flexStart}>
          <img width="24px" src="./images/sparkle.svg" />
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            marginInlineStart={2}
          >
            <Text
              color={TextColor.textDefault}
              variant={TextVariant.bodyMd}
              fontWeight={FontWeight.Medium}
            >
              {t('smartAccountFeatures')}
            </Text>
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMd}
              fontWeight={FontWeight.Normal}
            >
              {t('smartAccountFeaturesDescription')}{' '}
              <a
                key="learn_more_link"
                href={SMART_ACCOUNT_INFO_LINK}
                rel="noopener noreferrer"
                target="_blank"
              >
                {t('learnMoreUpperCaseWithDot')}
              </a>
            </Text>
          </Box>
        </Box>
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31879
          onClick={handleRejectUpgrade}
          width={BlockSize.Full}
        >
          {t('smartAccountReject')}
        </Button>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          onClick={() => setAcknowledged(true)}
          width={BlockSize.Full}
        >
          {t('smartAccountAccept')}
        </Button>
      </Box>
    </Box>
  );
}
