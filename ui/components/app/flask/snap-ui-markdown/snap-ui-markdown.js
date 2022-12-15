import React from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { TYPOGRAPHY } from '../../../../helpers/constants/design-system';
import Typography from '../../../ui/typography/typography';

const Paragraph = (props) => <Typography {...props} variant={TYPOGRAPHY.H6} />;

export const SnapUIMarkdown = ({ children }) => {
  return (
    <ReactMarkdown
      className="snap-ui-markdown__text"
      allowedElements={['p', 'strong', 'em']}
      components={{ p: Paragraph }}
    >
      {children}
    </ReactMarkdown>
  );
};

SnapUIMarkdown.propTypes = {
  children: PropTypes.string,
};
