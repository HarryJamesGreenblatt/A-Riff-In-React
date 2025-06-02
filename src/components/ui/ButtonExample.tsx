import React from 'react';

/**
 * Temporary Button component following shadcn/ui patterns
 * This demonstrates the component structure until we properly set up shadcn/ui
 */
const Button: React.FC<{
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ variant = 'default', size = 'default', children, onClick, className = '' }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'underline-offset-4 hover:underline text-primary'
  };
  
  const sizeClasses = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 rounded-md',
    lg: 'h-11 px-8 rounded-md',
    icon: 'h-10 w-10'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

/**
 * ButtonExample Component
 * 
 * This component demonstrates both Tailwind CSS utility classes and shadcn/ui-style components.
 * It serves as a learning example for UI integration in the React template.
 */
const ButtonExample: React.FC = () => {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        UI Framework Examples
      </h2>
      
      {/* Pure Tailwind CSS Button */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">Tailwind CSS Button:</h3>
        <button 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          onClick={() => alert('Tailwind button clicked!')}
        >
          Tailwind Button
        </button>
      </div>
      
      {/* shadcn/ui-style Button Component */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">shadcn/ui-style Button:</h3>
        <div className="space-x-2">
          <Button onClick={() => alert('Default button clicked!')}>
            Default Button
          </Button>
          <Button variant="outline" onClick={() => alert('Outline button clicked!')}>
            Outline Button
          </Button>
          <Button variant="destructive" onClick={() => alert('Destructive button clicked!')}>
            Destructive Button
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ButtonExample;
