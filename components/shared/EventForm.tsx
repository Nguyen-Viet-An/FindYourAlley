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
import { useTranslations } from 'next-intl'
import Image from "next/image"
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import { Checkbox } from "../ui/checkbox"
import { Switch } from "../ui/switch"
import { TagInput } from "./TagInput"
import { useRouter } from "next/navigation"
import { createEvent, updateEvent } from "@/lib/actions/event.actions"
import { IEvent } from "@/lib/database/models/event.model"
import { Plus, Trash2, PlusCircle, XCircle, Star, Tag, CalendarDays} from "lucide-react"
import { storage } from '@/lib/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import MultipleSelector, { Option } from '@/components/ui/multiple-selector';
import FestivalMultiSelect from './FestivalMultiSelect';

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
  const t = useTranslations('eventForm');
  const tc = useTranslations('common');
  // State for images with categories
  const [imagesWithCategories, setImagesWithCategories] = useState<ImageWithCategories[]>([]);
  const [featuredFile, setFeaturedFile] = useState<File | null>(null);
  const [featuredPreview, setFeaturedPreview] = useState<string>(
    (event as any)?.featuredProduct?.imageUrl || ''
  );
  const [festivalIds, setFestivalIds] = useState<string[]>(() => {
    if (event && (event as any).festival) {
      const fest = (event as any).festival;
      return Array.isArray(fest) ? fest.map((f: any) => f._id) : fest?._id ? [fest._id] : [];
    }
    return festivals[0]?._id ? [festivals[0]._id] : [];
  });

  const festivalOptions: Option[] = (festivals || []).map((f: any) => ({ label: f.name, value: f._id }));
  const selectedFestivalOptions: Option[] = festivalOptions.filter(o => festivalIds.includes(o.value));

  // Compute multi-day festival info for the "attend which day" picker
  const selectedFestivalObjs = (festivals || []).filter((f: any) => festivalIds.includes(f._id));
  const multiDayFestival = selectedFestivalObjs.find((f: any) => {
    if (!f.startDate || !f.endDate) return false;
    const s = new Date(f.startDate); s.setHours(0,0,0,0);
    const e = new Date(f.endDate); e.setHours(0,0,0,0);
    return e.getTime() > s.getTime();
  }) as any;

  const festivalDays: { dayNum: number; date: Date; label: string }[] = [];
  if (multiDayFestival) {
    const s = new Date(multiDayFestival.startDate); s.setHours(0,0,0,0);
    const e = new Date(multiDayFestival.endDate); e.setHours(0,0,0,0);
    const totalDays = Math.round((e.getTime() - s.getTime()) / (1000*60*60*24)) + 1;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(s); d.setDate(d.getDate() + i);
      festivalDays.push({ dayNum: i + 1, date: d, label: tc('dayLabel', { day: i + 1, date: `${d.getDate()}/${d.getMonth() + 1}` }) });
    }
  }

  // Track which festival days are selected (for multi-day attendance)
  const [selectedDays, setSelectedDays] = useState<number[]>(() => {
    if (!multiDayFestival || festivalDays.length === 0) return [];
    // Read from attendDays if available (persisted field)
    if (event && (event as any).attendDays && (event as any).attendDays.length > 0) {
      return [...(event as any).attendDays].sort();
    }
    // Default: all days selected
    return festivalDays.map(fd => fd.dayNum);
  });

  const toggleDay = (dayNum: number) => {
    setSelectedDays(prev => {
      const next = prev.includes(dayNum) ? prev.filter(d => d !== dayNum) : [...prev, dayNum].sort();
      // Store selected days in the form (no longer overwrite preorder dates)
      form.setValue('attendDays', next);
      return next;
    });
  };

  // Sync attendDays with initially selected festival days (for new events)
  useEffect(() => {
    if (type === "Create" && selectedDays.length > 0 && festivalDays.length > 0) {
      form.setValue('attendDays', selectedDays);
    }
  }, [festivalDays.length]); // only on initial mount when festivalDays are computed

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
    if (festivalIds.length === 0) {
      // Fallback default to "Color Fiesta 15" or empty array
      const defaultFestival = festivals.find(f => f.name === "Color Fiesta 15");
      if (defaultFestival) {
        setFestivalIds([defaultFestival._id]);
        form.setValue("festival", [defaultFestival._id]);
      } else {
        form.setValue("festival", []); // still safe
      }
    }
  }, [festivals]);

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
        hasPostEventPreorder: (event as any).hasPostEventPreorder || false,
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
        featuredProductImageUrl: (event as any).featuredProduct?.imageUrl || '',
        featuredProductDescription: (event as any).featuredProduct?.description || '',
        dealBadge: (event as any).dealBadge || '',
        dealDescription: (event as any).dealDescription || '',
        attendDays: (event as any).attendDays || [],
        boothNumbers: (event as any).boothNumbers?.map((bn: any) => ({
          festival: bn.festival?._id || bn.festival || '',
          boothNumber: bn.boothNumber || '',
        })) || [],
      }
    : {
        ...eventDefaultValues,
        hasPreorder: eventDefaultValues.hasPreorder ?? "No",
        festival: festivalIds,
        attendDays: [] as number[],
        boothNumbers: [] as { festival: string; boothNumber: string }[],
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
    setImagesWithCategories(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        file,
        imageUrl: file ? '' : imageUrl || next[index].imageUrl,
      };
      return next;
    });
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

      // Upload featured product image if needed
      let featuredImgUrl = values.featuredProductImageUrl || '';
      if (featuredFile) {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: featuredFile.name, fileType: featuredFile.type }),
          });
          if (res.ok) {
            const { uploadUrl, fileUrl } = await res.json();
            const uploadRes = await fetch(uploadUrl, {
              method: 'PUT',
              headers: { 'Content-Type': featuredFile.type },
              body: featuredFile,
            });
            if (uploadRes.ok) featuredImgUrl = fileUrl;
          }
        } catch (err) { console.error('Featured image upload error:', err); }
      }

      // Create a new event object with the structure expected by the API
      const eventData = {
        ...values,
        images: imagesData as any, // Use type assertion to bypass TypeScript check
        hasPreorder: values.hasPreorder || "No",
        festival: festivalIds,
        attendDays: values.attendDays || [],
        boothNumbers: (values.boothNumbers || []).filter(bn => bn.boothNumber.trim()),
        featuredProduct: featuredImgUrl && values.featuredProductDescription
          ? { imageUrl: featuredImgUrl, description: values.featuredProductDescription }
          : undefined,
        dealBadge: values.dealBadge || undefined,
        dealDescription: values.dealDescription || undefined,
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
                  <Input placeholder={t('boothName')} {...field} className="input-field" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <div className="w-full">
            <FormLabel>Festival *</FormLabel>
            <FestivalMultiSelect
              value={selectedFestivalOptions}
              onChange={(opts: Option[]) => {
                handleFestivalChange(opts);
                form.setValue("festival", opts.map(o => o.value));
                form.clearErrors("festival");
              }}
              festivals={festivals}
              promptText={t('festivalLabel')}
            />
            {form.formState.errors.festival && (
              <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.festival.message}</p>
            )}
          </div>
        </div>

        {/* Multi-day festival attendance picker */}
        {festivalDays.length > 1 && (
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-500" />
              {t('dayQuestion')} <span className="text-xs text-muted-foreground font-normal">({multiDayFestival.code || multiDayFestival.name})</span>
            </h3>
            <div className="flex gap-2 flex-wrap">
              {festivalDays.map(fd => (
                <button
                  key={fd.dayNum}
                  type="button"
                  onClick={() => toggleDay(fd.dayNum)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedDays.includes(fd.dayNum)
                      ? 'bg-blue-500 text-white'
                      : 'bg-grey-50 dark:bg-muted text-grey-500 dark:text-muted-foreground hover:bg-grey-100 dark:hover:bg-muted/80'
                  }`}
                >
                  {fd.label}
                </button>
              ))}
            </div>
            {selectedDays.length === 0 && (
              <p className="text-xs text-red-500 mt-2">{t('dayRequired')}</p>
            )}
          </div>
        )}

        {/* Booth number per festival */}
        {festivalIds.length > 0 && (
          <div className="flex flex-col gap-3">
            <FormLabel>{t('boothNumber')}</FormLabel>
            {festivalIds.map((fid) => {
              const fest = festivals.find((f: any) => f._id === fid);
              const label = fest ? (fest.code || fest.name) : fid;
              const boothNumbers = form.watch('boothNumbers') || [];
              const idx = boothNumbers.findIndex((bn: any) => bn.festival === fid);
              const currentValue = idx >= 0 ? boothNumbers[idx].boothNumber : '';
              return (
                <div key={fid} className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 dark:bg-muted px-4 py-2">
                  <span className="text-sm text-grey-600 dark:text-muted-foreground whitespace-nowrap mr-3 font-medium">{label}:</span>
                  <Input
                    placeholder={t('boothNumberHint')}
                    value={currentValue}
                    onChange={(e) => {
                      const updated = [...(form.getValues('boothNumbers') || [])];
                      const i = updated.findIndex((bn) => bn.festival === fid);
                      if (i >= 0) {
                        updated[i] = { ...updated[i], boothNumber: e.target.value };
                      } else {
                        updated.push({ festival: fid, boothNumber: e.target.value });
                      }
                      form.setValue('boothNumbers', updated);
                    }}
                    className="input-field"
                    maxLength={50}
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl className="h-72">
                  <Textarea placeholder={t('description')} {...field} className="textarea rounded-2xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col gap-5">
                {artists.map((artist, index) => (
                  <div key={index} className="flex flex-col gap-3 p-4 border border-gray-200 dark:border-border rounded-lg">
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
                            <div className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 dark:bg-muted px-4 py-2">
                              <Input placeholder={t('artistName')} {...field} className="input-field" />
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
                            <div className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 dark:bg-muted px-4 py-2">
                              <Input placeholder={t('artistLink')} {...field} value={field.value || ""} className="input-field" />
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
                  {tc('addArtist')}
                </Button>
              </div>
        {/* Multiple Images Section */}
        <div className="border rounded-lg p-4 mt-4">
          <h3 className="text-lg font-medium mb-4">{t('sampleImages')}</h3>

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
                    <Trash2 className="w-4 h-4 mr-1" /> {tc('delete')}
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
                <p className="text-xs text-muted-foreground mt-1">{t('imageSizeHint')}</p>
              </div>

              {/* Categories for this image */}
              <div className="flex flex-col gap-4">
                <div className="w-full">
                  <FormLabel>{t('fandomLabel')}</FormLabel>
                  <MultiSelect
                    onChange={(value) => handleFandomCategoriesChange(index, value)}
                    value={imageWithCat.fandomCategories}
                    promptText={t('fandomHint')}
                    categoryType="fandom"
                  />
                </div>
                <div className="w-full">
                  <FormLabel>{t('itemTypeLabel')}</FormLabel>
                  <MultiSelect
                    onChange={(value) => handleItemTypeCategoriesChange(index, value)}
                    value={imageWithCat.itemTypeCategories}
                    promptText={t('itemTypeHint')}
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
            <Plus className="w-4 h-4 mr-2" /> {tc('addImage')}
          </Button>
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="extraTag"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <div className="flex items-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 dark:bg-muted px-4 py-2">
                    <TagInput
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder={t('extraTags')}
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
                <FormLabel>{t('preorderQuestion')}</FormLabel>
                <FormControl>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="Yes"
                        checked={field.value === "Yes"}
                        onChange={() => field.onChange("Yes")}
                        className="peer hidden"
                      />
                      <div className={`cursor-pointer border px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${field.value === "Yes" ? "bg-primary-500 text-white" : "bg-grey-50 dark:bg-muted text-grey-500 dark:text-muted-foreground hover:bg-grey-100 dark:hover:bg-muted/80"}`}>
                        {tc('yes')}
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
                      <div className={`cursor-pointer border px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${field.value === "No" ? "bg-primary-500 text-white" : "bg-grey-50 dark:bg-muted text-grey-500 dark:text-muted-foreground hover:bg-grey-100 dark:hover:bg-muted/80"}`}>
                        {tc('no')}
                      </div>
                    </label>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Post-festival preorder toggle - only show when preorder is Yes */}
        {form.watch("hasPreorder") === "Yes" && (
        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="hasPostEventPreorder"
            render={({ field }) => (
              <FormItem className="w-full">
                <div className="flex items-center gap-3">
                  <FormControl>
                    <Switch
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-base font-medium cursor-pointer" onClick={() => field.onChange(!field.value)}>
                    {t('postEventPreorderToggle')}
                  </FormLabel>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t('postEventPreorderNote')}</p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        )}

        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
              control={form.control}
              name="startDateTime"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <div className="flex-center h-[40px] w-full overflow-hidden rounded-full bg-grey-50 dark:bg-muted px-3 py-1 text-sm">
                      <Image
                        src="/assets/icons/calendar.svg"
                        alt="calendar"
                        width={18}
                        height={18}
                        className="filter-grey"
                      />
                      <p className="ml-2 whitespace-nowrap text-grey-600 dark:text-muted-foreground text-sm">{t('openOrder')}</p>
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
                    <div className="flex-center h-[40px] w-full overflow-hidden rounded-full bg-grey-50 dark:bg-muted px-3 py-1 text-sm">
                      <Image
                        src="/assets/icons/calendar.svg"
                        alt="calendar"
                        width={18}
                        height={18}
                        className="filter-grey"
                      />
                      <p className="ml-2 whitespace-nowrap text-grey-600 dark:text-muted-foreground text-sm">{t('closeOrder')}</p>
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
                    <div className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 dark:bg-muted px-4 py-2">
                      <Input placeholder={t('preorderLink')} {...field} value={field.value || ""} className="input-field" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        {/* Featured Product Section */}
        <div className="border rounded-lg p-4 mt-4">
          <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            {t('featuredItem')} <span className="text-xs text-muted-foreground font-normal">{t('featuredOptional')}</span>
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{t('featuredHint')}</p>

          <div className="mb-4">
            <FormLabel>{t('featuredImageLabel')}</FormLabel>
            <div className="w-full h-48">
              <FileUploader
                onFieldChange={(url) => {
                  setFeaturedPreview(url);
                  form.setValue('featuredProductImageUrl', url);
                }}
                imageUrl={featuredPreview}
                setFiles={(files) => {
                  if (files && files.length > 0) {
                    setFeaturedFile(files[0]);
                    setFeaturedPreview(URL.createObjectURL(files[0]));
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('imageSizeHint')}</p>
          </div>

          <FormField
            control={form.control}
            name="featuredProductDescription"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>{t('featuredDesc')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input placeholder="VD: Acrylic standee Arlecchino 15cm - limited edition" {...field} value={field.value || ''} className="input-field" maxLength={200} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {(field.value || '').length}/200
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Deal / Promotion Section */}
        <div className="border rounded-lg p-4 mt-4">
          <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
            <Tag className="h-5 w-5 text-green-500" />
            {t('promoSection')} <span className="text-xs text-muted-foreground font-normal">{t('promoOptional')}</span>
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{t('promoHint')}</p>

          <FormField
            control={form.control}
            name="dealBadge"
            render={({ field }) => (
              <FormItem className="w-full mb-4">
                <FormLabel>{t('promoBadge')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input placeholder={t('promoBadgePlaceholder')} {...field} value={field.value || ''} className="input-field" maxLength={30} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {(field.value || '').length}/30
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dealDescription"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>{t('promoDetails')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Textarea placeholder={t('promoPlaceholder')} {...field} value={field.value || ''} className="textarea rounded-2xl h-24" maxLength={500} />
                    <span className="absolute right-3 bottom-3 text-xs text-muted-foreground">
                      {(field.value || '').length}/500
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {hasInvalidImages && (
          <p className="text-red-500 text-sm mb-2">
            {t('uploadWait')}
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={form.formState.isSubmitting || hasInvalidImages}
          className="button col-span-2 w-full"
        >
          {form.formState.isSubmitting
            ? tc('posting')
            : type === "Create"
            ? t('postSample')
            : type === "Update"
            ? t('updateSample')
            : `${type} Sample`}
        </Button>
      </form>
    </Form>
  )
}

export default EventForm