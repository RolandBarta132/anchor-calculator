# IDEA StatiCa load sign convention

This branch changes the axial load input to match the IDEA StatiCa convention used by the reference exports.

## Input convention

- **N:** positive = tension; negative = compression.
- **Moments:** positive follows the right-hand rule.
- **Plan shear inputs:** keep the calculator's existing plan axes and positive directions (`Vx` to the right, `Vy` downward). These are the calculator's plan components corresponding to the imported IDEA load effects.

The existing plate equilibrium solver uses the opposite internal sign for the axial scalar. The conversion is therefore made once at the load-transfer boundary:

`Nt = -N_input * 1000 / Ec`

No calculation result or resistance formula is changed by this sign-convention migration.

## Reference

The IDEA StatiCa Connection documentation states that positive normal force N causes tension and that positive moments follow the right-hand rule. The supplied IDEA export reports the connection load effects as N, Vy, Vz, Mx, My and Mz.

The regression cases that use pure tension now enter positive N values. Their independent anchor-force results remain unchanged.
