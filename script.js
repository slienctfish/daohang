// 获取DOM元素
const searchInput = document.getElementById('searchInput');
const mainContent = document.querySelector('main');

// 存储网站数据
let sites = [];

// 从JSON文件加载数据
async function loadSitesFromJson() {
    try {
        const response = await fetch('output.json');
        if (!response.ok) {
            throw new Error('无法加载书签数据');
        }
        const data = await response.json();
        processBookmarkData(data);
    } catch (error) {
        console.error('加载数据失败:', error);
        showErrorMessage('加载数据失败，请稍后重试');
    }
}

// 处理书签数据
function processBookmarkData(data) {
    sites = [];
    // 遍历每个分类
    Object.entries(data).forEach(([category, items]) => {
        items.forEach(item => {
            sites.push({
                title: item.title,
                url: item.url,
                icon: item.icon || 'default-icon.png',
                category: category
            });
        });
    });
    renderSites();
}

// 渲染网站数据
function renderSites() {
    // 按分类对网站进行分组
    const sitesByCategory = sites.reduce((acc, site) => {
        if (!acc[site.category]) {
            acc[site.category] = [];
        }
        acc[site.category].push(site);
        return acc;
    }, {});

    // 清空主内容区
    mainContent.innerHTML = '';

    // 遍历分类创建section
    Object.entries(sitesByCategory).forEach(([category, categorySites]) => {
        const section = document.createElement('section');
        section.className = 'category';
        section.dataset.category = category;

        const h2 = document.createElement('h2');
        h2.textContent = category;
        section.appendChild(h2);

        const sitesGrid = document.createElement('div');
        sitesGrid.className = 'sites-grid';

        // 创建网站卡片
        categorySites.forEach(site => {
            const card = createSiteCard(site);
            sitesGrid.appendChild(card);
        });

        section.appendChild(sitesGrid);
        mainContent.appendChild(section);
    });

    // 重新绑定搜索功能
    bindSearchFunctionality();
}

// 创建网站卡片
function createSiteCard(site) {
    const card = document.createElement('div');
    card.className = 'site-card';
    card.dataset.title = site.title;
    card.dataset.url = site.url;

    // 添加图标区域
    const iconDiv = document.createElement('div');
    iconDiv.className = 'site-icon';
    const iconImg = document.createElement('img');
    iconImg.src = site.icon_base64 || 'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=' + site.url + '&size=32';
    iconImg.onerror = () => {
        iconImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSI2IiBmaWxsPSIjRTJFOEYwIi8+PHBhdGggZD0iTTE2IDE2QzE2IDE0LjkgMTYuOSAxNCAxOCAxNEMyMC4yMSAxNCAyMiAxNS43OSAyMiAxOEMyMiAyMC4yMSAyMC4yMSAyMiAxOCAyMkMxNS43OSAyMiAxNCAyMC4yMSAxNCAxOEMxNCAxNi45IDE0LjkgMTYgMTYgMTZaIiBmaWxsPSIjOTRBM0IzIi8+PC9zdmc+';
    };
    iconDiv.appendChild(iconImg);
    card.appendChild(iconDiv);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'site-info';
    const h3 = document.createElement('h3');
    h3.textContent = site.title;
    const p = document.createElement('p');
    p.textContent = site.description || site.title;
    infoDiv.appendChild(h3);
    infoDiv.appendChild(p);

    card.appendChild(infoDiv);

    // 添加点击事件
    card.addEventListener('click', () => {
        if (site.url) {
            window.open(site.url, '_blank');
        }
    });

    return card;
}

// 绑定搜索功能
function bindSearchFunctionality() {
    const siteCards = document.querySelectorAll('.site-card');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        let firstMatchCategory = null;
        let hasVisibleCard = false;

        // 重置所有分类的可见性
        document.querySelectorAll('.category').forEach(section => {
            section.style.display = 'block';
        });

        // 搜索卡片并记录第一个匹配的分类
        siteCards.forEach(card => {
            const title = card.dataset.title.toLowerCase();
            const description = card.querySelector('p').textContent.toLowerCase();
            const isVisible = title.includes(searchTerm) || description.includes(searchTerm);
            card.style.display = isVisible ? 'flex' : 'none';

            if (isVisible && !hasVisibleCard) {
                hasVisibleCard = true;
                const categorySection = card.closest('.category');
                if (categorySection) {
                    firstMatchCategory = categorySection.dataset.category;
                }
            }
        });

        // 隐藏没有匹配结果的分类
        document.querySelectorAll('.category').forEach(section => {
            const hasVisibleCards = Array.from(section.querySelectorAll('.site-card')).some(card => 
                card.style.display !== 'none'
            );
            section.style.display = hasVisibleCards ? 'block' : 'none';
        });

        // 更新导航栏高亮状态
        if (firstMatchCategory) {
            updateActiveNavItem(firstMatchCategory);
            // 滚动到第一个匹配的分类
            const firstMatchSection = document.querySelector(`section[data-category="${firstMatchCategory}"]`);
            if (firstMatchSection) {
                firstMatchSection.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            // 如果没有匹配结果，清除所有高亮
            document.querySelectorAll('#categoryNav li').forEach(item => {
                item.classList.remove('active');
            });
        }
    });
}

// 显示错误信息
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    mainContent.insertBefore(errorDiv, mainContent.firstChild);

    // 3秒后自动移除错误信息
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// 渲染导航栏
// 渲染导航菜单
function renderNavigation() {
    const navList = document.getElementById('categoryNav');
    const categories = [...new Set(sites.map(site => site.category))];
    
    navList.innerHTML = categories.map(category => `
        <li data-category="${category}">${category}</li>
    `).join('');

    // 添加点击事件
    navList.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', () => {
            // 移除所有active类
            navList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
            // 添加active类到当前项
            li.classList.add('active');
            // 滚动到对应section
            const section = document.querySelector(`section[data-category="${li.dataset.category}"]`);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// 在processBookmarkData函数中调用renderNavigation
function processBookmarkData(data) {
    sites = [];
    // 遍历每个分类
    Object.entries(data).forEach(([category, items]) => {
        items.forEach(item => {
            sites.push({
                title: item.title,
                url: item.url,
                icon: item.icon || 'default-icon.png',
                category: category
            });
        });
    });
    renderSites();
    renderNavigation();
}

// 添加滚动监听，实时更新导航栏高亮状态
window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY + 100; // 添加偏移量以提前触发高亮
    const sections = document.querySelectorAll('.category');
    
    let currentCategory = '';
    sections.forEach(section => {
        if (section.offsetTop <= scrollPosition && 
            section.offsetTop + section.offsetHeight > scrollPosition) {
            currentCategory = section.dataset.category;
        }
    });
    
    if (currentCategory) {
        updateActiveNavItem(currentCategory);
    }
});

// 更新导航栏活动项
// 更新导航栏高亮状态
function updateActiveNavItem(category) {
    const navItems = document.querySelectorAll('#categoryNav li');
    navItems.forEach(item => {
        if (item.dataset.category === category) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    loadSitesFromJson();
    // 加载完数据后渲染导航
    renderSites();
    renderNavigation();
});