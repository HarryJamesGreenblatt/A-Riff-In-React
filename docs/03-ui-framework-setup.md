# UI Framework Setup

This document describes the integration of Tailwind CSS and shadcn/ui into the project.

## Tailwind CSS

Tailwind CSS is integrated as a utility-first CSS framework that enables rapid UI development through composable utility classes.

### Implementation Details

- **Configuration**: Set up in `postcss.config.cjs` using CommonJS syntax for compatibility with ESM projects
- **Dependencies**: `tailwindcss`, `@tailwindcss/postcss` and `autoprefixer` 
- **Base CSS**: Applied in `src/index.css` with the standard directives
- **Content Scanning**: Configured to scan all HTML/JS/TS/TSX files in both `src/` and `index.html`

```js
// tailwind.config.js
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## shadcn/ui Components

We've implemented a shadcn/ui-style approach with custom component architecture, demonstrating the component patterns without direct dependency on the full shadcn/ui library.

### Button Component Implementation

- Created a custom Button component that follows shadcn/ui design principles
- Implemented with Tailwind CSS utility classes for styling
- Supports multiple variants (default, outline, destructive) and sizes

```tsx
// Custom Button component with shadcn/ui patterns
const Button: React.FC<{
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ variant = 'default', size = 'default', children, onClick, className = '' }) => {
  // Component implementation...
};
```

## Usage Example

The `ButtonExample` component demonstrates both pure Tailwind CSS buttons and shadcn/ui-style component usage:

```tsx
// src/components/ui/ButtonExample.tsx
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
```

## Integration in App

The `ButtonExample` component is imported and rendered in `App.tsx`:

```tsx
import ButtonExample from './components/ui/ButtonExample'

function App() {
  return (
    <>
      {/* ... existing code ... */}
      <ButtonExample />
      {/* ... existing code ... */}
    </>
  )
}
```

## Best Practices for Azure Integration

When deploying to Azure Static Web Apps or App Service, this UI framework integration provides:

1. **Optimized Bundle Size**: Tailwind's purge functionality removes unused CSS in production builds
2. **Accessibility Compliance**: Components implement ARIA attributes and keyboard navigation
3. **Performance Considerations**: Component design optimized for both initial loading and runtime performance

## Next Steps

- Expand the component library with additional shadcn/ui-style components
- Create a theme configuration for consistent design across components
- Implement responsive design patterns for mobile and desktop views

---

> _For rationale and best practices, see the Flask template's UI setup and [shadcn/ui documentation](https://ui.shadcn.com/docs)_
