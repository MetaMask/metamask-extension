import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { safeComponentList } from './safe-component-list'

const MetaMaskTemplateRenderer = ({ sections }) => {
  if (!sections) {
    return null
  }
  if (typeof sections === 'string') {
    return sections
  }
  return (
    <>
      {sections.reduce((acc, child, index) => {
        // React can render strings directly, so push them into the accumulator
        if (typeof child === 'string') {
          acc.push(child)
        } else if (child) {
          // The other option is one of our Sections, which contains
          // element, children, and props.
          const { element, children, props } = child
          const Element = safeComponentList[element]
          if (!Element) {
            console.warn(
              `${element} is not in the safe component list and will not be rendered`,
            )
          }
          const childrenOrNull =
            Element && children ? (
              <MetaMaskTemplateRenderer sections={children} />
            ) : null
          if (Element) {
            acc.push(
              <Element key={`${element}${index + 0}`} {...props}>
                {childrenOrNull}
              </Element>,
            )
          }
        }
        return acc
      }, [])}
    </>
  )
}

const SectionShape = {
  props: PropTypes.object,
  element: PropTypes.oneOf(Object.keys(safeComponentList)),
}

const ValidChildren = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.shape(SectionShape), PropTypes.string]),
  ),
])

SectionShape.children = ValidChildren

MetaMaskTemplateRenderer.propTypes = {
  sections: ValidChildren,
}

export default memo(MetaMaskTemplateRenderer)
