import { defineField, defineType } from "sanity";

export const socialLink = defineType({
  name: "socialLink",
  title: "Social Link",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", title: "Name" }),
    defineField({ name: "icon", type: "string", title: "Icon key", description: "One of: github, linkedin, email, x" }),
    defineField({ name: "url", type: "url", title: "URL" }),
    defineField({ name: "order", type: "number", title: "Display Order" }),
  ],
  preview: { select: { title: "name", subtitle: "url" } },
});
