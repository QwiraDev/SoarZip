import { FileItem } from "./fileService";

/**
 * Holds the path of the currently opened archive file.
 * 保存当前打开的压缩包文件的路径。
 */
let currentArchivePath = "";

/**
 * Cache of the file list extracted from the current archive.
 * 从当前压缩包提取的文件列表缓存。
 */
let currentFiles: FileItem[] = [];

/**
 * Indicates whether the application is currently in a loading state (e.g., opening archive, extracting).
 * 指示应用程序当前是否处于加载状态（例如，打开压缩包、解压）。
 */
let isLoading = false;

/**
 * Gets the path of the currently opened archive.
 * 获取当前打开的压缩包的路径。
 * 
 * @returns - The archive path, or an empty string if no archive is open.
 *          - 压缩包路径，如果未打开压缩包则为空字符串。
 */
export function getCurrentArchivePath(): string {
  return currentArchivePath;
}

/**
 * Sets the path of the currently opened archive.
 * 设置当前打开的压缩包的路径。
 * 
 * @param path - The new archive path.
 *             - 新的压缩包路径。
 */
export function setCurrentArchivePath(path: string): void {
  currentArchivePath = path;
}

/**
 * Gets the cached list of files from the currently opened archive.
 * 获取当前打开的压缩包中的缓存文件列表。
 * 
 * @returns - An array of FileItem objects.
 *          - FileItem 对象数组。
 */
export function getCurrentFiles(): FileItem[] {
  return currentFiles;
}

/**
 * Sets the cached list of files from the archive.
 * 设置来自压缩包的缓存文件列表。
 * 
 * @param files - The array of FileItem objects.
 *              - FileItem 对象数组。
 */
export function setCurrentFiles(files: FileItem[]): void {
  currentFiles = files;
}

/**
 * Gets the current loading state of the application.
 * 获取应用程序的当前加载状态。
 * 
 * @returns - True if the application is loading, false otherwise.
 *          - 如果应用程序正在加载则为 true，否则为 false。
 */
export function getIsLoading(): boolean {
  return isLoading;
}

/**
 * Sets the loading state of the application.
 * 设置应用程序的加载状态。
 * 
 * @param loading - The new loading state.
 *                - 新的加载状态。
 */
export function setIsLoading(loading: boolean): void {
  isLoading = loading;
}

/**
 * Resets the application state to its initial values (no archive open).
 * 将应用程序状态重置为其初始值（没有打开的压缩包）。
 */
export function resetAppState(): void {
  currentArchivePath = "";
  currentFiles = [];
  isLoading = false; // Ensure loading is also reset
} 