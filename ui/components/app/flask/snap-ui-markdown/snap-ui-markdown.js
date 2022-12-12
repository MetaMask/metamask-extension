import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { TYPOGRAPHY } from '../../../../helpers/constants/design-system';
import Typography from '../../../ui/typography/typography';

export const SnapUIMarkdown = ({ children }) => {
  return (
    <Typography variant={TYPOGRAPHY.H6}>
      <ReactMarkdown
        className="snap-ui-markdown__text"
        allowedElements={['p', 'strong', 'em']}
        components={{ p: Fragment }}
      >
        {children}
      </ReactMarkdown>
    </Typography>
  );
};

SnapUIMarkdown.propTypes = {
  children: PropTypes.string,
};
