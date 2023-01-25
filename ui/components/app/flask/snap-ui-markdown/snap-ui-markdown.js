import React from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { TYPOGRAPHY } from '../../../../helpers/constants/design-system';
import Typography from '../../../ui/typography/typography';

const Paragraph = (customProps) => {
  const ParagraphComponent = (props) => (
    <Typography
      {...props}
      color={customProps.color}
      variant={TYPOGRAPHY.H6}
      className="snap-ui-markdown__text"
    />
  );
  return ParagraphComponent;
};

export const SnapUIMarkdown = ({ children, color }) => {
  return (
    <ReactMarkdown
      allowedElements={['p', 'strong', 'em']}
      components={{ p: Paragraph({ color }) }}
    >
      {children}
    </ReactMarkdown>
  );
};

SnapUIMarkdown.propTypes = {
  children: PropTypes.string,
  color: PropTypes.string,
};
