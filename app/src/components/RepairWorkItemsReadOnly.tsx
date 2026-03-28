import { Badge } from '@/components/ui/badge';
import { ImageGallery } from '@/components/ImageGallery';
import type { Damage } from '@/types';

type Props = {
  damage: Damage;
  formatCurrency: (amount: number) => string;
  getStatusColor: (status: string) => string;
};

export function RepairWorkItemsReadOnly({ damage, formatCurrency, getStatusColor }: Props) {
  if (!damage.workItems?.length) return null;
  return (
    <div className="space-y-4 border-t pt-3">
      <p className="text-sm font-medium text-gray-700">Trades in this room</p>
      {damage.workItems.map((wi) => (
        <div key={wi.id} className="rounded-lg border bg-gray-50/80 p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {wi.category}
            </Badge>
            <Badge className={getStatusColor(wi.status)}>{wi.status}</Badge>
            {wi.cost != null && wi.cost > 0 && (
              <span className="text-sm font-medium">{formatCurrency(wi.cost)}</span>
            )}
          </div>
          <p className="text-sm text-gray-800">{wi.description}</p>
          {wi.notes && <p className="text-xs text-gray-500 italic">{wi.notes}</p>}
          {wi.images && wi.images.length > 0 && (
            <ImageGallery images={wi.images} damageId={`${damage.id}-${wi.id}`} />
          )}
        </div>
      ))}
    </div>
  );
}
