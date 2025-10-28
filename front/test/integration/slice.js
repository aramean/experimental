var content = 'abcdef'

test('slice - should slice element content from index 1', function () {
  var expected = 'bcdef'
  var testElement = createElement('div')
  testElement.innerText = content
  app.call('slice:#' + testElement.id + ':[0,1]')
  assertEqual(testElement.innerText, expected)
})

test('slice - should slice element content from index 2', function () {
  var expected = 'cdef'
  var testElement = createElement('div')
  testElement.innerText = content
  app.call('slice:#' + testElement.id + ':[0,2]')
  assertEqual(testElement.innerText, expected)
})

test('slice - should slice element content from index 3', function () {
  var expected = 'def'
  var testElement = createElement('div')
  testElement.innerText = content
  app.call('slice:#' + testElement.id + ':[3]')
  assertEqual(testElement.innerText, expected)
})

test('slice - should slice element content from index 4', function () {
  var expected = 'ef'
  var testElement = createElement('div')
  testElement.innerText = content
  app.call('slice:#' + testElement.id + ':[4]')
  assertEqual(testElement.innerText, expected)
})

test('slice - should slice element content from index 5', function () {
  var expected = 'f'
  var testElement = createElement('div')
  testElement.innerText = content
  app.call('slice:#' + testElement.id + ':[5]')
  assertEqual(testElement.innerText, expected)
})