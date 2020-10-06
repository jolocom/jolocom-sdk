## Development

1. Clone the sdk repository to your computer.
2. `cd` into the directory and run `yarn` or `yarn install` from your terminal to install the required packages.

To run a repl, use `yarn repl`.

### Testing

We use [Jest](https://jestjs.io) for unit tests. To run unit tests, with watch and testing coverage display enabled:

```bash
yarn test --watch --coverage
```

### Code Style and Formatting

- We use [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) to keep a consistent style across the codebase.
  - There are plugins available for a range of IDEs and text editors; automatic formatting on save is also supported in some editors.
- `yarn format` will format files automatically as much as possible.

Copyright (C) 2014-2020 JOLOCOM GmbH
