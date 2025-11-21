# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in rollout-bucket, please report it via [GitHub Security Advisories](https://github.com/vnykmshr/rollout-bucket/security/advisories/new).

**Please do not report security vulnerabilities through public GitHub issues.**

### What to Include

When reporting a vulnerability, please include:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

### Response Timeline

We take security seriously and will respond as quickly as possible. For urgent issues, consider submitting a PR with a proposed fix.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Considerations

rollout-bucket is a **deterministic bucketing library** for feature flags and A/B testing. It uses MurmurHash3 (non-cryptographic hash) for deterministic user assignment and has no network communication, data storage, or authentication mechanisms.

**Important**: MurmurHash3 is designed for speed, not security. Do not use this library for password hashing, cryptographic token generation, security-sensitive randomization, or anything requiring unpredictability. It is safe for feature flag rollouts, A/B test variant assignment, canary deployment bucketing, and experimentation frameworks.

## Dependencies

This package has minimal dependencies:

- **Production**: `murmur-hash` (hashing implementation)
- **Development**: Standard TypeScript/testing tools

We regularly update dependencies and monitor for security advisories via Dependabot.
