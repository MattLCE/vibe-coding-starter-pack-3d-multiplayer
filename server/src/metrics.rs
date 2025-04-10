use spacetimedb::{spacetimedb, Identity, Timestamp};
use std::time::Duration;
use sysinfo::{System, SystemExt};

#[spacetimedb(table)]
pub struct ServerMetrics {
    #[primarykey]
    pub timestamp: Timestamp,
    pub connected_clients: i32,
    pub updates_per_second: f32,
    pub average_update_time_ms: f32,
    pub memory_usage_mb: f32,
    pub cpu_usage_percent: f32,
}

#[spacetimedb(table)]
pub struct MetricsWindow {
    #[primarykey]
    pub window_id: i32,
    pub start_time: Timestamp,
    pub update_count: i32,
    pub total_update_time_ms: f32,
}

// Track the last 60 seconds of metrics in 1-second windows
const METRICS_WINDOW_COUNT: i32 = 60;

#[spacetimedb(reducer)]
pub fn init_metrics(ctx: &ReducerContext) {
    // Initialize metrics windows
    for i in 0..METRICS_WINDOW_COUNT {
        ctx.db.metrics_window().insert(MetricsWindow {
            window_id: i,
            start_time: ctx.timestamp,
            update_count: 0,
            total_update_time_ms: 0.0,
        });
    }
}

#[spacetimedb(reducer)]
pub fn record_update_metrics(ctx: &ReducerContext, update_time_ms: f32) {
    let current_window = (ctx.timestamp.micros() / 1_000_000) % (METRICS_WINDOW_COUNT as u64);
    
    // Update the current window
    if let Some(mut window) = ctx.db.metrics_window().filter_by_window_id(current_window as i32) {
        // If window is from previous cycle, reset it
        if (ctx.timestamp.micros() - window.start_time.micros()) >= (METRICS_WINDOW_COUNT as u64 * 1_000_000) {
            window.start_time = ctx.timestamp;
            window.update_count = 1;
            window.total_update_time_ms = update_time_ms;
        } else {
            window.update_count += 1;
            window.total_update_time_ms += update_time_ms;
        }
        ctx.db.metrics_window().update_by_window_id(window);
    }
}

#[spacetimedb(reducer(interval_secs = 1))]
pub fn update_server_metrics(ctx: &ReducerContext) {
    // Calculate updates per second and average update time
    let mut total_updates = 0;
    let mut total_time = 0.0;
    let now = ctx.timestamp;

    for window in ctx.db.metrics_window().iter() {
        if (now.micros() - window.start_time.micros()) < (METRICS_WINDOW_COUNT as u64 * 1_000_000) {
            total_updates += window.update_count;
            total_time += window.total_update_time_ms;
        }
    }

    let updates_per_second = total_updates as f32 / METRICS_WINDOW_COUNT as f32;
    let average_update_time = if total_updates > 0 {
        total_time / total_updates as f32
    } else {
        0.0
    };

    // Count connected clients
    let connected_clients = ctx.db.player().count() as i32;

    // Initialize system for metrics collection
    let mut system = System::new_all();
    system.refresh_all();

    // Get memory and CPU usage
    let total_memory = system.total_memory() as f32 / 1024.0; // Convert to MB
    let used_memory = system.used_memory() as f32 / 1024.0; // Convert to MB
    let memory_usage_mb = used_memory;
    let cpu_usage_percent = system.global_processor_info().cpu_usage();

    // Insert new metrics
    ctx.db.server_metrics().insert(ServerMetrics {
        timestamp: ctx.timestamp,
        connected_clients,
        updates_per_second,
        average_update_time_ms: average_update_time,
        memory_usage_mb,
        cpu_usage_percent,
    });

    // Clean up old metrics
    let cutoff_time = Timestamp::from_micros(ctx.timestamp.micros() - 60_000_000); // 60 seconds
    ctx.db.server_metrics()
        .filter(|m| m.timestamp < cutoff_time)
        .delete();
} 