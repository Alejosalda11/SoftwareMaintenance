import type { Damage, DamageStatus, RepairWorkItem } from '@/types';

export function newRepairWorkItemId(): string {
  return `wi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyRepairWorkItem(): RepairWorkItem {
  return {
    id: newRepairWorkItemId(),
    category: 'other',
    description: '',
    status: 'pending',
    images: [],
  };
}

export function deriveAggregateStatusFromWorkItems(items: RepairWorkItem[]): DamageStatus {
  if (items.length === 0) return 'pending';
  if (items.every((i) => i.status === 'cancelled')) return 'cancelled';
  const active = items.filter((i) => i.status !== 'cancelled');
  if (active.length === 0) return 'cancelled';
  if (active.every((i) => i.status === 'completed')) return 'completed';
  if (active.some((i) => i.status === 'in-progress')) return 'in-progress';
  if (active.some((i) => i.status === 'completed') && active.some((i) => i.status === 'pending')) {
    return 'in-progress';
  }
  return 'pending';
}

/** Roll up line items into parent `Damage` fields for filters, list rows, and legacy consumers */
export function deriveParentFromWorkItems(
  items: RepairWorkItem[],
  fallbackCost: number,
): Pick<Damage, 'category' | 'description' | 'status' | 'completedDate' | 'cost' | 'images'> {
  const status = deriveAggregateStatusFromWorkItems(items);
  const lineSum = items.reduce((s, i) => s + (i.cost ?? 0), 0);
  const cost = lineSum > 0 ? lineSum : fallbackCost;

  const active = items.filter((i) => i.status !== 'cancelled');
  let completedDate: string | undefined;
  if (status === 'completed' && active.length > 0) {
    const dates = active
      .map((i) => i.completedDate)
      .filter((d): d is string => Boolean(d))
      .sort();
    completedDate = dates.length > 0 ? dates[dates.length - 1]! : new Date().toISOString().split('T')[0];
  }

  const category = items[0]?.category ?? 'other';
  const description =
    items.length === 1
      ? (items[0]!.description || 'Room repair')
      : `${items[0]?.description?.trim() || 'Room work order'} (+${items.length - 1} more)`;

  return {
    category,
    description,
    status,
    completedDate,
    cost,
    images: [],
  };
}

/** One row per category line for reporting (parent damage is split when `workItems` exist). */
export type FlatDamageLine = {
  damageId: string;
  hotelId: string;
  roomNumber: string;
  category: Damage['category'];
  status: DamageStatus;
  cost: number;
  completedDate?: string;
  reportedDate: string;
};

export function flattenDamageForStats(d: Damage): FlatDamageLine[] {
  if (d.workItems && d.workItems.length > 0) {
    return d.workItems.map((wi) => ({
      damageId: d.id,
      hotelId: d.hotelId,
      roomNumber: d.roomNumber,
      category: wi.category,
      status: wi.status,
      cost: wi.cost ?? 0,
      completedDate:
        wi.status === 'completed' ? (wi.completedDate ?? d.completedDate) : wi.completedDate,
      reportedDate: d.reportedDate,
    }));
  }
  return [
    {
      damageId: d.id,
      hotelId: d.hotelId,
      roomNumber: d.roomNumber,
      category: d.category,
      status: d.status,
      cost: d.cost,
      completedDate: d.completedDate,
      reportedDate: d.reportedDate,
    },
  ];
}
