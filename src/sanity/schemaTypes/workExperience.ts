import { defineField, defineType } from "sanity";

export const workExperience = defineType({
  name: "workExperience",
  title: "Work Experience",
  type: "document",
  fields: [
    defineField({ name: "company", type: "string", title: "Company", validation: (r) => r.required() }),
    defineField({ name: "timeframe", type: "string", title: "Timeframe", validation: (r) => r.required() }),
    defineField({ name: "role", type: "string", title: "Role", validation: (r) => r.required() }),
    defineField({ name: "order", type: "number", title: "Display Order", description: "Lower number appears first (1 = most recent)" }),
    defineField({ name: "achievements", type: "array", title: "Achievements", of: [{ type: "block" }] }),
  ],
  preview: { select: { title: "company", subtitle: "role" } },
});
