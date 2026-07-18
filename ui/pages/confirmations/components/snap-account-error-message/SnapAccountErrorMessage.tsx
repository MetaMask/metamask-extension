import React from 'react';

import { Text, BannerAlert, BannerAlertSeverity } from '../../../../components/component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const SnapAccountErrorMessage = ({
  message,
  learnMoreLink,
  error,
}: {
  message: string;
  learnMoreLink?: string;
  error?: string;
}) => {
  const t = useI18nContext();

  return (
    <>
      <Text
        data-testid="snap-account-error-message-text"
        style={error ? { marginBottom: 2 } : {}}
      >
        {message}
        {Boolean(learnMoreLink) && (
          <>
            {' '}
            <a
              data-testid="snap-account-error-message-learn-more-link"
              href={learnMoreLink}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t('learnMoreUpperCase') as string}
            </a>
          </>
        )}
      </Text>
      {Boolean(error) && (
        <BannerAlert
          severity={BannerAlertSeverity.Danger}
          data-testid="snap-account-error-message-error"
        >
          {error}
        </BannerAlert>
      )}
    </>
  );
};

export default SnapAccountErrorMessage;
