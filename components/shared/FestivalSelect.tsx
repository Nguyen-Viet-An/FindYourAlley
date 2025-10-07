import { useEffect } from "react";
import MultipleSelector, { Option } from "@/components/ui/multiple-selector";

type FestivalSelectProps = {
  festivals: any[];
  selectedIds: string[];
  onChangeIds: (ids: string[]) => void;
  placeholder?: string;
  disableUrlSync?: boolean;
};

const FestivalSelect = ({ festivals, selectedIds, onChangeIds, placeholder, disableUrlSync }: FestivalSelectProps) => {
  // Map festivals to { label, value } options
  const options: Option[] = festivals.map(f => ({
    label: f.name,
    value: f._id
  }));

  useEffect(() => {
    console.log("FestivalSelect received festivals:", festivals);
    console.log("Mapped options:", options);
    console.log("Currently selected IDs:", selectedIds);
  }, [festivals, selectedIds]);

  const selectedOptions = options.filter(opt => selectedIds.includes(opt.value));
  console.log("Selected options for MultipleSelector:", selectedOptions);

  return (
    <MultipleSelector
      options={options}
      selected={selectedOptions}
      onChange={(newSelected: Option[]) => {
        console.log("Festival selection changed:", newSelected);
        onChangeIds(newSelected.map(o => o.value));
      }}
      placeholder={placeholder}
      disableUrlSync={disableUrlSync}
    />
  );
};

export default FestivalSelect;
