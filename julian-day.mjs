import computeΔT from '@robireton/delta-t'

export function JulianDay(date, gregorian = true) {
  // c.f. Chapter 7 of Astronomical Algorithms by Jean Meeus
  let Y = date.getUTCFullYear()
  let M = 1 + date.getUTCMonth()
  if (M < 3) {
    Y--
    M+=12
  }
  const D = date.getUTCDate() + date.getUTCHours()/24 + date.getUTCMinutes()/1440 + date.getUTCSeconds()/86400 + date.getUTCMilliseconds()/86400000

  const A = Math.floor( Y / 100 )
  const B = gregorian ? 2 - A + Math.floor( A / 4 ) : 0

  const JD = Math.floor( 365.25 * (Y + 4716) ) + Math.floor( 30.6001 * (M + 1) ) + D + B - 1524.5
  if (JD < 0) throw new Error('method not valid for negative Julian Day numbers')

  return JD // the Julian Day Number for the given date
}


export default function JulianEphemerisDay(date, gregorian = true) {
  // c.f. Chapter 9 of Astronomical Algorithms by Jean Meeus
  // the Julian Ephemeris Day number for the given date
  return JD(date, gregorian) + computeΔT(date.getUTCFullYear(), 1+date.getUTCMonth())/86400
}


// Number.prototype.JDtoDate = function() {
//   if (this.valueOf() < 0) throw new Error('method not valid for negative Julian Day numbers')
//   const JD = this.valueOf() + 0.5
//   const Z = Math.floor(JD)
//   const F = JD - Z
//   let A = Z
//   if ( Z >= 2299161 ) {
//     const α = Math.floor( (Z - 1867216.25) / 36524.25 )
//     A = Z + 1 + α - Math.floor( α / 4 )
//   }
//   const B = A + 1524
//   const C = Math.floor( (B - 122.1) / 365.25 )
//   const D = Math.floor( 365.25 * C )
//   const E = Math.floor( (B - D) / 30.6001 )
//
//   const month = (E < 14) ? (E - 1) : (E - 13)
//   const year = (month > 2) ? (C - 4716) : (C - 4715)
//   let X = B - D - Math.floor( 30.6001 * E ) + F
//   const date = Math.floor(X)
//   X -= date
//   X *= 24
//   const hours = Math.floor(X)
//   X -= hours
//   X *= 60
//   const minutes = Math.floor(X)
//   X -= minutes
//   X *= 60
//   const seconds = Math.floor(X)
//   X -= seconds
//   X *= 1000
//
//   return new Date( Date.UTC(year, month - 1, date, hours, minutes, seconds, Math.floor(X)) )
// }
