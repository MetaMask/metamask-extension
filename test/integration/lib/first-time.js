QUnit.test('agree to terms', function (assert) {
  var done = assert.async()

  // Select the mock app root
  var app = $('iframe').contents().find('#app-content .mock-app-root')

  app.find('.markdown').prop('scrollTop', 100000000)
  debugger;
  wait().then(function() {
    app.find('button').click()
  }).then(function() {
    return wait()
  }).then(function() {
    var title = app.find('h1').text()
    assert.equal(title, 'MetaMask', 'title screen')

    var buttons = app.find('button')
    assert.equal(buttons.length, 1, 'one button: create new vault')

    done()
  })

  // Wait for view to transition:
})
