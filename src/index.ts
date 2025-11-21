import { hash32 } from 'murmur-hash';

/**
 * Variant configuration for multi-variant testing
 */
export interface Variant<T = string> {
  /** Unique identifier for the variant */
  name: T;
  /** Weight/percentage for this variant (0-100) */
  weight: number;
}

/**
 * RolloutBucket provides deterministic percentage-based bucketing
 * for feature flags and A/B testing using murmur hash.
 */
export class RolloutBucket {
  private seed: number;

  /**
   * Creates a new RolloutBucket instance
   * @param seed - Optional seed for hash function (default: 0)
   */
  constructor(seed: number = 0) {
    this.seed = seed;
  }

  /**
   * Get the bucket number (0-99) for a given feature and identifier
   * @param feature - Feature name/identifier
   * @param identifier - User/entity identifier
   * @returns Bucket number between 0 and 99
   */
  getBucket(feature: string, identifier: string): number {
    const key = `${feature}:${identifier}`;
    const hash = hash32(key, this.seed);
    return Math.abs(hash) % 100;
  }

  /**
   * Check if a feature is enabled for a given identifier based on percentage
   * @param feature - Feature name/identifier
   * @param identifier - User/entity identifier
   * @param percentage - Rollout percentage (0-100)
   * @returns true if feature is enabled for this identifier
   */
  isEnabled(feature: string, identifier: string, percentage: number): boolean {
    if (percentage <= 0) return false;
    if (percentage >= 100) return true;

    const bucket = this.getBucket(feature, identifier);
    return bucket < percentage;
  }

  /**
   * Get the variant for a given identifier from weighted variant options
   * @param feature - Feature name/identifier
   * @param identifier - User/entity identifier
   * @param variants - Array of variant configurations with weights
   * @returns The selected variant name
   */
  getVariant<T = string>(feature: string, identifier: string, variants: Variant<T>[]): T | null {
    if (variants.length === 0) return null;

    const bucket = this.getBucket(feature, identifier);

    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.weight;
      if (bucket < cumulative) {
        return variant.name;
      }
    }

    // Fallback to last variant if weights don't sum to 100
    return variants[variants.length - 1]?.name ?? null;
  }
}

export default RolloutBucket;
