# UI Components

Components that live in the [`ui/components/ui`](https://github.com/MetaMask/metamask-extension/tree/develop/ui/components/ui) should be reusable, light weight and as simple as possible. They should not require any external dependencies to render other than a handful of props.

A very strong suggestion is to try and minimize the number of props to help make the component more portable.

Some prop contexts to be aware of:

- Minimize the number of imports per js file / component
- One component per file
- Maintain the discipline of a prop interface definition (PropTypes) for every component

> 💡 Please be aware we are in the process of developing our new design system and that some of our components might not follow theses standards.

## Development Guidelines and Best Practices

Some best practices and things to keep in mind when creating components:

### Simplicity and reusability focused

UI Components should be written as lightweight and simply as possible.

Look for ways to break components up into smaller more focused elements. This makes it easier to test, maintain, compose and reason about. This also creates flexibility as different level of compositions can be created with the same few isolated sub components.

### Make "dumb" components

UI components are presentational components. They should be light weight with minimal dependencies. The key rule to always keep in mind: **a presentational component is told what to do, and the consuming application is responsible for telling it what to do and when to do it.**

_They should literally be **dumb**!_

Yes, it's awesome if a component can do everything you want right out of the box and all you need to do the pass the raw API data into it. However, in reality we are under the ever changing business logic and API structures. To add all these different conditions into the component makes the component heavy, and difficult to reuse and maintain.

#### 1. Avoid business logic, focus on UI and behavior

We need to be mindful with how we approach each component. We don’t want to pollute the UI components with business or state specific logic, as these can change overtime.

#### 2. Externalize as much as possible

What's shared in the component library should be the **lowest common denominator** across all usage.

A UI component should simply need to worry about what's shown and what it looks like when it's shown, and should not need to worry about the conditions that make it so. We want to localize any potential differences or "un-reusability" inside the consuming application. An UI component only needs to worry about "how to look", instead of the conditions for "why/when to look" like this.

### Minimize the number of props

Any component with more than 10 props should be flagged and analyzed to see if it can be simplified.

🚧 **A good rule of thumb would be to keep the number of props below 7.**

#### 1. Reduce amount of props for larger components containing sub-components

Break down the complex component into smaller sub components when it makes sense.
