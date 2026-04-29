"use client";

import Masonry from "react-masonry-css";
import Image from "next/image";

interface GalleryImage {
  _id: string;
  imageUrl: string;
  alt: string;
  orientation: string;
}

interface MasonryGridProps {
  images: GalleryImage[];
}

export default function MasonryGrid({ images }: MasonryGridProps) {
  const breakpointColumnsObj = {
    default: 2,
    720: 1,
  };

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="flex w-auto -ml-4"
      columnClassName="pl-4 bg-clip-padding"
    >
      {images.map((image, index) => (
        <div
          key={image._id}
          className="relative mb-4 rounded-xl overflow-hidden border border-border"
          style={{ aspectRatio: image.orientation === "horizontal" ? "16 / 9" : "3 / 4" }}
        >
          <Image
            priority={index < 10}
            src={image.imageUrl}
            alt={image.alt}
            fill
            sizes="(max-width: 560px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      ))}
    </Masonry>
  );
}
