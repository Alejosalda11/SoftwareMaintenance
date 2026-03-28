-- Room checklist fields for hotel-wide preventive tasks
ALTER TABLE public.preventive_maintenance
  ADD COLUMN IF NOT EXISTS room_progress JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rooms_done_notes TEXT NOT NULL DEFAULT '';

-- Multi-line work orders per room (damages)
ALTER TABLE public.damages
  ADD COLUMN IF NOT EXISTS work_items JSONB NOT NULL DEFAULT '[]'::jsonb;
