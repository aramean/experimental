test('extractBracketValues - single bracket', function () {
  var result = app.element.extractBracketValues('[value]')
  assertEqual(result, 'value')
})

test('extractBracketValues - multiple brackets', function () {
  var result = app.element.extractBracketValues('[one][two][three]')
  assertEqual(result.length, 3)
  assertEqual(result[0], 'one')
  assertEqual(result[1], 'two')
  assertEqual(result[2], 'three')
})

test('extractBracketValues - special char &', function () {
  var result = app.element.extractBracketValues('[&test]')
  assertEqual(result, '&test')
})

test('extractBracketValues - empty brackets', function () {
  var result = app.element.extractBracketValues('[]')
  assertEqual(result, '')
})

test('extractBracketValues - no brackets', function () {
  var result = app.element.extractBracketValues('no brackets here')
  assertEqual(result, '')
})