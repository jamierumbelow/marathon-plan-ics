# marathon-plan-ics

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts [MARATHON DATE: YYYY-MM-DD] [GOAL TIME: HH:MM:SS] [TRAINING START DATE: YYYY-MM-DD] [RUNS START TIME: HH:MM:SS]
```

Eg, to start training on Jan 1, 2024, for a marathon on May 26, 2024 with a goal time of 3:30:00, and runs starting at 6:00am:

```bash
bun run index.ts 2024-05-26 3:30:00 2024-01-01 6:00:00
```
