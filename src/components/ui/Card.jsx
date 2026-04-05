export default function Card({ children, className = '', hover = false, glass = false, ...props }) {
  return (
    <div
      className={`
        rounded-2xl border
        ${glass
          ? 'glass'
          : 'bg-white border-warm-100 dark:bg-dark-800 dark:border-dark-600'
        }
        ${hover ? 'hover-lift cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 pt-6 pb-2 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 pb-6 pt-2 ${className}`}>
      {children}
    </div>
  );
}
