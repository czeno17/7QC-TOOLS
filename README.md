# 7 QC Tools

A browser-based toolkit for exploring the seven basic quality control tools. Create analyses, review visualizations, and compile saved findings into a printable report. Tool data is stored locally in the browser.

## Tools

- **Check Sheet** — tally defects or events by category.
- **Pareto Chart** — rank causes by frequency and cumulative contribution.
- **Fishbone Diagram** — organize potential causes of a problem.
- **Histogram** — inspect measurement distributions and process capability.
- **Scatter Diagram** — explore relationships between paired variables.
- **Stratification** — compare variation across groups such as shifts or machines.
- **Control Chart** — monitor process stability over time.

## Requirements

- Node.js compatible with Next.js 16
- pnpm (the package manager specified by this project)

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
pnpm dev        # Start the development server
pnpm build      # Create a production build
pnpm start      # Serve the production build
pnpm lint       # Run ESLint
pnpm typecheck  # Run TypeScript checks
pnpm test       # Run the test suite
```

## Data and reports

Analyses are saved on this device in browser storage. Use **Load example project** on the home page to populate the tools with sample data. The Report Dashboard compiles saved tool findings and supports printing from the browser.
