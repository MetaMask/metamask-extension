import React, { memo } from 'react';
import { isEqual } from 'lodash';
import { safeComponentList } from './safe-component-list';
import { TemplateRendererContext } from './template-renderer-context';
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
  const content =
    !sections ? null : typeof sections === 'string' ? (
      sections
    ) : sections &&
      typeof sections === 'object' &&
      !Array.isArray(sections) ? (
      renderElement(sections)
    ) : (
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

  return (
    <TemplateRendererContext.Provider value={MetaMaskTemplateRenderer}>
      {content}
    </TemplateRendererContext.Provider>
  );
};

MetaMaskTemplateRenderer.propTypes = {
  sections: ValidChildren,
};

export default memo(MetaMaskTemplateRenderer, (prevProps, nextProps) => {
  return isEqual(prevProps.sections, nextProps.sections);
});
