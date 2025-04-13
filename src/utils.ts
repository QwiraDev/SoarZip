/**
 * 格式化文件大小
 * @param size 文件大小（字节）
 * @returns 格式化后的文件大小字符串
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
   * 格式化日期
   * @param dateString 日期字符串
   * @returns 格式化后的日期字符串
   */
  export function formatDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      // 特殊处理"未知"日期
      if (dateString === '未知') {
        return '未知';
      }
      
      // 7-zip 返回的日期格式形如：YYYY-MM-DD HH:MM:SS
      // 尝试直接解析或进行必要的转换
      const date = new Date(dateString);
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        return dateString; // 如果解析失败，返回原始字符串
      }
      
      // 格式化为 YYYY-MM-DD HH:MM
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (error) {
      console.error('日期格式化错误:', error);
      return dateString;
    }
  } 