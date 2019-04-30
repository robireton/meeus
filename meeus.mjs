import circle from '@robireton/circle'
import JulianEphemerisDay from './julian-day'
import earthVSOP87D from './vsop87d-earth'
import dataNutation from './nutation-data'

export function positionSun (date, lat, lon) {
  const JDE = JulianEphemerisDay(date)
  const heliocentric = positionEarth(JDE)

  // convert heliocentric longitude & latitude to geocentric
  let Θ = circle.normalizedDegrees(heliocentric.L + 180)
  let β = -heliocentric.B

  // convert to FK5 reference frame
  const T = (JDE - 2451545) / 36525 // time in centuries from 2000.0
  const λ_ = Θ + T * (-1.397 + T * (-0.00031 * T))
  const ΔΘ = -0.09033 / 3600
  const Δβ = (0.03916 / 3600) * (Math.cos(circle.DegreesToRadians(λ_)) - Math.sin(circle.DegreesToRadians(λ_)))
  Θ += ΔΘ
  β += Δβ

  // correct for nutation and aberration
  const objNutObl = calculateNutationAndObliquity(JDE)
  const λ = Θ + objNutObl.Δψ - (20.4898 / 3600) / heliocentric.R

  // convert to right ascension & declination
  const ε = circle.DegreesToRadians(objNutObl.ε)
  const α = circle.normalizedDegrees(circle.RadiansToDegrees(Math.atan2(Math.sin(circle.DegreesToRadians(λ)) * Math.cos(ε) - Math.tan(circle.DegreesToRadians(β)) * Math.sin(ε), Math.cos(circle.DegreesToRadians(λ)))))
  const δ = circle.RadiansToDegrees(Math.asin(Math.sin(circle.DegreesToRadians(β)) * Math.cos(ε) + Math.cos(circle.DegreesToRadians(β)) * Math.sin(ε) * Math.sin(circle.DegreesToRadians(λ))))

  // c.f. Chapter 27 of Astronomical Algorithms by Jean Meeus
  const τ = T / 10
  const L0 = circle.normalizedDegrees(280.4664567 + τ * (360007.6982779 + τ * (0.03032028 + τ * (1 / 49931 + τ * (-1 / 15299 - τ / 1988000)))))
  let E = circle.normalizedDegrees(L0 - 0.0057183 - α + objNutObl.Δψ * Math.cos(ε))
  if (E > 180) E -= 360
  E *= 4 // convert degrees of arc to minutes of time

  let A, h
  if (!isNaN(lat) && !isNaN(lon)) {
    const θ0 = circle.normalizedDegrees(280.46061837 + 360.98564736629 * (JDE - 2451545.0) + 0.000387933 * T * T + T * T * T / 38710000) + objNutObl.Δψ * Math.cos(ε)

    const L = -lon // Meeus thumbs his nose at the IAU and considers longitude to increase west from Greenwich
    const φ = lat

    const H = circle.normalizedDegrees(θ0 - L - α)

    A = circle.normalizedDegrees(180 + circle.RadiansToDegrees(Math.atan2(Math.sin(circle.DegreesToRadians(H)), Math.cos(circle.DegreesToRadians(H)) * Math.sin(circle.DegreesToRadians(φ)) - Math.tan(circle.DegreesToRadians(δ)) * Math.cos(circle.DegreesToRadians(φ)))))

    h = circle.RadiansToDegrees(Math.asin(Math.sin(circle.DegreesToRadians(φ)) * Math.sin(circle.DegreesToRadians(δ)) + Math.cos(circle.DegreesToRadians(φ)) * Math.cos(circle.DegreesToRadians(δ)) * Math.cos(circle.DegreesToRadians(H))))
  }

  return {
    E: E, // value for the equation of time in minutes
    A: Math.round(1000000 * A) / 1000000, // azimuth in degrees, measured westward from the South
    h: Math.round(1000000 * h) / 1000000 // altitude in degrees, positive above the horizon, negative below
  }
}

function calculateNutationAndObliquity (JDE) {
  // c.f. Chapter 21 of Astronomical Algorithms by Jean Meeus
  const T = (JDE - 2451545) / 36525 // time in centuries from 2000.0
  const D = circle.normalizedDegrees(297.85036 + T * (445267.111480 + T * (-0.0019142 + T / 189474))) // mean elongation of the Moon from the Sun in degrees
  const M = circle.normalizedDegrees(357.52772 + T * (35999.050340 + T * (-0.0001603 - T / 300000))) // mean anomoly of the Sun (Earth) in degrees
  const M_ = circle.normalizedDegrees(134.96298 + T * (477198.867398 + T * (0.0086972 + T / 56250))) // mean anomoly of the Moon in degrees
  const F = circle.normalizedDegrees(93.27191 + T * (483202.017538 + T * (-0.0036825 + T / 327270))) // Moon's argument of latitude in degrees
  const Ω = circle.normalizedDegrees(125.04452 + T * (-1934.136261 + T * (0.0020708 + T / 450000))) // longitude of the ascending node of the Moon's mean orbit on the ecliptic, measured from the mean equinox of the date in degrees

  let Δψ = 0
  let Δε = 0
  for (const n of dataNutation) {
    const arg = circle.DegreesToRadians(n.D * D + n.M * M + n.M_ * M_ + n.F * F + n.Ω * Ω)
    Δψ += (n.Δψ.A + n.Δψ.B * T) * Math.sin(arg)
    Δε += (n.Δε.A + n.Δε.B * T) * Math.cos(arg)
  }
  Δψ /= 36000000 // coefficients above were in units of 0ʺ.0001
  Δε /= 36000000 // coefficients above were in units of 0ʺ.0001

  const U = T / 100
  const ε0 = 23 + 26 / 60 + 21.448 / 3600 + U * (-4680.93 / 3600 +
                  U * (-1.55 / 3600 +
                  U * (1999.25 / 3600 +
                  U * (-51.38 / 3600 +
                  U * (-249.67 / 3600 +
                  U * (-39.05 / 3600 +
                  U * (7.12 / 3600 +
                  U * (27.87 / 3600 +
                  U * (5.79 / 3600 +
                  U * 2.45 / 3600))))))))) // mean obliquity of the ecliptic

  const ε = ε0 + Δε

  return {
    Δψ: Δψ, // nutation in longitude
    Δε: Δε, // nutation in obliquity
    ε: ε // obliquity of the ecliptic
  }
}

function positionEarth (JDE) {
  // c.f. Chapter 31 of Astronomical Algorithms by Jean Meeus
  const τ = (JDE - 2451545) / 365250

  const L = circle.normalizedRadians(computeVSOP87(earthVSOP87D.L, τ))
  const B = computeVSOP87(earthVSOP87D.B, τ)
  const R = computeVSOP87(earthVSOP87D.R, τ)

  return {
    L: circle.RadiansToDegrees(L), // the ecliptical longitude in degrees
    B: circle.RadiansToDegrees(B), // the ecliptical latitude in degrees
    R: R // the radius vector (distance to Sun) in AU
  }
}

function computeVSOP87 (obj, T) {
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
