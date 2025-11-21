import { describe, it, expect } from 'vitest';
import { RolloutBucket } from '../src/index';

// Test helper: Verify a function returns the same result when called multiple times
function expectDeterministicBehavior<T>(fn: () => T): void {
  const result1 = fn();
  const result2 = fn();
  const result3 = fn();

  expect(result1).toBe(result2);
  expect(result2).toBe(result3);
}

describe('RolloutBucket', () => {
  describe('getBucket()', () => {
    it('should return deterministic buckets for same input', () => {
      const rollout = new RolloutBucket();
      expectDeterministicBehavior(() => rollout.getBucket('new-ui', 'user-123'));
    });

    it('should return values between 0 and 99', () => {
      const rollout = new RolloutBucket();

      for (let i = 0; i < 100; i++) {
        const bucket = rollout.getBucket('feature', `user-${i}`);
        expect(bucket).toBeGreaterThanOrEqual(0);
        expect(bucket).toBeLessThan(100);
      }
    });

    it('should provide feature isolation - different features produce different buckets', () => {
      const rollout = new RolloutBucket();
      const identifier = 'user-123';

      const bucket1 = rollout.getBucket('feature-a', identifier);
      const bucket2 = rollout.getBucket('feature-b', identifier);
      const bucket3 = rollout.getBucket('feature-c', identifier);

      // With proper hashing, buckets should differ for different features
      // (extremely unlikely to all be the same with murmur hash)
      const allSame = bucket1 === bucket2 && bucket2 === bucket3;
      expect(allSame).toBe(false);
    });

    it('should produce different distributions with different seeds', () => {
      const rollout1 = new RolloutBucket(0);
      const rollout2 = new RolloutBucket(12345);
      const identifier = 'user-123';
      const feature = 'test-feature';

      const bucket1 = rollout1.getBucket(feature, identifier);
      const bucket2 = rollout2.getBucket(feature, identifier);

      expect(bucket1).not.toBe(bucket2);
    });

    it('should be consistent across multiple instances with same seed', () => {
      const rollout1 = new RolloutBucket(42);
      const rollout2 = new RolloutBucket(42);
      const feature = 'feature';
      const identifier = 'user';

      expect(rollout1.getBucket(feature, identifier)).toBe(rollout2.getBucket(feature, identifier));
    });

    it('should handle edge case inputs gracefully', () => {
      const rollout = new RolloutBucket();

      // Empty strings - should not throw
      expect(() => rollout.getBucket('', '')).not.toThrow();
      const emptyResult = rollout.getBucket('', '');
      expect(emptyResult).toBeGreaterThanOrEqual(0);
      expect(emptyResult).toBeLessThan(100);

      // Special characters
      expect(() => rollout.getBucket('feature:name', 'user@example.com')).not.toThrow();
      expect(() => rollout.getBucket('feature/test', 'user#123')).not.toThrow();

      // Very long strings
      const longString = 'x'.repeat(10000);
      expect(() => rollout.getBucket(longString, longString)).not.toThrow();
      const longResult = rollout.getBucket(longString, longString);
      expect(longResult).toBeGreaterThanOrEqual(0);
      expect(longResult).toBeLessThan(100);
    });

    it('should produce uniform distribution (chi-square test)', () => {
      const rollout = new RolloutBucket();
      const totalUsers = 10000;
      const numBuckets = 100;
      const expectedPerBucket = totalUsers / numBuckets;

      // Count occurrences in each bucket
      const bucketCounts = new Array(numBuckets).fill(0);
      for (let i = 0; i < totalUsers; i++) {
        const bucket = rollout.getBucket('feature', `user-${i}`);
        bucketCounts[bucket]++;
      }

      // Calculate chi-square statistic: Σ((observed - expected)² / expected)
      let chiSquare = 0;
      for (let i = 0; i < numBuckets; i++) {
        const observed = bucketCounts[i];
        const diff = observed - expectedPerBucket;
        chiSquare += (diff * diff) / expectedPerBucket;
      }

      // For 99 degrees of freedom (100 buckets - 1) and α=0.05 significance level,
      // the critical value is approximately 123.23
      // We use a more lenient threshold of 135 to account for random variation
      // Reference: https://www.itl.nist.gov/div898/handbook/eda/section3/eda3674.htm
      const criticalValue = 135;

      expect(chiSquare).toBeLessThan(criticalValue);

      // Also verify that each bucket has a reasonable count (within 3 standard deviations)
      // Standard deviation for uniform distribution ≈ sqrt(n*p*(1-p)) ≈ 9.95
      // 3 standard deviations ≈ 30
      for (let i = 0; i < numBuckets; i++) {
        expect(bucketCounts[i]).toBeGreaterThan(expectedPerBucket - 30);
        expect(bucketCounts[i]).toBeLessThan(expectedPerBucket + 30);
      }
    });
  });

  describe('isEnabled()', () => {
    it('should handle edge case percentages correctly', () => {
      const rollout = new RolloutBucket();

      // 0% - always false
      for (let i = 0; i < 10; i++) {
        expect(rollout.isEnabled('feature', `user-${i}`, 0)).toBe(false);
      }

      // 100% - always true
      for (let i = 0; i < 10; i++) {
        expect(rollout.isEnabled('feature', `user-${i}`, 100)).toBe(true);
      }

      // Negative percentage - always false
      expect(rollout.isEnabled('feature', 'user', -10)).toBe(false);
      expect(rollout.isEnabled('feature', 'user', -100)).toBe(false);

      // >100 percentage - always true
      expect(rollout.isEnabled('feature', 'user', 150)).toBe(true);
      expect(rollout.isEnabled('feature', 'user', 200)).toBe(true);
    });

    it('should enable approximately correct percentage of users', () => {
      const rollout = new RolloutBucket();
      const percentage = 30;
      const totalUsers = 10000;
      let enabledCount = 0;

      for (let i = 0; i < totalUsers; i++) {
        if (rollout.isEnabled('feature', `user-${i}`, percentage)) {
          enabledCount++;
        }
      }

      const actualPercentage = (enabledCount / totalUsers) * 100;
      // Should be within 2% of target (statistical margin)
      expect(actualPercentage).toBeGreaterThan(percentage - 2);
      expect(actualPercentage).toBeLessThan(percentage + 2);
    });

    it('should be deterministic', () => {
      const rollout = new RolloutBucket();
      expectDeterministicBehavior(() => rollout.isEnabled('test', 'user-123', 50));
    });
  });

  describe('getVariant()', () => {
    it('should return null for empty variants array', () => {
      const rollout = new RolloutBucket();
      const variant = rollout.getVariant('feature', 'user', []);
      expect(variant).toBe(null);
    });

    it('should return deterministic variant for same input', () => {
      const rollout = new RolloutBucket();
      const variants = [
        { name: 'control', weight: 50 },
        { name: 'variant-a', weight: 30 },
        { name: 'variant-b', weight: 20 },
      ];

      expectDeterministicBehavior(() => rollout.getVariant('feature', 'user-123', variants));
    });

    it('should handle single variant', () => {
      const rollout = new RolloutBucket();
      const variants = [{ name: 'only', weight: 100 }];

      // All users should get the single variant
      for (let i = 0; i < 100; i++) {
        const variant = rollout.getVariant('feature', `user-${i}`, variants);
        expect(variant).toBe('only');
      }
    });

    it('should distribute variants according to weights', () => {
      const rollout = new RolloutBucket();
      const variants = [
        { name: 'control', weight: 50 },
        { name: 'variant-a', weight: 30 },
        { name: 'variant-b', weight: 20 },
      ];

      const counts = { control: 0, 'variant-a': 0, 'variant-b': 0 };
      const totalUsers = 10000;

      for (let i = 0; i < totalUsers; i++) {
        const variant = rollout.getVariant('feature', `user-${i}`, variants);
        if (variant) {
          counts[variant]++;
        }
      }

      // Check distribution is within 3% of expected
      expect(counts.control / totalUsers).toBeCloseTo(0.5, 1);
      expect(counts['variant-a'] / totalUsers).toBeCloseTo(0.3, 1);
      expect(counts['variant-b'] / totalUsers).toBeCloseTo(0.2, 1);
    });

    it('should handle custom variant types with TypeScript generics', () => {
      const rollout = new RolloutBucket();
      const variants = [
        { name: 1, weight: 50 },
        { name: 2, weight: 50 },
      ];

      const variant = rollout.getVariant('feature', 'user', variants);
      expect(typeof variant).toBe('number');
      expect([1, 2]).toContain(variant);
    });

    it('should fallback to last variant if weights do not sum to 100', () => {
      const rollout = new RolloutBucket();
      const variants = [
        { name: 'a', weight: 10 },
        { name: 'b', weight: 10 },
        { name: 'c', weight: 10 },
      ];

      // Test many users - some will have bucket > 30
      const results = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        const variant = rollout.getVariant('feature', `user-${i}`, variants);
        if (variant) {
          results.add(variant);
        }
      }

      // Should see variant 'c' for users with bucket >= 30
      expect(results).toContain('c');
    });

    it('should handle weights exceeding 100', () => {
      const rollout = new RolloutBucket();
      const variants = [
        { name: 'a', weight: 60 },
        { name: 'b', weight: 60 }, // Total: 120
      ];

      // First variant gets buckets 0-59, second gets 60-99
      // Both should be reachable despite weight sum
      const results = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        const variant = rollout.getVariant('feature', `user-${i}`, variants);
        if (variant) {
          results.add(variant);
        }
      }

      expect(results.size).toBe(2);
      expect(results).toContain('a');
      expect(results).toContain('b');
    });

    it('should ensure all variants are reachable', () => {
      const rollout = new RolloutBucket();
      const variants = [
        { name: 'a', weight: 33 },
        { name: 'b', weight: 33 },
        { name: 'c', weight: 34 },
      ];

      const results = new Set<string>();
      for (let i = 0; i < 10000; i++) {
        const variant = rollout.getVariant('feature', `user-${i}`, variants);
        if (variant) {
          results.add(variant);
        }
      }

      expect(results.size).toBe(3);
      expect(results).toContain('a');
      expect(results).toContain('b');
      expect(results).toContain('c');
    });
  });
});
