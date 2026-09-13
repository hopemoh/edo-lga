"use client";

import { useState, useEffect } from "react";

export function useSignedUrl(url: string | null | undefined): string {
  const [signed, setSigned] = useState<string>("");

  useEffect(() => {
    if (!url) {
      setSigned("");
      return;
    }

    if (!url.includes("s3.") && !url.includes("amazonaws.com")) {
      setSigned(url);
      return;
    }

    fetch(`/api/signed-url?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.signedUrl) setSigned(data.signedUrl);
      })
      .catch(() => setSigned(url));
  }, [url]);

  return signed;
}
