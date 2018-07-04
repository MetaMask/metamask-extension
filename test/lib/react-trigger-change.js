// Trigger React's synthetic change events on input, textarea and select elements
// https://github.com/vitalyq/react-trigger-change

/** ****************IMPORTANT NOTE******************/
/* This file is a modification of the             */
/* 'react-trigger-change' library linked above.   */
/* That library breaks when 'onFocus' events are  */
/* added to components under test because it      */
/* dispatches focus events to ensure changes are  */
/* triggered in some versions of IE.              */
/* This modification removes the accomodations    */
/* 'react-trigger-change' makes for IE to ensure  */
/* our tests can pass in chrome and firefox.      */
/** ************************************************/

'use strict'

// Constants and functions are declared inside the closure.
// In this way, reactTriggerChange can be passed directly to executeScript in Selenium.
module.exports = function reactTriggerChange (node) {
  var supportedInputTypes = {
    color: true,
    date: true,
    datetime: true,
    'datetime-local': true,
    email: true,
    month: true,
    number: true,
    password: true,
    range: true,
    search: true,
    tel: true,
    text: true,
    time: true,
    url: true,
    week: true,
  }
  var nodeName = node.nodeName.toLowerCase()
  var type = node.type
  var event
  var descriptor
  var initialValue
  var initialChecked
  var initialCheckedRadio

  // Do not try to delete non-configurable properties.
  // Value and checked properties on DOM elements are non-configurable in PhantomJS.
  function deletePropertySafe (elem, prop) {
    var desc = Object.getOwnPropertyDescriptor(elem, prop)
    if (desc && desc.configurable) {
      delete elem[prop]
    }
  }

  function getCheckedRadio (radio) {
    var name = radio.name
    var radios
    var i
    if (name) {
      radios = document.querySelectorAll('input[type="radio"][name="' + name + '"]')
      for (i = 0; i < radios.length; i += 1) {
        if (radios[i].checked) {
          return radios[i] !== radio ? radios[i] : null
        }
      }
    }
    return null
  }

  function preventChecking (e) {
    e.preventDefault()
    if (!initialChecked) {
      e.target.checked = false
    }
    if (initialCheckedRadio) {
      initialCheckedRadio.checked = true
    }
  }

  if (nodeName === 'select' ||
    (nodeName === 'input' && type === 'file')) {
    // IE9-IE11, non-IE
    // Dispatch change.
    event = document.createEvent('HTMLEvents')
    event.initEvent('change', true, false)
    node.dispatchEvent(event)
  } else if ((nodeName === 'input' && supportedInputTypes[type]) ||
    nodeName === 'textarea') {
    // React 16
    // Cache artificial value property descriptor.
    // Property doesn't exist in React <16, descriptor is undefined.
    descriptor = Object.getOwnPropertyDescriptor(node, 'value')

    // Update inputValueTracking cached value.
    // Remove artificial value property.
    // Restore initial value to trigger event with it.
    initialValue = node.value
    node.value = initialValue + '#'
    deletePropertySafe(node, 'value')
    node.value = initialValue

    // React 0.14: IE10-IE11, non-IE
    // React 15: non-IE
    // React 16: IE10-IE11, non-IE
    event = document.createEvent('HTMLEvents')
    event.initEvent('input', true, false)
    node.dispatchEvent(event)

    // React 16
    // Restore artificial value property descriptor.
    if (descriptor) {
      Object.defineProperty(node, 'value', descriptor)
    }
  } else if (nodeName === 'input' && type === 'checkbox') {
    // Invert inputValueTracking cached value.
    node.checked = !node.checked

    // Dispatch click.
    // Click event inverts checked value.
    event = document.createEvent('MouseEvents')
    event.initEvent('click', true, true)
    node.dispatchEvent(event)
  } else if (nodeName === 'input' && type === 'radio') {
    // Cache initial checked value.
    initialChecked = node.checked

    // Find and cache initially checked radio in the group.
    initialCheckedRadio = getCheckedRadio(node)

    // React 16
    // Cache property descriptor.
    // Invert inputValueTracking cached value.
    // Remove artificial checked property.
    // Restore initial value, otherwise preventDefault will eventually revert the value.
    descriptor = Object.getOwnPropertyDescriptor(node, 'checked')
    node.checked = !initialChecked
    deletePropertySafe(node, 'checked')
    node.checked = initialChecked

    // Prevent toggling during event capturing phase.
    // Set checked value to false if initialChecked is false,
    // otherwise next listeners will see true.
    // Restore initially checked radio in the group.
    node.addEventListener('click', preventChecking, true)

    // Dispatch click.
    // Click event inverts checked value.
    event = document.createEvent('MouseEvents')
    event.initEvent('click', true, true)
    node.dispatchEvent(event)

    // Remove listener to stop further change prevention.
    node.removeEventListener('click', preventChecking, true)

    // React 16
    // Restore artificial checked property descriptor.
    if (descriptor) {
      Object.defineProperty(node, 'checked', descriptor)
    }
  }
}
