
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLink?: string;
  actionText?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLink,
  actionText,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
      {icon && <div className="text-gray-400 mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">{description}</p>
      
      {actionLink && actionText && (
        <Button asChild>
          <Link to={actionLink}>{actionText}</Link>
        </Button>
      )}
    </div>
  );
}
