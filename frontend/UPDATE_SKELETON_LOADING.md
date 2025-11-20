# Skeleton Loading & Meta Tags Update Guide

This document outlines the pattern for updating all pages with skeleton loading and meta tags.

## Pattern to Follow

### 1. Import Required Components
```typescript
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import { useButtonDisable } from "../hooks/useButtonDisable";
import { Metadata } from "../components/Metadata/Metadata";
```

### 2. Add Hook
```typescript
const [isButtonDisabled, handleButtonClick] = useButtonDisable();
```

### 3. Replace Loading Spinners
```typescript
// BEFORE:
if (loading) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#A333FF] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

// AFTER:
if (loading) {
  return (
    <div className="min-h-screen bg-white">
      <HomeHeader /> {/* or appropriate header */}
      <div className="container mx-auto px-4 py-10">
        <SkeletonCard count={6} /> {/* or appropriate skeleton */}
      </div>
    </div>
  );
}
```

### 4. Update Button Handlers
```typescript
// BEFORE:
<button onClick={() => someAction()}>
  Action
</button>

// AFTER:
<button 
  onClick={() => handleButtonClick(() => someAction())}
  disabled={isButtonDisabled}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isButtonDisabled ? "Loading..." : "Action"}
</button>
```

### 5. Add Metadata Component
```typescript
return (
  <div>
    <Metadata 
      title="Page Title"
      description="Page description"
      keywords="keyword1, keyword2"
    />
    {/* rest of component */}
  </div>
);
```

## Pages to Update

### ✅ Completed
- [x] home/page.tsx
- [x] profile/page.tsx
- [x] community-feed/page.tsx
- [x] login/page.tsx
- [x] challenges/[id]/page.tsx

### ⏳ Remaining
- [ ] signup/page.tsx
- [ ] shared-challenges/[id]/page.tsx
- [ ] profile/[username]/page.tsx
- [ ] profile/edit/page.tsx
- [ ] profile/settings/page.tsx
- [ ] challenge-center/page.tsx
- [ ] share-challenge/[id]/page.tsx
- [ ] [username]/[challengeId]/page.tsx
- [ ] forget-password/page.tsx
- [ ] reset-password/page.tsx
- [ ] reset-password/ResetPasswordContent.tsx
- [ ] admin/* pages
- [ ] Components (HomeHeader, etc.)

## Common Skeleton Patterns

### For Card Lists
```typescript
<SkeletonCard count={6} />
```

### For Forms
```typescript
<Skeleton variant="text" width="60%" height={32} className="mb-4" />
<Skeleton variant="rectangular" width="100%" height={48} className="mb-2" />
<Skeleton variant="rectangular" width="100%" height={48} />
```

### For Profile Pages
```typescript
<div className="flex items-start gap-4 mb-4">
  <Skeleton variant="avatar" width={48} height={48} />
  <div className="flex-1">
    <Skeleton variant="text" width="40%" height={24} className="mb-2" />
    <Skeleton variant="text" width="60%" height={16} />
  </div>
</div>
```

### For Challenge Details
```typescript
<Skeleton variant="image" width="100%" height={400} className="mb-6 rounded-xl" />
<Skeleton variant="text" width="100%" height={24} className="mb-2" />
<Skeleton variant="text" width="80%" height={20} className="mb-4" />
```




