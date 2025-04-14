// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import ActionableMessage from '../../../../components/ui/actionable-message';
import { Text } from '../../../../components/component-library';
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
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
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
        <ActionableMessage
          type={'danger'}
          message={error}
          dataTestId={'snap-account-error-message-error'}
        ></ActionableMessage>
      )}
    </>
  );
};

export default SnapAccountErrorMessage;
