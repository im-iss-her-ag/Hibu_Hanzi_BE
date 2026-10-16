-- meaning_vi starts empty for the HSK1-6 skeleton import (DESIGN.md §9: Vietnamese
-- meanings are written by the team afterwards). Only 'reviewed' rows reach the client,
-- so NULL here is the honest "not written yet" marker. Safe to rerun.

ALTER TABLE character_readings ALTER COLUMN meaning_vi DROP NOT NULL;
ALTER TABLE words ALTER COLUMN meaning_vi DROP NOT NULL;
