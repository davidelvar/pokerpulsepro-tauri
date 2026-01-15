#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Player {
    id: String,
    name: String,
    buyins: u32,
    rebuys: u32,
    eliminated: bool,
    placement: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlindLevel {
    id: String,
    small_blind: u32,
    big_blind: u32,
    ante: u32,
    duration_minutes: u32,
    is_break: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tournament {
    id: String,
    name: String,
    buyin_amount: u32,
    rebuy_amount: u32,
    starting_chips: u32,
    players: Vec<Player>,
    blind_structure: Vec<BlindLevel>,
    current_level: usize,
    time_remaining_seconds: u32,
    is_running: bool,
    currency_symbol: String,
}

impl Default for Tournament {
    fn default() -> Self {
        Tournament {
            id: uuid(),
            name: String::from("New Tournament"),
            buyin_amount: 100,
            rebuy_amount: 100,
            starting_chips: 10000,
            players: Vec::new(),
            blind_structure: default_blind_structure(),
            current_level: 0,
            time_remaining_seconds: 15 * 60,
            is_running: false,
            currency_symbol: String::from("$"),
        }
    }
}

fn uuid() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now().duration_since(UNIX_EPOCH).unwrap();
    format!("{:x}{:x}", duration.as_secs(), duration.subsec_nanos())
}

fn default_blind_structure() -> Vec<BlindLevel> {
    vec![
        BlindLevel { id: uuid(), small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
        BlindLevel { id: uuid(), small_blind: 50, big_blind: 100, ante: 0, duration_minutes: 15, is_break: false },
        BlindLevel { id: uuid(), small_blind: 75, big_blind: 150, ante: 0, duration_minutes: 15, is_break: false },
        BlindLevel { id: uuid(), small_blind: 100, big_blind: 200, ante: 25, duration_minutes: 15, is_break: false },
        BlindLevel { id: uuid(), small_blind: 0, big_blind: 0, ante: 0, duration_minutes: 10, is_break: true },
        BlindLevel { id: uuid(), small_blind: 150, big_blind: 300, ante: 25, duration_minutes: 15, is_break: false },
        BlindLevel { id: uuid(), small_blind: 200, big_blind: 400, ante: 50, duration_minutes: 15, is_break: false },
        BlindLevel { id: uuid(), small_blind: 300, big_blind: 600, ante: 75, duration_minutes: 15, is_break: false },
        BlindLevel { id: uuid(), small_blind: 400, big_blind: 800, ante: 100, duration_minutes: 15, is_break: false },
        BlindLevel { id: uuid(), small_blind: 0, big_blind: 0, ante: 0, duration_minutes: 10, is_break: true },
        BlindLevel { id: uuid(), small_blind: 500, big_blind: 1000, ante: 100, duration_minutes: 15, is_break: false },
        BlindLevel { id: uuid(), small_blind: 700, big_blind: 1400, ante: 200, duration_minutes: 15, is_break: false },
        BlindLevel { id: uuid(), small_blind: 1000, big_blind: 2000, ante: 300, duration_minutes: 15, is_break: false },
        BlindLevel { id: uuid(), small_blind: 1500, big_blind: 3000, ante: 400, duration_minutes: 15, is_break: false },
        BlindLevel { id: uuid(), small_blind: 2000, big_blind: 4000, ante: 500, duration_minutes: 15, is_break: false },
    ]
}

pub struct AppState {
    tournament: Mutex<Tournament>,
}

#[tauri::command]
fn get_tournament(state: State<AppState>) -> Tournament {
    state.tournament.lock().unwrap().clone()
}

#[tauri::command]
fn update_tournament(state: State<AppState>, tournament: Tournament) {
    let mut t = state.tournament.lock().unwrap();
    *t = tournament;
}

#[tauri::command]
fn add_player(state: State<AppState>, name: String) -> Player {
    let mut t = state.tournament.lock().unwrap();
    let player = Player {
        id: uuid(),
        name,
        buyins: 1,
        rebuys: 0,
        eliminated: false,
        placement: None,
    };
    t.players.push(player.clone());
    player
}

#[tauri::command]
fn remove_player(state: State<AppState>, player_id: String) {
    let mut t = state.tournament.lock().unwrap();
    t.players.retain(|p| p.id != player_id);
}

#[tauri::command]
fn update_player(state: State<AppState>, player: Player) {
    let mut t = state.tournament.lock().unwrap();
    if let Some(p) = t.players.iter_mut().find(|p| p.id == player.id) {
        *p = player;
    }
}

#[tauri::command]
fn eliminate_player(state: State<AppState>, player_id: String) {
    let mut t = state.tournament.lock().unwrap();
    let active_count = t.players.iter().filter(|p| !p.eliminated).count();
    if let Some(player) = t.players.iter_mut().find(|p| p.id == player_id) {
        player.eliminated = true;
        player.placement = Some(active_count as u32);
    }
}

#[tauri::command]
fn start_timer(state: State<AppState>) {
    let mut t = state.tournament.lock().unwrap();
    t.is_running = true;
}

#[tauri::command]
fn pause_timer(state: State<AppState>) {
    let mut t = state.tournament.lock().unwrap();
    t.is_running = false;
}

#[tauri::command]
fn tick_timer(state: State<AppState>) -> Tournament {
    let mut t = state.tournament.lock().unwrap();
    if t.is_running && t.time_remaining_seconds > 0 {
        t.time_remaining_seconds -= 1;
    } else if t.is_running && t.time_remaining_seconds == 0 {
        // Advance to next level
        if t.current_level < t.blind_structure.len() - 1 {
            t.current_level += 1;
            t.time_remaining_seconds = t.blind_structure[t.current_level].duration_minutes * 60;
        } else {
            t.is_running = false;
        }
    }
    t.clone()
}

#[tauri::command]
fn next_level(state: State<AppState>) {
    let mut t = state.tournament.lock().unwrap();
    if t.current_level < t.blind_structure.len() - 1 {
        t.current_level += 1;
        t.time_remaining_seconds = t.blind_structure[t.current_level].duration_minutes * 60;
    }
}

#[tauri::command]
fn prev_level(state: State<AppState>) {
    let mut t = state.tournament.lock().unwrap();
    if t.current_level > 0 {
        t.current_level -= 1;
        t.time_remaining_seconds = t.blind_structure[t.current_level].duration_minutes * 60;
    }
}

#[tauri::command]
fn add_time(state: State<AppState>, seconds: u32) {
    let mut t = state.tournament.lock().unwrap();
    t.time_remaining_seconds += seconds;
}

#[tauri::command]
fn reset_tournament(state: State<AppState>) {
    let mut t = state.tournament.lock().unwrap();
    *t = Tournament::default();
}

#[tauri::command]
fn save_tournament(app: AppHandle, state: State<AppState>) -> Result<String, String> {
    let t = state.tournament.lock().unwrap();
    let json = serde_json::to_string_pretty(&*t).map_err(|e| e.to_string())?;
    
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    
    let file_path = app_dir.join(format!("{}.json", t.id));
    fs::write(&file_path, json).map_err(|e| e.to_string())?;
    
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn load_tournament(app: AppHandle, state: State<AppState>, id: String) -> Result<Tournament, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let file_path = app_dir.join(format!("{}.json", id));
    
    let json = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let tournament: Tournament = serde_json::from_str(&json).map_err(|e| e.to_string())?;
    
    let mut t = state.tournament.lock().unwrap();
    *t = tournament.clone();
    
    Ok(tournament)
}

#[tauri::command]
fn list_tournaments(app: AppHandle) -> Result<Vec<String>, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    
    if !app_dir.exists() {
        return Ok(Vec::new());
    }
    
    let entries = fs::read_dir(&app_dir).map_err(|e| e.to_string())?;
    let mut tournaments = Vec::new();
    
    for entry in entries {
        if let Ok(entry) = entry {
            if let Some(ext) = entry.path().extension() {
                if ext == "json" {
                    if let Some(stem) = entry.path().file_stem() {
                        tournaments.push(stem.to_string_lossy().to_string());
                    }
                }
            }
        }
    }
    
    Ok(tournaments)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .manage(AppState {
            tournament: Mutex::new(Tournament::default()),
        })
        .invoke_handler(tauri::generate_handler![
            get_tournament,
            update_tournament,
            add_player,
            remove_player,
            update_player,
            eliminate_player,
            start_timer,
            pause_timer,
            tick_timer,
            next_level,
            prev_level,
            add_time,
            reset_tournament,
            save_tournament,
            load_tournament,
            list_tournaments,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
