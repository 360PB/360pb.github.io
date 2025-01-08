class DataManager {
    constructor() {
        this.cache = new Map();
        this.allData = [];
        this.initialized = false;
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.loadingText = document.getElementById('loading-text');
        this.dataCountDisplay = document.getElementById('data-count');
        
        // 添加初始化状态检查
        if (!this.loadingOverlay || !this.loadingText || !this.dataCountDisplay) {
            console.error('必要的 DOM 元素未找到');
            throw new Error('Required DOM elements not found');
        }
    }

    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('visible');
            this.loadingText.textContent = '正在加载数据...';
            this.dataCountDisplay.textContent = '已加载数据：0';
        }
    }

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('visible');
        }
    }

    updateLoadingStatus(message) {
        if (this.loadingText) {
            this.loadingText.textContent = message;
        }
    }

    async initialize() {
        if (this.initialized) {
            console.log('数据管理器已经初始化');
            return;
        }

        try {
            this.showLoading();
            console.log('开始初始化数据管理器...');

            // 先检查文件列表是否存在
            const listResponse = await this.checkFileExists('data/file_list.txt');
            if (!listResponse) {
                throw new Error('文件列表不存在');
            }

            const text = await listResponse.text();
            const jsonFiles = text.split('\n').filter(name => name.trim() !== '');

            console.log('找到以下数据文件:', jsonFiles);

            if (jsonFiles.length === 0) {
                throw new Error('文件列表为空');
            }

            let loadedCount = 0;
            for (const fileName of jsonFiles) {
                try {
                    console.log(`正在加载文件: data/${fileName}`);
                    const data = await this.loadFile(`data/${fileName}`);
                    if (Array.isArray(data)) {
                        this.allData.push(...data);
                        loadedCount += data.length;
                        this.updateDataCount(loadedCount);
                        console.log(`成功加载 ${data.length} 条数据从 ${fileName}`);
                    }
                } catch (error) {
                    console.error(`加载文件 ${fileName} 失败:`, error);
                    this.updateLoadingStatus(`加载文件 ${fileName} 失败: ${error.message}`);
                }
            }

            if (this.allData.length === 0) {
                throw new Error('没有成功加载任何数据');
            }

            console.log(`总共加载了 ${this.allData.length} 条数据`);
            this.initialized = true;
            this.updateLoadingStatus(`加载完成！成功加载 ${this.allData.length} 条数据`);
            
        } catch (error) {
            console.error('初始化失败:', error);
            this.updateLoadingStatus(`加载失败: ${error.message}`);
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async checkFileExists(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                console.error(`文件不存在: ${filePath}`);
                return null;
            }
            return response;
        } catch (error) {
            console.error(`检查文件存在性失败: ${filePath}`, error);
            return null;
        }
    }

    updateDataCount(count) {
        if (this.dataCountDisplay) {
            this.dataCountDisplay.textContent = `已加载数据：${count}`;
        }
    }

    async loadFile(fileName) {
        if (this.cache.has(fileName)) {
            return this.cache.get(fileName);
        }

        const response = await fetch(fileName);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const tableData = data.find(item => item.type === 'table' && item.name === 'qf_source');
        
        if (tableData && Array.isArray(tableData.data)) {
            this.cache.set(fileName, tableData.data);
            return tableData.data;
        }
        
        throw new Error(`文件 ${fileName} 的数据格式不正确`);
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
    try {
        const dataManager = new DataManager();
        window.dataManager = dataManager; // 将实例存储在全局变量中以供其他函数使用
        dataManager.initialize().catch(error => {
            console.error('DataManager 初始化失败:', error);
        });
    } catch (error) {
        console.error('创建 DataManager 实例失败:', error);
    }
    // 根据设备类型设置每页显示的卡片数量
    setDefaultItemsPerPage();    
    fetchDataAndDisplay();
    setupEventListeners();
    setupItemsPerPageSelector();
    new BubbleEffect(); // 初始化气泡效果
});
document.getElementById('data-count').classList.add('loaded');

function setDefaultItemsPerPage() {
    // 检测设备类型
    const isMobile = window.innerWidth <= 768;
    itemsPerPage = isMobile ? 6 : 15;

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

async function fetchDataAndDisplay() {
    const dataManager = new DataManager();
    try {
        console.log('开始加载数据...');
        await dataManager.initialize();
        
        if (dataManager.allData.length > 0) {
            console.log(`成功加载 ${dataManager.allData.length} 条数据`);
            originalData = dataManager.allData;
            filteredData = [...originalData];
            displayTable();
        } else {
            console.error('没有加载到任何数据');
            document.getElementById('loading-text').textContent = '未找到数据，请检查数据文件';
        }
    } catch (error) {
        console.error('获取数据时发生错误:', error);
        document.getElementById('loading-text').textContent = `加载失败: ${error.message}`;
    }
}

function setupEventListeners() {
    document.getElementById('search-input').addEventListener('input', searchTable);
    document.querySelector('.pagination').addEventListener('click', handlePaginationClick);
}

function handlePaginationClick(event) {
    if (event.target.tagName !== 'BUTTON') return;

    const resourceList = document.getElementById('resource-list');
    const listTop = resourceList.offsetTop;
    
    const buttonText = event.target.textContent;
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    let newPage = currentPage;
    
    switch(buttonText) {
        case '上一页':
            if (currentPage > 1) newPage = currentPage - 1;
            break;
        case '下一页':
            if (currentPage < totalPages) newPage = currentPage + 1;
            break;
        default:
            const pageNum = parseInt(buttonText);
            if (!isNaN(pageNum)) newPage = pageNum;
    }
    
    if (newPage !== currentPage) {
        currentPage = newPage;
        displayTable();
        window.scrollTo({
            top: listTop,
            behavior: 'smooth'
        });
    }
    
    event.preventDefault();
}

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
    const columns = ['序号', '文件名', '夸克链接', '更新时间'];
    const csvData = [columns.join(',')];

    filteredData.forEach((item, index) => {
        const updateTime = new Date(item.update_time * 1000).toLocaleString();
        const rowData = [
            index + 1,
            item.title,
            item.url,
            updateTime
        ].join(',');
        csvData.push(rowData);
    });

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

function updatePagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (totalPages <= 1) return;

    const prevButton = document.createElement('button');
    prevButton.textContent = '上一页';
    prevButton.disabled = currentPage === 1;
    pagination.appendChild(prevButton);

    const maxVisibleButtons = 3;
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + 2);

    if (endPage - startPage + 1 < maxVisibleButtons && totalPages >= maxVisibleButtons) {
        if (currentPage === totalPages) {
            startPage = totalPages - 2;
        } else if (currentPage === 1) {
            endPage = 3;
        }
    }

    startPage = Math.max(1, startPage);
    endPage = Math.min(totalPages, endPage);

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

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pagination.appendChild(pageButton);
    }

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

    const nextButton = document.createElement('button');
    nextButton.textContent = '下一页';
    nextButton.disabled = currentPage === totalPages;
    pagination.appendChild(nextButton);
}

function displayTable() {
    const resourceList = document.getElementById('resource-list');
    const fragment = document.createDocumentFragment();
    let sortedData = filteredData;

    if (!currentSort || currentSort === 'desc') {
        sortedData.sort((a, b) => b.update_time - a.update_time);
    } else if (currentSort === 'asc') {
        sortedData.sort((a, b) => a.update_time - b.update_time);
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = sortedData.slice(startIndex, endIndex);

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
        this.bubbleCount = 30;
        this.init();
    }

    init() {
        this.createBubbles();
        setInterval(() => this.checkAndReplenishBubbles(), 2000);
    }

    createBubble() {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        
        const size = Math.random() * 60 + 30;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        
        const startX = Math.random() * 100;
        bubble.style.left = `${startX}%`;
        
        const duration = Math.random() * 4 + 4;
        bubble.style.setProperty('--duration', `${duration}s`);
        
        const opacity = Math.random() * 0.6 + 0.1;
        bubble.style.setProperty('--opacity', opacity);
        
        this.container.appendChild(bubble);
        
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
