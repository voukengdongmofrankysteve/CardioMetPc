use chrono::Local;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri::command;

#[command]
pub async fn create_database_backup(backup_type: String) -> Result<String, String> {
    // Database connection details
    let db_host = "localhost";
    let db_user = "root";
    let db_password = "51405492fS@";
    let db_name = "cardio_ebogo";

    // Create backups directory if it doesn't exist
    let backup_dir = PathBuf::from("backups");
    if !backup_dir.exists() {
        fs::create_dir_all(&backup_dir)
            .map_err(|e| format!("Failed to create backup directory: {}", e))?;
    }

    // Generate filename with timestamp
    let timestamp = Local::now().format("%Y%m%d_%H%M%S");
    let filename = format!("cardio_ebogo_backup_{}.sql", timestamp);
    let backup_path = backup_dir.join(&filename);

    // Execute mysqldump command
    let output = Command::new("mysqldump")
        .args(&[
            "-h", db_host,
            "-u", db_user,
            &format!("-p{}", db_password),
            "--single-transaction",
            "--routines",
            "--triggers",
            db_name,
        ])
        .output()
        .map_err(|e| format!("Failed to execute mysqldump: {}. Make sure MySQL is installed and mysqldump is in your PATH.", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Backup failed: {}", error));
    }

    // Write backup to file
    fs::write(&backup_path, &output.stdout)
        .map_err(|e| format!("Failed to write backup file: {}", e))?;

    // Get file size in MB
    let metadata =
        fs::metadata(&backup_path).map_err(|e| format!("Failed to get file metadata: {}", e))?;
    let size_mb = metadata.len() as f64 / (1024.0 * 1024.0);

    // Return backup info as JSON string
    Ok(serde_json::json!({
        "filename": filename,
        "size_mb": format!("{:.2}", size_mb),
        "path": backup_path.to_string_lossy(),
        "type": backup_type,
        "timestamp": Local::now().to_rfc3339()
    })
    .to_string())
}

#[command]
pub async fn restore_database_backup(filename: String) -> Result<String, String> {
    // Database connection details
    let db_host = "localhost";
    let db_user = "root";
    let db_password = "51405492fS@";
    let db_name = "cardio_ebogo";

    let backup_path = PathBuf::from("backups").join(&filename);

    if !backup_path.exists() {
        return Err(format!("Backup file not found: {}", filename));
    }

    // Read backup file
    let backup_content = fs::read_to_string(&backup_path)
        .map_err(|e| format!("Failed to read backup file: {}", e))?;

    // Execute mysql command to restore
    let mut child = Command::new("mysql")
        .args(&[
            "-h",
            db_host,
            "-u",
            db_user,
            &format!("-p{}", db_password),
            db_name,
        ])
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| {
            format!(
                "Failed to execute mysql: {}. Make sure MySQL client is installed.",
                e
            )
        })?;

    // Write backup content to stdin
    use std::io::Write;
    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(backup_content.as_bytes())
            .map_err(|e| format!("Failed to write to mysql stdin: {}", e))?;
    }

    let output = child
        .wait_with_output()
        .map_err(|e| format!("Failed to wait for mysql process: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Restore failed: {}", error));
    }

    Ok(format!("Database restored successfully from {}", filename))
}

#[command]
pub async fn list_backup_files() -> Result<Vec<String>, String> {
    let backup_dir = PathBuf::from("backups");

    if !backup_dir.exists() {
        return Ok(Vec::new());
    }

    let mut backups = Vec::new();

    let entries =
        fs::read_dir(&backup_dir).map_err(|e| format!("Failed to read backup directory: {}", e))?;

    for entry in entries {
        if let Ok(entry) = entry {
            if let Some(filename) = entry.file_name().to_str() {
                if filename.ends_with(".sql") {
                    let metadata = entry
                        .metadata()
                        .map_err(|e| format!("Failed to get file metadata: {}", e))?;
                    let size_mb = metadata.len() as f64 / (1024.0 * 1024.0);

                    backups.push(
                        serde_json::json!({
                            "filename": filename,
                            "size_mb": format!("{:.2}", size_mb),
                            "modified": metadata.modified()
                                .ok()
                                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                                .map(|d| d.as_secs())
                        })
                        .to_string(),
                    );
                }
            }
        }
    }

    Ok(backups)
}

#[command]
pub async fn delete_backup_file(filename: String) -> Result<String, String> {
    let backup_path = PathBuf::from("backups").join(&filename);

    if !backup_path.exists() {
        return Err(format!("Backup file not found: {}", filename));
    }

    fs::remove_file(&backup_path).map_err(|e| format!("Failed to delete backup file: {}", e))?;

    Ok(format!("Backup file {} deleted successfully", filename))
}
