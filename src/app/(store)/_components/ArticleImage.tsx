"use client";

import { useState } from "react";

interface ArticleImageProps {
  src: string;
  alt: string;
}

export function ArticleImage({ src, alt }: ArticleImageProps) {
  const [error, setError] = useState(false);

  if (error) return null;

  return (
    <img
      src={src}
      alt={alt}
      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
      onError={() => setError(true)}
    />
  );
}
