window.addEventListener('load', () => {
  window.METAMASK_SKIP_RELOAD = true
  // inject app container
  const body = document.body
  const container = document.createElement('div')
  container.id = 'app-content'
  body.appendChild(container)
  // start ui
  require('../src/ui.js')
})
