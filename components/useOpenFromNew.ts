"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Lets the "+ New" menu open a page's "new" dialog: the menu links to `/page?new=<key>`, and the dialog
 * is open while the address says so. Closing it removes `?new=` again, so a refresh does not reopen it.
 */
export function useOpenFromNew(key: string): [boolean, (open: boolean) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [manual, setManual] = useState(false);
  const wanted = params.get("new") === key;

  function setOpen(open: boolean) {
    setManual(open);
    if (!open && wanted) {
      const next = new URLSearchParams(params.toString());
      next.delete("new");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
  }

  return [manual || wanted, setOpen];
}
