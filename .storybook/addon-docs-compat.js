const React = require('react');

const Passthrough = ({ children }) =>
  React.createElement(React.Fragment, null, children);
const ArgsTable = () => null;
const Markdown = ({ children }) =>
  React.createElement(React.Fragment, null, children);
const Meta = () => null;

module.exports = {
  Canvas: Passthrough,
  Story: Passthrough,
  ArgsTable,
  Markdown,
  Meta,
  default: {},
};
