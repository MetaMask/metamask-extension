import React from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import {
  TypographyVariant,
  OVERFLOW_WRAP,
} from '../../../../helpers/constants/design-system';
import Typography from '../../../ui/typography/typography';

const Paragraph = (props) => (
  <Typography
    {...props}
    variant={TypographyVariant.H6}
    className="snap-ui-markdown__text"
    overflowWrap={OVERFLOW_WRAP.BREAK_WORD}
  />
);

export const SnapUIMarkdown = ({ children }) => {
  return (
    <ReactMarkdown
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
