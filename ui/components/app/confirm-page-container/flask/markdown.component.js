import React from 'react';
import ReactMarkdown from 'react-markdown';

export const Markdown = ({ source }) => (
  <ReactMarkdown skipHtml>{source}</ReactMarkdown>
);
