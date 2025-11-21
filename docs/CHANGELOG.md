# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-21

### Added

- Initial release of rollout-bucket
- `RolloutBucket` class with deterministic bucketing using MurmurHash3
- `getBucket()` method for bucket assignment (0-99)
- `isEnabled()` method for percentage-based feature flags
- `getVariant()` method for multi-variant A/B testing with TypeScript generics
- Comprehensive test suite with 18 tests (100% coverage)
- Chi-square statistical validation for distribution uniformity
- Dual ESM/CommonJS module support
- TypeScript type definitions and source maps
- Complete API documentation in README
- MIT license
- GitHub Actions CI workflow for Node.js 18.x, 20.x, 22.x

### Features

- **Deterministic bucketing**: Same user always gets same bucket for a feature
- **Feature isolation**: Different features produce independent distributions
- **Uniform distribution**: Chi-square tested across 10,000 users
- **Lightweight**: < 5KB minified bundle
- **Type-safe**: Full TypeScript support with generics

[0.1.0]: https://github.com/vnykmshr/rollout-bucket/releases/tag/v0.1.0
