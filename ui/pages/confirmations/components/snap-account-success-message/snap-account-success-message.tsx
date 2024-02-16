import React from 'react';

import { Text } from '../../../../components/component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SnapAccountCard } from '../../../remove-snap-account';

const SnapAccountSuccessMessage = ({
  message,
  address,
  learnMoreLink,
}: {
  message: string;
  address: string;
  learnMoreLink?: string;
}) => {
  const t = useI18nContext();

  return (
    <React.Fragment>
      <SnapAccountCard address={address} />
      <Text>
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
    </React.Fragment>
  );
};

export default SnapAccountSuccessMessage;
