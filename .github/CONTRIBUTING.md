# Contributing to rollout-bucket

Thank you for considering contributing to rollout-bucket! 🎉

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm (comes with Node.js)
- Git

### Setup

1. **Fork the repository** on GitHub

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/rollout-bucket.git
   cd rollout-bucket
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Verify setup:**
   ```bash
   npm test        # All tests should pass
   npm run lint    # No linting errors
   npm run build   # Build should succeed
   ```

## Development Workflow

### Making Changes

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes:**
   - Write code in `src/`
   - Add/update tests in `test/`
   - Update README if adding features
   - Update docs/CHANGELOG.md

3. **Test your changes:**
   ```bash
   npm test              # Run tests
   npm run test:coverage # Check coverage (aim for >95%)
   npm run lint          # Check code style
   npm run build         # Verify build works
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

   Pre-commit hooks will automatically run linting and formatting.

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/). Use prefixes: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, or `refactor:`.

### Submitting a Pull Request

1. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request** on GitHub

3. **Ensure CI passes:**
   - All tests pass
   - Linting passes
   - Build succeeds
   - No security vulnerabilities

4. **Wait for review:**
   - Address any feedback
   - Make requested changes
   - Push updates to the same branch

## Testing Guidelines

### Writing Tests

- **Location:** `test/rollout-bucket.test.ts`
- **Framework:** Vitest
- **Coverage:** Aim for >95% coverage

Example test:
```typescript
it('should return deterministic buckets', () => {
  const rollout = new RolloutBucket();
  const bucket1 = rollout.getBucket('feature', 'user-123');
  const bucket2 = rollout.getBucket('feature', 'user-123');
  expect(bucket1).toBe(bucket2);
});
```

### Running Tests

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
npm run test:ui             # Visual UI (Vitest UI)
```

## Code Style

We use ESLint and Prettier for code formatting:

```bash
npm run lint          # Check for issues
npm run format        # Auto-fix formatting
```

Pre-commit hooks automatically enforce code style.

## Project Structure

```
rollout-bucket/
├── src/
│   └── index.ts          # Main source code
├── test/
│   └── rollout-bucket.test.ts  # Test suite
├── dist/                 # Build output (git-ignored)
│   ├── esm/             # ES Module build
│   └── cjs/             # CommonJS build
├── .github/
│   └── workflows/       # CI/CD workflows
├── package.json
├── tsconfig.json        # TypeScript config
├── vitest.config.ts     # Test config
└── eslint.config.js     # Linting config
```

## Questions?

- 📖 Check the [README](../README.md) for API documentation
- 🐛 [Open an issue](https://github.com/vnykmshr/rollout-bucket/issues) for bugs
- 💡 [Start a discussion](https://github.com/vnykmshr/rollout-bucket/discussions) for questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
