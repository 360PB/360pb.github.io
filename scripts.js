class DataManager {
    constructor() {
        this.cache = new Map();
        this.allData = [];
        this.initialized = false;
        this.loadingOverlay = document.getElementById('loading-overlay'); // 加载遮罩层
        this.loadingText = document.getElementById('loading-text');     // 加载进度文本
    }

    // 显示加载遮罩层
    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('visible');
        }
    }

    // 隐藏加载遮罩层
    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('visible');
        }
    }

    // 更新加载进度
    updateLoadingProgress(current, total) {
        if (this.loadingText) {
            const percentage = Math.round((current / total) * 100);
            this.loadingText.textContent = `正在加载数据... ${percentage}%`;
        }
    }

    async initialize() {
		if (this.initialized) return;
	
		try {
			this.showLoading();
	
			// 加载 data/file_list.json 文件
			const response = await fetch('data/file_list.json');
			if (!response.ok) throw new Error('无法加载文件列表');
			const jsonFiles = await response.json();
	
			// 加载所有 JSON 文件
			let loadedFiles = 0;
			for (const fileName of jsonFiles) {
				const data = await this.loadFile(`data/${fileName}`);
				this.allData.push(...data);
	
				loadedFiles++;
				this.updateLoadingProgress(loadedFiles, jsonFiles.length);
			}
	
			this.initialized = true;
			this.hideLoading();
		} catch (error) {
			console.error('初始化失败:', error);
			if (this.loadingText) {
				this.loadingText.textContent = '加载失败，请刷新页面重试';
			}
			throw error;
		}
	}


    async loadFile(fileName) {
        if (this.cache.has(fileName)) {
            return this.cache.get(fileName);
        }

        try {
            const response = await fetch(`data/${fileName}`);
            if (!response.ok) throw new Error(`Failed to load file ${fileName}`);
            const data = await response.json();
            this.cache.set(fileName, data);
            return data;
        } catch (error) {
            console.error(`加载文件 ${fileName} 失败:`, error);
            return [];
        }
    }

    async getPageData(page, itemsPerPage, filter = 'all') {
        await this.initialize();

        let filteredData = this.allData;
        if (filter !== 'all') {
            filteredData = this.allData.filter(item =>
                item.source_category_id.toString() === filter
            );
        }

        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        return filteredData.slice(startIndex, endIndex);
    }

    async search(keyword) {
        await this.initialize();

        return this.allData.filter(item =>
            item.title.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    async getTotalItems(filter = 'all') {
        await this.initialize();

        if (filter === 'all') {
            return this.allData.length;
        }

        return this.allData.filter(item =>
            item.source_category_id.toString() === filter
        ).length;
    }
}

// 全局变量
let itemsPerPage = 15; // 默认每页显示的卡片数量（PC端）
let currentPage = 1;
let originalData = [];
let filteredData = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    // 根据设备类型设置每页显示的卡片数量
    setDefaultItemsPerPage();

    fetchDataAndDisplay();
    setupEventListeners();
    setupItemsPerPageSelector();
    new BubbleEffect(); // 初始化气泡效果
});

function setDefaultItemsPerPage() {
    // 检测设备类型
    const isMobile = window.innerWidth <= 768; // 判断屏幕宽度是否小于等于768px
    itemsPerPage = isMobile ? 6 : 15; // 手机端默认6个，PC端默认12个

    // 同步更新下拉框的默认选项
    const itemsPerPageSelect = document.getElementById('items-per-page-select');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.value = itemsPerPage;
    }
}

function setupItemsPerPageSelector() {
    const itemsPerPageSelect = document.getElementById('items-per-page-select');
    itemsPerPageSelect.addEventListener('change', (event) => {
        itemsPerPage = parseInt(event.target.value, 10);
        currentPage = 1; // 重置到第一页
        displayTable();
    });
}

// 修改 fetchDataAndDisplay 函数
async function fetchDataAndDisplay() {
    const dataManager = new DataManager();
    try {
        await dataManager.initialize();
        if (dataManager.allData.length > 0) {
            originalData = dataManager.allData;
            filteredData = [...originalData];
            displayTable();
        } else {
            console.error('没有加载到任何数据');
            document.getElementById('loading-text').textContent = '未找到数据，请检查数据文件';
        }
    } catch (error) {
        console.error('获取数据时发生错误:', error);
        document.getElementById('loading-text').textContent = '加载失败，请刷新页面重试';
    }
}

function setupEventListeners() {
    document.getElementById('search-input').addEventListener('input', searchTable);
    document.querySelector('.pagination').addEventListener('click', handlePaginationClick);
}

// 移除重复的事件监听代码，保留一个统一的处理函数
function handlePaginationClick(event) {
    if (event.target.tagName !== 'BUTTON') return;

    // 记住当前的滚动位置
    const resourceList = document.getElementById('resource-list');
    const listTop = resourceList.offsetTop;

    const buttonText = event.target.textContent;
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    let newPage = currentPage;

    switch (buttonText) {
        case '上一页':
            if (currentPage > 1) {
                newPage = currentPage - 1;
            }
            break;
        case '下一页':
            if (currentPage < totalPages) {
                newPage = currentPage + 1;
            }
            break;
        default:
            const pageNum = parseInt(buttonText);
            if (!isNaN(pageNum)) {
                newPage = pageNum;
            }
    }

    if (newPage !== currentPage) {
        currentPage = newPage;
        displayTable();
        // 滚动到资源列表的顶部位置
        window.scrollTo({
            top: listTop,
            behavior: 'smooth' // 使用平滑滚动
        });
    }

    event.preventDefault(); // 阻止默认行为
}

// 添加排序功能
let currentSort = 'desc'; // 默认降序

function sortTable(ascending) {
    currentSort = ascending ? 'asc' : 'desc';
    filteredData.sort((a, b) => {
        return ascending ? a.update_time - b.update_time : b.update_time - a.update_time;
    });
    currentPage = 1;
    displayTable();
}

function searchTable() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    filteredData = originalData.filter(item => item.title.toLowerCase().includes(searchInput));
    currentPage = 1;
    displayTable();
}

function downloadData() {
    // 定义CSV列标题
    const columns = ['序号', '文件名', '夸克链接', '更新时间'];
    // 将列标题转换为CSV格式
    const csvData = [columns.join(',')];

    // 将数据添加到CSV
    filteredData.forEach((item, index) => {
        const updateTime = new Date(item.update_time * 1000).toLocaleString();
        const rowData = [
            index + 1, // 序号从1开始
            item.title,
            item.url,
            updateTime
        ].join(',');
        csvData.push(rowData);
    });

    // 创建CSV文件并下载
    const blob = new Blob([csvData.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resource_data-panhub.fun.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function downloadLinks() {
    const links = filteredData.map(item => item.url).join('\n');
    const blob = new Blob([links], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'download_links-panhub.fun.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function filterSelection(filter) {
    currentFilter = filter;
    if (filter === 'all') {
        filteredData = [...originalData];
    } else {
        filteredData = originalData.filter(item => item.source_category_id.toString() === filter);
    }
    currentPage = 1;
    displayTable();
    updateFilterButtons();
}

function updateFilterButtons() {
    const filters = document.querySelectorAll('.filters button');
    filters.forEach(filter => {
        filter.classList.remove('active');
        if (filter.textContent.trim() === currentFilter) {
            filter.classList.add('active');
        }
    });
}

// 更新分页逻辑以保持最初的显示
function updatePagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    if (totalPages <= 1) return; // 如果只有一页，不显示分页

    // 添加"上一页"按钮
    const prevButton = document.createElement('button');
    prevButton.textContent = '上一页';
    prevButton.disabled = currentPage === 1;
    pagination.appendChild(prevButton);

    // 计算要显示的页码范围
    const maxVisibleButtons = 3;
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + 2);

    // 调整起始页码，确保始终显示3个页码（如果总页数足够）
    if (endPage - startPage + 1 < maxVisibleButtons && totalPages >= maxVisibleButtons) {
        if (currentPage === totalPages) {
            startPage = totalPages - 2;
        } else if (currentPage === 1) {
            endPage = 3;
        }
    }

    // 确保页码范围有效
    startPage = Math.max(1, startPage);
    endPage = Math.min(totalPages, endPage);

    // 显示第一页和省略号
    if (startPage > 1) {
        const firstButton = document.createElement('button');
        firstButton.textContent = '1';
        pagination.appendChild(firstButton);

        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'ellipsis';
            pagination.appendChild(ellipsis);
        }
    }

    // 添加页码按钮
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pagination.appendChild(pageButton);
    }

    // 显示最后一页和省略号
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'ellipsis';
            pagination.appendChild(ellipsis);
        }

        const lastButton = document.createElement('button');
        lastButton.textContent = totalPages;
        pagination.appendChild(lastButton);
    }

    // 添加"下一页"按钮
    const nextButton = document.createElement('button');
    nextButton.textContent = '下一页';
    nextButton.disabled = currentPage === totalPages;
    pagination.appendChild(nextButton);

    // 移除所有已存在的点击事件监听器
    pagination.querySelectorAll('button').forEach(button => {
        button.removeEventListener('click', handlePaginationClick);
    });
}

function displayTable() {
    const resourceList = document.getElementById('resource-list');
    const fragment = document.createDocumentFragment();
    let sortedData = filteredData;

    // 默认按更新时间降序排序
    if (!currentSort || currentSort === 'desc') {
        sortedData.sort((a, b) => b.update_time - a.update_time);
    } else if (currentSort === 'asc') {
        sortedData.sort((a, b) => a.update_time - b.update_time);
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = sortedData.slice(startIndex, endIndex);

    console.log(`Displaying page ${currentPage} with items ${startIndex} to ${endIndex - 1}`);

    pageData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'resource-card';
        const updateTime = new Date(item.update_time * 1000).toLocaleString();
        card.innerHTML = `
            <h3>${item.title}</h3>
            <p class="update-time">更新时间: ${updateTime}</p>
            <a href="${item.url}" class="source-link" target="_blank">立即访问</a>
        `;
        fragment.appendChild(card);
    });

    resourceList.innerHTML = '';
    resourceList.appendChild(fragment);
    updatePagination();
}

class BubbleEffect {
    constructor() {
        this.container = document.getElementById('bubbles-container');
        this.bubbleCount = 30; // 增加气泡数量
        this.init();
    }

    init() {
        // 初始化时创建气泡
        this.createBubbles();
        // 定期检查和补充气泡
        setInterval(() => this.checkAndReplenishBubbles(), 2000);
    }

    createBubble() {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';

        // 增加气泡大小 (30-90px)
        const size = Math.random() * 60 + 30;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;

        // 随机位置
        const startX = Math.random() * 100;
        bubble.style.left = `${startX}%`;

        // 随机动画持续时间 (4-8秒)
        const duration = Math.random() * 4 + 4;
        bubble.style.setProperty('--duration', `${duration}s`);

        // 随机透明度 (0.1-0.7)
        const opacity = Math.random() * 0.6 + 0.1;
        bubble.style.setProperty('--opacity', opacity);

        // 添加到容器
        this.container.appendChild(bubble);

        // 动画结束后移除气泡
        bubble.addEventListener('animationend', () => {
            bubble.remove();
        });

        return bubble;
    }

    createBubbles() {
        for (let i = 0; i < this.bubbleCount; i++) {
            this.createBubble();
        }
    }

    checkAndReplenishBubbles() {
        const currentBubbles = this.container.getElementsByClassName('bubble').length;
        const bubblesNeeded = this.bubbleCount - currentBubbles;

        if (bubblesNeeded > 0) {
            for (let i = 0; i < bubblesNeeded; i++) {
                this.createBubble();
            }
        }
    }
}
