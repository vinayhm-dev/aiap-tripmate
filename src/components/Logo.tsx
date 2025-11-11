import { Plane } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-2">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2 shadow-lg">
        <Plane className={`${sizeClasses[size]} text-white`} />
      </div>
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent`}>
          TripPlanner
        </span>
      )}
    </div>
  );
}
