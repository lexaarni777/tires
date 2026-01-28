'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminGate({ children, rolesRequired = ['admin'] }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const user = useSelector((state) => state.auth?.user);
  const roles = useSelector((state) => state.auth?.roles) || [];

  const hasRequiredRole = useMemo(() => {
    if (!rolesRequired?.length) return true;
    return rolesRequired.some((role) => roles.includes(role));
  }, [roles, rolesRequired]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!user) {
      router.replace(`/authform?from=${encodeURIComponent(pathname || '/')}`);
      return;
    }

    if (!hasRequiredRole) {
      router.replace('/account');
    }
  }, [mounted, user, hasRequiredRole, router, pathname]);

  if (!mounted) return null;
  if (!user) return null;
  if (!hasRequiredRole) return null;

  return children;
}

