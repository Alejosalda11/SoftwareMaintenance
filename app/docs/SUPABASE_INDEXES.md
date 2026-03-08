# Supabase indexes for Hotel Maintenance Pro

To speed up data loading and hotel switching, create these indexes in your Supabase project (SQL Editor or migrations).

**If you see "canceling statement due to statement timeout" (code 57014)** when loading damages, the query is too slow: add the indexes below. The app also limits damages to 2000 rows per hotel so the request can complete without indexes; for full history and best performance, add indexes.

## Recommended indexes

```sql
-- Damages: filtered by hotel_id, ordered by reported_date (avoids timeout 57014)
CREATE INDEX IF NOT EXISTS idx_damages_hotel_id ON damages (hotel_id);
CREATE INDEX IF NOT EXISTS idx_damages_hotel_reported ON damages (hotel_id, reported_date DESC);

-- Rooms: filtered by hotel_id, ordered by number
CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON rooms (hotel_id);

-- Preventive maintenance: filtered by hotel_id, ordered by next_due_date
CREATE INDEX IF NOT EXISTS idx_preventive_maintenance_hotel_id ON preventive_maintenance (hotel_id);
CREATE INDEX IF NOT EXISTS idx_preventive_maintenance_next_due_date ON preventive_maintenance (next_due_date);
```

If your tables already have a primary key or unique constraint on the relevant columns, Supabase may have created indexes automatically. Check the Table Editor or run `\di` in the SQL editor to list existing indexes before adding these.
