/**
 * Utility functions module
 * 工具函数模块
 */

/**
 * Format file size with appropriate units
 * 格式化文件大小
 * 
 * @param size - File size in bytes
 *             - 文件大小（字节）
 * @returns Formatted file size string
 *          - 格式化后的文件大小字符串
 */
export function formatFileSize(size: number): string {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else if (size < 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  }
  
/**
 * Format date string to a standardized format
 * 格式化日期
 * 
 * @param dateString - Date string to format
 *                   - 需要格式化的日期字符串
 * @returns - Formatted date string
 *          - 格式化后的日期字符串
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    // Special handling for "unknown" date
    if (dateString === '未知') {
      return '未知';
    }
    
    // 7-zip returns dates in format: YYYY-MM-DD HH:MM:SS
    // Try to parse directly or do necessary conversion
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // If parsing fails, return original string
    }
    
    // Format as YYYY-MM-DD HH:MM
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
} 