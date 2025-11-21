# rollout-bucket

Deterministic percentage-based bucketing for feature flags and A/B testing.

## Overview

`rollout-bucket` provides a simple, deterministic way to bucket users into percentage-based groups using MurmurHash3. This enables consistent feature flag rollouts, A/B tests, and multi-variant experiments without requiring external state or databases.

### Key Features

- **Deterministic**: Same user always gets same bucket for a feature
- **Feature Isolation**: Different features produce independent bucket assignments
- **Uniform Distribution**: Chi-square tested for statistical uniformity
- **TypeScript**: Full type safety with generics support
- **Dual Module**: Works with both ESM and CommonJS
- **Zero Dependencies** (runtime): Only uses `murmur-hash` for hashing
- **Lightweight**: < 5KB minified

## Installation

```bash
npm install rollout-bucket
```

## Quick Start

```typescript
import { RolloutBucket } from 'rollout-bucket';

const rollout = new RolloutBucket();

// Simple percentage-based feature flag
if (rollout.isEnabled('new-ui', userId, 25)) {
  // Show new UI to 25% of users
}

// Multi-variant testing
const variant = rollout.getVariant('checkout-flow', userId, [
  { name: 'control', weight: 50 },
  { name: 'variant-a', weight: 30 },
  { name: 'variant-b', weight: 20 },
]);
```

## API Reference

### Constructor

```typescript
new RolloutBucket(seed?: number)
```

Creates a new `RolloutBucket` instance.

- **seed** (optional): Seed for hash function. Default: `0`. Different seeds produce different distributions.

**Example:**

```typescript
const rollout = new RolloutBucket(); // Default seed
const rollout2 = new RolloutBucket(42); // Custom seed
```

### getBucket()

```typescript
getBucket(feature: string, identifier: string): number
```

Returns a deterministic bucket number (0-99) for a given feature and user identifier.

- **feature**: Feature name or identifier
- **identifier**: User/entity identifier (user ID, session ID, etc.)
- **Returns**: Bucket number between 0 and 99 (inclusive)

**Example:**

```typescript
const bucket = rollout.getBucket('new-feature', 'user-123');
// Always returns the same bucket for this feature + user combination
console.log(bucket); // e.g., 42
```

**Characteristics:**

- Deterministic: Same inputs always produce same output
- Feature isolated: `getBucket('feature-a', 'user-1')` ≠ `getBucket('feature-b', 'user-1')`
- Uniformly distributed: Each bucket has ~1% probability

### isEnabled()

```typescript
isEnabled(feature: string, identifier: string, percentage: number): boolean
```

Checks if a feature should be enabled for a user based on percentage rollout.

- **feature**: Feature name or identifier
- **identifier**: User/entity identifier
- **percentage**: Rollout percentage (0-100)
- **Returns**: `true` if feature is enabled, `false` otherwise

**Example:**

```typescript
// Gradual rollout: enable for 25% of users
if (rollout.isEnabled('beta-feature', userId, 25)) {
  showBetaFeature();
}

// Full rollout
if (rollout.isEnabled('stable-feature', userId, 100)) {
  // Enabled for everyone
}

// Disabled
if (rollout.isEnabled('disabled-feature', userId, 0)) {
  // Never executes
}
```

**Edge Cases:**

- `percentage <= 0`: Always returns `false`
- `percentage >= 100`: Always returns `true`
- Deterministic: Same user gets consistent result across calls

### getVariant()

```typescript
getVariant<T = string>(
  feature: string,
  identifier: string,
  variants: Variant<T>[]
): T | null
```

Selects a variant from weighted options for multi-variant testing.

**Type:** `Variant<T> = { name: T; weight: number }`

- **feature**: Feature name or identifier
- **identifier**: User/entity identifier
- **variants**: Array of variant configurations with weights (0-100)
- **Returns**: Selected variant name, or `null` if variants array is empty

**Example:**

```typescript
// A/B/C test with uneven split
const variant = rollout.getVariant('pricing-page', userId, [
  { name: 'control', weight: 50 }, // 50% of users
  { name: 'variant-a', weight: 30 }, // 30% of users
  { name: 'variant-b', weight: 20 }, // 20% of users
]);

switch (variant) {
  case 'control':
    showOriginalPricing();
    break;
  case 'variant-a':
    showPricingVariantA();
    break;
  case 'variant-b':
    showPricingVariantB();
    break;
}
```

**TypeScript Generics:**

```typescript
// Use with custom variant types
const colorVariant = rollout.getVariant('theme', userId, [
  { name: 'blue' as const, weight: 50 },
  { name: 'green' as const, weight: 50 },
]);
// Type: "blue" | "green" | null

// Use with numbers
const tier = rollout.getVariant('service-tier', userId, [
  { name: 1, weight: 60 },
  { name: 2, weight: 30 },
  { name: 3, weight: 10 },
]);
// Type: number | null
```

**Weight Behavior:**

- Weights are cumulative: `[{w: 30}, {w: 30}, {w: 40}]` → buckets 0-29, 30-59, 60-99
- If weights don't sum to 100, users with bucket ≥ sum get the last variant
- All variants are statistically reachable with proper weight distribution

## Use Cases

### Feature Flags (Gradual Rollout)

```typescript
const rollout = new RolloutBucket();

// Start with 1% of users
if (rollout.isEnabled('new-search', userId, 1)) {
  useNewSearchAlgorithm();
}

// Gradually increase to 10%, 50%, 100% as confidence grows
```

### A/B Testing

```typescript
const variant = rollout.getVariant('homepage-hero', userId, [
  { name: 'control', weight: 50 },
  { name: 'treatment', weight: 50 },
]);

trackExperiment('homepage-hero', variant);
```

### Canary Deployments

```typescript
// Route 5% of traffic to new service version
if (rollout.isEnabled('api-v2', requestId, 5)) {
  return callApiV2();
} else {
  return callApiV1();
}
```

### Beta Programs

```typescript
// Combine with user attributes for targeted rollouts
const isBetaEligible =
  user.isEarlyAdopter && rollout.isEnabled('beta-feature', user.id, 20);
```

## How It Works

`rollout-bucket` uses MurmurHash3 (32-bit) to convert `feature:identifier` into a deterministic hash, then maps it to a bucket (0-99) via modulo operation:

```
hash("feature:user-123") → 2847562934 → mod 100 → 34
```

This ensures **consistency** (same user always gets same bucket), **independence** (different features produce uncorrelated buckets), and **uniformity** (each bucket has ~1% probability). Feature names are part of the hash input, preventing "lock-in" where users always see all new features or none.

The library is validated with chi-square tests across 10,000 users to ensure accurate percentage-based distributions.

## Important Considerations

### What This Library Does

- Deterministic bucketing for percentage-based feature flags
- Statistically uniform distribution of users across buckets
- Feature-independent bucket assignment
- Multi-variant experiment support

### What This Library Does NOT Do

- **User targeting**: No support for targeting specific users/segments
- **Dynamic configuration**: No remote config or feature flag service
- **Analytics**: No event tracking or experiment analysis
- **Persistence**: No state management or database integration
- **Cryptographic security**: MurmurHash is NOT cryptographically secure

### When to Use

- You need deterministic percentage-based rollouts
- You want feature flag logic without external dependencies
- You're building a simple A/B testing system
- You need consistent bucketing across services (same seed + inputs)

### When NOT to Use

- You need cryptographically secure randomization
- You require user targeting based on attributes
- You need centralized feature flag management
- You want built-in analytics and experiment tracking

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, testing guidelines, and contribution workflow.

## Performance

- **Hash computation**: ~50-100ns per call (Node.js v20)
- **Memory**: Negligible overhead (stateless operation)
- **Bundle size**: < 5KB minified (including murmur-hash)

## License

MIT © vnykmshr

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.
