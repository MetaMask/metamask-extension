const PASSWORD = 'password123'

QUnit.module('first time usage')

QUnit.test('agree to terms', function (assert) {
  var done = assert.async()
  let app

  wait().then(function() {
    app = $('iframe').contents().find('#app-content .mock-app-root')

    // Scroll through terms
    let termsPage = app.find('.markdown')[0]
    assert.ok(termsPage, 'on terms page')
    termsPage.scrollTop = termsPage.scrollHeight

    return wait()
  }).then(function() {

    // Agree to terms
    var button = app.find('button')[0]
    button.click()    

    return wait()
  }).then(function() {

    var title = app.find('h1').text()
    assert.equal(title, 'MetaMask', 'title screen')

    // enter password
    var pwBox = app.find('#password-box')[0]
    var confBox = app.find('#password-box-confirm')[0]
    pwBox.value = PASSWORD
    confBox.value = PASSWORD
    
    return wait()
  }).then(function() {

    // create vault
    var createButton = app.find('button.primary')[0]
    createButton.click()

    return wait(1500)
  }).then(function() {

    var created = app.find('h3')[0]
    assert.equal(created.textContent, 'Vault Created', 'Vault created screen')

    // Agree button
    var button = app.find('button')[0]
    assert.ok(button, 'button present')
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
    var children = sandwich.children
    var lock = children[children.length - 2]
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
