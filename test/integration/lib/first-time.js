const PASSWORD = 'password123'

QUnit.module('first time usage')

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

    // Scroll through terms
    var scrollable = app.find('.markdown')[0]
    scrollable.scrollTop = scrollable.scrollHeight

    return wait(10)
  }).then(function() {

    var button = app.find('button')[0] // Agree button
    button.click()

    return wait(1000)
  }).then(function() {

    var created = app.find('h3')[0]
    assert.equal(created.textContent, 'Vault Created', 'Vault created screen')

    var button = app.find('button')[0] // Agree button
    button.click()

    return wait(1000)
  }).then(function() {

    var detail = app.find('.account-detail-section')[0]
    assert.ok(detail, 'Account detail section loaded.')

    var sandwich = app.find('.sandwich-expando')[0]
    sandwich.click()

    return wait()
  }).then(function() {

    var sandwich = app.find('.menu-droppo')[0]
    var lock = sandwich.children[2]
    assert.ok(lock, 'Lock menu item found')
    lock.click()

    return wait(1000)
  }).then(function() {

    var pwBox = app.find('#password-box')[0]
    pwBox.value = PASSWORD

    var createButton = app.find('button.primary')[0]
    createButton.click()

    return wait(1000)
  }).then(function() {

    var detail = app.find('.account-detail-section')[0]
    assert.ok(detail, 'Account detail section loaded again.')

    done()
  })
})
