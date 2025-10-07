"use client"
  import { ICategory } from "@/lib/database/models/category.model"
  import { startTransition, useEffect, useState } from "react"
  import { Loader2 } from "lucide-react";
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
  import { Input } from "../ui/input"
  import { createCategory, getAllCategories } from "@/lib/actions/category.actions"
  import MultipleSelector, { Option } from '@/components/ui/multiple-selector';

  type MultiSelectProps = {
    value?: Option[]; // Current selected options
    onChange: (options: Option[]) => void; // Function to handle selection change
    promptText?: string;
    categoryType: string;
    };

  const MultiSelect = ({ value, onChange, promptText, categoryType }: MultiSelectProps) => {
    const [categories, setCategories] = useState<ICategory[]>([]); // State for categories
    const [isLoaded, setIsLoaded] = useState(false); // Track whether data is loaded
    const [newCategory, setNewCategory] = useState(''); // State for new category input

    // Fetch categories when the component mounts
    useEffect(() => {
      const getCategories = async () => {
        const categoryList = await getAllCategories(categoryType); // Fetch categories from the API
        setCategories(categoryList || []); // Update state with fetched categories
        setIsLoaded(true); // Indicate that loading is complete
      };

      getCategories(); // Trigger fetch
    }, []);

    // Map categories to options
    const categoryOptions: Option[] = categories.map((category: ICategory) => ({
      label: category.name, // Option label
      value: category._id,  // Option value
    }));

    const handleAddCategory = async () => {
      const raw = newCategory.trim();
      if (!raw) return;
      const formattedName = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
      // Prevent adding duplicate ignoring case
      if (categories.some((c: ICategory) => c.name.toLowerCase() === formattedName.toLowerCase())) {
        setNewCategory('');
        return;
      }
      const category = await createCategory({ categoryName: formattedName,  categoryType: categoryType});
      setCategories((prevState: ICategory[]) => [...prevState, category]);
      // Auto-select the newly added category
      const newOption: Option = { label: category.name, value: category._id };
      onChange([...(value || []), newOption]);
      setNewCategory('');
    };

    return (
      <>
        {/* Render only after data is loaded */}
        {isLoaded ? (
          <MultipleSelector
            value={value}
            onChange={onChange}
            options={categoryOptions} // use controlled options so updates propagate
            placeholder={promptText}
            emptyIndicator={
              <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                Không tìm thấy tag.
              </p>
            }
          />
        ) : (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-base">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Đang tải tag...</span>
          </div>
        )}

        <AlertDialog>
          <AlertDialogTrigger className="p-medium-14 flex w-full rounded-sm py-3 pl-8 text-primary-500 hover:bg-primary-50 focus:text-primary-500">
            Không có tag bạn đang tìm? Nhấn vào đây để thêm.
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Tag mới</AlertDialogTitle>
              <AlertDialogDescription>
                <Input
                  type="text"
                  placeholder="Tên tag"
                  className="input-field mt-3"
                  value={newCategory} // Bind input value
                  onChange={(e) => setNewCategory(e.target.value)} // Handle input change
                />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Quay lại</AlertDialogCancel>
              <AlertDialogAction onClick={() => startTransition(handleAddCategory)}>
                Thêm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  };

  export default MultiSelect;