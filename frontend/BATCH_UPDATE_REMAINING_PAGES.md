# Batch Update Guide for Remaining Pages

## Quick Update Script Pattern

For each remaining page, follow this pattern:

### 1. Add Imports
```typescript
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import { useButtonDisable } from "../hooks/useButtonDisable";
import { Metadata } from "../components/Metadata/Metadata";
```

### 2. Add Hook
```typescript
const [isButtonDisabled, handleButtonClick] = useButtonDisable();
```

### 3. Replace All Loading Spinners
Search for: `animate-spin|border-4.*border.*rounded-full|w-12 h-12.*border`

Replace with appropriate skeleton components.

### 4. Update All Button Handlers
Search for: `onClick=`
Wrap all onClick handlers with `handleButtonClick(() => ...)`
Add `disabled={isButtonDisabled}` and `disabled:opacity-50 disabled:cursor-not-allowed` to className

### 5. Add Metadata Component
Add `<Metadata title="..." description="..." keywords="..." />` at the start of return statement

## Remaining Pages Checklist

- [ ] profile/[username]/page.tsx
- [ ] profile/edit/page.tsx  
- [ ] profile/settings/page.tsx
- [ ] challenge-center/page.tsx
- [ ] share-challenge/[id]/page.tsx
- [ ] [username]/[challengeId]/page.tsx
- [ ] forget-password/page.tsx
- [ ] reset-password/page.tsx
- [ ] reset-password/ResetPasswordContent.tsx
- [ ] admin/page.tsx
- [ ] admin/challenges/page.tsx
- [ ] admin/users/page.tsx
- [ ] admin/activity/page.tsx
- [ ] admin/reports/page.tsx
- [ ] admin/settings/page.tsx
- [ ] Components (HomeHeader, LandingHeader, etc.)



