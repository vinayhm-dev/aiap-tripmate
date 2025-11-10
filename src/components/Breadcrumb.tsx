import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-6">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-gray-600 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
