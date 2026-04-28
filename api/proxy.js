/**
 * Vercel 代理函数
 * 用于转发 API 请求，绕过 CORS 限制
 */

export default async function handler(req, res) {
    // 只允许 POST 请求
    if (req.method !== 'POST' && req.method !== 'OPTIONS') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 处理 CORS 预检请求
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(200).end();
    }

    try {
        const { key, url } = req.body;

        if (!key || !url) {
            return res.status(400).json({ 
                code: 400,
                msg: '缺少必要参数：key 或 url'
            });
        }

        console.log('[代理] 接收请求:', {
            timestamp: new Date().toISOString(),
            key: key.substring(0, 10) + '...',
            url: url
        });

        // 构建原始 API 请求
        const apiUrl = 'https://api.wxshares.com/api/qsy/plus';
        const formData = new URLSearchParams();
        formData.append('key', key);
        formData.append('url', url);

        console.log('[代理] 转发请求到:', apiUrl);

        // 转发请求到原始 API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: formData,
            timeout: 30000
        });

        console.log('[代理] API 响应状态:', response.status);

        // 获取响应文本
        const responseText = await response.text();
        console.log('[代理] 响应内容长度:', responseText.length);

        if (!responseText) {
            console.warn('[代理] API 返回空响应');
            return res.status(200).json({
                code: 200,
                msg: 'API 返回空响应',
                data: null
            });
        }

        // 尝试解析 JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('[代理] JSON 解析失败:', e.message);
            return res.status(200).json({
                code: 500,
                msg: 'API 返回的数据格式错误',
                raw: responseText.substring(0, 500)
            });
        }

        console.log('[代理] 解析成功，返回结果');

        // 设置 CORS 头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Content-Type', 'application/json');

        // 返回 API 响应
        return res.status(200).json(result);

    } catch (error) {
        console.error('[代理] 错误:', error.message);

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');

        return res.status(500).json({
            code: 500,
            msg: '代理请求失败',
            error: error.message
        });
    }
}
