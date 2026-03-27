"use client"
import MultipleSelector, { Option } from '@/components/ui/multiple-selector';

type Festival = { _id: string; name: string; code?: string };

type FestivalMultiSelectProps = {
  value?: Option[];
  onChange: (options: Option[]) => void;
  festivals: Festival[];
  promptText?: string;
};

const FestivalMultiSelect = ({ value, onChange, festivals, promptText }: FestivalMultiSelectProps) => {
  const festivalOptions: Option[] = festivals.map((f) => ({
    label: f.code ? `${f.name} (${f.code})` : f.name,
    value: f._id,
  }));

  return (
    <MultipleSelector
      value={value}
      onChange={onChange}
      options={festivalOptions}
      placeholder={promptText || "Chọn festival"}
      className="bg-grey-50 dark:bg-muted rounded-full"
      emptyIndicator={
        <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
          Không tìm thấy festival.
        </p>
      }
    />
  );
};

export default FestivalMultiSelect;