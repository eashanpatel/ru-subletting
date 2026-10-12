import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";
import { ROOM_TYPE_LABEL, type RoomType } from "@/lib/browse";

export type ContactKind = Database["public"]["Enums"]["contact_kind"];
export type AddressVisibility = Database["public"]["Enums"]["address_visibility"];

export const ADDRESS_VISIBILITY: { value: AddressVisibility; label: string; hint: string }[] = [
  {
    value: "private",
    label: "Only people I share it with",
    hint: "Everyone sees the street and the area on the map. You give the exact address to people you talk to.",
  },
  {
    value: "members",
    label: "Signed-in members",
    hint: "Anyone with an account sees the exact address and a pin. People who aren't signed in see the street and area.",
  },
  {
    value: "public",
    label: "Everyone",
    hint: "The exact address is shown to anyone. Best for landlords and buildings.",
  },
];
export type HomeType = "apartment" | "house";

export const ROOM_TYPES: { value: RoomType; label: string; hint: string }[] = [
  { value: "private_room", label: "Private room", hint: "Their own bedroom, shared common spaces" },
  { value: "shared_room", label: "Shared room", hint: "Shares a bedroom with someone" },
  { value: "entire_place", label: "Entire place", hint: "The whole apartment or house" },
  { value: "studio", label: "Studio", hint: "One room with its own kitchen and bath" },
];

/** Names students actually use. "Other" lets the lister type their own. */
export const NEIGHBORHOODS = [
  "College Ave area",
  "Easton Ave",
  "Hamilton St",
  "Somerset St",
  "Mine St",
  "Downtown New Brunswick",
  "Douglass / Cook",
  "Busch",
  "Livingston",
  "Highland Park",
  "Piscataway",
];

export const CONTACT_KINDS: Record<
  ContactKind,
  { label: string; placeholder: string; inputMode?: "email" | "tel" | "text"; validate: (v: string) => string | null }
> = {
  email: {
    label: "Email",
    placeholder: "you@example.com",
    inputMode: "email",
    validate: (v) => (z.email().safeParse(v).success ? null : "Enter an email like you@example.com."),
  },
  phone: {
    label: "Phone (text)",
    placeholder: "732 555 0142",
    inputMode: "tel",
    validate: (v) => (v.replace(/\D/g, "").length >= 10 ? null : "Enter a 10-digit phone number."),
  },
  whatsapp: {
    label: "WhatsApp",
    placeholder: "732 555 0142",
    inputMode: "tel",
    validate: (v) => (v.replace(/\D/g, "").length >= 10 ? null : "Enter the phone number on your WhatsApp."),
  },
  instagram: {
    label: "Instagram",
    placeholder: "@yourhandle",
    validate: (v) => (/^@?[A-Za-z0-9._]{1,30}$/.test(v) ? null : "Enter your Instagram handle, like @yourhandle."),
  },
  snapchat: {
    label: "Snapchat",
    placeholder: "@yourhandle",
    validate: (v) => (/^@?[A-Za-z0-9._-]{3,15}$/.test(v) ? null : "Enter your Snapchat username."),
  },
  other: {
    label: "Other",
    placeholder: "GroupMe, Discord, ...",
    validate: (v) => (v.trim().length >= 2 ? null : "Add how to reach you."),
  },
};

/** Link that opens each contact method in its app. */
export function contactHref(kind: ContactKind, value: string, subject?: string): string | null {
  const digits = value.replace(/\D/g, "");
  const us = digits.length === 10 ? `1${digits}` : digits;
  const handle = value.replace(/^@/, "");
  switch (kind) {
    case "email":
      return `mailto:${value}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
    case "phone":
      return `sms:+${us}`;
    case "whatsapp":
      return `https://wa.me/${us}`;
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "snapchat":
      return `https://snapchat.com/add/${handle}`;
    default:
      return null;
  }
}

export function unitLabel(roomType: RoomType, homeType: HomeType, bedrooms: number | null) {
  if (roomType === "studio") return "";
  const br = bedrooms ? `${bedrooms}BR` : homeType === "house" ? "house" : "apartment";
  const suffix = bedrooms && homeType === "house" ? " house" : "";
  return roomType === "entire_place" ? `${br}${suffix}` : `in ${br}${suffix}`;
}

export function listingTitle(roomType: RoomType, unit: string) {
  return `${ROOM_TYPE_LABEL[roomType]}${unit ? ` ${unit}` : ""}`;
}

const contactSchema = z.object({
  kind: z.enum(["email", "phone", "whatsapp", "instagram", "snapchat", "other"]),
  value: z.string().trim().max(200),
});

export const MAX_PHOTOS = 12;

/** Shared by the form and the server action. Publishing adds stricter checks. */
export const listingSchema = z
  .object({
    id: z.uuid(),
    intent: z.enum(["draft", "publish"]),
    roomType: z.enum(["private_room", "shared_room", "entire_place", "studio"], {
      error: "Choose what you're subletting.",
    }),
    homeType: z.enum(["apartment", "house"]),
    bedrooms: z.number().int().min(1).max(12).nullable(),
    bathrooms: z.number().min(0.5).max(8).nullable(),
    price: z
      .number({ error: "Enter the monthly rent." })
      .int("Use a whole dollar amount.")
      .min(50, "Rent looks too low. Enter the monthly amount.")
      .max(19999, "Rent looks too high. Enter the monthly amount."),
    dates: z.object({ start: z.string(), end: z.string() }, { error: "Pick when it's available." }).nullable(),
    address: z
      .object({
        full: z.string().min(1),
        street: z.string().nullable(),
        lat: z.number(),
        lng: z.number(),
      })
      .nullable(),
    neighborhood: z.string().trim().max(60),
    addressVisibility: z.enum(["private", "members", "public"]),
    description: z.string().trim().max(2000, "Keep it under 2,000 characters."),
    amenities: z.array(z.string()),
    photos: z.array(z.string()).max(MAX_PHOTOS),
    contacts: z.array(contactSchema).max(6),
  })
  .superRefine((v, ctx) => {
    if (!v.dates) ctx.addIssue({ code: "custom", path: ["dates"], message: "Pick when it's available." });
    v.contacts.forEach((c, i) => {
      if (!c.value) return;
      const problem = CONTACT_KINDS[c.kind].validate(c.value);
      if (problem) ctx.addIssue({ code: "custom", path: ["contacts", i, "value"], message: problem });
    });
    if (v.intent !== "publish") return;
    if (!v.address) ctx.addIssue({ code: "custom", path: ["address"], message: "Pick the address from the suggestions." });
    else if (!v.address.street)
      ctx.addIssue({ code: "custom", path: ["address"], message: "Pick an address that includes a street name." });
    if (!v.neighborhood) ctx.addIssue({ code: "custom", path: ["neighborhood"], message: "Choose a neighborhood." });
    if (v.roomType !== "studio" && !v.bedrooms)
      ctx.addIssue({ code: "custom", path: ["bedrooms"], message: "How many bedrooms does the place have?" });
    if (!v.bathrooms) ctx.addIssue({ code: "custom", path: ["bathrooms"], message: "How many bathrooms?" });
    if (v.photos.length === 0) ctx.addIssue({ code: "custom", path: ["photos"], message: "Add at least one photo." });
    if (!v.contacts.some((c) => c.value))
      ctx.addIssue({ code: "custom", path: ["contacts"], message: "Add at least one way to reach you." });
  });

export type ListingFormValues = z.infer<typeof listingSchema>;
