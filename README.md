# rollout-bucket

Deterministic percentage-based bucketing for feature flags and A/B testing.

[![npm version](https://img.shields.io/npm/v/rollout-bucket.svg)](https://www.npmjs.com/package/rollout-bucket)
[![npm downloads](https://img.shields.io/npm/dm/rollout-bucket.svg)](https://www.npmjs.com/package/rollout-bucket)
[![CI](https://github.com/vnykmshr/rollout-bucket/actions/workflows/ci.yml/badge.svg)](https://github.com/vnykmshr/rollout-bucket/actions)
[![License](https://img.shields.io/npm/l/rollout-bucket.svg)](https://github.com/vnykmshr/rollout-bucket/blob/main/LICENSE)

## Overview

`rollout-bucket` uses MurmurHash3 to deterministically assign users to buckets (0-99) for percentage-based feature rollouts and A/B testing. Same user + feature combination always produces the same bucket, enabling consistent experimentation without external state.

**Features:**
- Deterministic bucketing with feature isolation
- Statistically uniform distribution (chi-square validated)
- TypeScript with full generic support
- Zero runtime dependencies (only `murmur-hash`)
- Dual module (ESM + CommonJS)
- Lightweight (< 5KB minified)

## Installation

```bash
npm install rollout-bucket
```

## Quick Start

```typescript
import { RolloutBucket } from 'rollout-bucket';

const rollout = new RolloutBucket();

// Feature flags with percentage rollout
if (rollout.isEnabled('new-ui', userId, 25)) {
  // Enabled for 25% of users
}

// A/B testing
const variant = rollout.getVariant('checkout-flow', userId, [
  { name: 'control', weight: 50 },
  { name: 'variant-a', weight: 30 },
  { name: 'variant-b', weight: 20 },
]);

// Canary deployments
if (rollout.isEnabled('api-v2', requestId, 5)) {
  return callApiV2();
}

// Custom seeds for independent distributions
const testRollout = new RolloutBucket(42);
```

## API

### `new RolloutBucket(seed?: number)`

Creates a bucketing instance. Optional seed (default: 0) creates different distributions.

### `getBucket(feature: string, identifier: string): number`

Returns bucket number (0-99) for a feature + identifier combination.

```typescript
const bucket = rollout.getBucket('new-search', 'user-123');
// Always returns same bucket for this combination
```

Guarantees:
- Deterministic: same inputs → same output
- Feature isolated: different features → uncorrelated buckets
- Uniform: each bucket has ~1% probability

### `isEnabled(feature: string, identifier: string, percentage: number): boolean`

Returns true if user's bucket is below the percentage threshold.

```typescript
if (rollout.isEnabled('beta-feature', userId, 25)) {
  // Runs for users in buckets 0-24 (25%)
}
```

Edge cases:
- `percentage <= 0`: always false
- `percentage >= 100`: always true

### `getVariant<T>(feature: string, identifier: string, variants: Variant<T>[]): T | null`

Selects a variant from weighted options. Returns null for empty variants array.

```typescript
interface Variant<T> {
  name: T;
  weight: number; // 0-100
}

// A/B test
const variant = rollout.getVariant('pricing-page', userId, [
  { name: 'control', weight: 50 },
  { name: 'treatment', weight: 50 },
]);

// With TypeScript generics
const tier = rollout.getVariant('service-tier', userId, [
  { name: 1, weight: 60 },
  { name: 2, weight: 30 },
  { name: 3, weight: 10 },
]);
// Type: number | null
```

Weights are cumulative: `[{w: 30}, {w: 30}, {w: 40}]` assigns buckets 0-29, 30-59, 60-99. If weights don't sum to 100, remaining buckets get the last variant.

## TypeScript

Fully typed with TypeScript. Types are bundled - no separate `@types` installation needed.

```typescript
import { RolloutBucket, Variant } from 'rollout-bucket';

// Full type inference
const rollout = new RolloutBucket();
const bucket: number = rollout.getBucket('feature', 'user');
const enabled: boolean = rollout.isEnabled('feature', 'user', 50);

// Generic support for variant names
const variant: 'control' | 'treatment' | null = rollout.getVariant(
  'experiment',
  'user',
  [
    { name: 'control' as const, weight: 50 },
    { name: 'treatment' as const, weight: 50 },
  ]
);
```

## How It Works

Uses MurmurHash3 (32-bit) to convert `feature:identifier` into a deterministic hash, then maps to bucket via modulo:

```
hash("feature:user-123") → 2847562934 → mod 100 → 34
```

This ensures consistency (same user always gets same bucket), independence (different features produce uncorrelated assignments), and uniformity (validated with chi-square tests across 10,000 users).

Feature names are part of the hash input, preventing "lock-in" where users always see all new features or none.

## Limitations

**Not cryptographically secure**: MurmurHash3 is designed for speed, not security. Do not use for password hashing, token generation, or any security-sensitive operations.

**No user targeting**: Bucketing is purely hash-based. No support for targeting specific users, segments, or attributes.

**No persistence or analytics**: This is a stateless bucketing library. No feature flag management, event tracking, or remote configuration.

Use when you need deterministic percentage-based rollouts without external dependencies. For advanced feature flag systems with targeting and analytics, consider LaunchDarkly, Optimizely, or similar services.

## Performance

- Hash computation: ~50-100ns per call (Node.js v20)
- Memory: Negligible overhead (stateless)
- Bundle size: < 5KB minified

## License

MIT © vnykmshr

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for development setup and guidelines. See [CHANGELOG.md](docs/CHANGELOG.md) for version history.
