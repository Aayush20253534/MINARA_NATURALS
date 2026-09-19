"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { LeafIcon } from "@/components/ui/icons";
import styles from "./product-detail.module.css";
function GalleryImage({
  src,
  title,
  zoom = false,
}: {
  src: string;
  title: string;
  zoom?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className={styles.imageFallback}>
      <LeafIcon width={42} height={42} />
      <span>Image unavailable</span>
    </div>
  ) : (
    <Image
      src={src}
      alt={title}
      fill
      priority={!zoom}
      sizes={zoom ? "90vw" : "(max-width: 800px) 92vw, 50vw"}
      className={styles.productImage}
      onError={() => setFailed(true)}
    />
  );
}
export function ProductGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const open = () => {
    dialog.current?.showModal();
  };
  return (
    <div className={styles.gallery}>
      {images.length ? (
        <button
          type="button"
          className={styles.mainImage}
          onClick={open}
          aria-label={`Enlarge ${title} image ${index + 1}`}
        >
          <GalleryImage
            key={images[index]}
            src={images[index]}
            title={`${title} — image ${index + 1}`}
          />
          <span className={styles.zoomHint}>View closer ↗</span>
        </button>
      ) : (
        <div className={styles.mainImage}>
          <div className={styles.imageFallback}>
            <LeafIcon width={50} height={50} />
            <span>Product photography coming soon</span>
          </div>
        </div>
      )}
      {images.length > 1 && (
        <div
          className={styles.thumbnails}
          role="group"
          aria-label="Product images"
        >
          {images.map((src, i) => (
            <button
              type="button"
              key={src}
              aria-label={`Show image ${i + 1}`}
              aria-pressed={index === i}
              onClick={() => setIndex(i)}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              <Image
                src={src}
                alt=""
                fill
                sizes="72px"
                className={styles.productImage}
                onError={(event) => {
                  event.currentTarget.style.opacity = "0";
                }}
              />
            </button>
          ))}
        </div>
      )}
      <p className={styles.galleryNote}>
        Product appearance and packaging may vary.
      </p>
      {images.length > 0 && (
        <dialog
          ref={dialog}
          className={styles.zoomDialog}
          aria-label={`${title} enlarged image`}
          onClick={(event) => {
            if (event.target === event.currentTarget) dialog.current?.close();
          }}
        >
          <div className={styles.zoomContent}>
            <button
              type="button"
              className={styles.closeZoom}
              onClick={() => dialog.current?.close()}
              aria-label="Close enlarged image"
            >
              ×
            </button>
            <GalleryImage
              key={images[index]}
              src={images[index]}
              title={title}
              zoom
            />
          </div>
        </dialog>
      )}
    </div>
  );
}
