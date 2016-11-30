const PASSWORD = 'password123'

QUnit.test('agree to terms', function (assert) {
  var done = assert.async()
  let app

  wait().then(function() {
    app = $('iframe').contents().find('#app-content .mock-app-root')
    app.find('.markdown').prop('scrollTop', 100000000)
    return wait()

  }).then(function() {

    var title = app.find('h1').text()
    assert.equal(title, 'MetaMask', 'title screen')

    var pwBox = app.find('#password-box')[0]
    var confBox = app.find('#password-box-confirm')[0]

    pwBox.value = PASSWORD
    confBox.value = PASSWORD
    return wait()

  }).then(function() {

    var createButton = app.find('button.primary')[0]
    createButton.click()

    return wait(1500)
  }).then(function() {

    var terms = app.find('h3.terms-header')[0]
    assert.equal(terms.textContent, 'MetaMask Terms & Conditions', 'Showing TOS')

    done()
  })
})
