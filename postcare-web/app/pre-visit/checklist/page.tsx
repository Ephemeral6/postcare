'use client';

// This route redirects to the main pre-visit page with checklist tab
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChecklistRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/pre-visit?tab=checklist');
  }, [router]);
  return null;
}
