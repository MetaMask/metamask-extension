import { shallow } from 'enzyme'

export default function (jsxComponent) {
  return shallow(jsxComponent, {
    context: { t: (str1, str2) => str2 ? str1 + str2 : str1 },
  })
}
