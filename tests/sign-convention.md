# IDEA StatiCa load sign convention

Stage A uses the IDEA StatiCa sign convention for the external load inputs used by the calculator.

## Input convention

- **N:** positive = tension; negative = compression.
- **Moments:** positive follows the right-hand rule.
- **Plan shear inputs:** keep the calculator's existing plan axes and positive directions (`Vx` to the right, `Vy` downward).

The existing plate equilibrium solver uses the opposite internal sign for the axial scalar. The conversion is therefore made once at the load-transfer boundary:

`Nt = -N_input * 1000 / Ec`

No resistance formula is changed by this sign-convention migration.

## Regression cases

The pure-tension regression cases now enter positive N values. Their independent anchor-force results remain unchanged.
