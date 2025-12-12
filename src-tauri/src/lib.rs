use chrono::Local;

#[tauri::command]
fn logger(level: &str, message: &str) {
    let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
    match level {
        "info" => println!("[{}][INFO] {}", timestamp, message),
        "warn" => println!("[{}][WARN] {}", timestamp, message),
        "error" => eprintln!("[{}][ERROR] {}", timestamp, message),
        "debug" => println!("[{}][DEBUG] {}", timestamp, message),
        _ => println!("[{}][LOG] {}", timestamp, message),
    }
}

#[tauri::command]
async fn start_drag(window: tauri::Window) -> Result<(), String> {
    println!("start_drag command called from Rust");
    window.start_dragging().map_err(|e| {
        println!("Error starting drag: {}", e);
        e.to_string()
    })?;
    println!("Drag started successfully from Rust");
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![logger, start_drag])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
