const itemsPerPage = 14;
let currentPage = 1;
let originalData = [];
let filteredData = [];
let currentFilter = 'all';

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

function filterSelection(filter) {
    currentFilter = filter;
    if (filter === 'all') {
        filteredData = [...originalData];
    } else {
        filteredData = originalData.filter(item => item.source_category_id === filter);
    }
    currentPage = 1;
    displayTable();
    updateFilterButtons();
}

function updateFilterButtons() {
    const filters = document.querySelectorAll('.filters button');
    filters.forEach(filter => {
        filter.classList.remove('active');
        if (filter.textContent === currentFilter) {
            filter.classList.add('active');
        }
    });
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

function updatePagination() {
    const pagination = document.getElementById('pagination');
     pagination.innerHTML = '';

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = '上一页';
        prevButton.addEventListener('click', () => {
            currentPage--;
            displayTable();
        });
        pagination.appendChild(prevButton);
    }

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.addEventListener('click', () => {
            currentPage = i;
            displayTable();
        });
        if (i === currentPage) {
            button.classList.add('active');
        }
        pagination.appendChild(button);
    }

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