# Regression tests

`npm test` loads `index.html` in a headless browser (jsdom), applies each case from `cases.json`,
and compares every utilisation and anchor force with `expected.json`. It also checks that
nothing threw, nothing is NaN, equilibrium holds, and hidden rows stay hidden.

On GitHub the same run happens automatically for every push (Actions tab).

**When a test fails** read the lines under it: they name the check and show `old -> new`.
- Unintended change: you found a regression, fix the code.
- Intended change (an engineering correction): run `npm run test:update`, review the
  "CHANGED" list it prints, and commit the new `expected.json` together with the code change.

**Adding a case:** add an entry to `cases.json` (`set` takes input ids and values), run
`npm run test:update`, check the printed values make engineering sense, commit.
