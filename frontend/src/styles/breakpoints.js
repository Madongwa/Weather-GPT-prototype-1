// Canonical breakpoint values (pixels), mirrored in breakpoints.css.
//
// CSS media queries can't reference a JS constant (and can't reference a
// CSS custom property either — `var()` isn't allowed inside a media
// feature, only in ordinary property values). So this file isn't a
// literal single-source-of-truth the way a CSS variable would be for,
// say, a color — every `@media` rule in the app still has to spell out
// the same pixel number itself. What this file (and its CSS twin) give
// you instead is one place to check what the numbers *are*, and a
// target for any future JS that needs to know a breakpoint (e.g. a
// `matchMedia`-based hook), instead of each call site guessing its own.
//
//   mobile:   < 600px   (implicit default — no query needed)
//   tablet:   >= 600px
//   desktop:  >= 900px  (sidebar pins open, two-pane layouts kick in)
//   wide:     >= 1280px (extra content width)
export const BREAKPOINTS = {
  tablet: 600,
  desktop: 900,
  wide: 1280,
}
