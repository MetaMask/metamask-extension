import React from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import {
  TextVariant,
  OverflowWrap,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { Text } from '../../../component-library';

const Paragraph = (props) => (
  <Text
    {...props}
    variant={TextVariant.bodyMd}
    className="snap-ui-markdown__text"
    overflowWrap={OverflowWrap.BreakWord}
    color={TextColor.inherit}
  />
);

export const SnapUIMarkdown = ({ children, markdown }) => {
  if (markdown === false) {
    return <Paragraph>{children}</Paragraph>;
  }

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
  markdown: PropTypes.bool,
};
