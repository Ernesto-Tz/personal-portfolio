import { defineField, defineType } from "sanity";

export const person = defineType({
  name: "person",
  title: "Person",
  type: "document",
  description: "Singleton — only one Person document should exist. Create it once and update it.",
  fields: [
    defineField({ name: "firstName", type: "string", title: "First Name" }),
    defineField({ name: "lastName", type: "string", title: "Last Name" }),
    defineField({ name: "role", type: "string", title: "Role" }),
    defineField({ name: "avatar", type: "image", title: "Avatar", options: { hotspot: true } }),
    defineField({ name: "email", type: "string", title: "Email" }),
    defineField({ name: "location", type: "string", title: "Location (IANA timezone)", description: "e.g. Europe/Budapest" }),
    defineField({ name: "languages", type: "array", title: "Languages", of: [{ type: "string" }] }),
    defineField({ name: "introText", type: "array", title: "Intro Text (About page)", of: [{ type: "block" }] }),
  ],
  preview: { select: { title: "firstName", subtitle: "role", media: "avatar" } },
});
