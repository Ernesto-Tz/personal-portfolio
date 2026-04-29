import { groq } from "next-sanity";

// Sports posts
export const ALL_SPORTS_POSTS_QUERY = groq`
  *[_type == "sportsPost"] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    summary,
    publishedAt,
    tag,
    coverImage
  }
`;

export const SPORTS_POST_BY_SLUG_QUERY = groq`
  *[_type == "sportsPost" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    summary,
    publishedAt,
    tag,
    coverImage,
    body
  }
`;

export const ALL_SPORTS_POST_SLUGS_QUERY = groq`
  *[_type == "sportsPost"] { "slug": slug.current }
`;

// Work projects
export const ALL_WORK_PROJECTS_QUERY = groq`
  *[_type == "workProject"] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    summary,
    publishedAt,
    coverImage,
    images,
    link
  }
`;

export const WORK_PROJECT_BY_SLUG_QUERY = groq`
  *[_type == "workProject" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    summary,
    publishedAt,
    coverImage,
    images,
    link,
    body
  }
`;

export const ALL_WORK_PROJECT_SLUGS_QUERY = groq`
  *[_type == "workProject"] { "slug": slug.current }
`;

// Person (singleton)
export const PERSON_QUERY = groq`
  *[_type == "person"][0] {
    firstName,
    lastName,
    "name": firstName + " " + lastName,
    role,
    avatar,
    email,
    location,
    languages,
    introText
  }
`;

// Skills — icon projected as src to match SkillsMarquee's Skill interface
export const ALL_SKILLS_QUERY = groq`
  *[_type == "skill"] | order(_createdAt asc) {
    _id,
    title,
    "src": icon,
    href,
    "projects": projects[]->slug.current
  }
`;

// Work experience
export const WORK_EXPERIENCE_QUERY = groq`
  *[_type == "workExperience"] | order(order asc) {
    _id,
    company,
    timeframe,
    role,
    achievements
  }
`;

// Social links — url projected as link to match existing social interface
export const SOCIAL_LINKS_QUERY = groq`
  *[_type == "socialLink"] | order(order asc) {
    _id,
    name,
    icon,
    "link": url
  }
`;

// Gallery images
export const GALLERY_IMAGES_QUERY = groq`
  *[_type == "galleryImage"] | order(order asc) {
    _id,
    image,
    alt,
    orientation
  }
`;

// Page settings (singleton)
export const PAGE_SETTINGS_QUERY = groq`
  *[_type == "pageSettings"][0] {
    headline,
    subline,
    contactCtaTitle,
    featuredLabel,
    "featuredProject": featuredProject-> {
      title,
      "slug": slug.current
    },
    projectsSectionTitle,
    sportsSectionTitle
  }
`;
