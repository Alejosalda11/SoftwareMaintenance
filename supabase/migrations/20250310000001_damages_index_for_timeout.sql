-- Composite index so "WHERE hotel_id = ? ORDER BY reported_date DESC LIMIT N" uses the index
-- and avoids statement timeout (57014) when fetching damages.
CREATE INDEX IF NOT EXISTS idx_damages_hotel_reported_desc
  ON public.damages (hotel_id, reported_date DESC);
