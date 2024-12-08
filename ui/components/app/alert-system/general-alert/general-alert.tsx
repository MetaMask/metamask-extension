import React, { useCallback } from 'react';
import {
  BannerAlert,
  Box,
  ButtonLink,
  ButtonLinkSize,
  Text,
} from '../../../component-library';
import Disclosure from '../../../ui/disclosure';
import { DisclosureVariant } from '../../../ui/disclosure/disclosure.constants';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Display,
  FontWeight,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { SecurityProvider } from '../../../../../shared/constants/security-provider';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import { getBannerAlertSeverity } from '../utils';
import { AlertProvider } from '../alert-provider';
import { AlertSeverity } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { useAlertActionHandler } from '../contexts/alertActionHandler';

export type GeneralAlertProps = {
  description: string;
  details?: React.ReactNode | string[];
  onClickSupportLink?: () => void;
  provider?: SecurityProvider;
  reportUrl?: string;
  severity: AlertSeverity;
  title?: string;
  actions?: { key: string; label: string }[];
};

function ReportLink({
  reportUrl,
  provider,
  onClickSupportLink,
}: {
  reportUrl?: string;
  provider?: SecurityProvider;
  onClickSupportLink?: () => void;
}) {
  const t = useI18nContext();
  return (
    <Text marginTop={1} display={Display.Flex}>
      {t('somethingDoesntLookRight', [
        <ButtonLink
          key={`security-provider-button-supporturl-${provider}`}
          size={ButtonLinkSize.Inherit}
          href={reportUrl ?? ZENDESK_URLS.SUPPORT_URL}
          externalLink
          onClick={onClickSupportLink}
        >
          {t('reportIssue')}
        </ButtonLink>,
      ])}
    </Text>
  );
}

function AlertDetails({
  details,
  reportUrl,
  onClickSupportLink,
  provider,
}: {
  details?: React.ReactNode | string[];
  reportUrl?: string;
  onClickSupportLink?: () => void;
  provider?: SecurityProvider;
}) {
  const t = useI18nContext();
  if (!details) {
    return null;
  }

  return (
    <Box marginTop={1}>
      <Disclosure title={t('seeDetails')} variant={DisclosureVariant.Arrow}>
        {details instanceof Array ? (
          <Box>
            <Box as="ul" className="alert-modal__alert-details" paddingLeft={6}>
              {details.map((detail, index) => (
                <Box as="li" key={`disclosure-detail-${index}`}>
                  <Text
                    variant={TextVariant.bodyMdMedium}
                    fontWeight={FontWeight.Normal}
                  >
                    {detail}
                  </Text>
                </Box>
              ))}
            </Box>
            <ReportLink
              reportUrl={reportUrl}
              provider={provider}
              onClickSupportLink={onClickSupportLink}
            />
          </Box>
        ) : (
          details
        )}
      </Disclosure>
    </Box>
  );
}

function GeneralAlert({
  description,
  details,
  onClickSupportLink,
  provider,
  severity,
  title,
  reportUrl,
  actions,
  ...props
}: GeneralAlertProps) {
  const { processAction } = useAlertActionHandler();

  const actionClose = actions?.find((action) =>
    action.key.startsWith('onClose'),
  );

  const handleClick = useCallback(() => {
    if (!actionClose) {
      return;
    }
    processAction(actionClose.key);
  }, [actions, processAction]);

  return (
    <BannerAlert
      title={title}
      severity={getBannerAlertSeverity(severity)}
      description={description}
      onClose={actionClose ? handleClick : undefined}
      {...props}
    >
      <AlertDetails
        details={details}
        reportUrl={reportUrl}
        onClickSupportLink={onClickSupportLink}
        provider={provider}
      />
      <AlertProvider provider={provider} />
    </BannerAlert>
  );
}

export default GeneralAlert;
