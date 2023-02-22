import React from 'react';
import Box from '../../ui/box/box';

export const TokenList = () => {
  return <Box>Token List</Box>;
};

TokenList.propTypes = {
  /**
   * TokenList also accepts all props from Box
   */
  ...Box.propTypes,
};
