"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { eventFormSchema } from "@/lib/validator"
import * as z from 'zod'
import { eventDefaultValues } from "@/constants"
import MultiSelect from "./MultiSelect"
import { Textarea } from "@/components/ui/textarea"
import { FileUploader } from "./FileUploader"
import { useState, useEffect} from "react"
import Image from "next/image"
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import { Checkbox } from "../ui/checkbox"
import { TagInput } from "./TagInput"
import { useRouter } from "next/navigation"
import { createEvent, updateEvent } from "@/lib/actions/event.actions"
import { IEvent } from "@/lib/database/models/event.model"
import { Plus, Trash2, PlusCircle, XCircle} from "lucide-react"
import { storage } from '@/lib/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import MultipleSelector, { Option } from '@/components/ui/multiple-selector';
// import FestivalSelect from './FestivalSelect';

// festivals now passed from server components to avoid calling server action directly in client

type EventFormProps = {
  userId: string;
  type: "Create" | "Update";
  event?: IEvent;
  eventId?: string;
  festivals?: any[]; // passed from server
}

// Updated type definition for IEvent images
type ImageWithCategories = {
  file: File | null;
  imageUrl: string;
  fandomCategories: { value: string; label: string }[];
  itemTypeCategories: { value: string; label: string }[];
}

type Artist = {
  name: string;
  link: string;
};

const mapCategoriesToOptions = (categories: { _id: string; name: string, type: string }[]) =>
  categories.map(category => ({ value: category._id, label: category.name }));

const mapOptionsToCategories = (options: { value: string; label: string }[]) =>
  options.map(option => option.value);

const EventForm = ({ userId, type, event, eventId, festivals = [] }: EventFormProps) => {
  // State for images with categories
  const [imagesWithCategories, setImagesWithCategories] = useState<ImageWithCategories[]>([]);
  const [festivalIds, setFestivalIds] = useState<string[]>(() => {
    if (event && (event as any).festival) {
      const fest = (event as any).festival;
      return Array.isArray(fest) ? fest.map((f: any) => f._id) : fest?._id ? [fest._id] : [];
    }
    return festivals[0]?._id ? [festivals[0]._id] : [];
  });

  const festivalOptions: Option[] = (festivals || []).map((f: any) => ({ label: f.name, value: f._id }));
  const selectedFestivalOptions: Option[] = festivalOptions.filter(o => festivalIds.includes(o.value));

  const handleFestivalChange = (opts: Option[]) => {
    setFestivalIds(opts.map(o => o.value));
  };

  useEffect(() => {
    if (event && (event as any).festival) {
      const fest = (event as any).festival;
      const ids = Array.isArray(fest) ? fest.map((f: any) => f._id) : fest?._id ? [fest._id] : [];
      setFestivalIds(ids);
    }
  }, [event]);

  useEffect(() => {
    if (festivalIds && festivalIds.length) {
      form.setValue('festival', festivalIds as any, { shouldValidate: true });
    }
  }, [festivalIds]);

  // Initialize state with existing images if updating
  useEffect(() => {
    if (event && type === "Update" && event.images) {
      // Map existing images with their categories
      const initialImages = event.images.map((img: any) => {
        // Get categories from the image
        const categories = img.category || [];

        return {
          file: null,
          imageUrl: img.imageUrl || '',
          fandomCategories: mapCategoriesToOptions(
            categories.filter((cat: any) => cat.type === "fandom")
          ),
          itemTypeCategories: mapCategoriesToOptions(
            categories.filter((cat: any) => cat.type === "itemType")
          )
        };
      });

      // Ensure we have at least one image
      if (initialImages.length === 0) {
        initialImages.push({
          file: null,
          imageUrl: '',
          fandomCategories: [],
          itemTypeCategories: []
        });
      }

      setImagesWithCategories(initialImages);

      // Update the form values to match
      const formImages = initialImages.map(img => ({
        imageUrl: img.imageUrl,
        categoryIds: img.fandomCategories,
        itemTypeIds: img.itemTypeCategories
      }));

      // Set the form values
      form.setValue('images', formImages);
    } else {
      // Initialize with one empty image for new events
      setImagesWithCategories([{
        file: null,
        imageUrl: '',
        fandomCategories: [],
        itemTypeCategories: []
      }]);
    }
  }, [event, type]);

  // Prepare initial values for the form
  const initialValues = event && type === "Update"
    ? {
        ...event,
        startDateTime: new Date(event.startDateTime),
        endDateTime: new Date(event.endDateTime),
        hasPreorder: event.hasPreorder === "Yes" ? "Yes" : event.hasPreorder === "No" ? "No" : undefined,
        festival: festivalIds,
        // Handle conversion for artists array
        artists: Array.isArray(event.artists)
        ? event.artists.map((artist: any) => ({
            name: artist.name || '',
            link: artist.link || ''
          }))
        : event.artists
          ? [{ name: (event as any).artists.name || '', link: (event as any).artists.link || '' }]
          : [{ name: '', link: '' }],
        images: event.images?.map((image: any) => {
          const categories = image.category || [];
          return {
            imageUrl: image.imageUrl || '',
            categoryIds: mapCategoriesToOptions(
              categories.filter((cat: any) => cat.type === "fandom")
            ),
            itemTypeIds: mapCategoriesToOptions(
              categories.filter((cat: any) => cat.type === "itemType")
            ),
          };
        }) || [],
      }
    : {
        ...eventDefaultValues,
        hasPreorder: eventDefaultValues.hasPreorder ?? "No",
        festival: festivalIds,
        artists: [{ name: '', link: '' }],
        images: [{
          imageUrl: '',
          categoryIds: [],
          itemTypeIds: []
        }]
      };

  const router = useRouter();
  // const { startUpload } = useUploadThing('imageUploader')

  // console.log("Event form schema:", eventFormSchema);

  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialValues as z.infer<typeof eventFormSchema>,
    mode: "onSubmit"
  });

  // Update the form when categories change
  useEffect(() => {
    if (imagesWithCategories.length > 0) {
      const formValues = form.getValues();
      const updatedImages = imagesWithCategories.map((img: ImageWithCategories, index: number) => ({
        imageUrl: img.imageUrl,
        categoryIds: img.fandomCategories,
        itemTypeIds: img.itemTypeCategories
      }));
      form.setValue('images', updatedImages);
    }
  }, [imagesWithCategories]);

  const hasInvalidImages = imagesWithCategories.some((img: ImageWithCategories) => {
    if (img.imageUrl.startsWith('blob:')) {
      return !img.file;
    }
    return !img.imageUrl;
  });

  // Handle file selection for a specific image entry
  const handleFileChange = (index: number, file: File | null, imageUrl: string = '') => {
    const newImagesWithCategories = [...imagesWithCategories];
    newImagesWithCategories[index] = {
      ...newImagesWithCategories[index],
      file,
      imageUrl: file ? '' : imageUrl || newImagesWithCategories[index].imageUrl,
    };
    setImagesWithCategories(newImagesWithCategories);
  };

// Handle fandom categories change for a specific image
const handleFandomCategoriesChange = (index: number, categories: { value: string; label: string }[]) => {
  // Update local state
  const newImagesWithCategories = [...imagesWithCategories];
  newImagesWithCategories[index] = {
    ...newImagesWithCategories[index],
    fandomCategories: categories
  };
  setImagesWithCategories(newImagesWithCategories);

  // Update form state
  const formValues = form.getValues();
  const images = [...(formValues.images || [])];

  // Ensure we have enough items in the array
  while (images.length <= index) {
    images.push({ imageUrl: '', categoryIds: [], itemTypeIds: [] });
  }

  // Update the specific image's categoryIds
  images[index] = {
    ...images[index],
    categoryIds: categories
  };

  // Set the updated values
  form.setValue('images', images);
};

// Handle item type categories change for a specific image
const handleItemTypeCategoriesChange = (index: number, categories: { value: string; label: string }[]) => {
  // Update local state
  const newImagesWithCategories = [...imagesWithCategories];
  newImagesWithCategories[index] = {
    ...newImagesWithCategories[index],
    itemTypeCategories: categories
  };
  setImagesWithCategories(newImagesWithCategories);

  // Update form state
  const formValues = form.getValues();
  const images = [...(formValues.images || [])];

  // Ensure we have enough items in the array
  while (images.length <= index) {
    images.push({ imageUrl: '', categoryIds: [], itemTypeIds: [] });
  }

  // Update the specific image's itemTypeIds
  images[index] = {
    ...images[index],
    itemTypeIds: categories
  };

  // Set the updated values
  form.setValue('images', images);
};

  // Add a new image entry
  const addImageEntry = () => {
    setImagesWithCategories([...imagesWithCategories, {
      file: null,
      imageUrl: '',
      fandomCategories: [],
      itemTypeCategories: []
    }]);
  };

  // Remove an image entry
  const removeImageEntry = (index: number) => {
    if (imagesWithCategories.length > 1) {
      const newImagesWithCategories = [...imagesWithCategories];
      newImagesWithCategories.splice(index, 1);
      setImagesWithCategories(newImagesWithCategories);
    }
  };

    // Get the current artists array from form
    const artists = form.watch('artists') || [{ name: '', link: '' }];

    // Add a new artist field
    const addArtist = () => {
      form.setValue('artists', [...artists, { name: '', link: '' }]);
    };

    // Remove an artist field
    const removeArtist = (index: number) => {
      const updatedArtists = [...artists];
      updatedArtists.splice(index, 1);
      form.setValue('artists', updatedArtists);
    };

  async function onSubmit(values: z.infer<typeof eventFormSchema>) {
  try {
      // Upload all images and collect their URLs and categories
    const imagesData = [];

      // Log for debugging
    console.log("Form values before processing:", values);
    console.log("Images with categories state:", imagesWithCategories);

    for (let i = 0; i < imagesWithCategories.length; i++) {
      const imageWithCategories = imagesWithCategories[i];
      let imageUrl = imageWithCategories.imageUrl;

      // Get corresponding form values
      const formImage = values.images[i] || { categoryIds: [], itemTypeIds: [] };

      if (imageWithCategories.file && !imageUrl.includes(process.env.NEXT_PUBLIC_R2_PUBLIC_URL!)) {
        try {
          // 1️⃣ Request a signed URL from your Next.js API
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: imageWithCategories.file.name,
              fileType: imageWithCategories.file.type,
            }),
          });

          if (!res.ok) throw new Error('Failed to get signed URL for R2');

          const { uploadUrl, fileUrl } = await res.json();

          // 2️⃣ Upload file directly to R2
          const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': imageWithCategories.file.type },
            body: imageWithCategories.file,
          });

          if (!uploadRes.ok) throw new Error('Failed to upload file to R2');

          imageUrl = fileUrl; // ✅ final URL served via your Worker + caching
        } catch (error) {
          console.error("Error uploading file to R2:", error);
          continue; // Skip this image if upload fails
        }
      }

      // Skip if no image URL
      if (!imageUrl) continue;

        // Get category IDs from form data OR state if needed
      let fandomCategoryIds: string[] = [];
      let itemTypeCategoryIds: string[] = [];

        // Try to get category data from form values first
        if (formImage.categoryIds && formImage.categoryIds.length > 0) {
          fandomCategoryIds = mapOptionsToCategories(formImage.categoryIds);
        }
        // Fallback to state data
        else if (imageWithCategories.fandomCategories.length > 0) {
          fandomCategoryIds = mapOptionsToCategories(imageWithCategories.fandomCategories);
        }

        // Try to get item type data from form values first
        if (formImage.itemTypeIds && formImage.itemTypeIds.length > 0) {
          itemTypeCategoryIds = mapOptionsToCategories(formImage.itemTypeIds);
        }
        // Fallback to state data
        else if (imageWithCategories.itemTypeCategories.length > 0) {
          itemTypeCategoryIds = mapOptionsToCategories(imageWithCategories.itemTypeCategories);
        }

        // Log for debugging
        console.log(`Image ${i} processed:`, {
          imageUrl,
          fandomCategoryIds,
          itemTypeCategoryIds
        });

        // Format for API - combine all category IDs into a single array
        imagesData.push({
          imageUrl,
          category: [...fandomCategoryIds, ...itemTypeCategoryIds]
        });
      }

      // Log processed data
      console.log("Processed images data for submission:", imagesData);

      // Create a new event object with the structure expected by the API
      const eventData = {
        ...values,
        images: imagesData as any, // Use type assertion to bypass TypeScript check
        hasPreorder: values.hasPreorder || "No",
        festival: festivalIds,
      };

      // Log final data
      console.log("Final event data for submission:", eventData);

      // Update or create event with the processed data
      if (type === "Create") {
        try {
          const newEvent = await createEvent({
            event: eventData,
            userId,
            path: "/profile",
          });

          if (newEvent) {
            form.reset();
            router.push(`/events/${newEvent._id}`);
          }
        } catch (error) {
          console.log("Error creating event:", error);
        }
      } else if (type === 'Update') {
        if (!eventId) {
          return router.back();
        }

        try {
          const updatedEvent = await updateEvent({
            userId,
            event: {
              ...eventData,
              _id: eventId
            },
            path: `/events/${eventId}`
          });

          if (updatedEvent) {
            form.reset();
            router.push(`/events/${updatedEvent?._id}`);
          }
        } catch (error) {
          console.error("Error updating event:", error);
        }
      }
    } catch (error) {
      console.error("Error in submit handler:", error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
        console.log("Form submit event triggered");
        form.handleSubmit((data: z.infer<typeof eventFormSchema>) => {
          console.log("Form passed validation", data);
          onSubmit(data);
        })(e);
      }}
  className="flex flex-col gap-5">
        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input placeholder="Vị trí gian - tên gian (ví dụ: Q22 - Gà Rán)" {...field} className="input-field" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl className="h-72">
                  <Textarea placeholder="Mô tả/giới thiệu về gian hàng" {...field} className="textarea rounded-2xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col gap-5">
                {artists.map((artist, index) => (
                  <div key={index} className="flex flex-col gap-3 p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Artist {index + 1}</h4>
                      {index > 0 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeArtist(index)}
                        >
                          <XCircle className="h-5 w-5 text-red-500" />
                        </Button>
                      )}
                    </div>
                    
                    <FormField
                      control={form.control}
                      name={`artists.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormControl>
                            <div className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
                              <Input placeholder="Tên artist" {...field} className="input-field" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`artists.${index}.link`}
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormControl>
                            <div className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
                              <Input placeholder="Link tới trang cá nhân/blog của artist" {...field} value={field.value || ""} className="input-field" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2 w-full"
                  onClick={addArtist}
                >
                  <PlusCircle className="h-4 w-4" />
                  Thêm artist
                </Button>
              </div>
        {/* Multiple Images Section */}
        <div className="border rounded-lg p-4 mt-4">
          <h3 className="text-lg font-medium mb-4">Ảnh sample</h3>

          {imagesWithCategories.map((imageWithCat: ImageWithCategories, index: number) => (
            <div key={index} className="mb-8 p-4 border rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Ảnh {index + 1}</h4>
                {imagesWithCategories.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImageEntry(index)}
                    className="flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Xóa
                  </Button>
                )}
              </div>

              {/* Image Upload */}
              <div className="mb-4">
                <div className="w-full h-72">
                <FileUploader
                  onFieldChange={(url) => handleFileChange(index, null, url)}
                  imageUrl={imageWithCat.imageUrl}
                  setFiles={(files) => {
                    if (files && files.length > 0) {
                      handleFileChange(index, files[0]);
                    }
                  }}
                />
                </div>
              </div>

              {/* Categories for this image */}
              <div className="flex flex-col gap-4">
                <div className="w-full">
                  <FormLabel>Các fandom xuất hiện trong ảnh sample</FormLabel>
                  <MultiSelect
                    onChange={(value) => handleFandomCategoriesChange(index, value)}
                    value={imageWithCat.fandomCategories}
                    promptText="Chọn fandom cho ảnh này"
                    categoryType="fandom"
                  />
                </div>
                <div className="w-full">
                  <FormLabel>Các loại mặt hàng xuất hiện trong ảnh sample</FormLabel>
                  <MultiSelect
                    onChange={(value) => handleItemTypeCategoriesChange(index, value)}
                    value={imageWithCat.itemTypeCategories}
                    promptText="Chọn loại mặt hàng cho ảnh này"
                    categoryType="itemType"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center"
            onClick={addImageEntry}
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm ảnh
          </Button>
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="extraTag"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <div className="flex items-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
                    <TagInput
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Thêm tag khác (không thuộc fandom hay mặt hàng, ví dụ: couple, nhân vật... - phân cách bằng dấu phẩy hoặc Enter)"
                      className="flex-1 bg-transparent p-0 border-0 outline-none"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="hasPreorder"
            render={({ field }) => (
              <FormItem className="w-full">
                <h3 className="text-lg font-medium mb-4">Gian hàng của bạn có mở preorder không?</h3>
                <FormControl>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="Yes"
                        checked={field.value === "Yes"}
                        onChange={() => field.onChange("Yes")}
                        className="peer hidden"
                      />
                      <div className={`cursor-pointer border px-4 py-2 rounded-md ${field.value === "Yes" ? "bg-primary-500 text-white" : "bg-gray-200"}`}>
                        Có
                      </div>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="No"
                        checked={field.value === "No"}
                        onChange={() => field.onChange("No")}
                        className="peer hidden"
                      />
                      <div className={`cursor-pointer border px-4 py-2 rounded-md ${field.value === "No" ? "bg-primary-500 text-white" : "bg-gray-200"}`}>
                        Không
                      </div>
                    </label>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
              control={form.control}
              name="startDateTime"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <div className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
                      <Image
                        src="/assets/icons/calendar.svg"
                        alt="calendar"
                        width={24}
                        height={24}
                        className="filter-grey"
                      />
                      <p className="ml-3 whitespace-nowrap text-grey-600">Ngày mở đơn:</p>
                      <DatePicker
                        selected={field.value}
                        onChange={(date: Date | null) => field.onChange(date)}
                        showTimeSelect
                        timeInputLabel="Time:"
                        dateFormat="dd/MM/yyyy h:mm aa"
                        wrapperClassName="datePicker"
                      />
                    </div>

                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          <FormField
              control={form.control}
              name="endDateTime"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <div className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
                      <Image
                        src="/assets/icons/calendar.svg"
                        alt="calendar"
                        width={24}
                        height={24}
                        className="filter-grey"
                      />
                      <p className="ml-3 whitespace-nowrap text-grey-600">Ngày đóng đơn:</p>
                      <DatePicker
                        selected={field.value}
                        onChange={(date: Date | null) => field.onChange(date)}
                        showTimeSelect
                        timeInputLabel="Time:"
                        dateFormat="dd/MM/yyyy h:mm aa"
                        wrapperClassName="datePicker"
                      />
                    </div>

                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <div className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
                      <Input placeholder="Link preorder" {...field} value={field.value || ""} className="input-field" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        {hasInvalidImages && (
          <p className="text-red-500 text-sm mb-2">
            Vui lòng chờ ảnh được upload thành công trước khi đăng hoặc thử đăng lại ảnh.
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={form.formState.isSubmitting || hasInvalidImages}
          className="button col-span-2 w-full"
        >
          {form.formState.isSubmitting
            ? "Đang đăng..."
            : type === "Create"
            ? "Đăng sample"
            : type === "Update"
            ? "Cập nhật sample"
            : `${type} Sample`}
        </Button>
      </form>
    </Form>
  )
}

export default EventForm
