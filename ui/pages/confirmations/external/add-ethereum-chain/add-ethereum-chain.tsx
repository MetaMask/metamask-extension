import React from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from 'viem';
import {
  Box,
  IconSize,
  IconName,
  Text,
  TextVariant,
  Icon,
} from '@metamask/design-system-react';
import { IconName as LegacyIconName } from '../../../../components/component-library';
import { TextColor } from '../../../../helpers/constants/design-system';
import { ConfirmInfoSection } from '../../../../components/app/confirm/info/row/section';
import { ConfirmInfoRow } from '../../../../components/app/confirm/info/row';
import { useConfirmContext } from '../../context/confirm';
import { ConfirmInfoAlertRow } from '../../../../components/app/confirm/info/row/alert-row/alert-row';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import { AddEthereumChainContext } from './types';

export const AddEthereumChain = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<AddEthereumChainContext>();
  const { requestData, origin } = currentConfirmation;
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const networkConfig = networkConfigurations[requestData.chainId as Hex];

  const title = networkConfig
    ? t('updateNetworkConfirmationTitle', [networkConfig.name])
    : t('addNetworkConfirmationTitle', [requestData.chainName]);

  // TODO: Localize
  const description = 'A site is suggesting additional network details.';

  return (
    <>
      <Box className="text-center mb-4 mt-8">
        <Text variant={TextVariant.HeadingLg} className="text-balance mb-2">
          {title}
        </Text>
        <Text className="text-alternative">{description}</Text>
      </Box>

      <ConfirmInfoSection>
        <ConfirmInfoRow
          label={t('requestFrom')}
          color={TextColor.textAlternative}
        >
          <Box className="flex gap-1 items-center">
            <Icon name={IconName.Global} size={IconSize.Sm} />
            <Text>{origin}</Text>
          </Box>
        </ConfirmInfoRow>
      </ConfirmInfoSection>

      <ConfirmInfoSection>
        <ConfirmInfoAlertRow
          label={t('network')}
          color={TextColor.textAlternative}
          alertKey="network"
          ownerId={currentConfirmation.id}
        >
          <Text>{requestData.chainName}</Text>
        </ConfirmInfoAlertRow>

        <ConfirmInfoAlertRow
          label="RPC"
          color={TextColor.textAlternative}
          tooltip={t('networkURLDefinition')}
          tooltipIcon={LegacyIconName.Question}
          alertKey="rpcUrl"
          ownerId={currentConfirmation.id}
        >
          <Text>{requestData.rpcUrl}</Text>
        </ConfirmInfoAlertRow>
      </ConfirmInfoSection>

      <Text className="text-center">
        {t('watchOutMessage', [
          <a
            key="securityMessageLinkForNetworks"
            className="text-primary-default"
            href={ZENDESK_URLS.USER_GUIDE_CUSTOM_NETWORKS}
            target="__blank"
            rel="noreferrer"
          >
            {t('securityMessageLinkForNetworks')}
          </a>,
        ])}
      </Text>
    </>
  );
};
