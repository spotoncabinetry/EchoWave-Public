-- Modify menu_uploads table to make file_url nullable
ALTER TABLE menu_uploads ALTER COLUMN file_url DROP NOT NULL;

-- Add a check constraint to ensure file_url is not empty when provided
ALTER TABLE menu_uploads ADD CONSTRAINT file_url_not_empty 
    CHECK (file_url IS NULL OR LENGTH(TRIM(file_url)) > 0);

-- Add trigger to validate file_url on status change
CREATE OR REPLACE FUNCTION validate_menu_upload_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When status is being set to 'processing' or 'completed', ensure file_url is not null
    IF NEW.status IN ('processing', 'completed') AND NEW.file_url IS NULL THEN
        RAISE EXCEPTION 'file_url must be set before status can be changed to processing or completed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_menu_upload_status_trigger ON menu_uploads;
CREATE TRIGGER validate_menu_upload_status_trigger
    BEFORE UPDATE ON menu_uploads
    FOR EACH ROW
    EXECUTE FUNCTION validate_menu_upload_status();
