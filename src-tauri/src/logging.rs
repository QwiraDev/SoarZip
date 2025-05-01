//! Logging utilities for SoarZip.
//! SoarZip 的日志记录工具。

/// Logs an informational message to the console, only in debug builds.
/// 向控制台记录一条信息性消息，仅在调试构建中。
///
/// # Arguments
/// # 参数
///
/// * `message` - The message string to log.
/// * `message` - 要记录的消息字符串。
#[cfg(debug_assertions)] // Only compile this function for debug builds
pub fn log_info(message: &str) {
    println!("[SoarZip INFO] {}", message);
}

/// Does nothing in release builds.
/// 在发布构建中不执行任何操作。
#[cfg(not(debug_assertions))] // Compile an empty function for release builds
#[inline(always)] // Hint the compiler to remove this empty function call
pub fn log_info(_message: &str) {
    // No-op in release mode / 在发布模式下为空操作
}

/// Logs an error message to the standard error stream, only in debug builds.
/// 向标准错误流记录一条错误消息，仅在调试构建中。
///
/// # Arguments
/// # 参数
///
/// * `message` - The error message string to log.
/// * `message` - 要记录的错误消息字符串。
#[cfg(debug_assertions)] // Only compile this function for debug builds
pub fn log_error(message: &str) {
    eprintln!("[SoarZip ERROR] {}", message);
}

/// Does nothing in release builds.
/// 在发布构建中不执行任何操作。
#[cfg(not(debug_assertions))] // Compile an empty function for release builds
#[inline(always)] // Hint the compiler to remove this empty function call
pub fn log_error(_message: &str) {
    // No-op in release mode / 在发布模式下为空操作
} 