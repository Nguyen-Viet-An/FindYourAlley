"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ocCardFormSchema } from "@/lib/validator";
import * as z from "zod";
import { ocCardDefaultValues } from "@/constants";
import { FileUploader } from "./FileUploader";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createOcCard, updateOcCard } from "@/lib/actions/ocCard.actions";
import { Plus, Trash2 } from "lucide-react";
import FestivalMultiSelect from "./FestivalMultiSelect";
import type { Option } from "@/components/ui/multiple-selector";

type OcCardFormProps = {
  userId: string;
  type: "Create" | "Update";
  card?: any;
  cardId?: string;
  festivals?: { _id: string; name: string; code?: string }[];
};

type CardImage = {
  file: File | null;
  ocName: string;
  artistName: string;
  imageUrl: string;
  description: string;
};

export default function OcCardForm({ userId, type, card, cardId, festivals = [] }: OcCardFormProps) {
  const [images, setImages] = useState<CardImage[]>([
    { file: null, ocName: "", artistName: "", imageUrl: "", description: "" },
  ]);
  const [appearanceFile, setAppearanceFile] = useState<File | null>(null);
  const [appearancePreview, setAppearancePreview] = useState(
    card?.appearance?.imageUrl || ""
  );
  const [selectedFestivalOptions, setSelectedFestivalOptions] = useState<Option[]>(
    card?.festival?.map((f: any) => ({
      label: f.code ? `${f.name} (${f.code})` : f.name,
      value: f._id,
    })) || []
  );
  const router = useRouter();

  const initialValues =
    card && type === "Update"
      ? {
          ownerName: card.ownerName || "",
          images:
            card.images?.map((img: any) => ({
              ocName: img.ocName || "",
              artistName: img.artistName || "",
              imageUrl: img.imageUrl || "",
              description: img.description || "",
            })) || [{ ocName: "", artistName: "", imageUrl: "", description: "" }],
          festival: card.festival?.map((f: any) => f._id) || [],
          eventTime: card.eventTime || "",
          location: card.location || "",
          appearanceText: card.appearance?.text || "",
          appearanceImageUrl: card.appearance?.imageUrl || "",
          contactMethod: card.contactMethod || "",
        }
      : ocCardDefaultValues;

  useEffect(() => {
    if (card && type === "Update" && card.images) {
      setImages(
        card.images.map((img: any) => ({
          file: null,
          ocName: img.ocName || "",
          artistName: img.artistName || "",
          imageUrl: img.imageUrl || "",
          description: img.description || "",
        }))
      );
    }
  }, [card, type]);

  const form = useForm<z.infer<typeof ocCardFormSchema>>({
    resolver: zodResolver(ocCardFormSchema),
    defaultValues: initialValues,
    mode: "onSubmit",
  });

  // Sync local images state into form so Zod validation passes
  useEffect(() => {
    form.setValue("images", images.map(img => ({
      ocName: img.ocName,
      artistName: img.artistName,
      imageUrl: img.imageUrl || "placeholder",
      description: img.description,
    })));
  }, [images, form]);

  const addImage = () => {
    setImages((prev) => [...prev, { file: null, ocName: "", artistName: "", imageUrl: "", description: "" }]);
  };

  const removeImage = (index: number) => {
    if (images.length > 1) {
      setImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleFileChange = (index: number, file: File | null, url?: string) => {
    setImages((prev) => {
      const next = [...prev];
      if (url) {
        // FileUploader finished uploading — store the final URL, clear the file
        next[index] = { ...next[index], file: null, imageUrl: url };
      } else {
        // FileUploader picked a file — store it for preview, URL will come later
        next[index] = { ...next[index], file, imageUrl: "" };
      }
      return next;
    });
  };

  const handleDescriptionChange = (index: number, desc: string) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], description: desc };
      return next;
    });
  };

  const handleOcNameChange = (index: number, name: string) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ocName: name };
      return next;
    });
  };

  const handleArtistNameChange = (index: number, name: string) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], artistName: name };
      return next;
    });
  };

  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload file");
    const { fileUrl } = await res.json();
    return fileUrl;
  }

  const hasUploading = images.some((img) => img.imageUrl?.startsWith("blob:"))
    || appearancePreview?.startsWith("blob:");

  async function onSubmit(values: z.infer<typeof ocCardFormSchema>) {
    // Block submission if any image is still uploading (blob: preview URL)
    if (hasUploading) {
      alert("Ảnh đang được tải lên, vui lòng chờ giây lát rồi thử lại.");
      return;
    }

    try {
      // Upload images
      const uploadedImages = [];
      for (const img of images) {
        let url = img.imageUrl;
        if (img.file) {
          url = await uploadFile(img.file);
        }
        if (!url || !img.ocName) continue;
        uploadedImages.push({ ocName: img.ocName, artistName: img.artistName || undefined, imageUrl: url, description: img.description });
      }

      // Upload appearance image if needed
      let appearanceImgUrl = values.appearanceImageUrl || "";
      if (appearanceFile) {
        appearanceImgUrl = await uploadFile(appearanceFile);
      }

      const cardData = {
        ownerName: values.ownerName,
        images: uploadedImages,
        festival: values.festival?.length ? values.festival : undefined,
        eventTime: values.eventTime || undefined,
        location: values.location || undefined,
        appearance:
          values.appearanceText || appearanceImgUrl
            ? { text: values.appearanceText || undefined, imageUrl: appearanceImgUrl || undefined }
            : undefined,
        contactMethod: values.contactMethod || undefined,
      };

      if (type === "Create") {
        const newCard = await createOcCard({ userId, card: cardData });
        if (newCard) {
          form.reset();
          router.push("/oc-cards");
        }
      } else if (type === "Update" && cardId) {
        const updated = await updateOcCard({ userId, cardId, card: cardData });
        if (updated) {
          router.push("/oc-cards");
        }
      }
    } catch (error) {
      console.error("Error submitting OC card:", error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* Images - each card is an OC */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">OC Cards *</h3>
          {images.map((img, index) => (
            <div key={index} className="mb-6 p-4 border rounded-md">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">Card {index + 1}</h4>
                {images.length > 1 && (
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeImage(index)}>
                    <Trash2 className="w-4 h-4 mr-1" /> Xóa
                  </Button>
                )}
              </div>
              <div className="mb-3">
                <label className="text-sm font-medium">Tên OC *</label>
                <Input
                  placeholder="Tên OC"
                  value={img.ocName}
                  onChange={(e) => handleOcNameChange(index, e.target.value)}
                  maxLength={100}
                  className="input-field mt-1"
                />
              </div>
              <div className="mb-3">
                <label className="text-sm font-medium">Artist vẽ card</label>
                <Input
                  placeholder="Tên artist (nếu có)"
                  value={img.artistName}
                  onChange={(e) => handleArtistNameChange(index, e.target.value)}
                  maxLength={100}
                  className="input-field mt-1"
                />
              </div>
              <div className="w-full h-48 mb-3">
                <FileUploader
                  onFieldChange={(url) => handleFileChange(index, null, url)}
                  imageUrl={img.imageUrl}
                  setFiles={(files) => {
                    if (files?.[0]) handleFileChange(index, files[0]);
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground -mt-2 mb-2">Ảnh nên ≤ 3MB để đảm bảo tải lên thành công</p>
              <div className="relative">
                <Input
                  placeholder="Mô tả ngắn (không bắt buộc)"
                  value={img.description}
                  onChange={(e) => handleDescriptionChange(index, e.target.value)}
                  maxLength={200}
                  className="input-field"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {img.description.length}/200
                </span>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-full" onClick={addImage}>
            <Plus className="w-4 h-4 mr-2" /> Thêm OC card
          </Button>
        </div>

        {/* Festival */}
        <div>
          <FormLabel>Festival *</FormLabel>
          <FestivalMultiSelect
            value={selectedFestivalOptions}
            onChange={(opts: Option[]) => {
              setSelectedFestivalOptions(opts);
              form.setValue("festival", opts.map(o => o.value));
              form.clearErrors("festival");
            }}
            festivals={festivals}
            promptText="Festival sẽ đổi card"
          />
          {form.formState.errors.festival && (
            <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.festival.message}</p>
          )}
        </div>

        {/* Owner Info Section */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Thông tin chủ card</h3>
          <FormField
            control={form.control}
            name="ownerName"
            render={({ field }) => (
              <FormItem className="mb-3">
                <FormLabel>Tên chủ OC *</FormLabel>
                <FormControl>
                  <Input placeholder="Tên của bạn / nickname" {...field} className="input-field" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactMethod"
            render={({ field }) => (
              <FormItem className="mb-3">
                <FormLabel>Phương thức liên lạc</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Link FB, SĐT, Zalo, Discord..."
                    {...field}
                    value={field.value || ""}
                    className="input-field"
                    maxLength={300}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Time & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="eventTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thời gian</FormLabel>
                <FormControl>
                  <Input
                    placeholder="VD: 3-5pm 11/3, Chiều CN, Cả ngày"
                    {...field}
                    value={field.value || ""}
                    className="input-field"
                    maxLength={200}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Địa điểm</FormLabel>
                <FormControl>
                  <Input
                    placeholder="VD: Sảnh A, gian Q22"
                    {...field}
                    value={field.value || ""}
                    className="input-field"
                    maxLength={300}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Appearance */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">Đặc điểm nhận diện</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Giúp người khác nhận ra bạn để đổi card.
          </p>
          <FormField
            control={form.control}
            name="appearanceText"
            render={({ field }) => (
              <FormItem className="mb-3">
                <FormLabel>Mô tả</FormLabel>
                <FormControl>
                  <Input
                    placeholder="VD: Mặc áo đen, đội mũ Pikachu"
                    {...field}
                    value={field.value || ""}
                    className="input-field"
                    maxLength={300}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div>
            <FormLabel>Ảnh/Minh họa (không bắt buộc)</FormLabel>
            <div className="w-full h-48 mt-1">
              <FileUploader
                onFieldChange={(url) => {
                  setAppearancePreview(url);
                  form.setValue("appearanceImageUrl", url);
                  // Clear backup file once real R2 URL arrives
                  if (url && !url.startsWith("blob:")) setAppearanceFile(null);
                }}
                imageUrl={appearancePreview}
                setFiles={(files) => {
                  if (files?.[0]) setAppearanceFile(files[0]);
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ảnh nên ≤ 3MB để đảm bảo tải lên thành công</p>
          </div>
        </div>

        <div className="pt-2">
          {hasUploading && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-2">Ảnh đang được tải lên, vui lòng chờ...</p>
          )}
          <Button
            type="submit"
            size="lg"
            disabled={form.formState.isSubmitting || hasUploading}
            className="button col-span-2 w-full"
          >
          {form.formState.isSubmitting
            ? "Đang đăng..."
            : type === "Create"
            ? "Đăng OC card"
            : "Cập nhật OC card"}
        </Button>
        </div>
      </form>
    </Form>
  );
}