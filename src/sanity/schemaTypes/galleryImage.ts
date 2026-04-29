import { defineField, defineType } from "sanity";

export const galleryImage = defineType({
  name: "galleryImage",
  title: "Gallery Image",
  type: "document",
  fields: [
    defineField({ name: "image", type: "image", title: "Image", options: { hotspot: true }, validation: (r) => r.required() }),
    defineField({ name: "alt", type: "string", title: "Alt Text", validation: (r) => r.required() }),
    defineField({
      name: "orientation",
      type: "string",
      title: "Orientation",
      options: { list: [{ title: "Horizontal", value: "horizontal" }, { title: "Vertical", value: "vertical" }], layout: "radio" },
    }),
    defineField({ name: "order", type: "number", title: "Display Order" }),
  ],
  preview: { select: { title: "alt", media: "image" } },
});
