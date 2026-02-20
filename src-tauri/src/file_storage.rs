use std::fs;
use tauri::{AppHandle, Manager};

#[tauri::command]
pub async fn save_medical_file(
    app: AppHandle,
    file_data: Vec<u8>,
    filename: String,
    _file_type: String,
) -> Result<String, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app directory: {}", e))?;

    let medical_files_dir = app_dir.join("medical_files");
    
    fs::create_dir_all(&medical_files_dir)
        .map_err(|e| format!("Failed to create medical files directory: {}", e))?;

    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S").to_string();
    let safe_filename = sanitize_filename(&filename);
    let unique_filename = format!("{}_{}", timestamp, safe_filename);
    
    let file_path = medical_files_dir.join(&unique_filename);

    fs::write(&file_path, file_data)
        .map_err(|e| format!("Failed to write file: {}", e))?;

    let relative_path = format!("medical_files/{}", unique_filename);
    Ok(relative_path)
}

#[tauri::command]
pub async fn read_medical_file(
    app: AppHandle,
    file_path: String,
) -> Result<Vec<u8>, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app directory: {}", e))?;

    let full_path = app_dir.join(&file_path);

    if !full_path.exists() {
        return Err(format!("File not found: {}", file_path));
    }

    fs::read(&full_path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub async fn delete_medical_file(
    app: AppHandle,
    file_path: String,
) -> Result<(), String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app directory: {}", e))?;

    let full_path = app_dir.join(&file_path);

    if full_path.exists() {
        fs::remove_file(&full_path)
            .map_err(|e| format!("Failed to delete file: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn open_medical_file(
    app: AppHandle,
    file_path: String,
) -> Result<(), String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app directory: {}", e))?;

    let full_path = app_dir.join(&file_path);

    if !full_path.exists() {
        return Err(format!("File not found: {}", file_path));
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(&["/C", "start", "", full_path.to_str().unwrap()])
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(full_path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(full_path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    Ok(())
}

fn sanitize_filename(filename: &str) -> String {
    filename
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '.' || c == '-' || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect()
}
