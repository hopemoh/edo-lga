"use client";

import { useState, useEffect, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SignedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string | null | undefined;
}

export function SignedImage({ src, className, ...props }: SignedImageProps) {
  const [signedSrc, setSignedSrc] = useState<string>("");

  useEffect(() => {
    if (!src) {
      setSignedSrc("");
      return;
    }

    if (!src.includes("s3.") && !src.includes("amazonaws.com")) {
      setSignedSrc(src);
      return;
    }

    fetch(`/api/signed-url?url=${encodeURIComponent(src)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.signedUrl) setSignedSrc(data.signedUrl);
      })
      .catch(() => setSignedSrc(src));
  }, [src]);

  if (!signedSrc) return null;

  return <img src={signedSrc} className={cn(className)} {...props} />;
}
