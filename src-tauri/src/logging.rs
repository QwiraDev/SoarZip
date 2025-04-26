//! Logging utilities for SoarZip.
//! SoarZip 的日志记录工具。

/// Logs an informational message to the console.
/// 向控制台记录一条信息性消息。
///
/// # Arguments
/// # 参数
///
/// * `message` - The message string to log.
/// * `message` - 要记录的消息字符串。
pub fn log_info(message: &str) {
    println!("[SoarZip INFO] {}", message);
}

/// Logs an error message to the standard error stream.
/// 向标准错误流记录一条错误消息。
///
/// # Arguments
/// # 参数
///
/// * `message` - The error message string to log.
/// * `message` - 要记录的错误消息字符串。
pub fn log_error(message: &str) {
    eprintln!("[SoarZip ERROR] {}", message);
} 