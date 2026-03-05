---
name: jsdoc-guidelines
description: Professional JSDoc patterns for React, JavaScript, TypeScript, and Solana code in this project. Use when adding or updating documentation comments to ensure behavioral, example-driven JSDoc that avoids redundant typing and focuses on usage, edge cases, and Solana-specific patterns.
---

# JSDoc Guidelines

Project-wide JSDoc conventions for React, JavaScript, TypeScript, and Solana-related code. This skill emphasizes context-rich, example-driven docs over redundant type annotations.

## When to Apply

Use these guidelines whenever you:
- Add or modify `/** ... */` comments on functions, components, hooks, or utilities
- Document Solana-specific helpers (PDAs, transaction builders, validation, account utilities)
- Write docs for React Router metadata, context providers, or async hooks

## Core Philosophy

- **JavaScript (no types)**:
  - Use JSDoc to provide **full type information** and better IntelliSense.
  - Include `@template`, parameter, and return types explicitly.

- **TypeScript**:
  - Do **not** repeat types in `@param` / `@returns`.
  - Use JSDoc to explain **behavior, edge cases, and usage**:
    - When/why to call this
    - Assumptions and invariants
    - Important failure modes or thrown errors
    - Concrete `@example` blocks

## Recommended Structure

For any non-trivial function/hook/component:

1. **Summary line**: one sentence describing the main purpose.
2. **Optional `@remarks`**: behavioral details, caching, side effects, or how it interacts with Solana/network/UI.
3. **`@param` tags**:
   - JS: include types and detailed meaning.
   - TS: omit types, focus on domain meaning (e.g., "UUID v4 from auth provider").
4. **`@returns`**: clarify special values (`null`, `undefined`, sentinel values like `-1`).
5. **`@throws`** (when relevant): list error types and when they fire.
6. **`@example`**: realistic usage snippet; prefer end-to-end usage over toy examples.

## Technology-Specific Patterns (Project-Focused)

- **React components**
  - Document what they render, how key props affect behavior, and any visual/UX guarantees.
  - Use `@component` and a JSX `@example` showing common usage.

- **React hooks**
  - Clearly document the **shape of the return value** (tuple/object).
  - For async data hooks, describe `loading`, `error`, and `refresh` semantics.

- **Solana / Anchor helpers**
  - For PDA derivation: explain seeds, bump, and how the address is used.
  - For transaction builders vs `*SendAndConfirm`:
    - Builders: emphasize flexibility (pre/post instructions, remaining accounts, manual `.instruction()` vs `.rpc()`).
    - `*SendAndConfirm`: emphasize convenience, default confirmation, and when to prefer it.
  - For actions: clarify separation of concerns (pure business logic vs UI).

- **Validation and error handling**
  - Validation helpers should document:
    - Whether they **throw** or **return** error arrays/objects.
    - Which fields are validated (format vs on-chain checks).
    - Typical integration pattern (e.g., collect all errors and show them in UI).

## Advanced Tags to Use Deliberately

- `@deprecated` — always state what to use instead and, if relevant, removal version.
- `@see` — link related functions, documentation, or external references (e.g., React/Solana docs, Jira tickets).
- `@todo` — mark intentional technical debt with a clear future action.

## Additional Reference

For the full, detailed guideline with many technology-specific examples, see:

- [`JSDoc_Guidelines.md`](../../../GUIDELINES/JSDoc_Guidelines.md)

