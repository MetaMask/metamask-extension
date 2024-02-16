import React from 'react';

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
  const t = useI18nContext();

  return (
    <React.Fragment>
      <Text style={error ? { marginBottom: 2 } : {}}>
        {message}
        {learnMoreLink && (
          <React.Fragment>
            {' '}
            <a href={learnMoreLink} rel="noopener noreferrer" target="_blank">
              {t('learnMoreUpperCase') as string}
            </a>
          </React.Fragment>
        )}
      </Text>
      {error && (
        <ActionableMessage type={'danger'} message={error}></ActionableMessage>
      )}
    </React.Fragment>
  );
};

export default SnapAccountErrorMessage;
