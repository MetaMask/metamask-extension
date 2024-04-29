import React from 'react';
import { useSelector } from 'react-redux';

import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
  ConfirmInfoRowUrl,
} from '../../../../../../components/app/confirm/info/row';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../../selectors';
import { Box } from '../../../../../../components/component-library';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../../helpers/constants/design-system';
import {
  hexToText,
  sanitizeString,
} from '../../../../../../helpers/utils/util';
import { SignatureRequestType } from '../../../../types/confirm';

const PersonalSignInfo: React.FC = () => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as SignatureRequestType;

  if (!currentConfirmation?.msgParams) {
    return null;
  }

  return (
    <>
      <Box
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.MD}
        padding={2}
        marginBottom={4}
      >
        <ConfirmInfoRow label={t('requestFrom')} tooltip={t('requestFromInfo')}>
          <ConfirmInfoRowUrl url={currentConfirmation.msgParams.origin} />
        </ConfirmInfoRow>
      </Box>
      <Box
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.MD}
        padding={2}
        marginBottom={4}
      >
        <ConfirmInfoRow label={t('message')}>
          <ConfirmInfoRowText
            text={sanitizeString(
              hexToText(currentConfirmation.msgParams?.data),
            )}
          />
        </ConfirmInfoRow>
      </Box>
    </>
  );
};

export default PersonalSignInfo;
