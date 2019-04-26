import circle from '@robireton/circle'
import VSOP87D_Earth from './vsop87d-earth'
import nutation_data from './nutation-data'

﻿export function positionSun(date, lat, lon) {
  const JDE = date.toJDE()
  const heliocentric = positionEarth(JDE)

  //convert heliocentric longitude & latitude to geocentric
  let Θ = circle.normalizedDegrees(heliocentric.L + 180)
  let β = -heliocentric.B

  //convert to FK5 reference frame
  const T   = (JDE - 2451545) / 36525 //time in centuries from 2000.0
  const λ_  = Θ + T*(-1.397 + T*(-0.00031 * T))
  const ΔΘ  = -0.09033 / 3600
  const Δβ  = (0.03916 / 3600) * (Math.cos(circle.DegreesToRadians(λ_)) - Math.sin(circle.DegreesToRadians(λ_)))
  Θ += ΔΘ
  β += Δβ

  //correct for nutation and aberration
  const objNutObl = calculateNutationAndObliquity(JDE)
  const λ = Θ + objNutObl.Δψ - (20.4898/3600) / heliocentric.R

  //convert to right ascension & declination
  const ε = circle.DegreesToRadians(objNutObl.ε)
  const α = circle.normalizedDegrees(circle.RadiansToDegrees(Math.atan2(Math.sin(circle.DegreesToRadians(λ)) * Math.cos(ε) - Math.tan(circle.DegreesToRadians(β)) * Math.sin(ε), Math.cos(circle.DegreesToRadians(λ)))))
  const δ = circle.RadiansToDegrees(Math.asin(Math.sin(circle.DegreesToRadians(β)) * Math.cos(ε) + Math.cos(circle.DegreesToRadians(β)) * Math.sin(ε) * Math.sin(circle.DegreesToRadians(λ))))

  // c.f. Chapter 27 of Astronomical Algorithms by Jean Meeus
  const τ = T/10
  const L0 = circle.normalizedDegrees(280.4664567 + τ*(360007.6982779 + τ*(0.03032028 + τ*(1/49931 + τ*(-1/15299 - τ/1988000)))))
  let E = circle.normalizedDegrees(L0 - 0.0057183 - α + objNutObl.Δψ * Math.cos(ε))
  if (E > 180) E-=360
  E *= 4 //convert degrees of arc to minutes of time

  let A, h
  if (!isNaN(lat) && !isNaN(lon)) {
    const θ0 = circle.normalizedDegrees(280.46061837 + 360.98564736629 * (JDE - 2451545.0) + 0.000387933 * T*T + T*T*T / 38710000) + objNutObl.Δψ*Math.cos(ε)

    const L = -lon // Meeus thumbs his nose at the IAU and considers longitude to increase west from Greenwich
    const φ =  lat

    const H = circle.normalizedDegrees(θ0 - L - α)

    A = circle.normalizedDegrees(180 + circle.RadiansToDegrees(Math.atan2(Math.sin(circle.DegreesToRadians(H)),Math.cos(circle.DegreesToRadians(H)) * Math.sin(circle.DegreesToRadians(φ)) - Math.tan(circle.DegreesToRadians(δ)) * Math.cos(circle.DegreesToRadians(φ)))))

    h = circle.RadiansToDegrees(Math.asin(Math.sin(circle.DegreesToRadians(φ)) * Math.sin(circle.DegreesToRadians(δ)) + Math.cos(circle.DegreesToRadians(φ)) * Math.cos(circle.DegreesToRadians(δ)) * Math.cos(circle.DegreesToRadians(H))))
  }



  return {
    E: E, // value for the equation of time in minutes
    A: Math.round(1000000 * A)/1000000, // azimuth in degrees, measured westward from the South
    h: Math.round(1000000 * h)/1000000, // altitude in degrees, positive above the horizon, negative below
  }
}

function calculateNutationAndObliquity(JDE) {
  // c.f. Chapter 21 of Astronomical Algorithms by Jean Meeus
  const T = (JDE - 2451545) / 36525 //time in centuries from 2000.0
  const D  = circle.normalizedDegrees(297.85036 + T*(445267.111480 + T*(-0.0019142 + T/189474))) //mean elongation of the Moon from the Sun in degrees
  const M  = circle.normalizedDegrees(357.52772 + T*( 35999.050340 + T*(-0.0001603 - T/300000))) //mean anomoly of the Sun (Earth) in degrees
  const M_ = circle.normalizedDegrees(134.96298 + T*(477198.867398 + T*( 0.0086972 + T/ 56250))) //mean anomoly of the Moon in degrees
  const F  = circle.normalizedDegrees( 93.27191 + T*(483202.017538 + T*(-0.0036825 + T/327270))) //Moon's argument of latitude in degrees
  const Ω  = circle.normalizedDegrees(125.04452 + T*( -1934.136261 + T*( 0.0020708 + T/450000))) //longitude of the ascending node of the Moon's mean orbit on the ecliptic, measured from the mean equinox of the date in degrees

  let Δψ = 0
  let Δε = 0
  for (const n of nutation_data) {
    const arg = circle.DegreesToRadians(n.D * D + n.M * M + n.M_ * M_ + n.F * F + n.Ω * Ω)
    Δψ += (n.Δψ.A + n.Δψ.B * T) * Math.sin(arg)
    Δε += (n.Δε.A + n.Δε.B * T) * Math.cos(arg)
  }
  Δψ /= 36000000 //coefficients above were in units of 0ʺ.0001
  Δε /= 36000000 //coefficients above were in units of 0ʺ.0001

  const U = T / 100
  const ε0 = 23+26/60+21.448/3600 + U*(-4680.93/3600
                  + U*(-   1.55/3600
                  + U*( 1999.25/3600
                  + U*(-  51.38/3600
                  + U*(- 249.67/3600
                  + U*(-  39.05/3600
                  + U*(    7.12/3600
                  + U*(   27.87/3600
                  + U*(    5.79/3600
                  + U*2.45/3600))))))))) // mean obliquity of the ecliptic

  const ε = ε0 + Δε

  return {
    Δψ: Δψ, // nutation in longitude
    Δε: Δε, // nutation in obliquity
     ε:  ε, // obliquity of the ecliptic
  }
}

function positionEarth(JDE) {
  // c.f. Chapter 31 of Astronomical Algorithms by Jean Meeus
  const τ = (JDE - 2451545) / 365250

  const L = circle.normalizedRadians(computeVSOP87(VSOP87D_Earth.L, τ))
  const B = computeVSOP87(VSOP87D_Earth.B, τ)
  const R = computeVSOP87(VSOP87D_Earth.R, τ)

  return {
    L: circle.RadiansToDegrees(L), // the ecliptical longitude in degrees
    B: circle.RadiansToDegrees(B), // the ecliptical latitude in degrees
    R: R,                    // the radius vector (distance to Sun) in AU
  }
}

Date.prototype.toJD = function() {
  let Y = this.getUTCFullYear()
  let M = 1 + this.getUTCMonth()
  if (M < 3) {
    Y--
    M+=12
  }
  const D = this.getUTCDate() + this.getUTCHours()/24 + this.getUTCMinutes()/1440 + this.getUTCSeconds()/86400 + this.getUTCMilliseconds()/86400000
  const A = Math.floor( Y / 100 )
  const B = 2 - A + Math.floor( A / 4 )
  const JD = Math.floor( 365.25 * (Y + 4716) ) + Math.floor( 30.6001 * (M + 1) ) + D + B - 1524.5
  if (JD < 0) throw new Error('method not valid for negative Julian Day numbers')

  return JD
}

Date.prototype.toJDE = function() {
  return this.toJD() + computeΔT(this.getUTCFullYear(), 1+this.getUTCMonth())/86400
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

function computeΔT(year, month) {
  //c.f. http://eclipse.gsfc.nasa.gov/SEhelp/deltatpoly2004.html
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

function computeVSOP87(obj, T) {
  let X = 0
  for (const α in obj) {
    let coeff = 0
    for (const β of obj[α]) {
      coeff += β.A * Math.cos(β.B + β.C * T)
    }
    X += coeff * Math.pow(T, α)
  }

  return X
}
