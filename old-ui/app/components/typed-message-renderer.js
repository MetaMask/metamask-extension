const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const extend = require('xtend')
const { ObjectInspector } = require('react-inspector')

module.exports = TypedMessageRenderer

inherits(TypedMessageRenderer, Component)
function TypedMessageRenderer () {
  Component.call(this)
}

TypedMessageRenderer.prototype.render = function () {
  const props = this.props
  const { value, version, style } = props
  let text
  switch (version) {
    case 'V1':
      text = renderTypedData(value)
      break
    case 'V3':
      text = renderTypedDataV3(value)
      break
  }

  const defaultStyle = extend({
    width: '100%',
    maxHeight: '210px',
    resize: 'none',
    border: 'none',
    background: 'white',
    padding: '3px',
    overflow: 'scroll',
  }, style)

  return (
    h('div.font-small', {
      style: defaultStyle,
    }, text)
  )
}

function renderTypedData (values) {
  return values.map(function (value) {
    let v = value.value
    if (typeof v === 'boolean') {
      v = v.toString()
    }
    return h('div', {}, [
      h('strong', {style: {display: 'block', fontWeight: 'bold'}}, String(value.name) + ':'),
      h('div', {}, v),
    ])
  })
}

function renderTypedDataV3 (values) {
  const { domain, message } = JSON.parse(values)
   return [
    domain ? h('div', [
      h('h1', 'Domain'),
      h(ObjectInspector, { data: domain, expandLevel: 1, name: 'domain' }),
    ]) : '',
    message ? h('div', [
      h('h1', 'Message'),
      h(ObjectInspector, { data: message, expandLevel: 1, name: 'message' }),
    ]) : '',
  ]
}
