export { default } from './networks-tab.container';

/***
Refactor requirements
- file structure
  - index.js
  - networks-tab.js
    - import NetworkForm
    - import NetworksTabContent
    - const SubHeader: type function
  - network-form/
  - networks-tab-content/
    - const NetworkList: type function
    - const NetworkListItem: type function
- refactor networks-tab.component to be a functional component, that uses hooks
  - only need a `index.js` file and `name.js` file now
  - props are the same, just received as parameters on the function
  - propTypes added as a property on the function object (outide the function body)
  - for context, you can use the `useI18nContext` hook
  - class methods that return sub components
    - name does not need to begin with `render`
    - can be move to a function defined outside the body of the main functional component
    - can be rendered in jsx syntax in the return of the main functional component  
  - move render networks tab content to its own file
  - move render networks list to it own functional component, but it can stay in the networks tab content file
    - same for network list item

- remove `networks-tab.container.js` and replace it with use of redux hooks in a functional component
*/