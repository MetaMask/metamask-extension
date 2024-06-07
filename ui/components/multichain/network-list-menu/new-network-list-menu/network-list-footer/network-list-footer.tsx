import React from 'react';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  Box,
  ButtonSecondary,
  ButtonSecondarySize,
  IconName,
} from '../../../../component-library';
import {
  BackgroundColor,
  TextAlign,
  TextVariant,
  BlockSize,
} from '../../../../../helpers/constants/design-system';
import { ADD_NETWORK_ROUTE } from '../../../../../helpers/constants/routes';

const NetworkListFooter = ({ isPopUp }: { isPopUp: boolean }) => {
  const t = useI18nContext();
  const history = useHistory();
  const { platform } = global;

  return (
    <Box
      className="sticky-button-container"
      backgroundColor={BackgroundColor.backgroundDefault}
      textAlign={TextAlign.Center}
      padding={4}
    >
      <ButtonSecondary
        backgroundColor={BackgroundColor.backgroundDefault}
        textAlign={TextAlign.Center}
        variant={TextVariant.bodyMd}
        size={ButtonSecondarySize.Lg}
        width={BlockSize.FourFifths}
        startIconName={IconName.Add}
        onClick={() => {
          isPopUp
            ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-expect-error
              platform.openExtensionInBrowser(ADD_NETWORK_ROUTE)
            : history.push(ADD_NETWORK_ROUTE);
        }}
      >
        {t('addCustomNetwork')}
      </ButtonSecondary>
    </Box>
  );
};

export default NetworkListFooter;
