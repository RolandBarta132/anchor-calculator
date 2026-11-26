# Step A — Trusted baseline

Branch: `refactor/stage-a-trusted-baseline`

## Load sign convention

The calculator input convention is aligned with the IDEA StatiCa convention used by the reference exports: **N positive = tension and N negative = compression**. Moments use the right-hand rule. The existing plan shear axes remain x to the right and y downward. The legacy plate equilibrium solver keeps its historical internal axial sign; the conversion is made once at the load-transfer boundary.

## Purpose

This branch establishes a correctness baseline before the load-transfer and model refactors. The existing regression suite remains the protection against accidental changes; the independent values below are separate hand-calculated anchors-force checks.

## Independent checks added

The following cases now carry explicit independent values in `tests/cases.json`, and `tests/run.js` verifies them with a tolerance:

1. **pure_tension**
   - Actions: N = +300 kN (IDEA convention), Vx = Vy = Mx = My = Mz = 0.
   - Two symmetric anchors.
   - Independent result: T = [150, 150] kN; qx = [0, 0]; qy = [0, 0].
   - Basis: 300 kN total tension divided equally between two symmetric anchors.

2. **pure_shear**
   - Actions: N = 0, Vx = 60 kN, Vy = Mx = My = Mz = 0.
   - Two symmetric anchors.
   - Independent result: T = [0, 0] kN; qx = [30, 30] kN; qy = [0, 0].
   - Basis: 60 kN shear divided equally between two symmetric anchors.

3. **symmetric_tension_3x2**
   - Actions: N = +600 kN (IDEA convention), all moments and shear zero.
   - Six symmetric anchors (3 × 2).
   - Independent result: T = [100, 100, 100, 100, 100, 100] kN; qx/qy all zero.
   - Basis: 600 kN total tension divided equally between six symmetric anchors.

These are intentionally load-transfer checks, not independent verification of every EN 1992-4 utilisation formula. The latter still requires independently verified engineering values.

## Historical roadmap case capture

The earlier roadmap recorded utilisation values of 318%, 104%, 117%, 83%, 24%, 29% and 57%, but the governing loads were missing. Therefore those percentages cannot yet be reproduced as a trusted case.

The geometry previously identified for that case is preserved here as a reproducible capture, with the currently available page-default loads:

- fck 30 MPa; hef 500 mm; cracked concrete
- 2 × 1 anchors; sx 380 mm; sy 200 mm
- foundation 600 × 600 × 1000 mm
- cover 50 mm; vertical bars Ø12; stirrups Ø8; 4 bars per face; stirrup spacing 150 mm
- anchor M27, steel 8.8
- common plate: hd 100 mm, t = 10 mm, offset 50 mm, stiffener 100 × 10 mm
- lever-arm shear transfer; grout gap 50 mm
- shear lug: HEA 120, strong orientation, 200 mm embedment, 100% shear share
- actions currently available: N = +168.9 kN (IDEA convention), Vx = 71.6 kN, Vy = 12.5 kN, My = 10.9 kNm, Mx = 0, Mz = 0
- plate 420 × 320 mm; friction 0; bearing factor 1; plate bears
- supplementary reinforcement enabled; fyk 500 MPa; reach 0.75 hef; d0 = 0.25 hef

The historical load case still needs to be recovered from the original IDEA StatiCa calculation/output before the historical utilisation percentages can be accepted as a trusted baseline.

## Supplementary reinforcement diameter

The code and UI are now aligned to **16 mm maximum** for supplementary reinforcement. EN 1992-4:2018 clause 7.2.1.2 states that supplementary reinforcement for tension is ribbed reinforcement with diameter not larger than 16 mm; the same 16 mm limit is also stated for the shear supplementary-reinforcement detailing in 7.2.2.2. The implementation now rejects a supplementary reinforcement diameter above 16 mm and the UI says ≤ 16 mm.

## Remaining Step A work

- Run the full GitHub Actions regression suite on this branch.
- Independently verify at least three complete utilisation results (not only anchor-force distribution), preferably against IDEA StatiCa or hand calculations.
- Recover the original governing loads for the historical roadmap case and add those loads to the captured case.
- Only after those are available should Step A be declared complete and Step B begin.
