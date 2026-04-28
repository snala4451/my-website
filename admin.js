// 初始化
initParticles();
loadAdminData();

// 切换标签
function switchTab(tab) {
    // 更新导航按钮
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // 更新内容区域
    document.querySelectorAll('.admin-section').forEach(section => section.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
    
    // 刷新数据
    loadAdminData();
}

// 加载管理数据
function loadAdminData() {
    loadOverview();
    loadCards();
    loadUsers();
    loadPraise();
}

// 加载概览数据
function loadOverview() {
    const cards = JSON.parse(localStorage.getItem('cardCodes') || '[]');
    const usedCards = cards.filter(c => c.used).length;
    
    // 统计用户数（简化版，实际应该有独立的用户表）
    const totalUsers = localStorage.getItem('userToken') ? 1 : 0;
    
    // 统计夸赞数
    const praiseHistory = JSON.parse(localStorage.getItem('praiseHistory') || '[]');
    
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('totalCards').textContent = cards.length;
    document.getElementById('usedCards').textContent = usedCards;
    document.getElementById('totalPraise').textContent = praiseHistory.length;
}

// 生成卡密
function generateCards() {
    const quota = parseInt(document.getElementById('cardQuota').value);
    const count = parseInt(document.getElementById('cardCount').value);
    
    if (count < 1 || count > 100) {
        showToast('生成数量必须在1-100之间', 'error');
        return;
    }
    
    const cards = JSON.parse(localStorage.getItem('cardCodes') || '[]');
    const newCards = [];
    
    for (let i = 0; i < count; i++) {
        const code = generateCardCode();
        newCards.push({
            code: code,
            quota: quota,
            createTime: new Date().toISOString(),
            used: false,
            usedTime: null
        });
    }
    
    cards.push(...newCards);
    localStorage.setItem('cardCodes', JSON.stringify(cards));
    
    showToast(`✓ 成功生成${count}个卡密`, 'success');
    loadCards();
    loadOverview();
}

// 生成卡密代码
function generateCardCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 16; i++) {
        if (i > 0 && i % 4 === 0) code += '-';
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// 加载卡密列表
function loadCards() {
    const cards = JSON.parse(localStorage.getItem('cardCodes') || '[]');
    const cardList = document.getElementById('cardList');
    
    if (cards.length === 0) {
        cardList.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center;">暂无卡密</p>';
        return;
    }
    
    cardList.innerHTML = cards.map(card => `
        <div class="card-item">
            <div class="card-info">
                <div class="card-code">${card.code}</div>
                <div class="card-meta">
                    ${card.quota}次使用 | 创建时间：${new Date(card.createTime).toLocaleString()}
                    ${card.used ? ` | 使用时间：${new Date(card.usedTime).toLocaleString()}` : ''}
                </div>
            </div>
            <div class="card-status ${card.used ? 'used' : 'unused'}">
                ${card.used ? '已使用' : '未使用'}
            </div>
        </div>
    `).join('');
}

// 导出卡密
function exportCards() {
    const cards = JSON.parse(localStorage.getItem('cardCodes') || '[]');
    const unusedCards = cards.filter(c => !c.used);
    
    if (unusedCards.length === 0) {
        showToast('没有可导出的未使用卡密', 'error');
        return;
    }
    
    let text = '酸奶去水印工具 - 卡密列表\n';
    text += '=' .repeat(50) + '\n\n';
    
    unusedCards.forEach((card, index) => {
        text += `${index + 1}. ${card.code} (${card.quota}次)\n`;
    });
    
    text += '\n' + '='.repeat(50) + '\n';
    text += `总计：${unusedCards.length}个未使用卡密\n`;
    text += `导出时间：${new Date().toLocaleString()}\n`;
    
    // 下载文件
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `卡密列表_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('✓ 导出成功', 'success');
}

// 加载用户列表
function loadUsers() {
    const userList = document.getElementById('userList');
    
    // 简化版：只显示当前用户
    const userToken = localStorage.getItem('userToken');
    const userName = localStorage.getItem('userName');
    const quota = localStorage.getItem('parseQuota');
    const registerTime = localStorage.getItem('registerTime');
    
    if (!userToken) {
        userList.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center;">暂无用户</p>';
        return;
    }
    
    userList.innerHTML = `
        <div class="user-item">
            <div class="user-info">
                <div>
                    <div style="color: #00FFFF; font-weight: 600; margin-bottom: 5px;">
                        ${userName || '用户'}
                    </div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.6);">
                        Token: ${userToken.substring(0, 20)}... | 
                        剩余次数: ${quota} | 
                        注册时间: ${new Date(registerTime).toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 加载夸赞记录
function loadPraise() {
    const praiseHistory = JSON.parse(localStorage.getItem('praiseHistory') || '[]');
    const praiseList = document.getElementById('praiseList');
    
    if (praiseHistory.length === 0) {
        praiseList.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center;">暂无夸赞记录</p>';
        return;
    }
    
    praiseList.innerHTML = praiseHistory.map(praise => `
        <div class="praise-item">
            <div class="praise-content">
                ${Array.isArray(praise.content) ? praise.content.join('<br>') : praise.content}
            </div>
            <div class="praise-time">
                ${new Date(praise.date).toLocaleString()}
            </div>
        </div>
    `).reverse().join('');
}
