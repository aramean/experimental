test('if - executes action when values are equal (:)', function () {
  var expected = 'EQUAL'
  var el = createElement('div')
  el.setAttribute('if', '([42]:[42]);settext:[EQUAL]')
  dom.rerun(el)
  assertEqual(el.innerText, expected)
})

test('if - executes action when values are not equal (!)', function () {
  var expected = 'NOT_EQUAL'
  var el = createElement('div')
  el.setAttribute('if', '([42]![43]);settext:[NOT_EQUAL]')
  dom.rerun(el)
  assertEqual(el.innerText, expected)
})

test('if - executes action when left value is greater than right value (>)', function () {
  var expected = 'GREATER'
  var el = createElement('div')
  el.setAttribute('if', '([10]>[5]);settext:[GREATER]')
  dom.rerun(el)
  assertEqual(el.innerText, expected)
})

test('if - executes action when left value is less than right value (<)', function () {
  var expected = 'LESS'
  var el = createElement('div')
  el.setAttribute('if', '([5]<[10]);settext:[LESS]')
  dom.rerun(el)
  assertEqual(el.innerText, expected)
})

test('if - executes action when left value contains right value (~)', function () {
  var expected = 'CONTAINS'
  var el = createElement('div')
  el.setAttribute('if', '([hello world]~[world]);settext:[CONTAINS]')
  dom.rerun(el)
  assertEqual(el.innerText, expected)
})

test('if - executes action when left value does not contain right value (!~)', function () {
  var expected = 'NOT_CONTAINS'
  var el = createElement('div')
  el.setAttribute('if', '([hello world]!~[mars]);settext:[NOT_CONTAINS]')
  dom.rerun(el)
  assertEqual(el.innerText, expected)
})