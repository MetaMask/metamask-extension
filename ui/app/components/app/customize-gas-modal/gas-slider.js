// const Component = require('react').Component
// const h = require('react-hyperscript')
// const inherits = require('util').inherits

// module.exports = GasSlider

// inherits(GasSlider, Component)
// function GasSlider () {
//   Component.call(this)
// }

// GasSlider.prototype.render = function () {
//   const {
//     memo,
//     identities,
//     onChange,
//     unitLabel,
//     value,
//     id,
//     step,
//     max,
//     min,
//   } = this.props

//   return h('div.gas-slider', [

//     h('input.gas-slider__input', {
//       type: 'range',
//       step,
//       max,
//       min,
//       value,
//       id: 'gasSlider',
//       onChange: event => onChange(event.target.value),
//     }, []),

//     h('div.gas-slider__bar', [

//       h('div.gas-slider__low'),

//       h('div.gas-slider__mid'),

//       h('div.gas-slider__high'),

//     ]),

//   ])

// }

