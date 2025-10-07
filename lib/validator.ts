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
});
