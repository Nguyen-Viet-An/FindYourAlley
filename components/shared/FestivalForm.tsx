"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { festivalFormSchema } from "@/lib/validator"
import * as z from 'zod'
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { createFestival, updateFestival } from "@/lib/actions/festival.actions"
import { useRef, useState } from "react"

type FestivalFormProps = {
  type: "Create" | "Update"
  festival?: any
}

const FestivalForm = ({ type, festival }: FestivalFormProps) => {
  const router = useRouter()
  const t = useTranslations('festivalForm');
  const tc = useTranslations('common');

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

  const [uploading, setUploading] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetField = useRef<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const fieldName = uploadTargetField.current as keyof z.infer<typeof festivalFormSchema> | null
    if (!file || !fieldName) return

    setUploading(fieldName)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload-festival-file', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok && data.filePath) {
        form.setValue(fieldName, data.filePath)
      } else {
        alert(data.error || 'Upload failed')
      }
    } catch {
      alert('Upload failed')
    } finally {
      setUploading(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const triggerUpload = (fieldName: string, accept: string) => {
    uploadTargetField.current = fieldName
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept
      fileInputRef.current.click()
    }
  }

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
                <FormLabel>{t('name')}</FormLabel>
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
                <FormLabel>{t('shortCode')}</FormLabel>
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
                <FormLabel>{t('startDate')}</FormLabel>
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
                <FormLabel>{t('endDate')}</FormLabel>
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
                <FormLabel>{t('hideAfter')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="input-field" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-5 p-4 rounded-lg border bg-grey-50 dark:bg-muted">
          <h3 className="font-semibold">{t('mapData')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('mapDataHint')}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
          />

          <FormField
            control={form.control}
            name="floorMapFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('mapFile')}</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="VD: data/floormap.xml" {...field} className="input-field flex-1" />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading === 'floorMapFile'}
                    onClick={() => triggerUpload('floorMapFile', '.xml')}
                  >
                    {uploading === 'floorMapFile' ? '...' : '📤'}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="boothFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('boothFile')}</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="VD: data/booth-cofi16.json" {...field} className="input-field flex-1" />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading === 'boothFile'}
                    onClick={() => triggerUpload('boothFile', '.json')}
                  >
                    {uploading === 'boothFile' ? '...' : '📤'}
                  </Button>
                </div>
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
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="VD: data/stamprally.json" {...field} className="input-field flex-1" />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading === 'stampRallyFile'}
                    onClick={() => triggerUpload('stampRallyFile', '.json')}
                  >
                    {uploading === 'stampRallyFile' ? '...' : '📤'}
                  </Button>
                </div>
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
              <FormLabel className="!mt-0">{t('active')}</FormLabel>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          disabled={form.formState.isSubmitting}
          className="button col-span-2 w-full"
        >
          {form.formState.isSubmitting ? tc('saving') : type === "Create" ? t('create') : t('updateFestival')}
        </Button>
      </form>
    </Form>
  )
}

export default FestivalForm