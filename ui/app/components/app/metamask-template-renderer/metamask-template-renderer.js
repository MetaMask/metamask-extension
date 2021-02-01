import React, { memo } from 'react'
import PropTypes from 'prop-types'
import hash from 'object-hash'
import { isEqual } from 'lodash'
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
      {sections.reduce((allChildren, child, index) => {
        // React can render strings directly, so push them into the accumulator
        if (typeof child === 'string') {
          allChildren.push(child)
        } else if (child) {
          // The other option is one of our Sections, which contains
          // element, children, and props.
          const key = hash([sections, child, index])
          const { element, children, props } = child
          const Element = safeComponentList[element]
          if (!Element) {
            throw new Error(
              `${element} is not in the safe component list for MetaMask template renderer`,
            )
          }
          const childrenOrNull =
            Element && children ? (
              <MetaMaskTemplateRenderer key={key} sections={children} />
            ) : null
          if (Element) {
            allChildren.push(
              <Element key={key} {...props}>
                {childrenOrNull}
              </Element>,
            )
          }
        }
        return allChildren
      }, [])}
    </>
  )
}

const SectionShape = {
  props: PropTypes.object,
  element: PropTypes.oneOf(Object.keys(safeComponentList)).isRequired,
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

export default memo(MetaMaskTemplateRenderer, (prevProps, nextProps) => {
  return isEqual(prevProps.sections, nextProps.sections)
})
