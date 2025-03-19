import React from 'react';
import { useDispatch } from 'react-redux';
import classnames from 'classnames';
import {
  ButtonLink,
  IconName,
  Box,
  ButtonLinkSize,
} from '../../component-library';
import { AlignItems, Display } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { detectTokens } from '../../../store/actions';
import type { BoxProps } from '../../component-library/box';
import type { ImportTokenLinkProps } from './import-token-link.types';

export const ImportTokenLink: React.FC<ImportTokenLinkProps> = ({
  className = '',
  ...props
}): JSX.Element => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  return (
    <Box
      className={classnames('multichain-import-token-link', className)}
      {...(props as BoxProps<'div'>)}
    >
      <Box display={Display.Flex} alignItems={AlignItems.center} paddingTop={2}>
        <ButtonLink
          size={ButtonLinkSize.Md}
          startIconName={IconName.Refresh}
          data-testid="refresh-list-button"
          onClick={() => dispatch(detectTokens())}
        >
          {t('refreshList')}
        </ButtonLink>
      </Box>
    </Box>
  );
};
