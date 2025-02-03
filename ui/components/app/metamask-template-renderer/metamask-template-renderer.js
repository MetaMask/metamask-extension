import React, { memo } from 'react';
import { isEqual } from 'lodash';
import { safeComponentList } from './safe-component-list';
import { ValidChildren } from './section-shape';

function getElement(section) {
  const { element } = section;
  const Element = safeComponentList[element];
  if (!Element) {
    throw new Error(
      `${element} is not in the safe component list for MetaMask template renderer`,
    );
  }
  return Element;
}

function renderElement(element) {
  const Element = getElement(element);
  const propsAsComponents = element.propComponents
    ? getPropComponents(element.propComponents)
    : {};
  return (
    <Element {...element.props} {...propsAsComponents}>
      {typeof element.children === 'object' ? (
        <MetaMaskTemplateRenderer sections={element.children} />
      ) : (
        element?.children
      )}
    </Element>
  );
}

function getPropComponents(components) {
  return Object.entries(components).reduce((accumulator, [key, component]) => {
    if (component) {
      accumulator[key] = Array.isArray(component)
        ? component.map(renderElement)
        : renderElement(component);
    }
    return accumulator;
  }, {});
}

const MetaMaskTemplateRenderer = ({ sections }) => {
  if (!sections) {
    // If sections is null eject early by returning null
    return null;
  } else if (typeof sections === 'string') {
    // React can render strings directly, so return the string
    return sections;
  } else if (
    sections &&
    typeof sections === 'object' &&
    !Array.isArray(sections)
  ) {
    // If dealing with a single entry, then render a single object without key
    return renderElement(sections);
  }

  // The last case is dealing with an array of objects
  return (
    <>
      {sections.reduce((allChildren, child) => {
        if (child === undefined || child?.hide === true) {
          return allChildren;
        }
        if (typeof child === 'string') {
          // React can render strings directly, so push them into the accumulator
          allChildren.push(child);
        } else {
          // If the entry in array is not a string, then it must be a Section.
          // Sections are handled by the main function, but must
          // be provided a key when a part of an array.
          if (!child.key) {
            throw new Error(
              'When using array syntax in MetaMask Template Language, you must specify a key for each child of the array',
            );
          }
          if (typeof child?.children === 'object') {
            // If this child has its own children, check if children is an
            // object, and in that case use recursion to render.
            allChildren.push(
              <MetaMaskTemplateRenderer sections={child} key={child.key} />,
            );
          } else {
            // Otherwise render the element.
            const Element = getElement(child);
            const propsAsComponents = child.propComponents
              ? getPropComponents(child.propComponents)
              : {};
            allChildren.push(
              <Element key={child.key} {...child.props} {...propsAsComponents}>
                {child?.children}
              </Element>,
            );
          }
        }
        return allChildren;
      }, [])}
    </>
  );
};

MetaMaskTemplateRenderer.propTypes = {
  sections: ValidChildren,
};

export default memo(MetaMaskTemplateRenderer, (prevProps, nextProps) => {
  return isEqual(prevProps.sections, nextProps.sections);
});
