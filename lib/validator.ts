import * as z from "zod"


const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
  disable: z.boolean().optional(),
});

export const eventFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(3, 'Description must be at least 3 characters').max(400, 'Description must be less than 400 characters'),
  location: z.string().min(3, 'Location must be at least 3 characters').max(400, 'Location must be less than 400 characters'),
  imageUrl: z.string(),
  startDateTime: z.date(),
  endDateTime: z.date(),
  categoryIds:z.array(optionSchema).min(1),
  itemTypeIds:z.array(optionSchema).min(1),
  hasPreorder: z.enum(["Yes", "No"]),
  price: z.string(),
  isFree: z.boolean(),
  url: z.string().url()
})