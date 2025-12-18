use chrono::Local;
use std::sync::Mutex;
use tauri::{Emitter, Manager};

struct PendingOpenFiles(Mutex<Vec<String>>);

impl Default for PendingOpenFiles {
	fn default() -> Self {
		Self(Mutex::new(Vec::new()))
	}
}

#[tauri::command]
fn take_pending_open_files(state: tauri::State<'_, PendingOpenFiles>) -> Vec<String> {
	let mut guard = state.0.lock().expect("pending open files lock poisoned");
	std::mem::take(&mut *guard)
}

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
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(PendingOpenFiles::default())
        .invoke_handler(tauri::generate_handler![logger, start_drag, take_pending_open_files]);

    let app = builder
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(move |app_handle, event| {
        if let tauri::RunEvent::Opened { urls } = event {
            for url in urls {
                if let Ok(path) = url.to_file_path() {
                    let path_str = path.to_string_lossy().to_string();
                    println!("[FILE_ASSOCIATION] File opened: {}", path_str);

					let pending = app_handle.state::<PendingOpenFiles>();
					let mut guard = pending.0.lock().expect("pending open files lock poisoned");
					guard.push(path_str.clone());

					let _ = app_handle.emit("file-opened", &path_str);
                }
            }
        }
    });
}
