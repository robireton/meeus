import { JulianDay } from '../julian-day'

console.log('JulianDay Testing Started')
let errors = 0
for (const testset of [
  { date: new Date(Date.UTC(2050, 9, 22, 21, 36)), gregorian: true, expected: 2470102.4 },
  { date: new Date(Date.UTC(2019, 3, 28)), gregorian: true, expected: 2458601.5 },
  { date: new Date(Date.UTC(2008, 1, 28)), gregorian: true, expected: 2454524.5 },
  { date: new Date(Date.UTC(2008, 1, 29)), gregorian: true, expected: 2454525.5 },
  { date: new Date(Date.UTC(2008, 2, 1)), gregorian: true, expected: 2454526.5 },
  { date: new Date(Date.UTC(2000, 0, 1, 12)), gregorian: true, expected: 2451545.0 },
  { date: new Date(Date.UTC(1999, 0, 1)), gregorian: true, expected: 2451179.5 },
  { date: new Date(Date.UTC(1987, 0, 27)), gregorian: true, expected: 2446822.5 },
  { date: new Date(Date.UTC(1987, 5, 19, 12)), gregorian: true, expected: 2446966.0 },
  { date: new Date(Date.UTC(1988, 0, 27)), gregorian: true, expected: 2447187.5 },
  { date: new Date(Date.UTC(1988, 5, 19, 12)), gregorian: true, expected: 2447332.0 },
  { date: new Date(Date.UTC(1970, 0, 1)), gregorian: true, expected: 2440587.5 },
  { date: new Date(Date.UTC(1957, 9, 4, 19, 26, 24)), gregorian: true, expected: 2436116.31 },
  { date: new Date(Date.UTC(1900, 0, 1)), gregorian: true, expected: 2415020.5 },
  { date: new Date(Date.UTC(1600, 0, 1)), gregorian: true, expected: 2305447.5 },
  { date: new Date(Date.UTC(1600, 11, 31)), gregorian: true, expected: 2305812.5 },
  { date: new Date(Date.UTC(837, 3, 10, 7, 12)), gregorian: false, expected: 2026871.8 },
  { date: new Date(Date.UTC(333, 0, 27, 12)), gregorian: false, expected: 1842713.0 },
  { date: new Date(Date.UTC(-123, 11, 31)), gregorian: false, expected: 1676496.5 },
  { date: new Date(Date.UTC(-122, 0, 1)), gregorian: false, expected: 1676497.5 },
  { date: new Date(Date.UTC(-1000, 6, 12, 12)), gregorian: false, expected: 1356001.0 },
  // I think there is some weirdness with the JavaScript Date object’s understanding of leap years in the distant past…
  // {date: new Date(Date.UTC(-1000,  1, 28)),             gregorian: false, expected: 1355865.5},
  // {date: new Date(Date.UTC(-1000,  1, 29)),             gregorian: false, expected: 1355866.5}, // JavaScript thinks this is March 1
  // {date: new Date(Date.UTC(-1000,  2,  1)),             gregorian: false, expected: 1355867.5},
  { date: new Date(Date.UTC(-1001, 7, 17, 21, 36)), gregorian: false, expected: 1355671.4 },
  { date: new Date(Date.UTC(-4712, 0, 1, 12)), gregorian: false, expected: 0.0 }
]) {
  const JD = JulianDay(testset.date, testset.gregorian)
  if (JD !== testset.expected) {
    console.error('JulianDay() failed for %o; got %f', testset, JD)
    errors++
  }
}

console.log(`JulianDay Testing Finished with ${errors} ${errors === 1 ? 'error' : 'errors'}.`)
