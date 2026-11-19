import { Input } from "./Input";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

/** Search box for filter bars, with a screen-reader-only label. */
export function SearchInput({ id, label, value, onChange, placeholder }: Props) {
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Input
        id={id}
        type="search"
        fullWidth={false}
        className="w-64"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </>
  );
}
