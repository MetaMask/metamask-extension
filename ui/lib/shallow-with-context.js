import { shallow } from 'enzyme'

export default function shallowWithContext(jsxComponent) {
  return shallow(jsxComponent, {
    context: { t: (str1, str2) => (str2 ? str1 + str2 : str1) },
  })
}
