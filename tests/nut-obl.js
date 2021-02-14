import assert from 'assert'
import calculateNutationAndObliquity from '../nutation-obliquity.js'

for (const test of [
  { JDE: 2446895.5, Δψ: -0.00105223113, Δε: 0.00262292242, ε: 23.443569213 }
]) {
  const result = calculateNutationAndObliquity(test.JDE)
  assert.strictEqual(result.Δψ.toPrecision(5), test.Δψ.toPrecision(5), `error in Δψ for JDE ${test.JDE} — got ${result.Δψ.toPrecision(5)}`)
  assert.strictEqual(result.Δε.toPrecision(5), test.Δε.toPrecision(5), `error in Δε for JDE ${test.JDE} — got ${result.Δε.toPrecision(5)}`)
  assert.strictEqual(result.ε.toPrecision(7), test.ε.toPrecision(7), `error in ε for JDE ${test.JDE} — got ${result.ε.toPrecision(7)}`)
}
console.log('calculateNutationAndObliquity OK')
