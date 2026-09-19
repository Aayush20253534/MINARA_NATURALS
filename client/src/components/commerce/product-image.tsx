"use client";
import Image from "next/image";
import { useState } from "react";
import { LeafIcon } from "@/components/ui/icons";
import styles from "./product-card.module.css";
export function ProductImage({
  src,
  alt,
  priority,
}: {
  src: string | null;
  alt: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="(max-width: 560px) 45vw, (max-width: 900px) 42vw, 280px"
      className={styles.image}
      onError={() => setFailed(true)}
    />
  ) : (
    <div className={styles.placeholder}>
      <LeafIcon width={30} height={30} />
      <span>Image coming soon</span>
    </div>
  );
}
