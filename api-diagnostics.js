/**
 * API 诊断工具
 * 用于诊断本地和线上环境的 API 调用差异
 */

// 诊断工具类
class APIDiagnostics {
    constructor() {
        this.logs = [];
        this.results = {};
    }
    
    // 记录日志
    log(message, data = null) {
        const entry = {
            timestamp: new Date().toISOString(),
            message,
            data
        };
        this.logs.push(entry);
        console.log(`[诊断] ${message}`, data || '');
    }
    
    // 获取环境信息
    getEnvironmentInfo() {
        const info = {
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            origin: window.location.origin,
            href: window.location.href,
            userAgent: navigator.userAgent,
            language: navigator.language,
            onLine: navigator.onLine,
            cookieEnabled: navigator.cookieEnabled,
            localStorage: typeof localStorage !== 'undefined',
            sessionStorage: typeof sessionStorage !== 'undefined'
        };
        
        this.log('环境信息', info);
        return info;
    }
    
    // 测试 CORS
    async testCORS() {
        this.log('开始测试 CORS...');
        
        const apiUrl = 'https://api.wxshares.com/api/qsy/plus';
        const testData = new URLSearchParams();
        testData.append('key', 'puM4bNPd7nBIFcRXBUgvfutGzE');
        testData.append('url', 'https://www.douyin.com/video/1234567890');
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
                },
                body: testData,
                mode: 'cors'
            });
            
            const corsHeaders = {
                'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
                'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
                'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
                'access-control-allow-headers': response.headers.get('access-control-allow-headers')
            };
            
            this.log('CORS 测试成功', {
                status: response.status,
                corsHeaders
            });
            
            this.results.cors = {
                success: true,
                status: response.status,
                corsHeaders
            };
            
        } catch (error) {
            this.log('CORS 测试失败', {
                error: error.message,
                name: error.name
            });
            
            this.results.cors = {
                success: false,
                error: error.message
            };
        }
    }
    
    // 测试请求头
    async testHeaders() {
        this.log('开始测试不同的请求头...');
        
        const apiUrl = 'https://api.wxshares.com/api/qsy/plus';
        const testData = new URLSearchParams();
        testData.append('key', 'puM4bNPd7nBIFcRXBUgvfutGzE');
        testData.append('url', 'https://www.douyin.com/video/1234567890');
        
        const headerConfigs = [
            {
                name: '完整请求头',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
                    'Accept': '*/*',
                    'Accept-Language': 'zh-CN,zh;q=0.9',
                    'Origin': window.location.origin,
                    'Referer': window.location.href
                }
            },
            {
                name: '简化请求头',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
                }
            },
            {
                name: '最小请求头',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        ];
        
        this.results.headers = [];
        
        for (const config of headerConfigs) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: config.headers,
                    body: testData,
                    mode: 'cors'
                });
                
                const responseText = await response.text();
                
                this.log(`请求头测试 - ${config.name}`, {
                    status: response.status,
                    responseLength: responseText.length,
                    hasContent: responseText.length > 0
                });
                
                this.results.headers.push({
                    name: config.name,
                    success: response.ok,
                    status: response.status,
                    responseLength: responseText.length
                });
                
            } catch (error) {
                this.log(`请求头测试失败 - ${config.name}`, error.message);
                
                this.results.headers.push({
                    name: config.name,
                    success: false,
                    error: error.message
                });
            }
        }
    }
    
    // 测试 API 响应
    async testAPIResponse() {
        this.log('开始测试 API 响应...');
        
        const apiUrl = 'https://api.wxshares.com/api/qsy/plus';
        const testData = new URLSearchParams();
        testData.append('key', 'puM4bNPd7nBIFcRXBUgvfutGzE');
        testData.append('url', 'https://www.douyin.com/video/1234567890');
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
                },
                body: testData,
                mode: 'cors'
            });
            
            const responseText = await response.text();
            
            this.log('API 响应原始文本', {
                status: response.status,
                length: responseText.length,
                preview: responseText.substring(0, 200)
            });
            
            if (responseText) {
                try {
                    const json = JSON.parse(responseText);
                    this.log('API 响应 JSON', json);
                    this.results.apiResponse = {
                        success: true,
                        status: response.status,
                        data: json
                    };
                } catch (e) {
                    this.log('JSON 解析失败', e.message);
                    this.results.apiResponse = {
                        success: false,
                        error: 'JSON 解析失败',
                        rawResponse: responseText.substring(0, 500)
                    };
                }
            } else {
                this.log('API 返回空响应');
                this.results.apiResponse = {
                    success: false,
                    error: '空响应'
                };
            }
            
        } catch (error) {
            this.log('API 测试失败', error.message);
            this.results.apiResponse = {
                success: false,
                error: error.message
            };
        }
    }
    
    // 测试网络连接
    async testNetworkConnectivity() {
        this.log('开始测试网络连接...');
        
        const tests = [
            {
                name: 'DNS 解析',
                url: 'https://api.wxshares.com/ping'
            },
            {
                name: 'Google',
                url: 'https://www.google.com'
            },
            {
                name: 'Cloudflare',
                url: 'https://www.cloudflare.com'
            }
        ];
        
        this.results.connectivity = [];
        
        for (const test of tests) {
            try {
                const startTime = performance.now();
                const response = await fetch(test.url, {
                    method: 'HEAD',
                    mode: 'no-cors'
                });
                const endTime = performance.now();
                
                this.log(`网络连接测试 - ${test.name}`, {
                    status: response.status,
                    time: `${(endTime - startTime).toFixed(2)}ms`
                });
                
                this.results.connectivity.push({
                    name: test.name,
                    success: true,
                    time: endTime - startTime
                });
                
            } catch (error) {
                this.log(`网络连接测试失败 - ${test.name}`, error.message);
                
                this.results.connectivity.push({
                    name: test.name,
                    success: false,
                    error: error.message
                });
            }
        }
    }
    
    // 运行完整诊断
    async runFullDiagnostics() {
        console.clear();
        console.log('🔍 开始完整 API 诊断...\n');
        
        this.getEnvironmentInfo();
        await this.testNetworkConnectivity();
        await this.testCORS();
        await this.testHeaders();
        await this.testAPIResponse();
        
        this.printReport();
    }
    
    // 打印诊断报告
    printReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 API 诊断报告');
        console.log('='.repeat(60) + '\n');
        
        console.log('📋 诊断结果摘要:');
        console.log(JSON.stringify(this.results, null, 2));
        
        console.log('\n📝 完整日志:');
        this.logs.forEach(log => {
            console.log(`[${log.timestamp}] ${log.message}`, log.data || '');
        });
        
        console.log('\n' + '='.repeat(60));
        console.log('💡 诊断建议:');
        console.log('='.repeat(60));
        
        // 分析结果并给出建议
        if (this.results.cors && !this.results.cors.success) {
            console.log('❌ CORS 问题: API 可能不允许跨域请求');
            console.log('   建议: 使用代理服务或联系 API 提供商配置 CORS');
        }
        
        if (this.results.apiResponse && !this.results.apiResponse.success) {
            console.log('❌ API 响应问题: 无法获取有效响应');
            console.log('   建议: 检查 API 密钥、请求参数或 API 服务状态');
        }
        
        if (this.results.connectivity) {
            const failedConnections = this.results.connectivity.filter(c => !c.success);
            if (failedConnections.length > 0) {
                console.log('❌ 网络连接问题: 某些连接失败');
                console.log('   建议: 检查网络连接或防火墙设置');
            }
        }
        
        console.log('\n✅ 诊断完成！');
    }
    
    // 导出诊断数据
    exportDiagnostics() {
        const data = {
            timestamp: new Date().toISOString(),
            environment: this.getEnvironmentInfo(),
            results: this.results,
            logs: this.logs
        };
        
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `api-diagnostics-${Date.now()}.json`;
        a.click();
        
        this.log('诊断数据已导出');
    }
}

// 创建全局诊断实例
window.apiDiagnostics = new APIDiagnostics();

// 添加快捷命令
window.runDiagnostics = async () => {
    await window.apiDiagnostics.runFullDiagnostics();
};

window.exportDiagnostics = () => {
    window.apiDiagnostics.exportDiagnostics();
};

console.log('💡 诊断工具已加载！');
console.log('使用方法:');
console.log('  1. 运行诊断: window.runDiagnostics()');
console.log('  2. 导出数据: window.exportDiagnostics()');
