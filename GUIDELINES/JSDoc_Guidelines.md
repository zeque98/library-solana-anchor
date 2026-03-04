# Professional JSDoc Guidelines

This guideline focuses on professional JSDoc patterns tailored for mid-level developers working in **React, JavaScript, and TypeScript** environments.

At this level, documentation should move beyond "what" the code is (which the syntax already shows) to **"how"** to use it and **"why"** it behaves a certain way.

-----

## **Professional JSDoc Guideline**

### **1. Core Philosophy: Context over Redundancy**

* **JavaScript:** Use JSDoc to provide **full type safety** and Intellisense.
* **TypeScript:** Do **NOT** duplicate type definitions. Use JSDoc to explain *behavior*, *edge cases*, and provide *examples*.
  * *Bad (TS):* `@param {string} userId - The user's ID` (Redundant)
  * *Good (TS):* `@param userId - The UUID v4 string retrieved from the auth provider.` (Adds context)

### **2. The "Must-Have" Structure**

Every complex function or component should follow this structure:

1. **Summary:** A single sentence explaining the primary goal.
2. **Description (Optional):** Details on *when* to use this, side effects, or algorithm details.
3. **Parameters (`@param`):** Definitions of inputs.
4. **Return Value (`@returns`):** What comes out and what it represents (especially `null` or `undefined` cases).
5. **Example (`@example`):** The most critical tag for mid-senior dev velocity.

-----

### **3. Patterns by Technology**

#### **A. Pure JavaScript (Full Typing)**

Since there is no static type checker, you must be explicit.

```javascript
/**
 * Debounces a function call, ensuring it is only triggered once per delay period.
 *
 * @template T
 * @param {function(...args): T} func - The function to debounce.
 * @param {number} [delay=300] - The delay in milliseconds.
 * @returns {function(...args): void} A debounced version of the original function.
 *
 * @example
 * const saveInput = debounce((text) => api.save(text), 500);
 * // Only saves after user stops typing for 500ms
 */
export function debounce(func, delay = 300) { ... }
```

#### **B. TypeScript (Behavioral Documentation)**

Skip the types in `@param` and `@returns`. Focus on the *nuance*.

```typescript
/**
 * Calculates the total price with tax, handling region-specific exemptions.
 *
 * @remarks
 * This function uses a caching strategy for tax rates. If the region code
 * is invalid, it throws a `RegionError`.
 *
 * @param price - The raw price in cents (integer).
 * @param regionCode - ISO 3166-1 alpha-2 code (e.g., 'US', 'CA').
 * @returns The final price in cents. Returns -1 if tax calculation fails gracefully.
 *
 * @throws {RegionError} If the region code is not supported.
 */
export const calculateTotal = (price: number, regionCode: string): number => { ... }
```

#### **C. React Components (Props & Usage)**

Focus on what the component *renders* and specific prop behaviors.

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick: () => void;
}

/**
 * A polimorphic button component that handles loading states automatically.
 *
 * @component
 * @example
 * // Basic usage with primary variant
 * <Button variant="primary" onClick={handleSubmit}>
 * Submit Form
 * </Button>
 *
 * @param props - The component props.
 * @param props.variant - Visual style. Defaults to 'secondary' if omitted.
 * @param props.disabled - Disables interaction and applies 0.5 opacity.
 * @returns A styled button element.
 */
export const Button = ({ variant = 'secondary', ...props }: ButtonProps) => { ... }
```

#### **D. React Hooks**

Document the *return tuple/object* clearly, as hooks often return opaque arrays.

```typescript
/**
 * Custom hook to manage local storage with automatic JSON parsing.
 *
 * @param key - The key under which the value is stored.
 * @param initialValue - Fallback value if the key doesn't exist.
 * @returns A tuple containing:
 * 1. `storedValue` - The current state.
 * 2. `setValue` - Function to update state and localStorage simultaneously.
 */
export function useLocalStorage<T>(key: string, initialValue: T) { ... }
```

#### **E. Solana/Blockchain-Specific Patterns**

For Solana applications, document blockchain-specific concepts like PDAs, transactions, and account management.

```typescript
/**
 * Derives a Program Derived Address (PDA) for an escrow account.
 *
 * @remarks
 * PDAs are deterministic addresses derived from seeds. This function uses
 * the escrow seeds (maker + seed) to generate a unique, program-owned address.
 * The bump seed is returned to allow programmatic verification.
 *
 * @param seeds - The escrow seeds containing maker and seed
 * @param programId - The anchor-escrow program ID
 * @returns Tuple of [PublicKey, bump] where bump is the 8-bit seed used in derivation
 *
 * @example
 * const [escrowPDA, bump] = deriveEscrowPDA(
 *   { maker: wallet.publicKey, seed: 12345n },
 *   programId
 * );
 * // Use escrowPDA as the account address in transactions
 */
export const deriveEscrowPDA = (...) => { ... }
```

**Transaction Builders vs Send-and-Confirm:**

```typescript
/**
 * Builds a transaction instruction for creating an escrow.
 *
 * @remarks
 * This function returns a {@link MethodsBuilder}, allowing you to:
 * - Add pre/post instructions
 * - Modify accounts
 * - Call `.instruction()` to get the instruction
 * - Call `.rpc()` to send and confirm automatically
 *
 * Use this when you need fine-grained control over transaction construction.
 * For simple cases, use `makeSendAndConfirm()` instead.
 *
 * @param args - Escrow creation parameters
 * @param remainingAccounts - Optional additional account metas
 * @returns MethodsBuilder that can be further configured
 *
 * @example
 * // Build instruction manually
 * const builder = makeBuilder(args);
 * const instruction = await builder.instruction();
 * tx.add(instruction);
 *
 * // Or send directly
 * const signature = await makeBuilder(args).rpc();
 */
export const makeBuilder = (...) => { ... }

/**
 * Creates an escrow and automatically sends/confirms the transaction.
 *
 * @remarks
 * This is a convenience wrapper around `makeBuilder().rpc()`. Use this when
 * you don't need to customize the transaction. The wallet from the provider
 * will be used to sign and send.
 *
 * @param args - Escrow creation parameters
 * @returns Promise resolving to transaction signature
 * @throws {Error} If program not initialized or transaction fails
 */
export const makeSendAndConfirm = async (...) => { ... }
```

#### **F. React Router Patterns**

For React Router v7+ applications, document route-specific functions.

```typescript
/**
 * Route metadata for SEO and document head.
 *
 * @remarks
 * This function is called by React Router to set page title and meta tags.
 * It runs on both server and client during SSR/SSG.
 *
 * @param args - Route loader/action data (if available)
 * @returns Array of meta tag objects
 */
export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Home | Solana Escrow Program' },
    { name: 'description', content: 'Welcome!' },
  ];
}
```

#### **G. Action Functions (Pure Business Logic)**

For functions that handle business logic but not UI state, emphasize the separation of concerns.

```typescript
/**
 * Pure business logic function for creating an escrow.
 *
 * @remarks
 * This function handles validation, derivation, and transaction execution.
 * It does NOT handle UI state updates or logging - those are the responsibility
 * of the calling component. This separation allows for easier testing and reuse.
 *
 * @param connection - Solana RPC connection
 * @param walletPubKey - Wallet public key (must be connected)
 * @param args - Escrow creation parameters from form inputs
 * @returns Promise resolving to transaction signature and seed
 * @throws {Error} If validation fails, wallet not connected, or transaction fails
 *
 * @example
 * ```typescript
 * try {
 *   const { signature, seed } = await makeEscrowAction(
 *     connection,
 *     wallet.publicKey,
 *     formData
 *   );
 *   // Update UI state here
 *   setSuccessMessage(`Escrow created: ${signature}`);
 * } catch (error) {
 *   // Handle error in UI
 *   setErrorMessage(error.message);
 * }
 * ```
 */
export async function makeEscrowAction(...) { ... }
```

#### **H. Context Providers**

Document the context value shape and usage patterns clearly.

```typescript
/**
 * Provider component that manages transaction log state and persistence.
 *
 * @remarks
 * Stores transaction logs in localStorage and provides methods to add/update/clear.
 * Logs are automatically persisted and restored on page reload. Maximum of 100 logs
 * are kept (oldest are removed when limit is reached).
 *
 * @param children - React children to wrap
 *
 * @example
 * ```tsx
 * <TransactionLogProvider>
 *   <App />
 * </TransactionLogProvider>
 * ```
 */
export function TransactionLogProvider({ children }: { children: ReactNode }) { ... }

/**
 * Hook to access transaction log context.
 *
 * @returns Context value containing:
 * - `logs`: Array of transaction logs
 * - `addLog`: Function to add a new log
 * - `updateLog`: Function to update an existing log by ID
 * - `clearLogs`: Function to clear all logs
 *
 * @throws {Error} If used outside TransactionLogProvider
 */
export function useTransactionLog() { ... }
```

#### **I. Async Data Fetching Hooks**

For hooks that fetch and manage async data, document the return object structure clearly.

```typescript
/**
 * Hook to fetch and filter available escrows for the connected user (Taker).
 *
 * @remarks
 * Filters out escrows created by the current user and expired escrows.
 * Taken/completed escrows are automatically removed by the program, so we
 * rely on `program.account.escrow.all()` for accuracy.
 *
 * @param excludeMaker - Optional: Exclude escrows from this maker (e.g., current user)
 * @param autoRefresh - Whether to auto-refresh escrows (default: true)
 * @param refreshInterval - Refresh interval in ms (default: 5000, only used if autoRefresh is true)
 * @returns Object containing:
 * - `escrows`: Array of available escrow accounts
 * - `loading`: Boolean indicating if data is being fetched
 * - `error`: Error object if fetch failed, null otherwise
 * - `currentSlot`: Current Solana slot (for expiry checks)
 * - `refresh`: Manual refresh function
 *
 * @example
 * ```tsx
 * const { escrows, loading, error, refresh } = useAvailableEscrows(
 *   wallet?.publicKey, // Exclude own escrows
 *   true, // Auto-refresh
 *   10000 // Every 10 seconds
 * );
 * ```
 */
export function useAvailableEscrows(...) { ... }
```

#### **J. Type Conversions and Solana-Specific Types**

Document common type conversions between Solana types (BN, bigint, PublicKey).

```typescript
/**
 * Converts a BN (BigNumber) to bigint for use in program methods.
 *
 * @remarks
 * Anchor program methods expect BN, but we use bigint in the frontend
 * for better type safety and native support. This conversion is necessary
 * when passing values to program methods.
 *
 * @param value - BN or bigint value to convert
 * @returns BN instance suitable for Anchor program calls
 *
 * @example
 * const seedBN = new BN(seedBigInt.toString());
 * await program.methods.make(seedBN, ...);
 */
```

#### **K. Error Handling Patterns**

Document validation and error handling strategies, especially for blockchain operations.

```typescript
/**
 * Validates escrow creation parameters before transaction execution.
 *
 * @remarks
 * This function performs comprehensive validation including:
 * - SOL balance checks for transaction fees
 * - Token account existence verification
 * - Amount and duration validation
 * - On-chain account verification
 *
 * All validation errors are collected and returned as an array, allowing
 * the caller to display all issues at once rather than failing on first error.
 *
 * @param connection - Solana connection for on-chain checks
 * @param params - Escrow parameters to validate
 * @returns Promise resolving to array of validation errors (empty if valid)
 *
 * @example
 * ```typescript
 * const errors = await validateMakeEscrow(connection, params);
 * if (errors.length > 0) {
 *   // Display all errors to user
 *   errors.forEach(err => console.error(err.message));
 *   return;
 * }
 * // Proceed with transaction
 * ```
 */
```

-----

### **4. Advanced Tags for "Pro" Documentation**

* **`@deprecated`**: Crucial for refactoring. Always add *what to use instead*.
  * `@deprecated Use 'useNewAuth()' instead. Will be removed in v2.0.`
* **`@see`**: Links to related functions or external docs (Jira tickets, Figma links).
  * `@see {@link https://react.dev/reference/react/useState}`
* **`@todo`**: Marks technical debt directly in the docs.
  * `@todo Refactor to use React Query for caching.`
