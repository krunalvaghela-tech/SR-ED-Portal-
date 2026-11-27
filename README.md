# SR&ED Records Portal (demo)

A single-page demo of a records portal for Canada's SR&ED tax credit program. It keeps the
evidence a reviewer asks for, filed as the work happens:

- **Projects**: one sheet per project (objective, uncertainty, what was tried, results)
- **Evidence**: records tagged to a project, person and date, with locked timestamps
- **Weekly time**: hours split by project and checked against payroll
- **Funding and finance**: payroll, receipts, contracts, and grants that reduce the claim
- **Gap alerts**: what a reviewer would ask for that is not on file yet
- **Export**: a binder index in the order a reviewer reads it

Everything runs in the browser from `index.html`. All businesses, people and amounts are sample
data and nothing is saved. The portal organizes records; it does not decide whether work
qualifies for SR&ED.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Publish with GitHub Pages

Settings → Pages → Deploy from a branch → `main` / root.
