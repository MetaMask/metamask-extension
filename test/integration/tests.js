QUnit.test('agree to terms', function (assert) {
  var done = assert.async()

  // Select the mock app root
  var app = $('iframe').contents().find('#app-content .mock-app-root')
  // var button = $('.agree')
  // button.removeAttr('disabled')

  app.find('.markdown').prop('scrollTop', 100000000)


  // Agree to terms
  wait().then(function() {
    app.find('button').click()
    wait().then(function() {

      var title = app.find('h1').text()
      assert.equal(title, 'MetaMask', 'title screen')

      var buttons = app.find('button')
      assert.equal(buttons.length, 2, 'two buttons: create and restore')

      done()
    })
  })

  // Wait for view to transition:
})
