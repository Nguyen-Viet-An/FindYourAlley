import * as z from "zod"


const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
  disable: z.boolean().optional(),
});

export const eventFormSchema = z.object({
  title: z.string().min(3, 'Tiêu đề cần dài hơn 3 từ'),
  description: z.string().min(3, 'Mô tả cần dài hơn 3 từ'),
  artistLink: z.string().optional(),
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
  extraTag: z.string().optional(),
  // isFree: z.boolean(),
  url: z.string().optional()
});