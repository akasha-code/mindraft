use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Mutex;
use std::time::UNIX_EPOCH;

use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FileContent {
    path: String,
    filename: String,
    content: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FileMetadata {
    modified_ms: u64,
}

struct WatchState {
    watcher: Option<RecommendedWatcher>,
    path: Option<String>,
}

fn is_markdown_path(path: &Path) -> bool {
    path.extension()
        .and_then(|value| value.to_str())
        .map(|value| {
            let lower = value.to_ascii_lowercase();
            lower == "md" || lower == "markdown"
        })
        .unwrap_or(false)
}

fn read_file_content(path: &Path) -> Result<FileContent, String> {
    if !path.is_file() {
        return Err(format!("File not found: {}", path.display()));
    }

    if !is_markdown_path(path) {
        return Err("Only .md and .markdown files are supported.".into());
    }

    let content = std::fs::read_to_string(path).map_err(|error| error.to_string())?;
    let filename = path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("Untitled.md")
        .to_string();

    Ok(FileContent {
        path: path.display().to_string(),
        filename,
        content,
    })
}

#[tauri::command]
fn read_markdown_file(path: String) -> Result<FileContent, String> {
    read_file_content(Path::new(&path))
}

#[tauri::command]
fn get_markdown_file_metadata(path: String) -> Result<FileMetadata, String> {
    let path_obj = Path::new(&path);

    if !path_obj.is_file() {
        return Err(format!("File not found: {}", path_obj.display()));
    }

    let metadata = std::fs::metadata(path_obj).map_err(|error| error.to_string())?;
    let modified = metadata
        .modified()
        .map_err(|error| error.to_string())?
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?;

    Ok(FileMetadata {
        modified_ms: modified.as_millis() as u64,
    })
}

#[tauri::command]
fn write_markdown_file(path: String, content: String) -> Result<(), String> {
    let path_obj = Path::new(&path);

    if path_obj.exists() && !path_obj.is_file() {
        return Err(format!("Path is not a file: {path}"));
    }

    if let Some(parent) = path_obj.parent() {
        std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    std::fs::write(path_obj, content).map_err(|error| error.to_string())
}

#[tauri::command]
fn write_binary_file(path: String, contents: Vec<u8>) -> Result<(), String> {
    let path_obj = Path::new(&path);

    if path_obj.exists() && !path_obj.is_file() {
        return Err(format!("Path is not a file: {path}"));
    }

    if let Some(parent) = path_obj.parent() {
        std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    std::fs::write(path_obj, contents).map_err(|error| error.to_string())
}

fn parent_directory(path: &Path) -> Result<PathBuf, String> {
    path.parent()
        .map(Path::to_path_buf)
        .ok_or_else(|| "No se pudo obtener la carpeta del archivo.".to_string())
}

fn spawn_command(program: &str, args: &[&str]) -> bool {
    Command::new(program)
        .args(args)
        .spawn()
        .map(|_| true)
        .unwrap_or(false)
}

#[cfg(target_os = "linux")]
fn reveal_in_file_manager_linux(file_path: &Path, parent: &Path) -> Option<String> {
    let file = file_path.to_string_lossy();

    if spawn_command("nautilus", &["--select", &file]) {
        return Some("Archivo revelado en la carpeta.".into());
    }

    if spawn_command("dolphin", &["--select", &file]) {
        return Some("Archivo revelado en la carpeta.".into());
    }

    if spawn_command("nemo", &["--no-desktop", &file]) {
        return Some("Archivo revelado en la carpeta.".into());
    }

    if spawn_command("xdg-open", &[&parent.to_string_lossy()]) {
        return Some("Carpeta abierta en el administrador de archivos.".into());
    }

    let file_url = format!("file://{}", parent.to_string_lossy());
    if spawn_command("xdg-open", &[&file_url]) {
        return Some("Carpeta abierta en el navegador.".into());
    }

    None
}

#[cfg(target_os = "macos")]
fn reveal_in_file_manager_macos(file_path: &Path) -> Option<String> {
    if spawn_command("open", &["-R", &file_path.to_string_lossy()]) {
        return Some("Archivo revelado en la carpeta.".into());
    }

    None
}

#[cfg(target_os = "windows")]
fn reveal_in_file_manager_windows(file_path: &Path) -> Option<String> {
    if spawn_command(
        "explorer",
        &["/select,", &file_path.to_string_lossy()],
    ) {
        return Some("Archivo revelado en la carpeta.".into());
    }

    None
}

#[tauri::command]
fn open_markdown_externally(path: String) -> Result<String, String> {
    let file_path = PathBuf::from(&path);

    if !file_path.is_file() {
        return Err(format!("No se encontró el archivo: {}", file_path.display()));
    }

    let file = file_path.to_string_lossy();

    #[cfg(target_os = "linux")]
    if spawn_command("xdg-open", &[&file]) {
        return Ok("Archivo abierto en la aplicación predeterminada.".into());
    }

    #[cfg(target_os = "macos")]
    if spawn_command("open", &[&file]) {
        return Ok("Archivo abierto en la aplicación predeterminada.".into());
    }

    #[cfg(target_os = "windows")]
    if spawn_command("cmd", &["/C", "start", "", &file]) {
        return Ok("Archivo abierto en la aplicación predeterminada.".into());
    }

    Err("No se pudo abrir el archivo con la aplicación predeterminada.".into())
}

#[tauri::command]
fn reveal_markdown_in_folder(path: String) -> Result<String, String> {
    let file_path = PathBuf::from(&path);

    if !file_path.is_file() {
        return Err(format!("No se encontró el archivo: {}", file_path.display()));
    }

    let parent = parent_directory(&file_path)?;

    #[cfg(target_os = "linux")]
    if let Some(message) = reveal_in_file_manager_linux(&file_path, &parent) {
        return Ok(message);
    }

    #[cfg(target_os = "macos")]
    if let Some(message) = reveal_in_file_manager_macos(&file_path) {
        return Ok(message);
    }

    #[cfg(target_os = "windows")]
    if let Some(message) = reveal_in_file_manager_windows(&file_path) {
        return Ok(message);
    }

    #[cfg(target_os = "macos")]
    if spawn_command("open", &[&parent.to_string_lossy()]) {
        return Ok("Carpeta abierta en Finder.".into());
    }

    #[cfg(target_os = "windows")]
    if spawn_command("explorer", &[&parent.to_string_lossy()]) {
        return Ok("Carpeta abierta en el Explorador.".into());
    }

    let file_url = format!("file://{}", parent.to_string_lossy());
    if spawn_command("xdg-open", &[&file_url]) {
        return Ok("Carpeta abierta en el navegador.".into());
    }

    Err("No se pudo abrir la carpeta del archivo.".into())
}

#[tauri::command]
fn set_markdown_file_watch(
    app: AppHandle,
    state: State<'_, Mutex<WatchState>>,
    path: Option<String>,
) -> Result<(), String> {
    let mut watch_state = state
        .lock()
        .map_err(|_| "No se pudo acceder al watcher de archivos.".to_string())?;

    watch_state.watcher = None;
    watch_state.path = path.clone();

    let Some(path_value) = path else {
        return Ok(());
    };

    let path_obj = PathBuf::from(&path_value);
    if !path_obj.is_file() {
        return Err(format!("File not found: {}", path_obj.display()));
    }

    let app_handle = app.clone();
    let watched_path = path_value.clone();

    let watcher = RecommendedWatcher::new(
        move |result: Result<Event, notify::Error>| {
            if let Ok(event) = result {
                let changed = matches!(
                    event.kind,
                    EventKind::Modify(_) | EventKind::Create(_)
                );

                if changed {
                    let _ = app_handle.emit("markdown-file-changed", watched_path.clone());
                }
            }
        },
        Config::default(),
    )
    .map_err(|error| error.to_string())?;

    let mut active_watcher = watcher;
    active_watcher
        .watch(&path_obj, RecursiveMode::NonRecursive)
        .map_err(|error| error.to_string())?;

    watch_state.watcher = Some(active_watcher);
    Ok(())
}

fn startup_file_from_args() -> Option<PathBuf> {
    std::env::args()
        .skip(1)
        .map(PathBuf::from)
        .find(|path| path.is_file() && is_markdown_path(path))
}

fn apply_main_window_icon(app: &tauri::App) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };

    let icon = app
        .default_window_icon()
        .cloned()
        .unwrap_or_else(|| tauri::include_image!("icons/128x128.png"));

    if let Err(error) = window.set_icon(icon) {
        eprintln!("Failed to set window icon: {error}");
    }
}

#[tauri::command]
fn exit_app() {
    std::process::exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(WatchState {
            watcher: None,
            path: None,
        }))
        .invoke_handler(tauri::generate_handler![
            read_markdown_file,
            write_markdown_file,
            write_binary_file,
            get_markdown_file_metadata,
            open_markdown_externally,
            reveal_markdown_in_folder,
            set_markdown_file_watch,
            exit_app
        ])
        .setup(|app| {
            apply_main_window_icon(app);

            if let Some(path) = startup_file_from_args() {
                let handle = app.handle().clone();
                let startup_path = path.display().to_string();
                let _ = handle.emit("startup-open-file", startup_path);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
