# update dashboard to use tanstack query for caching -- DONE

# make main area scrollarea not so the siteheader stays visible DONE

# privacy mode on dashboard (blur numbers or something like that) DONE

# add single month calendar srange select to spending and expense tables - DONE

- fix the weird issue with the select dropdowns
- encryption! and then delete the data and re-upload
- create the ability to bulk update categories and isRecurring
- bulk delete?

# Security Implementation for Financial Data - Next.js App

## Context

This is a budgeting application handling sensitive financial data. We need to implement proper API route protection and consider encryption strategies for storing user financial information securely.

## Task 1: API Route Protection

### Implement Authentication Middleware

Create a middleware system to protect all API routes:

1. **Create `middleware.ts`** in the root directory to protect `/api/*` routes
2. **Create `lib/auth-helpers.ts`** with reusable auth functions:

   - `getCurrentUser()` - validates session and returns user
   - `requireAuth()` - throws if not authenticated
   - `requireOwnership()` - validates user owns the resource

3. **Update ALL API routes** to include authentication checks:

   ```typescript
   // Example pattern for every API route
   const user = await getCurrentUser();
   if (!user) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
   ```

4. **Implement resource-level authorization**:
   - Verify user owns the expense/budget/category before allowing CRUD
   - Add `userId` checks in all Prisma queries
   - Never trust client-provided user IDs

### Rate Limiting

- Implement rate limiting for API routes to prevent abuse
-
- Different limits for different endpoints (stricter for mutations)

## Task 2: Database Security & Encryption

### 1. Sensitive Data Encryption

Identify and encrypt sensitive fields:

**Fields to encrypt** (at minimum):

- Account numbers
- Account balances
- Transaction amounts
- Transaction descriptions
- Personal notes/memos
- Any API keys or tokens stored

**Implementation approach**:

```typescript
// lib/encryption.ts
- Use AES-256-GCM for field-level encryption
- Create encrypt/decrypt helpers
- Store encryption keys in environment variables (not in code)
- Consider using AWS KMS or similar for key management
```

### 2. Database Schema Updates

Update Prisma schema for encrypted fields:

```prisma
model Expense {
  id              String   @id
  userId          String
  amount          String   // Encrypted
  amountEncrypted Bytes?   // Alternative: store as bytes
  description     String?  // Encrypted
  // ... other fields
}
```

### 3. Migration Strategy

1. **Add new encrypted columns** alongside existing ones
2. **Create migration script** to encrypt existing data
3. **Update all queries** to use encryption/decryption
4. **Remove unencrypted columns** after verification

### 4. Query Patterns

Create secure query helpers:

```typescript
// lib/secure-queries.ts
export async function getDecryptedExpenses(userId: string) {
  const expenses = await prisma.expense.findMany({
    where: { userId },
  });
  return expenses.map((expense) => ({
    ...expense,
    amount: decrypt(expense.amount),
    description: expense.description ? decrypt(expense.description) : null,
  }));
}
```

## Task 3: Additional Security Measures

### 1. Input Validation

- Sanitize all inputs before database storage
- Use Zod schemas for API route validation
- Prevent SQL injection (Prisma handles this, but be careful with raw queries)

### 2. Audit Logging

- Log all financial data access and modifications
- Store: userId, action, timestamp, IP address
- Consider separate audit database/table

### 3. Session Security

- Implement secure session management
- Short session lifetimes for financial data
- Re-authentication for sensitive operations (delete all, export data)

### 4. Data Export Security

- Encrypt any data exports
- Add watermarks with user info
- Time-limited download links

### 5. Privacy Features

- Implement "privacy mode" to hide amounts
- Allow users to permanently delete their data
- Regular automated backups with encryption

## Implementation Priority

1. **Critical (Do First)**:

   - API route authentication
   - Resource ownership validation
   - Encrypt financial amounts

2. **Important (Do Next)**:

   - Encrypt all sensitive fields
   - Rate limiting
   - Audit logging

3. **Nice to Have**:
   - Advanced key management (KMS)
   - Privacy mode
   - Export encryption

## Security Testing Checklist

- [ ] Cannot access other users' data
- [ ] All API routes require authentication
- [ ] Encrypted data is never sent to client in plain text
- [ ] Rate limiting prevents abuse
- [ ] SQL injection is not possible
- [ ] XSS attacks are prevented
- [ ] CSRF protection is enabled

## Important Considerations

- **Performance**: Encryption/decryption adds overhead - consider caching decrypted data in memory briefly
- **Searchability**: Encrypted fields can't be searched directly - may need additional indexes
- **Backups**: Ensure backup encryption keys are stored securely
- **Compliance**: Consider requirements like PCI DSS, GDPR for financial data
- **Key Rotation**: Plan for periodic encryption key rotation

Remember: Security is layered. No single measure is sufficient - implement multiple layers of protection for defense in depth.

Implement Authentication Middleware
Create a middleware system to protect all API routes:

Create middleware.ts in the root directory to protect /api/\* routes
Create lib/auth-helpers.ts with reusable auth functions:

getCurrentUser() - validates session and returns user
requireAuth() - throws if not authenticated
requireOwnership() - validates user owns the resource

Update ALL API routes to include authentication checks:
typescript// Example pattern for every API route
const user = await getCurrentUser()
if (!user) {
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

Implement resource-level authorization:

Verify user owns the expense/budget/category before allowing CRUD
Add userId checks in all Prisma queries
Never trust client-provided user IDs

Rate Limiting

Implement rate limiting for the GEMINI API call routes to prevent abuse
Use upstash redis --- i have set the environment variables in the .env already.
We ONLY need to rate limit the AI functionality to prevent running up a huge bill accidentally.
Make a detailed plan for implemntation of these two pieces of functionality
