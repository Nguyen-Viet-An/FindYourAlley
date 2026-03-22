"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { festivalFormSchema } from "@/lib/validator"
import * as z from 'zod'
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { createFestival, updateFestival } from "@/lib/actions/festival.actions"

type FestivalFormProps = {
  type: "Create" | "Update"
  festival?: any
}

const FestivalForm = ({ type, festival }: FestivalFormProps) => {
  const router = useRouter()

  const initialValues = type === "Update" && festival
    ? {
        name: festival.name || "",
        code: festival.code || "",
        startDate: festival.startDate ? new Date(festival.startDate).toISOString().split('T')[0] : "",
        endDate: festival.endDate ? new Date(festival.endDate).toISOString().split('T')[0] : "",
        expiresAt: festival.expiresAt ? new Date(festival.expiresAt).toISOString().split('T')[0] : "",
        isActive: festival.isActive ?? true,
        floorMapFile: festival.floorMapFile || "",
        boothFile: festival.boothFile || "",
        stampRallyFile: festival.stampRallyFile || "",
      }
    : {
        name: "",
        code: "",
        startDate: "",
        endDate: "",
        expiresAt: "",
        isActive: true,
        floorMapFile: "",
        boothFile: "",
        stampRallyFile: "",
      }

  const form = useForm<z.infer<typeof festivalFormSchema>>({
    resolver: zodResolver(festivalFormSchema),
    defaultValues: initialValues,
  })

  async function onSubmit(values: z.infer<typeof festivalFormSchema>) {
    if (type === "Create") {
      const res = await createFestival(values)
      if (res) router.push("/festivals")
    }

    if (type === "Update" && festival?._id) {
      const res = await updateFestival({ ...values, _id: festival._id })
      if (res) router.push("/festivals")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên festival *</FormLabel>
                <FormControl>
                  <Input placeholder="VD: Color Fiesta 15" {...field} className="input-field" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mã ngắn</FormLabel>
                <FormControl>
                  <Input placeholder="VD: COFI15" {...field} className="input-field" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày bắt đầu</FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="input-field" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày kết thúc</FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="input-field" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiresAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ẩn khỏi bộ lọc sau</FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="input-field" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-5 p-4 rounded-lg border bg-grey-50 dark:bg-muted">
          <h3 className="font-semibold">📁 Tệp dữ liệu sơ đồ</h3>
          <p className="text-sm text-muted-foreground">
            Đặt tệp vào thư mục gốc dự án rồi nhập tên tệp ở đây.
          </p>

          <FormField
            control={form.control}
            name="floorMapFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>File sơ đồ (.drawio.xml)</FormLabel>
                <FormControl>
                  <Input placeholder="VD: MyEvent floor map.drawio.xml" {...field} className="input-field" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="boothFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>File tên gian (.json)</FormLabel>
                <FormControl>
                  <Input placeholder="VD: mybooth.json" {...field} className="input-field" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stampRallyFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>File stamp rally (.json)</FormLabel>
                <FormControl>
                  <Input placeholder="VD: mystamprally.json" {...field} className="input-field" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="!mt-0">Đang hoạt động</FormLabel>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          disabled={form.formState.isSubmitting}
          className="button col-span-2 w-full"
        >
          {form.formState.isSubmitting ? "Đang lưu..." : type === "Create" ? "Tạo Festival" : "Cập nhật Festival"}
        </Button>
      </form>
    </Form>
  )
}

export default FestivalForm
