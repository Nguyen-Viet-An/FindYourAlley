import * as z from "zod"


const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
  disable: z.boolean().optional(),
});

export const eventFormSchema = z.object({
  title: z.string().min(3, 'Tiêu đề cần dài hơn 3 từ'),
  description: z.string().min(3, 'Mô tả cần dài hơn 3 từ'),
  artists: z.array(
    z.object({
      name: z.string().min(1, "Tên artist không được để trống"),
      link: z.string().optional(),
    })
  ).min(1, "Cần ít nhất một artist"),
  images: z.array(
    z.object({
      imageUrl: z.string(),
      categoryIds: z.array(optionSchema).default([]),
      itemTypeIds: z.array(optionSchema).default([]),
    })
  ).min(1, "Cần ít nhất một sample"),
  startDateTime: z.date(),
  endDateTime: z.date(),
  hasPreorder: z.enum(["Yes", "No"]),
  extraTag: z.array(z.string()).optional(),
  // isFree: z.boolean(),
  url: z.string().optional(),
  festival: z.array(z.string()).optional().default([]),
  featuredProductImageUrl: z.string().optional().default(""),
  featuredProductDescription: z.string().max(200, "Tối đa 200 ký tự").optional().default(""),
  dealBadge: z.string().max(30, "Tối đa 30 ký tự").optional().default(""),
  dealDescription: z.string().max(500, "Tối đa 500 ký tự").optional().default(""),
  attendDays: z.array(z.number()).optional().default([]),
});

export const ocCardFormSchema = z.object({
  ownerName: z.string().min(1, "Tên chủ OC không được để trống"),
  images: z.array(
    z.object({
      ocName: z.string().min(1, "Tên OC không được để trống").max(100, "Tối đa 100 ký tự"),
      artistName: z.string().max(100, "Tối đa 100 ký tự").optional().default(""),
      imageUrl: z.string(),
      description: z.string().max(200, "Tối đa 200 ký tự").optional().default(""),
    })
  ).min(1, "Cần ít nhất một OC card"),
  festival: z.array(z.string()).optional().default([]),
  eventTime: z.string().max(200).optional().default(""),
  location: z.string().max(300).optional().default(""),
  appearanceText: z.string().max(300).optional().default(""),
  appearanceImageUrl: z.string().optional().default(""),
  contactMethod: z.string().max(300).optional().default(""),
});

export const festivalFormSchema = z.object({
  name: z.string().min(1, "Tên festival không được để trống"),
  code: z.string().max(20).optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  expiresAt: z.string().optional().default(""),
  isActive: z.boolean().default(true),
  floorMapFile: z.string().optional().default(""),
  boothFile: z.string().optional().default(""),
  stampRallyFile: z.string().optional().default(""),
});