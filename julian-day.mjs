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


export function computeΔT(year, month) {
  //c.f. https://eclipse.gsfc.nasa.gov/SEhelp/deltatpoly2004.html
  const y = year + (month - 0.5) / 12

  if (year < -500) {
    const u = (year - 1820) / 100
    return Math.round(-20 + 32 * u * u)
  }

  if (year < 500) {
    const u = y / 100
    return Math.round(10583.6 + u*(-1014.41 + u*(33.78311 + u*(-5.952053 + u*(-0.1798452 + u*(0.022174192 + u * 0.0090316521))))))
  }

  if (year < 1600) {
    const u = (y - 1000) / 100
    return Math.round(1574.2 + u*(-556.01 + u*(71.23472 + u*(0.319781 + u*(-0.8503463 + u*(-0.005050998 + u * 0.0083572073))))))
  }

  if (year < 1700) {
    const t = y - 1600
    return Math.round(120 + t*(-0.9808 + t*(-0.01532 + t/7129)))
  }

  if (year < 1800) {
    const t = y - 1700
    return Math.round(8.83 + t*(0.1603 + t*(-0.0059285 + t*(0.00013336 - t/1174000))))
  }

  if (year < 1860) {
    const t = y - 1800
    return Math.round((13.72 + t*(-0.332447 + t*(0.0068612 + t*(0.0041116 + t*(-0.00037436 + t*(0.0000121272 + t*(-0.0000001699 + t * 0.000000000875))))))) * 10)/10
  }

  if (year < 1900) {
    const t = y - 1860
    return Math.round((7.62 + t*(0.5737 + t*(-0.251754 + t*(0.01680668 + t*(-0.0004473624 + t/233174))))) * 10)/10
  }

  if (year < 1920) {
    const t = y - 1900
    return Math.round((-2.79 + t*(1.494119 + t*(-0.0598939 + t*(0.0061966 - t * 0.000197)))) * 10)/10
  }

  if (year < 1941) {
    const t = y - 1920
    return Math.round((21.20 + t*(0.84493 + t*(-0.076100 + t * 0.0020936))) * 10)/10
  }

  if (year < 1961) {
    const t = y - 1950
    return Math.round((29.07 + t*(0.407 + t *(-1/233 + t/2547))) * 10)/10
  }

  if (year < 1986) {
    const t = y - 1975
    return Math.round((45.45 + t*(1.067 + t*(-1/260 - t/718))) * 10)/10
  }

  if (year < 2005) {
    const t = y - 2000
    return Math.round((63.86 + t*(0.3345 + t*(-0.060374 + t*(0.0017275 + t*(0.000651814 + t * 0.00002373599))))) * 100)/100
  }

  if (year < 2050) {
    const t = y - 2000
    return Math.round((62.92 + t*(0.32217 + t * 0.005589)) * 10)/10
  }

  if (year < 2150) {
    return Math.round((-20 + 32 * Math.pow((y-1820)/100, 2) - 0.5628 * (2150 - y)) * 10)/10
  }

  const u = (year - 1820) / 100
  return Math.round(-20 + 32 * u * u)
}
