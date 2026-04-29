import { defineField, defineType } from "sanity";

export const pageSettings = defineType({
  name: "pageSettings",
  title: "Page Settings",
  type: "document",
  description: "Singleton — only one Page Settings document should exist. Create it once and update it.",
  fields: [
    defineField({ name: "headline", type: "string", title: "Hero Headline", description: "e.g. Welcome to my website!" }),
    defineField({ name: "subline", type: "text", title: "Hero Subline", rows: 3 }),
    defineField({ name: "contactCtaTitle", type: "string", title: "Contact CTA Label", description: "e.g. Let's connect" }),
    defineField({ name: "featuredLabel", type: "string", title: "Featured Banner Label", description: "e.g. Currently working on:" }),
    defineField({ name: "featuredProject", type: "reference", title: "Featured Project", to: [{ type: "workProject" }] }),
    defineField({ name: "projectsSectionTitle", type: "string", title: "Projects Section Title", description: "e.g. Latest Projects" }),
    defineField({ name: "sportsSectionTitle", type: "string", title: "Sports Section Title", description: "e.g. Recent from Sports" }),
  ],
  preview: { select: { title: "headline" } },
});
