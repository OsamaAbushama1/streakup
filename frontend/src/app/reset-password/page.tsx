"use client";

import React, { Suspense } from "react";
import ResetPassword from "./ResetPasswordContent";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPassword />
    </Suspense>
  );
}
