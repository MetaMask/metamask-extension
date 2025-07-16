import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  Text,
  Box,
  IconName,
  ButtonIconSize,
  ButtonIcon,
} from '../../../components/component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

type CustodianListViewProps = {
  custodianList: React.ReactNode[];
};

const CustodianListView: React.FC<CustodianListViewProps> = ({
  custodianList,
}) => {
  const t = useI18nContext();
  const history = useHistory();

  return (
    <Box
      data-testid="connect-custodial-account"
      padding={4}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      width={BlockSize.Full}
    >
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        marginBottom={4}
        marginTop={4}
      >
        <ButtonIcon
          ariaLabel={t('back')}
          iconName={IconName.ArrowLeft}
          size={ButtonIconSize.Sm}
          color={IconColor.iconDefault}
          onClick={() => history.push(DEFAULT_ROUTE)}
          display={Display.Flex}
        />
        <Text>{t('back')}</Text>
      </Box>
      <Text as="h4" variant={TextVariant.bodyLgMedium} marginTop={4}>
        {t('connectCustodialAccountTitle')}
      </Text>
      <Text
        as="h6"
        color={TextColor.textDefault}
        marginTop={2}
        marginBottom={5}
      >
        {t('connectCustodialAccountMsg')}
      </Text>
      <Box>
        <Box as="ul" width={BlockSize.Full}>
          {custodianList}
        </Box>
      </Box>
    </Box>
  );
};

export default CustodianListView;
