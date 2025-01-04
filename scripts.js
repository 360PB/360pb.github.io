const itemsPerPage = 14;
let currentPage = 1;
let originalData = [];
let filteredData = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchDataAndDisplay();
    setupEventListeners();
});

async function fetchDataAndDisplay() {
    try {
        const response = await fetch('qf_source.json');
        if (!response.ok) {
            throw new Error('网络响应错误');
        }
        const data = await response.json();
        const tableData = data.find(item => item.type === 'table' && item.name === 'qf_source');
        originalData = tableData.data;
        filteredData = [...originalData];
        displayTable();
    } catch (error) {
        console.error('获取数据时发生错误:', error);
    }
}

function setupEventListeners() {
    document.getElementById('search-input').addEventListener('input', searchTable);
    document.getElementById('download-button').addEventListener('click', downloadData);
    document.querySelector('.pagination').addEventListener('click', handlePaginationClick);
}

function handlePaginationClick(event) {
    if (event.target.tagName === 'BUTTON') {
        currentPage = parseInt(event.target.textContent);
        displayTable();
    }
}

function displayTable() {
    const tableBody = document.getElementById('table-body');
    const fragment = document.createDocumentFragment();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);

    pageData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.source_id}</td>
            <td>${item.title}</td>
            <td><a href="${item.url}" target="_blank">${item.url}</a></td>
        `;
        fragment.appendChild(row);
    });

    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);
    updatePagination();
}

// ... 其他函数 ...

function updatePagination() {
    const pagination = document.getElementById('pagination');
     pagination.innerHTML = '';

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const maxButtons = 5; // 最多显示的页码按钮数量，包括当前页和其周围的页码

    // 添加“上一页”按钮
    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = '上一页';
        prevButton.addEventListener('click', () => {
            currentPage = Math.max(1, currentPage - 1);
            displayTable();
        });
        pagination.appendChild(prevButton);
    }

    // 添加页码按钮
    if (currentPage > 1) { // 如果不是第一页，则显示页码 1
        const page1Button = document.createElement('button');
        page1Button.textContent = '1';
        page1Button.addEventListener('click', () => {
            currentPage = 1;
            displayTable();
        });
        pagination.appendChild(page1Button);
    }

    // 计算并添加中间的省略号和页码按钮
    const startRange = Math.max(2, currentPage - Math.floor((maxButtons - 1) / 2));
    const endRange = Math.min(totalPages - 2, currentPage + Math.floor((maxButtons - 1) / 2));

    for (let i = startRange; i <= endRange; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => {
            currentPage = i;
            displayTable();
        });
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pagination.appendChild(pageButton);
    }

    // 如果当前页不是最后几页，则添加省略号和最后几页的页码按钮
    if (currentPage < totalPages - 1) {
        const ellipsisButton = document.createElement('button');
        ellipsisButton.textContent = '...';
        ellipsisButton.disabled = true; // 禁用省略号按钮
        pagination.appendChild(ellipsisButton);

        const pageLastMinus2Button = document.createElement('button');
        pageLastMinus2Button.textContent = totalPages - 2;
        pageLastMinus2Button.addEventListener('click', () => {
            currentPage = totalPages - 2;
            displayTable();
        });
        pagination.appendChild(pageLastMinus2Button);

        const pageLastMinus1Button = document.createElement('button');
        pageLastMinus1Button.textContent = totalPages - 1;
        pageLastMinus1Button.addEventListener('click', () => {
            currentPage = totalPages - 1;
            displayTable();
        });
        pagination.appendChild(pageLastMinus1Button);

        const pageLastButton = document.createElement('button');
        pageLastButton.textContent = totalPages;
        pageLastButton.addEventListener('click', () => {
            currentPage = totalPages;
            displayTable();
        });
        pagination.appendChild(pageLastButton);
    }

    // 添加“下一页”按钮
    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.textContent = '下一页';
        nextButton.addEventListener('click', () => {
            currentPage++;
            displayTable();
        });
        pagination.appendChild(nextButton);
    }
}

// ... 其他函数 ...

function searchTable() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    filteredData = originalData.filter(item => item.title.toLowerCase().includes(searchInput));
    currentPage = 1;
    displayTable();
}

function downloadData() {
    const dataToDownload = filteredData.map(item => ({
        source_id: item.source_id,
        title: item.title,
        url: item.url
    }));

    const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filtered_data.json';
    a.click();
    URL.revokeObjectURL(url);
}