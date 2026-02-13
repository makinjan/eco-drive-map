import { cn } from '@/lib/utils';

const TAGS = [
  { value: 'CERO', label: '0 Emisiones', colorClass: 'bg-tag-cero' },
  { value: 'ECO', label: 'ECO', colorClass: 'bg-tag-eco' },
  { value: 'C', label: 'C', colorClass: 'bg-tag-c' },
  { value: 'B', label: 'B', colorClass: 'bg-tag-b' },
  { value: 'SIN', label: 'Sin etiqueta', colorClass: 'bg-tag-sin' },
] as const;

interface TagSelectorProps {
  value: string;
  onChange: (tag: string) => void;
}

const TagSelector = ({ value, onChange }: TagSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Tu etiqueta ambiental DGT
      </label>
      <div className="flex flex-wrap gap-1.5">
        {TAGS.map((tag) => (
          <button
            key={tag.value}
            onClick={() => onChange(tag.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200',
              'text-primary-foreground',
              tag.colorClass,
              value === tag.value
                ? 'ring-2 ring-ring/50 ring-offset-1 ring-offset-background scale-[1.03] shadow-md'
                : 'opacity-50 hover:opacity-80'
            )}
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TagSelector;
