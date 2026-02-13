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
      <label className="text-sm font-medium text-foreground">
        Tu etiqueta ambiental DGT
      </label>
      <div className="flex flex-wrap gap-2">
        {TAGS.map((tag) => (
          <button
            key={tag.value}
            onClick={() => onChange(tag.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200',
              'border-2 text-primary-foreground',
              tag.colorClass,
              value === tag.value
                ? 'ring-2 ring-ring ring-offset-2 ring-offset-background scale-105 shadow-md'
                : 'opacity-60 hover:opacity-90 border-transparent'
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
