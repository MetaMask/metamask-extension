import React from 'react';
import PropTypes from 'prop-types';
import { Box, Text } from '../../../component-library';
import { SnapUIRenderer } from '../snap-ui-renderer';
import { useSnapPage } from './useSnapPage';

export const SnapPage = ({ snapId }) => {
  const { data, error, loading } = useSnapPage({ snapId });

  const content = !loading && !error && data?.content;

  return (
    <Box>
      {loading && <Text>Loading...</Text>}{' '}
      {content && <SnapUIRenderer snapId={snapId} data={content} />}
    </Box>
  );
};

SnapPage.propTypes = {
  snapId: PropTypes.string,
};
