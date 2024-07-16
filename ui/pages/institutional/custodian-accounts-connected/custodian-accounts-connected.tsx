import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  Text,
  Box,
  Button,
  ButtonVariant,
  ButtonSize,
} from '../../../components/component-library';
import {
  FontWeight,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

const CustodianAccountsConnected: React.FC = () => {
  const t = useI18nContext();
  const history = useHistory();

  return (
    <Box className="page-container">
      <Box
        data-testid="custody-accounts-empty"
        padding={7}
        className="page-container__content"
      >
        <Text
          marginBottom={2}
          fontWeight={FontWeight.Bold}
          color={TextColor.textDefault}
          variant={TextVariant.bodyLgMedium}
        >
          {t('allCustodianAccountsConnectedTitle')}
        </Text>
        <Text variant={TextVariant.bodyMd}>
          {t('allCustodianAccountsConnectedSubtitle')}
        </Text>
      </Box>
      <Box as="footer" className="page-container__footer" padding={4}>
        <Button
          block
          size={ButtonSize.Lg}
          type={ButtonVariant.Secondary}
          onClick={() => history.push(DEFAULT_ROUTE)}
        >
          {t('close')}
        </Button>
      </Box>
    </Box>
  );
};

export default CustodianAccountsConnected;
