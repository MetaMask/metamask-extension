import React from 'react';

import ActionableMessage from '../../../../components/ui/actionable-message';
import { Box, Text } from '../../../../components/component-library';
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
    <Box>
      <Text>
        {message}
        {learnMoreLink === undefined ? undefined : (
          <span>
            {' '}
            <a href="{learnMoreLink}" rel="noopener noreferrer" target="_blank">
              {t('learnMoreUpperCase') as string}
            </a>
          </span>
        )}
      </Text>
      {error === undefined ? undefined : (
        <Box style={{ marginTop: 2 }}>
          <ActionableMessage
            type={'danger'}
            message={error}
          ></ActionableMessage>
        </Box>
      )}
    </Box>
  );
};

export default SnapAccountErrorMessage;
