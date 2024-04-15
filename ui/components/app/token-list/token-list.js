import React from 'react';
import PropTypes from 'prop-types';
import TokenCell from '../token-cell';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Box } from '../../component-library';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';

export default function TokenList({ onTokenClick, tokens, loading = false }) {
  const t = useI18nContext();

  if (loading) {
    return (
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        padding={7}
        data-testid="token-list-loading-message"
      >
        {t('loadingTokens')}
      </Box>
    );
  }

  return (
    <div>
      {tokens.map((tokenData, index) => (
        <TokenCell key={index} {...tokenData} onClick={onTokenClick} />
      ))}
    </div>
  );
}

TokenList.propTypes = {
  onTokenClick: PropTypes.func.isRequired,
  tokens: PropTypes.array.isRequired,
  loading: PropTypes.bool,
};
