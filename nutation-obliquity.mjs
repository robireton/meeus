import circle from '@robireton/circle'
import dataNutation from './nutation-obliquity.json'

// c.f. Chapter 21 of Astronomical Algorithms by Jean Meeus
export default function calculateNutationAndObliquity (JDE) {
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
