test('if - executes action when values are equal (:)', function () {
  var expected = 'EQUAL'
  var testElement = createElement('div')
  testElement.setAttribute('if', '([42]:[42]);settext:[EQUAL]')
  dom.rerun(testElement)
  assertEqual(testElement.innerText, expected)
})

test('if - executes action with parameters when values are equal (:)', function () {
  var expected = 'value2'
  var testElement = createElement('div')
  testElement.setAttribute('if', '([42]:[42]);setattr:#' + testElement.id + ':[value1][value2]')
  dom.rerun(testElement)
  assertEqual(testElement.getAttribute('value1'), expected)
})

test('if - executes action when values are not equal (!)', function () {
  var expected = 'NOT_EQUAL'
  var testElement = createElement('div')
  testElement.setAttribute('if', '([42]![43]);settext:[NOT_EQUAL]')
  dom.rerun(testElement)
  assertEqual(testElement.innerText, expected)
})

test('if - executes action when left value is greater than right value (>)', function () {
  var expected = 'GREATER'
  var testElement = createElement('div')
  testElement.setAttribute('if', '([10]>[5]);settext:[GREATER]')
  dom.rerun(testElement)
  assertEqual(testElement.innerText, expected)
})

test('if - executes action when left value is less than right value (<)', function () {
  var expected = 'LESS'
  var testElement = createElement('div')
  testElement.setAttribute('if', '([5]<[10]);settext:[LESS]')
  dom.rerun(testElement)
  assertEqual(testElement.innerText, expected)
})

test('if - executes action when left value contains right value (~)', function () {
  var expected = 'CONTAINS'
  var testElement = createElement('div')
  testElement.setAttribute('if', '([hello world]~[world]);settext:[CONTAINS]')
  dom.rerun(testElement)
  assertEqual(testElement.innerText, expected)
})

test('if - executes action when left value does not contain right value (!~)', function () {
  var expected = 'NOT_CONTAINS'
  var testElement = createElement('div')
  testElement.setAttribute('if', '([hello world]!~[mars]);settext:[NOT_CONTAINS]')
  dom.rerun(testElement)
  assertEqual(testElement.innerText, expected)
})