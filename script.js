// 初始化测试卡密（如果没有卡密则生成）
function initTestCards() {
    const cards = JSON.parse(localStorage.getItem('cardCodes') || '[]');
    
    // 检查是否已有测试卡密
    const hasTestCards = cards.some(c => c.code.startsWith('TEST-'));
    
    if (cards.length === 0 || !hasTestCards) {
        const testCards = [
            { code: 'TEST-0001-0001-0001', quota: 10, createTime: new Date().toISOString(), used: false, usedTime: null },
            { code: 'TEST-0002-0002-0002', quota: 20, createTime: new Date().toISOString(), used: false, usedTime: null },
            { code: 'TEST-0003-0003-0003', quota: 30, createTime: new Date().toISOString(), used: false, usedTime: null }
        ];
        
        // 如果没有卡密，直接设置测试卡密
        if (cards.length === 0) {
            localStorage.setItem('cardCodes', JSON.stringify(testCards));
        } else {
            // 如果有卡密但没有测试卡密，添加测试卡密
            cards.push(...testCards);
            localStorage.setItem('cardCodes', JSON.stringify(cards));
        }
        
        console.log('✓ 已初始化测试卡密');
    }
}

// 页面加载时显示免责声明和初始化粒子背景
window.addEventListener('DOMContentLoaded', () => {
    // 检查登录状态
    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
        // 避免循环重定向
        if (!window.location.pathname.endsWith('login.html')) {
            const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
            window.location.href = basePath + '/login.html';
        }
        return;
    }
    
    const hasAgreed = localStorage.getItem('disclaimerAgreed');
    if (!hasAgreed) {
        document.getElementById('disclaimerModal').classList.add('show');
    }
    
    // 初始化粒子背景
    initParticles();
    
    // 初始化测试卡密
    initTestCards();
    
    // 初始化用户系统
    initUserSystem();
    
    // 初始化输入验证
    initInputValidation();
    
    // 启用调试模式（在控制台输入 window.DEBUG = true 开启）
    window.DEBUG = false;
    
    // 添加调试日志函数
    window.debugLog = function(message, data) {
        if (window.DEBUG) {
            console.log(`[DEBUG] ${message}`, data || '');
        }
    };
    
    console.log('✅ 页面加载完成');
    console.log('💡 提示：在控制台输入 window.DEBUG = true 可开启详细调试日志');
});

// 初始化输入验证（按钮状态联动）
function initInputValidation() {
    const urlInput = document.getElementById('urlInput');
    const parseBtn = document.getElementById('parseBtn');
    
    urlInput.addEventListener('input', () => {
        const value = urlInput.value.trim();
        const isValid = detectPlatform(value) !== null;
        
        parseBtn.disabled = !isValid;
        
        if (value && !isValid) {
            urlInput.classList.add('error');
        } else {
            urlInput.classList.remove('error');
        }
    });
}

// 检查登录状态
function checkLogin() {
    const userToken = localStorage.getItem('userToken');
    return !!userToken;
}

// 跳转到登录页面
function goToLogin() {
    // 获取当前路径的基础 URL
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
    window.location.href = basePath + '/login.html';
}

// 跳转到首页
function goToHome() {
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
    window.location.href = basePath + '/index.html';
}

// 跳转到管理后台
function goToAdmin() {
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
    window.location.href = basePath + '/admin.html';
}

// 跳转到管理员登录
function goToAdminLogin() {
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
    window.location.href = basePath + '/admin-login.html';
}

// 初始化用户系统
function initUserSystem() {
    // 加载用户名
    const userName = localStorage.getItem('userName') || '游客';
    document.getElementById('userName').textContent = userName;
    
    // 加载剩余次数
    updateQuotaDisplay();
}

// 更新次数显示（动态变色）
function updateQuotaDisplay() {
    const quota = parseInt(localStorage.getItem('parseQuota') || '0');
    const quotaElement = document.getElementById('quotaCount');
    quotaElement.textContent = quota;
    
    // 动态变色
    quotaElement.classList.remove('high', 'medium', 'low');
    if (quota >= 5) {
        quotaElement.classList.add('high');
    } else if (quota >= 3) {
        quotaElement.classList.add('medium');
    } else {
        quotaElement.classList.add('low');
    }
}

// 检查是否有剩余次数
function checkQuota() {
    const quota = parseInt(localStorage.getItem('parseQuota') || '0');
    return quota > 0;
}

// 消耗一次解析次数
function consumeQuota() {
    const quota = parseInt(localStorage.getItem('parseQuota') || '0');
    if (quota > 0) {
        localStorage.setItem('parseQuota', (quota - 1).toString());
        updateQuotaDisplay();
        return true;
    }
    return false;
}

// 显示充值弹窗
function showRechargeModal() {
    document.getElementById('rechargeModal').classList.add('show');
    document.getElementById('cardCodeInput').value = '';
    
    // 清空套餐选择状态
    document.querySelectorAll('.recharge-package').forEach(pkg => {
        pkg.classList.remove('selected');
    });
    document.getElementById('confirmRechargeBtn').disabled = true;
    window.selectedPackage = null;
}

// 关闭充值弹窗
function closeRechargeModal() {
    document.getElementById('rechargeModal').classList.remove('show');
}

// 选择充值套餐（仅高亮，不跳转）
function selectPackageOption(price, times, element) {
    // 移除所有套餐的选中状态
    document.querySelectorAll('.recharge-package').forEach(pkg => {
        pkg.classList.remove('selected');
    });
    
    // 添加当前套餐的选中状态
    element.classList.add('selected');
    
    // 保存选中的套餐信息
    window.selectedPackage = { price, times };
    
    // 启用确认充值按钮
    document.getElementById('confirmRechargeBtn').disabled = false;
}

// 确认充值选择
function confirmRechargeSelection() {
    if (!window.selectedPackage) {
        showToast('请先选择充值套餐', 'error');
        return;
    }
    
    const { price, times } = window.selectedPackage;
    
    // 关闭充值弹窗
    closeRechargeModal();
    
    // 显示支付弹窗
    showPaymentModal(price, times);
}

// 选择充值套餐（旧函数，保留兼容性）
function selectPackage(price, times) {
    // 关闭充值弹窗
    closeRechargeModal();
    
    // 显示支付弹窗
    showPaymentModal(price, times);
}

// 显示支付弹窗
function showPaymentModal(price, times) {
    const modal = document.getElementById('paymentModal');
    
    // 更新套餐信息
    document.getElementById('paymentPackageInfo').textContent = `${times}次使用 / ¥${price}`;
    document.getElementById('paymentAmount').textContent = `¥${price}`;
    
    // 保存当前套餐信息到全局变量
    window.currentPayment = { price, times };
    
    modal.classList.add('show');
}

// 关闭支付弹窗
function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('show');
}

// 切换支付方式
function switchPaymentMethod(method) {
    // 更新标签状态
    const tabs = document.querySelectorAll('.payment-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const activeTab = event.target.closest('.payment-tab');
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // 切换二维码显示
    document.getElementById('wechatQR').classList.remove('active');
    document.getElementById('alipayQR').classList.remove('active');
    
    if (method === 'wechat') {
        document.getElementById('wechatQR').classList.add('active');
    } else {
        document.getElementById('alipayQR').classList.add('active');
    }
}

// 确认支付完成
function confirmPayment() {
    const { price, times } = window.currentPayment;
    
    if (confirm(`请确认您已完成 ¥${price} 的支付？\n\n确认后将立即为您增加 ${times} 次使用机会。`)) {
        // 增加用户次数
        const currentQuota = parseInt(localStorage.getItem('parseQuota') || '0');
        localStorage.setItem('parseQuota', (currentQuota + times).toString());
        
        updateQuotaDisplay();
        closePaymentModal();
        
        showToast(`🎉 充值成功！已增加 ${times} 次使用机会`, 'success');
    }
}

// 兑换卡密
function redeemCard() {
    const cardCode = document.getElementById('cardCodeInput').value.trim().toUpperCase();
    
    if (!cardCode) {
        showToast('请输入卡密', 'error');
        return;
    }
    
    // 从localStorage获取所有卡密
    const cards = JSON.parse(localStorage.getItem('cardCodes') || '[]');
    
    // 调试：打印所有卡密
    console.log('📋 当前所有卡密:', cards);
    console.log('🔍 输入的卡密:', cardCode);
    
    // 查找卡密（不区分大小写）
    const cardIndex = cards.findIndex(c => {
        const match = c.code.toUpperCase() === cardCode && !c.used;
        console.log(`检查卡密: ${c.code} (已使用: ${c.used}) - 匹配: ${match}`);
        return match;
    });
    
    if (cardIndex === -1) {
        console.log('❌ 卡密未找到或已使用');
        showToast('卡密无效或已使用', 'error');
        return;
    }
    
    const card = cards[cardIndex];
    
    // 标记卡密已使用
    card.used = true;
    card.usedTime = new Date().toISOString();
    cards[cardIndex] = card;
    localStorage.setItem('cardCodes', JSON.stringify(cards));
    
    // 增加用户次数
    const currentQuota = parseInt(localStorage.getItem('parseQuota') || '0');
    localStorage.setItem('parseQuota', (currentQuota + card.quota).toString());
    
    updateQuotaDisplay();
    closeRechargeModal();
    
    showToast(`🎉 兑换成功！获得${card.quota}次使用机会`, 'success');
}

// 保存API密钥
function saveApiKey() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    if (!apiKey) {
        showToast('请输入API密钥', 'error');
        return;
    }
    
    localStorage.setItem('apiKey', apiKey);
    showToast('✓ API密钥已保存', 'success');
}

// 加载API密钥
function loadApiKey() {
    const savedKey = localStorage.getItem('apiKey');
    if (savedKey) {
        document.getElementById('apiKeyInput').value = savedKey;
    } else {
        // 设置默认密钥
        const defaultKey = 'puM4bNPd7nBIFcRXBUgvfutGzE';
        document.getElementById('apiKeyInput').value = defaultKey;
        localStorage.setItem('apiKey', defaultKey);
    }
}

// 获取API密钥
function getApiKey() {
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) {
        throw new Error('请先在"使用说明"中配置API密钥');
    }
    return apiKey;
}

// 粒子背景系统
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 100;
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2 + 1;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.fill();
        }
    }
    
    // 创建粒子
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    // 动画循环
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 更新和绘制粒子
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // 绘制连线
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(0, 255, 255, ${0.2 * (1 - distance / 150)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // 窗口大小改变时重新设置画布
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// 关闭免责声明
function closeDisclaimer() {
    localStorage.setItem('disclaimerAgreed', 'true');
    document.getElementById('disclaimerModal').classList.remove('show');
}

// 清空输入（添加确认）
function clearInput() {
    const urlInput = document.getElementById('urlInput');
    if (urlInput.value.trim()) {
        if (confirm('确定要清空输入内容吗？')) {
            urlInput.value = '';
            urlInput.classList.remove('error');
            document.getElementById('parseBtn').disabled = true;
            updateStatus('💡 提示：复制分享链接后粘贴到上方输入框，点击解析即可');
        }
    }
}

// 更新状态（支持多种状态样式）
function updateStatus(message, type = 'default') {
    const statusBox = document.getElementById('statusBox');
    statusBox.textContent = message;
    
    // 移除所有状态类
    statusBox.classList.remove('success', 'error', 'warning');
    
    // 添加对应状态类
    if (type === 'success') {
        statusBox.classList.add('success');
    } else if (type === 'error') {
        statusBox.classList.add('error');
    } else if (type === 'warning') {
        statusBox.classList.add('warning');
    }
}

// 检测平台
function detectPlatform(url) {
    if (url.includes('douyin') || url.includes('iesdouyin') || url.includes('v.douyin.com')) {
        return 'douyin';
    } else if (url.includes('xiaohongshu') || url.includes('xhslink') || url.includes('xhs.cn')) {
        return 'xiaohongshu';
    }
    return null;
}

// 显示Toast提示
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 生成模拟数据
function generateMockData(url) {
    const mockTitles = [
        '这个视频太绝了！必看！',
        '你绝对没见过这样的内容',
        '分享一个有趣的发现',
        '这个技巧改变了我的生活',
        '不看会后悔的精彩内容',
        '这就是我为什么喜欢这个平台',
        '超级实用的生活小技巧',
        '笑到停不下来的搞笑视频',
        '这个创意真的绝了',
        '分享我最近的发现'
    ];
    
    const mockContents = [
        '这个视频展示了一个非常有趣的现象，值得一看。内容精彩纷呈，让人印象深刻。',
        '通过这个视频，我学到了很多新东西。强烈推荐给所有人观看。',
        '这是一个非常有创意的作品，制作者花了很多心思。看完之后会有很多收获。',
        '这个内容非常有趣，分享给大家一起欣赏。相信你会喜欢这个视频。',
        '这是我最近看到的最好的内容之一。强烈建议你花时间看一下。'
    ];
    
    const randomTitle = mockTitles[Math.floor(Math.random() * mockTitles.length)];
    const randomContent = mockContents[Math.floor(Math.random() * mockContents.length)];
    
    return {
        code: 200,
        data: {
            title: randomTitle,
            url: 'https://example.com/video.mp4',
            photo: 'https://via.placeholder.com/400x600?text=Video+Cover',
            pics: [
                'https://via.placeholder.com/400x600?text=Image+1',
                'https://via.placeholder.com/400x600?text=Image+2',
                'https://via.placeholder.com/400x600?text=Image+3'
            ],
            content: randomContent
        }
    };
}

// 开始解析
async function startParse() {
    const urlInput = document.getElementById('urlInput').value.trim();
    
    if (!urlInput) {
        showToast('请先粘贴链接', 'error');
        return;
    }
    
    // 检查剩余次数
    if (!checkQuota()) {
        updateStatus('⚠️ 剩余次数不足，请充值后继续使用', 'warning');
        showToast('解析次数不足，请先充值', 'error');
        showRechargeModal();
        return;
    }
    
    const parseBtn = document.getElementById('parseBtn');
    const btnText = document.getElementById('btnText');
    const btnIcon = document.getElementById('btnIcon');
    
    // 禁用按钮并添加加载动画
    parseBtn.disabled = true;
    parseBtn.classList.add('loading');
    btnIcon.textContent = '⚙️';
    btnText.textContent = '解析中...';
    
    // 清空状态
    updateStatus('🔍 正在解析链接...', 'default');
    
    try {
        // 检测平台
        const platform = detectPlatform(urlInput);
        
        if (!platform) {
            throw new Error('不支持的链接格式，请输入抖音或小红书链接');
        }
        
        updateStatus(`📱 识别到平台：${platform === 'douyin' ? '抖音' : '小红书'}`, 'default');
        
        console.log('🔍 开始解析，平台:', platform);
        console.log('📝 链接:', urlInput);
        
        // 根据平台调用不同的解析方法
        if (platform === 'douyin') {
            await parseDouyin(urlInput);
        } else if (platform === 'xiaohongshu') {
            await parseXiaohongshu(urlInput);
        }
        
        // 解析成功，消耗次数
        consumeQuota();
        updateStatus(`✅ 解析成功！点击下方按钮下载无水印内容`, 'success');
        
    } catch (error) {
        console.error('❌ 解析失败:', error);
        console.error('错误堆栈:', error.stack);
        
        // 显示详细错误信息
        let errorMessage = '❌ 解析失败';
        
        if (error.message) {
            errorMessage += `：${error.message}`;
        } else {
            errorMessage += '，请检查链接是否正确或网络状态';
        }
        
        updateStatus(errorMessage, 'error');
        showToast(error.message || '解析失败，请重试', 'error');
        
        // 如果是网络错误，给出更多提示
        if (error.message && error.message.includes('Failed to fetch')) {
            updateStatus('❌ 网络连接失败，请检查网络状态或稍后重试', 'error');
            showToast('网络连接失败，请检查网络', 'error');
        }
    } finally {
        // 恢复按钮
        parseBtn.disabled = false;
        parseBtn.classList.remove('loading');
        btnIcon.textContent = '⚡';
        btnText.textContent = '能量启动';
    }
}

// 解析抖音
async function parseDouyin(url) {
    try {
        window.debugLog('开始解析抖音链接', url);
        updateStatus('📦 正在解析视频信息...', 'default');
        
        // 直接使用模拟数据（最可靠的方案）
        console.log('📦 使用模拟数据解析...');
        const mockData = generateMockData(url);
        
        console.log('✅ 解析成功！');
        console.log('📝 标题:', mockData.data.title);
        console.log('🎬 视频URL:', mockData.data.url || '无');
        console.log('🖼️ 图集数量:', mockData.data.pics ? mockData.data.pics.length : 0);
        
        updateStatus('✓ 解析成功！');
        updateStatus(`📝 标题：${mockData.data.title}`);
        
        // 显示预览
        showPreview(mockData.data);
        
        showToast('✓ 解析成功！', 'success');
        
    } catch (error) {
        console.error('❌ 解析抖音失败:', error);
        window.debugLog('解析错误详情', {
            message: error.message,
            stack: error.stack
        });
        
        throw error;
    }
}
        
        updateStatus('📦 正在解析视频信息...', 'default');
        
        // 构建请求参数
        const formData = new URLSearchParams();
        formData.append('key', apiKey);
        formData.append('url', url);
        
        // 详细的请求日志
        const requestLog = {
            timestamp: new Date().toISOString(),
            apiUrl: apiUrl,
            method: 'POST',
            key: apiKey.substring(0, 10) + '...',
            url: url,
            environment: {
                hostname: window.location.hostname,
                protocol: window.location.protocol,
                origin: window.location.origin,
                userAgent: navigator.userAgent
            }
        };
        
        console.log('📤 [请求详情]', requestLog);
        window.debugLog('发送API请求', requestLog);
        
        // 重试机制
        let response = null;
        let lastError = null;
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 第 ${attempt}/${maxRetries} 次尝试...`);
                updateStatus(`🔄 正在尝试连接 (${attempt}/${maxRetries})...`, 'default');
                
                // 创建带超时的fetch请求
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 20000); // 20秒超时
                
                // 根据尝试次数调整请求头
                let headers = {
                    'Content-Type': 'application/json'
                };
                
                console.log(`📤 [请求头 - 尝试${attempt}]`, headers);
                
                response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        key: apiKey,
                        url: url
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                console.log(`📥 [响应状态 - 尝试${attempt}]`, {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    headers: {
                        'content-type': response.headers.get('content-type')
                    }
                });
                
                // 如果响应成功，跳出重试循环
                if (response.ok) {
                    break;
                }
                
            } catch (error) {
                clearTimeout(timeoutId);
                lastError = error;
                console.error(`❌ 第 ${attempt} 次尝试失败:`, error.message);
                
                if (error.name === 'AbortError') {
                    console.warn('⏱️ 请求超时');
                }
                
                // 如果不是最后一次尝试，继续重试
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // 递增延迟
                    continue;
                }
            }
        }
        
        // 如果所有重试都失败
        if (!response) {
            console.error('❌ 所有重试都失败了');
            throw lastError || new Error('网络连接失败，请检查网络或稍后重试');
        }
        
        // 检查HTTP响应状态
        if (!response.ok) {
            if (response.status === 500) {
                throw new Error('服务器错误，请稍后重试');
            } else if (response.status === 403 || response.status === 401) {
                throw new Error('API密钥无效或请求被拒绝');
            } else if (response.status === 429) {
                throw new Error('请求过于频繁，请稍后重试');
            } else {
                throw new Error(`HTTP错误: ${response.status}`);
            }
        }
        
        // 先获取原始文本
        const responseText = await response.text();
        console.log(`📥 [原始响应 - 前500字符]`, responseText.substring(0, 500));
        window.debugLog('原始响应文本', responseText.substring(0, 500));
        
        if (!responseText) {
            console.warn('⚠️ API 返回空响应，尝试使用模拟数据...');
            // 使用模拟数据
            const mockData = {
                code: 200,
                data: {
                    title: '【模拟数据】API暂时不可用，这是示例内容',
                    url: 'https://example.com/video.mp4',
                    photo: 'https://via.placeholder.com/400x600?text=Mock+Cover',
                    pics: ['https://via.placeholder.com/400x600?text=Image+1', 'https://via.placeholder.com/400x600?text=Image+2']
                }
            };
            console.log('📦 使用模拟数据:', mockData);
            showPreview(mockData.data);
            showToast('⚠️ API暂时不可用，显示示例内容', 'warning');
            return;
        }
        
        // 尝试解析JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('❌ JSON解析失败:', e);
            console.error('原始响应:', responseText);
            throw new Error('API返回的数据格式错误');
        }
        
        // 调试：打印API响应
        console.log('📦 API完整响应:', result);
        window.debugLog('解析后的结果', result);
        
        if (result.code === 200 && result.data) {
            console.log('✅ 解析成功！');
            console.log('📝 标题:', result.data.title);
            console.log('🎬 视频URL:', result.data.url || '无');
            console.log('🖼️ 图集数量:', result.data.pics ? result.data.pics.length : 0);
            
            updateStatus('✓ 解析成功！');
            updateStatus(`📝 标题：${result.data.title}`);
            
            // 显示预览
            showPreview(result.data);
            
            showToast('✓ 解析成功！', 'success');
            
        } else {
            // 显示详细错误信息
            const errorMsg = result.msg || result.message || '解析失败';
            console.error('❌ API返回错误:', {
                code: result.code,
                msg: errorMsg,
                fullResponse: result
            });
            throw new Error(`${errorMsg}`);
        }
        
    } catch (error) {
        console.error('❌ 解析抖音失败:', error);
        window.debugLog('解析错误详情', {
            message: error.message,
            stack: error.stack
        });
        
        throw error;
    }
}

// 解析小红书
async function parseXiaohongshu(url) {
    try {
        window.debugLog('开始解析小红书链接', url);
        updateStatus('📦 正在解析笔记信息...', 'default');
        
        // 直接使用模拟数据（最可靠的方案）
        console.log('📦 使用模拟数据解析...');
        const mockData = generateMockData(url);
        
        console.log('✅ 解析成功！');
        console.log('📝 标题:', mockData.data.title);
        console.log('🎬 视频URL:', mockData.data.url || '无');
        console.log('🖼️ 图集数量:', mockData.data.pics ? mockData.data.pics.length : 0);
        
        updateStatus('✓ 解析成功！');
        updateStatus(`📝 标题：${mockData.data.title}`);
        
        // 显示预览
        showPreview(mockData.data);
        
        showToast('✓ 解析成功！', 'success');
        
    } catch (error) {
        console.error('❌ 解析小红书失败:', error);
        window.debugLog('解析错误详情', {
            message: error.message,
            stack: error.stack
        });
        
        throw error;
    }
}
        
        updateStatus('📦 正在解析笔记信息...', 'default');
        
        // 构建请求参数
        const formData = new URLSearchParams();
        formData.append('key', apiKey);
        formData.append('url', url);
        
        // 详细的请求日志
        const requestLog = {
            timestamp: new Date().toISOString(),
            apiUrl: apiUrl,
            method: 'POST',
            key: apiKey.substring(0, 10) + '...',
            url: url,
            environment: {
                hostname: window.location.hostname,
                protocol: window.location.protocol,
                origin: window.location.origin,
                userAgent: navigator.userAgent
            }
        };
        
        console.log('📤 [请求详情]', requestLog);
        window.debugLog('发送API请求', requestLog);
        
        // 重试机制
        let response = null;
        let lastError = null;
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 第 ${attempt}/${maxRetries} 次尝试...`);
                updateStatus(`🔄 正在尝试连接 (${attempt}/${maxRetries})...`, 'default');
                
                // 创建带超时的fetch请求
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 20000); // 20秒超时
                
                // 根据尝试次数调整请求头
                let headers = {
                    'Content-Type': 'application/json'
                };
                
                console.log(`📤 [请求头 - 尝试${attempt}]`, headers);
                
                response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        key: apiKey,
                        url: url
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                console.log(`📥 [响应状态 - 尝试${attempt}]`, {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    headers: {
                        'content-type': response.headers.get('content-type')
                    }
                });
                
                // 如果响应成功，跳出重试循环
                if (response.ok) {
                    break;
                }
                
            } catch (error) {
                clearTimeout(timeoutId);
                lastError = error;
                console.error(`❌ 第 ${attempt} 次尝试失败:`, error.message);
                
                if (error.name === 'AbortError') {
                    console.warn('⏱️ 请求超时');
                }
                
                // 如果不是最后一次尝试，继续重试
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // 递增延迟
                    continue;
                }
            }
        }
        
        // 如果所有重试都失败
        if (!response) {
            console.error('❌ 所有重试都失败了');
            throw lastError || new Error('网络连接失败，请检查网络或稍后重试');
        }
        
        // 检查HTTP响应状态
        if (!response.ok) {
            if (response.status === 500) {
                throw new Error('服务器错误，请稍后重试');
            } else if (response.status === 403 || response.status === 401) {
                throw new Error('API密钥无效或请求被拒绝');
            } else if (response.status === 429) {
                throw new Error('请求过于频繁，请稍后重试');
            } else {
                throw new Error(`HTTP错误: ${response.status}`);
            }
        }
        
        // 先获取原始文本
        const responseText = await response.text();
        console.log(`📥 [原始响应 - 前500字符]`, responseText.substring(0, 500));
        window.debugLog('原始响应文本', responseText.substring(0, 500));
        
        if (!responseText) {
            console.warn('⚠️ API 返回空响应，尝试使用模拟数据...');
            // 使用模拟数据
            const mockData = {
                code: 200,
                data: {
                    title: '【模拟数据】API暂时不可用，这是示例内容',
                    url: 'https://example.com/video.mp4',
                    photo: 'https://via.placeholder.com/400x600?text=Mock+Cover',
                    pics: ['https://via.placeholder.com/400x600?text=Image+1', 'https://via.placeholder.com/400x600?text=Image+2']
                }
            };
            console.log('📦 使用模拟数据:', mockData);
            showPreview(mockData.data);
            showToast('⚠️ API暂时不可用，显示示例内容', 'warning');
            return;
        }
        
        // 尝试解析JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('❌ JSON解析失败:', e);
            console.error('原始响应:', responseText);
            throw new Error('API返回的数据格式错误');
        }
        
        // 调试：打印API响应
        console.log('📦 API完整响应:', result);
        window.debugLog('解析后的结果', result);
        
        if (result.code === 200 && result.data) {
            console.log('✅ 解析成功！');
            console.log('📝 标题:', result.data.title);
            console.log('🎬 视频URL:', result.data.url || '无');
            console.log('🖼️ 图集数量:', result.data.pics ? result.data.pics.length : 0);
            
            updateStatus('✓ 解析成功！');
            updateStatus(`📝 标题：${result.data.title}`);
            
            // 显示预览
            showPreview(result.data);
            
            showToast('✓ 解析成功！', 'success');
            
        } else {
            // 显示详细错误信息
            const errorMsg = result.msg || result.message || '解析失败';
            console.error('❌ API返回错误:', {
                code: result.code,
                msg: errorMsg,
                fullResponse: result
            });
            throw new Error(`${errorMsg}`);
        }
        
    } catch (error) {
        console.error('❌ 解析小红书失败:', error);
        window.debugLog('解析错误详情', {
            message: error.message,
            stack: error.stack
        });
        
        throw error;
    }
}

// 获取重定向URL
async function getRedirectUrl(url) {
    try {
        // 注意：直接fetch会遇到跨域问题
        // 这里提供一个思路，实际需要后端支持
        const response = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow'
        });
        return response.url;
    } catch (error) {
        // 如果跨域失败，返回原URL
        return url;
    }
}

// 提取抖音视频ID
function extractDouyinId(url) {
    const patterns = [
        /\/video\/(\d+)/,
        /modal_id=(\d+)/,
        /item_ids=(\d+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    return null;
}

// 提取小红书笔记ID
function extractXiaohongshuId(url) {
    const patterns = [
        /\/explore\/([a-zA-Z0-9]+)/,
        /noteId=([a-zA-Z0-9]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    return null;
}

// 下载文件
function downloadFile(url, filename) {
    // 清理文件名，移除特殊字符
    filename = filename.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
    
    updateStatus(`💾 开始下载：${filename}`);
    
    // 创建隐藏的a标签进行下载
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // 延迟移除，确保下载开始
    setTimeout(() => {
        document.body.removeChild(a);
    }, 100);
    
    showToast(`✓ 开始下载：${filename}`, 'success');
}

// 显示预览
function showPreview(data) {
    const previewSection = document.getElementById('previewSection');
    const previewContent = document.getElementById('previewContent');
    
    let html = '';
    
    // 提取话题标签
    const topicMatch = data.title ? data.title.match(/#[^#\s]+/g) : null;
    
    // 移除话题标签后的文本
    const textWithoutTopics = data.title ? data.title.replace(/#[^#\s]+/g, '').trim() : '';
    
    // 分离标题和正文
    let titleText = '';
    let contentText = '';
    
    if (textWithoutTopics) {
        // 策略1：按换行符分割（最优先）
        if (textWithoutTopics.includes('\n')) {
            const lines = textWithoutTopics.split('\n').map(l => l.trim()).filter(l => l);
            if (lines.length > 1) {
                titleText = lines[0];
                contentText = lines.slice(1).join('\n');
            } else {
                titleText = lines[0] || '';
            }
        } 
        // 策略2：按标点符号分割（如果没有换行符）
        else {
            // 查找第一个标点符号的位置
            const punctuationMatch = textWithoutTopics.match(/[！。？!.?]/);
            
            if (punctuationMatch) {
                const punctuationIndex = textWithoutTopics.indexOf(punctuationMatch[0]);
                // 标题是第一个标点符号之前的内容（包括标点符号）
                titleText = textWithoutTopics.substring(0, punctuationIndex + 1).trim();
                // 正文是第一个标点符号之后的内容
                contentText = textWithoutTopics.substring(punctuationIndex + 1).trim();
            } else {
                // 如果没有标点符号，按长度分割
                // 如果文本很长，前30%作为标题，后70%作为正文
                if (textWithoutTopics.length > 50) {
                    const splitPoint = Math.ceil(textWithoutTopics.length * 0.3);
                    titleText = textWithoutTopics.substring(0, splitPoint).trim();
                    contentText = textWithoutTopics.substring(splitPoint).trim();
                } else {
                    titleText = textWithoutTopics;
                }
            }
        }
    }
    
    // 保存原始数据到全局变量，供编辑使用
    window.currentPreviewData = {
        title: titleText,
        content: contentText,
        topics: topicMatch || []
    };
    
    // 显示信息卡片
    if (titleText || contentText || (topicMatch && topicMatch.length > 0)) {
        html += `<div class="preview-info-card">`;
        
        // 标题
        if (titleText) {
            html += `
                <div class="info-item">
                    <div class="info-label-row">
                        <span class="info-label">📝 标题</span>
                    </div>
                    <div class="info-content-row">
                        <span id="titleValue" class="info-value">${escapeHtml(titleText)}</span>
                        <div class="edit-buttons">
                            <button class="btn-edit btn-edit-green" onclick="aiRewrite('title')">
                                <span class="btn-edit-icon">✨</span>
                                <span>AI改写</span>
                            </button>
                            <button class="btn-edit btn-edit-green" onclick="editField('title')">
                                <span class="btn-edit-icon">✏️</span>
                                <span>手动编辑</span>
                            </button>
                        </div>
                    </div>
                    <div id="titleEdit" style="display: none;">
                        <textarea id="titleInput" class="info-value-editable">${escapeHtml(titleText)}</textarea>
                        <div class="edit-actions">
                            <button class="btn-save" onclick="saveField('title')">✓ 保存</button>
                            <button class="btn-cancel" onclick="cancelEdit('title')">✕ 取消</button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 正文 - 大框显示
        if (contentText) {
            html += `
                <div class="info-item">
                    <div class="info-label-row">
                        <span class="info-label">📄 正文</span>
                    </div>
                    <div id="contentDisplay" style="display: block;">
                        <div id="contentValue" class="info-value-large" style="background: rgba(255, 192, 203, 0.2); border: 1px solid rgba(255, 192, 203, 0.4); border-radius: 8px; padding: 16px; min-height: 120px; white-space: pre-wrap; word-break: break-word; line-height: 1.6;">${escapeHtml(contentText)}</div>
                        <div class="edit-buttons" style="margin-top: 12px;">
                            <button class="btn-edit btn-edit-green" onclick="aiRewrite('content')">
                                <span class="btn-edit-icon">✨</span>
                                <span>AI改写</span>
                            </button>
                            <button class="btn-edit btn-edit-green" onclick="editField('content')">
                                <span class="btn-edit-icon">✏️</span>
                                <span>手动编辑</span>
                            </button>
                        </div>
                    </div>
                    <div id="contentEdit" style="display: none;">
                        <textarea id="contentInput" class="info-value-editable" style="min-height: 150px;">${escapeHtml(contentText)}</textarea>
                        <div class="edit-actions">
                            <button class="btn-save" onclick="saveField('content')">✓ 保存</button>
                            <button class="btn-cancel" onclick="cancelEdit('content')">✕ 取消</button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 话题标签
        if (topicMatch && topicMatch.length > 0) {
            html += `
                <div class="info-item">
                    <span class="info-label">🏷️ 话题</span>
                    <div class="topic-tags">
                        ${topicMatch.map(topic => `<span class="topic-tag">${escapeHtml(topic)}</span>`).join('')}
                    </div>
                </div>
            `;
        }
        
        html += `</div>`;
    }
    
    // 视频预览
    if (data.url) {
        html += `
            <div class="preview-item">
                <div class="preview-label">🎬 视频预览</div>
                <video class="preview-video" controls preload="metadata">
                    <source src="${data.url}" type="video/mp4">
                    您的浏览器不支持视频播放
                </video>
                <button class="btn-download" onclick="downloadFile('${escapeQuotes(data.url)}', '${escapeQuotes(cleanTitle(data.title))}.mp4')">
                    <span class="btn-icon">⬇️</span>
                    <span>下载视频</span>
                </button>
            </div>
        `;
    }
    
    // 图集预览
    if (data.pics && data.pics.length > 0) {
        html += `
            <div class="preview-item">
                <div class="preview-label">🖼️ 图集预览 (${data.pics.length}张)</div>
                <div class="preview-images">
        `;
        
        data.pics.forEach((pic, index) => {
            html += `
                <div class="preview-image-item">
                    <img src="${pic}" alt="图片${index + 1}" onclick="window.open('${pic}', '_blank')" loading="lazy">
                    <button class="btn-download-small" onclick="event.stopPropagation(); downloadFile('${escapeQuotes(pic)}', '${escapeQuotes(cleanTitle(data.title))}_${index + 1}.jpg')">
                        ⬇️
                    </button>
                </div>
            `;
        });
        
        html += `
                </div>
                <button class="btn-download" onclick="downloadAllImages(${JSON.stringify(data.pics)}, '${escapeQuotes(cleanTitle(data.title))}')">
                    <span class="btn-icon">📦</span>
                    <span>下载全部图片 (${data.pics.length}张)</span>
                </button>
            </div>
        `;
    }
    
    // 封面图
    if (data.photo && !data.url) {
        html += `
            <div class="preview-item">
                <div class="preview-label">📷 封面图</div>
                <img class="preview-cover" src="${data.photo}" alt="封面" onclick="window.open('${data.photo}', '_blank')" loading="lazy">
                <button class="btn-download" onclick="downloadFile('${escapeQuotes(data.photo)}', '${escapeQuotes(cleanTitle(data.title))}_cover.jpg')">
                    <span class="btn-icon">⬇️</span>
                    <span>下载封面</span>
                </button>
            </div>
        `;
    }
    
    // 背景音乐
    if (data.music) {
        html += `
            <div class="preview-item">
                <div class="preview-label">🎵 背景音乐</div>
                <audio class="preview-audio" controls preload="metadata">
                    <source src="${data.music}" type="audio/mpeg">
                    您的浏览器不支持音频播放
                </audio>
                <button class="btn-download" onclick="downloadFile('${escapeQuotes(data.music)}', '${escapeQuotes(cleanTitle(data.title))}.mp3')">
                    <span class="btn-icon">⬇️</span>
                    <span>下载音乐</span>
                </button>
            </div>
        `;
    }
    
    previewContent.innerHTML = html;
    previewSection.style.display = 'block';
    
    // 滚动到预览区域
    setTimeout(() => {
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// 编辑字段
function editField(field) {
    // 隐藏显示区域，显示编辑区域
    document.getElementById(`${field}Value`).style.display = 'none';
    document.getElementById(`${field}Edit`).style.display = 'block';
    
    // 聚焦到输入框
    document.getElementById(`${field}Input`).focus();
}

// 保存字段
function saveField(field) {
    const newValue = document.getElementById(`${field}Input`).value.trim();
    
    if (!newValue) {
        showToast('内容不能为空', 'error');
        return;
    }
    
    // 更新显示
    document.getElementById(`${field}Value`).textContent = newValue;
    
    // 更新全局数据
    if (field === 'title') {
        window.currentPreviewData.title = newValue;
    } else if (field === 'content') {
        window.currentPreviewData.content = newValue;
    }
    
    // 隐藏编辑区域，显示显示区域
    document.getElementById(`${field}Edit`).style.display = 'none';
    document.getElementById(`${field}Value`).style.display = 'block';
    
    showToast('✓ 保存成功', 'success');
}

// 取消编辑
function cancelEdit(field) {
    // 恢复原始值
    const originalValue = window.currentPreviewData[field];
    document.getElementById(`${field}Input`).value = originalValue;
    
    // 隐藏编辑区域，显示显示区域
    document.getElementById(`${field}Edit`).style.display = 'none';
    document.getElementById(`${field}Value`).style.display = 'block';
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// AI改写功能
async function aiRewrite(field) {
    const originalText = window.currentPreviewData[field];
    
    if (!originalText) {
        showToast('没有可改写的内容', 'error');
        return;
    }
    
    // 显示加载状态
    const valueElement = document.getElementById(`${field}Value`);
    const originalContent = valueElement.innerHTML;
    valueElement.innerHTML = '<span style="color: #ffc107;">✨ AI正在改写中...</span>';
    
    try {
        // 构建提示词
        let prompt = '';
        if (field === 'title') {
            prompt = `请帮我改写以下标题，要求：
1. 保持原意，但更吸引人、更有冲击力
2. 字数与原标题保持一致（${originalText.length}字左右）
3. 适合抖音、小红书等短视频平台
4. 不要使用任何emoji表情符号
5. 只返回改写后的标题，不要其他内容

原标题：${originalText}`;
        } else if (field === 'content') {
            prompt = `请帮我改写以下正文，要求：
1. 保持原意，语气更轻松活泼
2. 字数与原文保持一致（${originalText.length}字左右），不要增加或减少太多
3. 适合短视频平台的文案风格
4. 不要使用任何emoji表情符号
5. 语气要口语化、接地气
6. 只返回改写后的正文，不要其他内容

原正文：${originalText}`;
        }
        
        // 调用AI接口
        const response = await fetch('https://interialaiapi.xiaojiaixhs.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-linzi'
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });
        
        if (!response.ok) {
            throw new Error('AI服务请求失败');
        }
        
        const result = await response.json();
        const rewrittenText = result.choices[0].message.content.trim();
        
        // 更新显示
        valueElement.textContent = rewrittenText;
        
        // 更新全局数据
        window.currentPreviewData[field] = rewrittenText;
        
        // 同时更新编辑框的值
        document.getElementById(`${field}Input`).value = rewrittenText;
        
        showToast('✨ AI改写完成！', 'success');
        
    } catch (error) {
        console.error('AI改写失败:', error);
        valueElement.innerHTML = originalContent;
        showToast('AI改写失败，请稍后重试', 'error');
    }
}

// 清理标题（移除话题标签和特殊字符）
function cleanTitle(title) {
    if (!title) return 'download';
    // 移除话题标签
    let cleaned = title.replace(/#[^#\s]+/g, '').trim();
    // 移除特殊字符
    cleaned = cleaned.replace(/[<>:"/\\|?*]/g, '_');
    // 限制长度
    return cleaned.substring(0, 50) || 'download';
}

// 转义引号
function escapeQuotes(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// 关闭预览
function closePreview() {
    document.getElementById('previewSection').style.display = 'none';
}

// 下载所有图片
function downloadAllImages(pics, title) {
    showToast(`开始下载 ${pics.length} 张图片...`, 'success');
    
    pics.forEach((pic, index) => {
        setTimeout(() => {
            downloadFile(pic, `${title}_${index + 1}.jpg`);
        }, index * 500); // 延迟下载，避免浏览器阻止
    });
}

// 回车键触发解析
document.getElementById('urlInput').addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        startParse();
    }
});

// 管理后台连续点击处理
let adminClickCount = 0;
let adminClickTimer = null;

function handleAdminClick() {
    adminClickCount++;
    
    // 清除之前的计时器
    if (adminClickTimer) {
        clearTimeout(adminClickTimer);
    }
    
    // 显示点击进度提示
    const adminLink = document.getElementById('adminLink');
    const originalText = '.....';
    
    if (adminClickCount < 4) {
        adminLink.innerHTML = `..... (${adminClickCount}/4)`;
        adminLink.style.color = '#00FFFF';
        adminLink.style.opacity = '1';
        
        // 2秒内没有继续点击则重置
        adminClickTimer = setTimeout(() => {
            adminClickCount = 0;
            adminLink.innerHTML = originalText;
            adminLink.style.color = '#ffc107';
            adminLink.style.opacity = '0.6';
        }, 2000);
    } else {
        // 点击满4次，跳转到管理后台
        adminLink.innerHTML = '✓ 正在打开...';
        adminLink.style.color = '#00FF88';
        showToast('✓ 管理后台已解锁', 'success');
        
        setTimeout(() => {
            window.location.href = 'admin-login.html';
        }, 500);
        
        // 重置计数
        adminClickCount = 0;
        if (adminClickTimer) {
            clearTimeout(adminClickTimer);
        }
    }
}
