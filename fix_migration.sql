-- Script to fix migration issue and add missing columns
-- Execute this in your MySQL client (phpMyAdmin, MySQL Workbench, etc.)

USE cardio_ebogo;

-- Option 1: Delete the migration 8 record to allow it to run again
DELETE FROM _migrations WHERE version = 8;

-- Option 2: Or directly add the columns if they don't exist
-- Check and add ecg_files column
SELECT COUNT(*) INTO @col1_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE table_schema = 'cardio_ebogo' 
  AND table_name = 'ecg_ett_exams' 
  AND column_name = 'ecg_files';

SET @sql1 = IF(@col1_exists = 0, 
    'ALTER TABLE ecg_ett_exams ADD COLUMN ecg_files TEXT COMMENT ''JSON array of ECG file paths''',
    'SELECT ''Column ecg_files already exists'' AS info');
    
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- Check and add ett_files column
SELECT COUNT(*) INTO @col2_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE table_schema = 'cardio_ebogo' 
  AND table_name = 'ecg_ett_exams' 
  AND column_name = 'ett_files';

SET @sql2 = IF(@col2_exists = 0, 
    'ALTER TABLE ecg_ett_exams ADD COLUMN ett_files TEXT COMMENT ''JSON array of ETT file paths''',
    'SELECT ''Column ett_files already exists'' AS info');
    
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Verify the columns were added
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE table_schema = 'cardio_ebogo' 
  AND table_name = 'ecg_ett_exams'
  AND COLUMN_NAME IN ('ecg_files', 'ett_files');

SELECT 'Migration fix completed!' AS status;
