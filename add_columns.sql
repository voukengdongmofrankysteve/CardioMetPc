USE cardio_ebogo;

-- Check if columns exist and add them if they don't
SET @dbname = DATABASE();
SET @tablename = 'ecg_ett_exams';
SET @columnname1 = 'ecg_files';
SET @columnname2 = 'ett_files';

-- Add ecg_files column if not exists
SET @preparedStatement1 = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE (table_name = @tablename)
     AND (table_schema = @dbname)
     AND (column_name = @columnname1)) > 0,
    'SELECT ''Column ecg_files already exists'' AS message',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname1, ' TEXT COMMENT ''JSON array of ECG file paths''')
));
PREPARE alterIfNotExists1 FROM @preparedStatement1;
EXECUTE alterIfNotExists1;
DEALLOCATE PREPARE alterIfNotExists1;

-- Add ett_files column if not exists
SET @preparedStatement2 = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE (table_name = @tablename)
     AND (table_schema = @dbname)
     AND (column_name = @columnname2)) > 0,
    'SELECT ''Column ett_files already exists'' AS message',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname2, ' TEXT COMMENT ''JSON array of ETT file paths''')
));
PREPARE alterIfNotExists2 FROM @preparedStatement2;
EXECUTE alterIfNotExists2;
DEALLOCATE PREPARE alterIfNotExists2;

SELECT 'Migration completed successfully' AS status;
