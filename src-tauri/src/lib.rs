// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn logger(level: &str, message: &str) {
    match level {
        "info" => println!("[INFO] {}", message),
        "warn" => println!("[WARN] {}", message),
        "error" => eprintln!("[ERROR] {}", message),
        "debug" => println!("[DEBUG] {}", message),
        _ => println!("[LOG] {}", message),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, logger])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
