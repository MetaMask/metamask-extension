import PropTypes from 'prop-types';

export const SectionShape = {
  props: PropTypes.object,
  element: PropTypes.string,
  key: PropTypes.string,
};

export const ValidChildren = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape(SectionShape),
  PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.shape(SectionShape), PropTypes.string]),
  ),
]);

SectionShape.children = ValidChildren;
