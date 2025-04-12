import { invoke } from "@tauri-apps/api/core";

// 窗口控制功能
function setupWindowControls() {
  const minimizeBtn = document.getElementById('minimize-btn');
  const maximizeBtn = document.getElementById('maximize-btn');
  const closeBtn = document.getElementById('close-btn');

  minimizeBtn?.addEventListener('click', async () => {
    await invoke('minimize_window');
  });

  maximizeBtn?.addEventListener('click', async () => {
    await invoke('maximize_window');
  });

  closeBtn?.addEventListener('click', async () => {
    await invoke('close_window');
  });
}

// 菜单点击处理
function setupMenuItems() {
  // 处理主菜单按钮点击 - 显示/隐藏下拉菜单
  const menuContainers = document.querySelectorAll('.menu-container');
  const menuItems = document.querySelectorAll('.menu-item');
  
  menuItems.forEach(menuItem => {
    menuItem.addEventListener('click', (e) => {
      e.stopPropagation(); // 防止事件冒泡
      
      // 关闭所有其他打开的菜单
      menuContainers.forEach(container => {
        if (container !== menuItem.parentElement) {
          container.querySelector('.dropdown-menu')?.classList.remove('show');
        }
      });
      
      // 切换当前菜单的显示状态
      const dropdown = menuItem.parentElement?.querySelector('.dropdown-menu');
      dropdown?.classList.toggle('show');
    });
  });
  
  // 处理下拉菜单项点击
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  
  dropdownItems.forEach(item => {
    item.addEventListener('click', (e) => {
      // 阻止冒泡防止触发父元素事件
      e.stopPropagation();
      
      const itemText = (item as HTMLElement).textContent;
      console.log(`菜单项 ${itemText} 被点击`);
      
      // 关闭当前打开的下拉菜单
      const dropdown = item.closest('.dropdown-menu');
      dropdown?.classList.remove('show');
      
      // 这里可以根据不同的菜单项添加相应的处理逻辑
      // 例如：打开文件、保存、设置等
    });
  });
  
  // 点击页面其他部分关闭所有下拉菜单
  document.addEventListener('click', () => {
    const dropdowns = document.querySelectorAll('.dropdown-menu');
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('show');
    });
  });
}

// 搜索功能设置
function setupSearch() {
  const searchInput = document.querySelector('.search-input');
  const searchBtn = document.querySelector('.search-btn');
  
  // 搜索按钮点击
  searchBtn?.addEventListener('click', () => {
    const searchText = (searchInput as HTMLInputElement)?.value;
    if (searchText) {
      console.log(`搜索: ${searchText}`);
      // 实现搜索逻辑
      performSearch(searchText);
    }
  });
  
  // 按下回车键时也触发搜索
  searchInput?.addEventListener('keypress', (e: Event) => {
    if ((e as KeyboardEvent).key === 'Enter') {
      const searchText = (searchInput as HTMLInputElement)?.value;
      if (searchText) {
        console.log(`搜索: ${searchText}`);
        // 实现搜索逻辑
        performSearch(searchText);
      }
    }
  });
}

// 执行搜索的函数
function performSearch(query: string) {
  // 这里实现具体的搜索逻辑
  // 例如：在文件列表中过滤匹配的文件名
  // 或者调用后端的搜索API
  
  // 示例：简单的前端过滤
  const fileItems = document.querySelectorAll('.file-item');
  let matchCount = 0;
  
  fileItems.forEach(item => {
    const fileName = item.querySelector('.file-name span')?.textContent;
    if (fileName && fileName.toLowerCase().includes(query.toLowerCase())) {
      (item as HTMLElement).style.display = 'flex';
      matchCount++;
    } else {
      (item as HTMLElement).style.display = 'none';
    }
  });
  
  // 更新状态栏
  const statusLeft = document.querySelector('.status-left');
  if (statusLeft) {
    statusLeft.textContent = `找到 ${matchCount} 个匹配项`;
  }
}

// 导航按钮处理
function setupNavButtons() {
  const backBtn = document.querySelector('.nav-btn[title="后退"]');
  const forwardBtn = document.querySelector('.nav-btn[title="前进"]');
  const upBtn = document.querySelector('.nav-btn[title="上一级"]');
  const refreshBtn = document.querySelector('.nav-btn[title="刷新"]');
  
  // 后退按钮点击
  backBtn?.addEventListener('click', () => {
    console.log('导航后退');
    // 实现导航历史后退逻辑
  });
  
  // 前进按钮点击
  forwardBtn?.addEventListener('click', () => {
    console.log('导航前进');
    // 实现导航历史前进逻辑
  });
  
  // 上一级按钮点击
  upBtn?.addEventListener('click', () => {
    console.log('导航到上一级');
    // 实现导航到上一级目录逻辑
  });
  
  // 刷新按钮点击
  refreshBtn?.addEventListener('click', () => {
    console.log('刷新当前目录');
    // 实现刷新当前目录逻辑
  });
}

// 面包屑导航点击处理
function setupPathNavigation() {
  const pathItems = document.querySelectorAll('.path-item');
  
  pathItems.forEach(item => {
    item.addEventListener('click', () => {
      // 获取导航路径文本
      const pathText = item.textContent?.trim();
      console.log(`导航到路径: ${pathText}`);
      // 实现导航到特定路径逻辑
    });
  });
}

// 工具栏按钮处理
function setupToolbarButtons() {
  const toolButtons = document.querySelectorAll('.tool-btn');
  
  toolButtons.forEach(button => {
    button.addEventListener('click', () => {
      const title = button.getAttribute('title');
      console.log(`工具按钮 ${title} 被点击`);
      
      // 根据不同按钮执行不同操作
      switch(title) {
        case '添加文件':
          // 添加文件逻辑
          break;
        case '提取文件':
          // 提取文件逻辑
          break;
        case '剪切':
          // 剪切逻辑
          break;
        case '复制':
          // 复制逻辑
          break;
        case '粘贴':
          // 粘贴逻辑
          break;
        case '重命名':
          // 重命名逻辑
          break;
        case '移动':
          // 移动逻辑
          break;
        case '删除':
          // 删除逻辑
          break;
        case '新建文件夹':
          // 新建文件夹逻辑
          break;
        case '属性':
          // 显示属性逻辑
          break;
      }
    });
  });
}

// 文件项点击处理
function setupFileItems() {
  const fileItems = document.querySelectorAll('.file-item');
  
  fileItems.forEach(item => {
    item.addEventListener('click', () => {
      // 清除所有选中状态
      fileItems.forEach(i => i.classList.remove('selected'));
      // 添加选中状态
      item.classList.add('selected');
      
      // 获取文件名
      const fileName = item.querySelector('.file-name span')?.textContent;
      console.log(`文件 ${fileName} 被选中`);
    });
    
    item.addEventListener('dblclick', () => {
      const fileName = item.querySelector('.file-name span')?.textContent;
      console.log(`文件 ${fileName} 被双击`);
      // 这里可以添加打开文件的逻辑
    });
  });
}

// 初始化
window.addEventListener("DOMContentLoaded", () => {
  // 设置窗口控制
  setupWindowControls();
  
  // 设置菜单项
  setupMenuItems();
  
  // 设置搜索功能
  setupSearch();
  
  // 设置导航按钮
  setupNavButtons();
  
  // 设置路径导航
  setupPathNavigation();
  
  // 设置工具栏按钮
  setupToolbarButtons();
  
  // 设置文件项
  setupFileItems();
});
