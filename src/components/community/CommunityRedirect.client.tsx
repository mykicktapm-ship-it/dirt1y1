"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function CommunityRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/about/#notifications");
  }, [router]);

  return <Link href="/about/#notifications">Open your notifications in Dashboard</Link>;
}
