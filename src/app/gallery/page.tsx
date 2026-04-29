import MasonryGrid from "@/components/gallery/MasonryGrid";
import { baseURL } from "@/app/resources";
import { JsonLd } from "@/components/JsonLd";
import { Metadata } from "next";
import { sanityFetch } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { GALLERY_IMAGES_QUERY, PERSON_QUERY } from "@/sanity/lib/queries";
import { SanityImageSource } from "@sanity/image-url";

export const metadata: Metadata = {
  title: "Photo gallery — Ernesto Tzompantzi",
  description: "A photo collection by Ernesto Tzompantzi",
  openGraph: {
    title: "Photo gallery — Ernesto Tzompantzi",
    description: "A photo collection by Ernesto Tzompantzi",
    url: `${baseURL}/gallery`,
    images: [`${baseURL}/og?title=${encodeURIComponent("Photo gallery — Ernesto Tzompantzi")}`],
  },
};

export default async function Gallery() {
  const [rawImages, person] = await Promise.all([
    sanityFetch<{
      _id: string;
      image: SanityImageSource;
      alt: string;
      orientation: string;
    }[]>({ query: GALLERY_IMAGES_QUERY, tags: ["galleryImage"] }),
    sanityFetch<{ name: string; avatar: SanityImageSource | null }>({ query: PERSON_QUERY, tags: ["person"] }),
  ]);

  const authorImageUrl = person.avatar ? urlFor(person.avatar).width(200).url() : "";

  const images = rawImages.map((img) => ({
    _id: img._id,
    imageUrl: urlFor(img.image).width(1200).url(),
    alt: img.alt,
    orientation: img.orientation,
  }));

  return (
    <div className="w-full max-w-screen-lg">
      <JsonLd
        type="WebPage"
        baseURL={baseURL}
        path="/gallery"
        title="Photo gallery — Ernesto Tzompantzi"
        description="A photo collection by Ernesto Tzompantzi"
        image={`${baseURL}/og?title=${encodeURIComponent("Photo gallery — Ernesto Tzompantzi")}`}
        author={{
          name: person.name,
          url: `${baseURL}/gallery`,
          image: authorImageUrl,
        }}
      />
      <MasonryGrid images={images} />
    </div>
  );
}
