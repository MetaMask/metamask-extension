import React from 'react';

import { Box, Text } from '../../../../components/component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SnapAccountCard } from '../../../remove-snap-account';
import { ResultContext } from '../../../confirmations/confirmation/util';

const SnapAccountSuccessMessage = ({
  message,
  address,
  learnMoreLink,
  resultContext,
}: {
  message: string;
  address: string;
  learnMoreLink?: string;
  resultContext?: ResultContext;
}) => {
  const t = useI18nContext();

  if (resultContext) {
    resultContext.onSubmit.then(() => console.log(`on approval submit: ${resultContext.type}`));
  }

  return (
    <Box>
      <SnapAccountCard address={address} />
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
    </Box>
  );
};

export default SnapAccountSuccessMessage;
