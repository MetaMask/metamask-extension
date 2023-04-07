# Component Library

This folder contains design system components that are built 1:1 with the Figma [DS Components](https://www.figma.com/file/HKpPKij9V3TpsyMV1TpV7C/DS-Components?node-id=16%3A6&t=RFUEn25IPHUhqHVo-1) UI kit and should be used where possible in all UI feature work

## Architecture

All components are built on top of the `Box` component and accept all `Box` [component props](https://metamask.github.io/metamask-storybook/?path=/docs/components-ui-box--default-story#props)

#### Layout

`component-library` components accept all utility props for layout

```
import { Text } from '../../component-library'

<Text marginBottom={4}>This text has a margin-bottom of 16px</Text>
```

#### Polymorphic `as` prop

`component-library` components accept a polymorphic as prop to change the root html element of a component

```
import { Text } from '../../component-library'

<ul>
<Text as="li">This renders as list item html element</Text>
</ul>
```

## TypeScript

We are currently in the process of migrating all component-library components to TypeScript. Feel free to contribute by creating a PR against one of [these issues](https://github.com/MetaMask/metamask-extension/issues?q=is%3Aissue+is%3Aopen+DS%2FExtension%2F2023%2FQ2%2FO1%2FKR3)

## Support

If internal folks have any questions please reach out the design system team via the internal slack channel [#metamask-design-system](https://consensys.slack.com/archives/C0354T27M5M) 💁

[DS components figma file](https://www.figma.com/file/HKpPKij9V3TpsyMV1TpV7C/DS-Components?node-id=16%3A6) (internal)
