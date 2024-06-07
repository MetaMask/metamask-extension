import React from 'react';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  HeaderBase,
  ButtonIcon,
  Text,
  ButtonIconSize,
  IconName,
} from '../../../../component-library';
import {
  TextVariant,
  TextAlign,
} from '../../../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../../../helpers/constants/routes';

const NetworkListHeader = ({
  isModal,
  onClose,
}: {
  isModal: boolean;
  onClose: () => void;
}) => {
  const t = useI18nContext();
  const history = useHistory();

  const redirectToDefaultRoute = () => {
    history.push({
      pathname: DEFAULT_ROUTE,
    });
  };

  return (
    <HeaderBase
      paddingTop={5}
      paddingBottom={5}
      paddingLeft={4}
      paddingRight={4}
      startAccessory={
        isModal ? null : (
          <ButtonIcon
            size={ButtonIconSize.Sm}
            iconName={IconName.ArrowLeft}
            ariaLabel="back"
            onClick={redirectToDefaultRoute}
          />
        )
      }
      endAccessory={
        <ButtonIcon
          size={ButtonIconSize.Sm}
          iconName={IconName.Close}
          ariaLabel="close"
          onClick={isModal ? onClose : redirectToDefaultRoute}
        />
      }
    >
      <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
        {t('networkMenuHeading')}
      </Text>
    </HeaderBase>
  );
};

export default NetworkListHeader;
