// GasLimitChecker.js
// 该插件可以在交易执行前估算gas费用，如果超过设定阈值则阻止交易
// GasPrice目前在Monad上是有误的，请固定50

class GasLimitChecker {
  constructor() {
    this.defaultMaxGasLimit = 2000000; // 默认最大gas限制（单位：gas）
    this.defaultMaxGasPrice = 50; // 默认最大gas价格（单位：gwei）
    
    this.maxGasLimit = this.defaultMaxGasLimit;
    this.maxGasPrice = this.defaultMaxGasPrice;
    
    this.enabled = true;
    this.initialized = false;
    this.autoSyncEnabled = true; // 启用自动同步
    this.autoSyncInterval = null; // 自动同步定时器
    this.lastSyncTime = 0; // 上次同步时间
    this.lastGasSettings = {}; // 上次同步的Gas设置

    // 存储被拒绝的交易信息
    this.rejectedTransactions = [];
    
    // 交易类型映射到自定义上限
    this.customGasLimits = {
      // 示例：move: 1000000, // 移动操作最大gas限制
      // upgrade: 1500000, // 升级操作最大gas限制
    };
    
    // 添加交易类型到预估Gas倍率的映射
    this.gasEstimateMultipliers = {
      // 不同操作可能需要不同的安全系数
      move: 1.1,      // 移动操作
      upgrade: 1.2,   // 升级操作
      buyHat: 1.1,    // 购买帽子
      transferOwnership: 1.2, // 转移所有权
      withdrawSilver: 1.1,  // 提取银币
      default: 1.15   // 默认倍率
    };
    
    // 只读操作列表（不需要进行Gas检查）
    this.readOnlyMethods = [
      // 常见的只读方法前缀
      'get',
      'view',
      'read',
      'query',
      'check',
      'is',
      'has',
      'calculate',
      'compute',
      'estimate',
      // 特定的只读方法名
      'getBalance',
      'getMetadata',
      'getPlayerInfo',
      'getContractConstants',
      'getPlanetById',
      'getArtifactById',
      'getRevealedPlanets',
      'getRevealedCoordinates',
      'getPlanetsByIds',
      'getPlayerById'
    ];
    
    // 记录交易历史和错误模式
    this.transactionHistory = {
      successfulTxs: {}, // 按交易类型记录成功的交易
      failedTxs: {},     // 按交易类型记录失败的交易
      revertPatterns: {} // 记录某种操作的常见失败原因
    };
    
    // 记录常见的错误模式到易读的错误信息映射
    this.errorPatternToMessage = {
      'not owner': '你不是此对象的所有者',
      'insufficient': '资源不足',
      'not enough': '资源不足',
      'exceeds': '超出限制',
      'cooldown': '操作冷却中，请稍后再试',
      'invalid': '无效的操作或参数',
      'unauthorized': '未授权的操作',
      'already': '操作已存在或已完成',
      'not found': '找不到相关对象或资源',
      'no permission': '没有权限执行此操作',
      'not initialized': '系统尚未初始化',
      'paused': '系统当前已暂停'
    };
  }

  /**
   * 初始化插件
   */
  async render(container) {
    this.container = container;
    
    if (!this.initialized) {
      this.initialized = true;
      this.setupUI();
      this.interceptTxExecution();
      this.interceptNetworkRequests(); // 添加网络请求拦截
      this.setupTransactionMonitoring(); // 添加交易结果监控
      
      // 初始同步一次
      this.syncFromGameSettings();
      
      // 启动自动同步
      this.startAutoSync();
    }
    
    // 更新UI
    this.updateUI();
  }

  /**
   * 设置插件UI
   */
  setupUI() {
    // 创建插件控制面板
    this.container.style.width = '320px';
    this.container.style.height = 'auto';
    this.container.style.padding = '8px';
    
    // 标题
    const title = document.createElement('h3');
    title.innerText = 'Gas费用检查器';
    title.style.marginBottom = '10px';
    this.container.appendChild(title);
    
    // 启用/禁用开关
    const enableDiv = document.createElement('div');
    enableDiv.style.marginBottom = '10px';
    
    const enableCheckbox = document.createElement('input');
    enableCheckbox.type = 'checkbox';
    enableCheckbox.id = 'gas-checker-enabled';
    enableCheckbox.checked = this.enabled;
    enableCheckbox.addEventListener('change', () => {
      this.enabled = enableCheckbox.checked;
      this.updateUI();
    });
    
    const enableLabel = document.createElement('label');
    enableLabel.htmlFor = 'gas-checker-enabled';
    enableLabel.innerText = '启用Gas费用检查';
    
    enableDiv.appendChild(enableCheckbox);
    enableDiv.appendChild(enableLabel);
    this.container.appendChild(enableDiv);
    
    // 当前Gas设置信息显示
    const gasInfoDiv = document.createElement('div');
    gasInfoDiv.style.marginBottom = '16px';
    gasInfoDiv.style.padding = '8px';
    gasInfoDiv.style.border = '1px solid #ccc';
    gasInfoDiv.style.borderRadius = '4px';
    gasInfoDiv.style.backgroundColor = '#f5f5f5';
    
    this.gasInfoContent = document.createElement('div');
    this.gasInfoContent.innerHTML = `
      <p><strong>当前Gas限制:</strong> ${this.maxGasLimit}</p>
      <p><strong>当前Gas价格:</strong> ${this.maxGasPrice} gwei</p>
    `;
    
    gasInfoDiv.appendChild(this.gasInfoContent);
    this.container.appendChild(gasInfoDiv);
    
    // 添加同步按钮
    const syncButtonDiv = document.createElement('div');
    syncButtonDiv.style.marginBottom = '16px';
    syncButtonDiv.style.textAlign = 'center';
    
    const syncButton = document.createElement('button');
    syncButton.innerText = '从游戏设置同步Gas配置';
    syncButton.style.padding = '8px 16px';
    syncButton.style.cursor = 'pointer';
    syncButton.style.backgroundColor = '#4CAF50';
    syncButton.style.color = 'white';
    syncButton.style.border = 'none';
    syncButton.style.borderRadius = '4px';
    syncButton.style.fontSize = '14px';
    syncButton.style.fontWeight = 'bold';
    
    // 鼠标悬停效果
    syncButton.addEventListener('mouseover', () => {
      syncButton.style.backgroundColor = '#45a049';
    });
    
    syncButton.addEventListener('mouseout', () => {
      syncButton.style.backgroundColor = '#4CAF50';
    });
    
    syncButton.addEventListener('click', () => {
      this.syncFromGameSettings();
    });
    
    syncButtonDiv.appendChild(syncButton);
    this.container.appendChild(syncButtonDiv);
    
    // 状态信息
    this.statusDiv = document.createElement('div');
    this.statusDiv.style.marginTop = '10px';
    this.statusDiv.style.padding = '5px';
    this.statusDiv.style.border = '1px solid #ccc';
    this.statusDiv.style.borderRadius = '3px';
    this.container.appendChild(this.statusDiv);
    
    // 被拒绝的交易列表
    this.rejectedList = document.createElement('div');
    this.rejectedList.style.marginTop = '10px';
    this.rejectedList.style.maxHeight = '200px';
    this.rejectedList.style.overflow = 'auto';
    this.container.appendChild(this.rejectedList);
  }

  /**
   * 从游戏设置同步Gas配置
   */
  syncFromGameSettings() {
    try {
      // 检查df对象是否可用
      if (!window.df) {
        console.error('无法访问df对象，游戏可能尚未完全加载');
        this.showNotification('无法访问游戏数据，请确保游戏已完全加载', 'error');
        return;
      }
      
      // 获取当前账户和合约地址信息
      const config = {
        contractAddress: df.contractAddress,
        account: df.account
      };
      
      // 检查是否获取到合约地址和账户（如果是函数则尝试调用）
      if (typeof config.contractAddress === 'function') {
        config.contractAddress = df.contractAddress();
      } else if (typeof df.getContractAddress === 'function') {
        config.contractAddress = df.getContractAddress();
      }
      
      if (typeof config.account === 'function') {
        config.account = df.account();
      } else if (typeof df.getAccount === 'function') {
        config.account = df.getAccount();
      }
      
      // 输出检索到的值以便调试
      console.log('解析后的账户信息:', {
        contractAddress: config.contractAddress,
        account: config.account,
        contractAddressType: typeof config.contractAddress,
        accountType: typeof config.account
      });
      
      // 检查必要的信息是否存在
      if (!config.contractAddress || !config.account) {
        console.error('无法获取合约地址或账户信息');
        this.showNotification('无法获取合约地址或账户信息，请确保已登录游戏', 'error');
        return;
      }
      
      // 初始化变量
      let gasFeeGwei;
      let gasFeeLimit;
      
      // 调试日志
      console.log('开始同步Gas设置');
      console.log('账户信息:', config);
      
      // 使用正确的键名格式获取GasFeeGwei
      const gasFeeGweiKey = `${config.contractAddress}:${config.account}:GasFeeGwei`;
      console.log('尝试获取GasFeeGwei, 键名:', gasFeeGweiKey);
      const storedGasFeeGwei = localStorage.getItem(gasFeeGweiKey);
      console.log('从localStorage获取的GasFeeGwei:', storedGasFeeGwei);
      
      if (storedGasFeeGwei && !isNaN(parseFloat(storedGasFeeGwei))) {
        gasFeeGwei = parseFloat(storedGasFeeGwei);
        console.log(`成功从localStorage获取GasFeeGwei: ${gasFeeGwei}`);
      } else {
        // 使用默认值
        gasFeeGwei = this.defaultMaxGasPrice;
        console.log(`未找到GasFeeGwei值，使用默认值: ${gasFeeGwei}`);
      }
      
      // 使用正确的localStorage键格式获取GasFeeLimit
      const gasFeeLimitKey = `${config.contractAddress}:${config.account}:GasFeeLimit`;
      console.log('尝试获取GasFeeLimit, 键名:', gasFeeLimitKey);
      const storedGasFeeLimit = localStorage.getItem(gasFeeLimitKey);
      console.log('从localStorage获取的GasFeeLimit:', storedGasFeeLimit);
      
      if (storedGasFeeLimit && !isNaN(parseInt(storedGasFeeLimit, 10))) {
        gasFeeLimit = parseInt(storedGasFeeLimit, 10);
        console.log(`成功从localStorage获取GasFeeLimit: ${gasFeeLimit}`);
      } else {
        // 使用默认值
        gasFeeLimit = this.defaultMaxGasLimit;
        console.log(`未找到GasFeeLimit值，使用默认值: ${gasFeeLimit}`);
      }
      
      // 更新插件设置
      if (gasFeeGwei !== undefined && !isNaN(gasFeeGwei)) {
        this.maxGasPrice = gasFeeGwei;
      }
      
      if (gasFeeLimit !== undefined && !isNaN(gasFeeLimit)) {
        this.maxGasLimit = gasFeeLimit;
        console.log(`✅ 成功获取Gas限制值: ${this.maxGasLimit}，这个值将用于交易检查`);
      }
      
      // 更新UI并通知用户
      this.updateUI();
      
      const syncMessage = `已同步游戏Gas设置: Price=${this.maxGasPrice}gwei, Limit=${this.maxGasLimit}`;
      console.log(syncMessage);
      console.log('从localStorage获取的GasFeeGwei:', storedGasFeeGwei);

      this.showNotification(syncMessage, 'info', 5000);
      
    } catch (err) {
      console.error('同步Gas设置失败:', err);
      this.showNotification('同步Gas设置失败，请查看控制台', 'error', 5000);
    }
  }

  /**
   * 更新UI显示
   */
  updateUI() {
    if (!this.initialized) return;
    
    // 更新Gas信息显示
    if (this.gasInfoContent) {
      this.gasInfoContent.innerHTML = `
        <p><strong>当前Gas限制:</strong> ${this.maxGasLimit}</p>
        <p><strong>当前Gas价格:</strong> ${this.maxGasPrice} gwei</p>
      `;
    }
    
    // 更新状态信息
    this.statusDiv.innerHTML = `
      <p><strong>状态:</strong> ${this.enabled ? '已启用' : '已禁用'}</p>
      <p><strong>已拒绝交易:</strong> ${this.rejectedTransactions.length}个</p>
    `;
    
    // 更新被拒绝的交易列表
    this.rejectedList.innerHTML = '<h4>被拒绝的交易:</h4>';
    if (this.rejectedTransactions.length === 0) {
      this.rejectedList.innerHTML += '<p>暂无被拒绝的交易</p>';
    } else {
      const ul = document.createElement('ul');
      this.rejectedTransactions.slice(0, 10).forEach((tx, i) => {
        const li = document.createElement('li');
        li.innerHTML = `
          <strong>${tx.type}</strong> - 
          预估Gas: ${tx.estimatedGas} | 
          价格: ${tx.gasPrice} gwei | 
          时1: ${new Date(tx.timestamp).toLocaleTimeString()}
        `;
        ul.appendChild(li);
      });
      this.rejectedList.appendChild(ul);
      
      if (this.rejectedTransactions.length > 10) {
        const more = document.createElement('p');
        more.innerText = `...还有 ${this.rejectedTransactions.length - 10} 个未显示`;
        this.rejectedList.appendChild(more);
      }
    }
  }

  /**
   * 拦截交易执行
   */
  interceptTxExecution() {
    try {
      // 检查必要的对象是否存在
      if (!window.df || !df.contractsAPI || !df.contractsAPI.txExecutor) {
        console.error('无法访问交易执行器，拦截功能将不可用');
        this.showNotification('无法拦截交易，插件部分功能不可用', 'error');
        return;
      }
      
      // 这里我们需要修改df.contractsAPI.txExecutor的行为
      // 保存原始的queueTransaction方法
      const originalQueueTransaction = df.contractsAPI.txExecutor.queueTransaction.bind(df.contractsAPI.txExecutor);
      
      // 重写queueTransaction方法
      df.contractsAPI.txExecutor.queueTransaction = async (intent, overrides) => {
        if (!this.enabled) {
          // 插件禁用时，使用原始方法
          return originalQueueTransaction(intent, overrides);
        }
        
        try {
          // 获取交易类型
          const txType = intent.methodName;
          console.log(`准备执行交易: ${txType}`);
          
          // 检查是否为只读操作
          const isReadOnly = await this.isReadOnlyTransaction(intent);
          if (isReadOnly) {
            console.log(`${txType} 被识别为只读操作，跳过Gas检查`);
            return originalQueueTransaction(intent, overrides);
          }
          
          // 使用更准确的方法估算Gas
          const gasEstimationResult = await this.estimateTransactionGas(intent, overrides, txType);
          
          // 如果估算被拒绝，直接返回拒绝结果
          if (gasEstimationResult.rejected) {
            return Promise.reject(new Error(gasEstimationResult.reason));
          }
          
          // 获取估算的Gas值
          const estimatedGas = gasEstimationResult.estimatedGas;
          console.log(`交易${txType}的估算Gas: ${estimatedGas}`);
          
          // 获取当前gas价格（gwei）
          const autoGasPriceSetting = df.contractsAPI.getGasFeeForTransaction({ intent });
          let gasPrice;
          
          if (typeof autoGasPriceSetting === 'string' && !isNaN(parseFloat(autoGasPriceSetting))) {
            gasPrice = parseFloat(autoGasPriceSetting);
          } else {
            // 如果是自动设置，获取相应的gas价格
            const gasPrices = await df.ethConnection.getAutoGasPrices();
            gasPrice = df.ethConnection.getAutoGasPriceGwei(gasPrices, autoGasPriceSetting);
          }
          
          // 检查是否低于区块链当前接受的最低Gas价格
          try {
            // 尝试获取当前网络建议的最低Gas价格
            let minGasPrice = 0;
            if (df.ethConnection && typeof df.ethConnection.getAutoGasPrices === 'function') {
              const networkGasPrices = await df.ethConnection.getAutoGasPrices();
              // 使用slow价格作为最低标准
              if (networkGasPrices && networkGasPrices.slow) {
                minGasPrice = df.ethConnection.getAutoGasPriceGwei(networkGasPrices, 'slow');
                console.log(`当前网络建议的最低Gas价格: ${minGasPrice}gwei`);
              }
            }
            
            // 如果当前Gas价格低于网络最低要求，拒绝交易
            if (minGasPrice > 0 && gasPrice < minGasPrice) {
              const reason = `Gas价格(${gasPrice}gwei)低于网络当前最低要求(${minGasPrice}gwei)`;
              console.error('交易被拒绝: ' + reason);
              
              // 记录被拒绝的交易
              this.rejectedTransactions.unshift({
                type: txType,
                estimatedGas,
                gasPrice,
                timestamp: Date.now(),
                reason: 'Gas价格过低'
              });
              
              // 限制数组大小
              if (this.rejectedTransactions.length > 50) {
                this.rejectedTransactions.pop();
              }
              
              // 更新UI
              this.updateUI();
              
              // 提示用户
              this.showNotification(`交易已取消: ${reason}`, 'error', 10000);
              
              // 返回一个被拒绝的Promise
              return Promise.reject(new Error(`交易被GasLimitChecker插件拒绝: ${reason}`));
            }
          } catch (err) {
            console.warn('获取最低Gas价格失败:', err);
            // 获取失败不阻止交易，只是打印警告
          }
          
          // 检查自定义限制
          const customLimit = this.customGasLimits[txType];
          const effectiveGasLimit = customLimit || this.maxGasLimit;
          
          // 检查是否超过限制
          const isGasLimitExceeded = estimatedGas > effectiveGasLimit;
          const isGasPriceExceeded = gasPrice > this.maxGasPrice;
          
          if (isGasLimitExceeded || isGasPriceExceeded) {
            // 记录被拒绝的交易
            this.rejectedTransactions.unshift({
              type: txType,
              estimatedGas,
              gasPrice,
              timestamp: Date.now(),
              reason: isGasLimitExceeded ? 'Gas限制超出' : 'Gas价格超出'
            });
            
            // 限制数组大小
            if (this.rejectedTransactions.length > 50) {
              this.rejectedTransactions.pop();
            }
            
            // 更新UI
            this.updateUI();
            
            // 提示用户
            const reason = isGasLimitExceeded 
              ? `预估Gas(${estimatedGas})超出限制(${effectiveGasLimit})`
              : `Gas价格(${gasPrice}gwei)超出限制(${this.maxGasPrice}gwei)`;
              
            this.showNotification(`交易已取消: ${reason}`, 'error', 10000);
            
            // 返回一个被拒绝的Promise
            return Promise.reject(new Error(`交易被GasLimitChecker插件拒绝: ${reason}`));
          }
          
          // 未超过限制，使用原始方法
          return originalQueueTransaction(intent, overrides);
        } catch (err) {
          console.error('拦截交易执行失败:', err);
          this.showNotification('拦截交易执行失败，请查看控制台', 'error', 5000);
          // 出错时使用原始方法
          return originalQueueTransaction(intent, overrides);
        }
      };
    } catch (err) {
      console.error('设置交易拦截器失败:', err);
      this.showNotification('设置交易拦截器失败，请查看控制台', 'error', 5000);
    }
  }

  /**
   * 判断操作是否为只读操作
   * @param {string} methodName 方法名
   * @returns {boolean} 是否为只读操作
   */
  isReadOnlyOperation(methodName) {
    if (!methodName) return false;
    
    const lowerMethodName = methodName.toLowerCase();
    
    // 直接匹配完整方法名
    if (this.readOnlyMethods.includes(lowerMethodName)) {
      return true;
    }
    
    // 检查是否以只读前缀开头
    for (const prefix of ['get', 'view', 'read', 'query', 'check', 'is', 'has', 'calculate', 'compute', 'estimate']) {
      if (lowerMethodName.startsWith(prefix)) {
        return true;
      }
    }
    
    // 特定的游戏只读操作
    const gameReadOnlyOperations = [
      'refreshPlanet',
      'findArtifact',
      'getRefreshWindow',
      'getContractConstants',
      'getUpgrades',
      'getGameObjects',
      'locationIdToCoords',
      'getWorldRadius',
      'getWorldSilver',
      'getVerifiedContracts',
      'getSilverMines',
      'getWhitelistedPlayers',
      'getLeaderboard',
      'getRank'
    ];
    
    if (gameReadOnlyOperations.includes(lowerMethodName)) {
      return true;
    }
    
    return false;
  }

  /**
   * 更详细地检查交易是否为只读操作
   * @param {Object} intent 交易意图对象
   * @returns {Promise<boolean>} 是否为只读操作
   */
  async isReadOnlyTransaction(intent) {
    try {
      // 1. 检查方法名
      if (this.isReadOnlyOperation(intent.methodName)) {
        return true;
      }
      
      // 2. 检查合约接口中的函数状态可变性
      try {
        const fragment = intent.contract.interface.getFunction(intent.methodName);
        if (fragment && (fragment.stateMutability === 'view' || fragment.stateMutability === 'pure')) {
          return true;
        }
      } catch (err) {
        // 无法从合约接口获取信息
      }
      
      // 3. 检查是否有其他明确的只读标记
      if (intent.isView === true || intent.isPure === true || intent.isReadOnly === true) {
        return true;
      }
      
      // 4. 检查调用方式
      if (intent.functionFragment && intent.functionFragment.constant) {
        return true;
      }
      
      // 5. 检查覆盖参数
      if (intent.overrides && intent.overrides.from === undefined) {
        // 没有发送者地址可能暗示是只读调用
        return true;
      }
      
      return false;
    } catch (err) {
      console.warn('检查只读交易时出错:', err);
      // 出错时保守返回false，进行Gas检查
      return false;
    }
  }

  /**
   * 更准确地估算交易Gas费用
   * @param {Object} intent 交易意图
   * @param {Object} overrides 覆盖参数
   * @param {string} txType 交易类型
   * @returns {Object} 估算结果
   */
  async estimateTransactionGas(intent, overrides, txType) {
    try {
      // 获取交易参数
      const args = await intent.args;
      
      // 检查历史交易记录中的失败模式
      const commonFailureReason = this.getMostCommonFailureReason(txType);
      if (commonFailureReason) {
        console.log(`${txType} 有历史失败记录，常见失败原因: ${commonFailureReason}`);
        
        // 根据失败历史和成功历史的比例判断风险
        const failureHistory = this.transactionHistory.failedTxs[txType];
        const successHistory = this.transactionHistory.successfulTxs[txType];
        
        if (failureHistory && successHistory) {
          const totalTxs = (failureHistory.count || 0) + (successHistory.count || 0);
          const failureRate = failureHistory.count / totalTxs;
          
          // 如果失败率超过50%，提示用户
          if (failureRate > 0.5) {
            console.warn(`${txType} 的历史失败率为 ${(failureRate * 100).toFixed(1)}%，存在高风险`);
            
            // 如果是近期的失败（最近10分钟内），给出强烈警告
            const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
            if (failureHistory.lastFailure > tenMinutesAgo) {
              // 最近有失败记录，可能条件未变，高风险
              console.error(`${txType} 在最近10分钟内有失败记录，条件可能未改变`);
              
              const reason = `此操作最近失败过: ${commonFailureReason}`;
              console.error('预警交易可能会失败:', reason);
              
              this.showNotification(`交易风险提示: ${reason}`, 'warning', 10000);
            }
          }
        }
      }
      
      // 尝试模拟交易执行，检查是否会被恢复（reverted）
      try {
        console.log(`模拟执行交易 ${txType} 以检查可能的失败...`);
        
        // 创建用于模拟的调用对象
        const callData = {
          from: df.account,
          to: intent.contract.address,
          data: intent.contract.interface.encodeFunctionData(txType, args)
        };
        
        // 尝试不同方式进行交易模拟
        let simulationSuccess = false;
        
        // 方法1：使用window.ethereum直接调用
        if (window.ethereum && typeof window.ethereum.request === 'function') {
          try {
            await window.ethereum.request({
              method: 'eth_call',
              params: [callData, 'latest']
            });
            simulationSuccess = true;
            console.log(`使用window.ethereum模拟交易成功`);
          } catch (ethErr) {
            console.warn(`使用window.ethereum模拟交易失败:`, ethErr);
            throw ethErr; // 继续向上抛出错误
          }
        } 
        // 方法2：使用ethers提供程序
        else if (intent.contract.provider && typeof intent.contract.provider.call === 'function') {
          try {
            await intent.contract.provider.call(callData);
            simulationSuccess = true;
            console.log(`使用合约提供程序模拟交易成功`);
          } catch (providerErr) {
            console.warn(`使用合约提供程序模拟交易失败:`, providerErr);
            throw providerErr; // 继续向上抛出错误
          }
        }
        // 方法3：使用游戏的ethConnection
        else if (df.ethConnection && typeof df.ethConnection.provider?.call === 'function') {
          try {
            await df.ethConnection.provider.call(callData);
            simulationSuccess = true;
            console.log(`使用df.ethConnection模拟交易成功`);
          } catch (dfErr) {
            console.warn(`使用df.ethConnection模拟交易失败:`, dfErr);
            throw dfErr; // 继续向上抛出错误
          }
        }
        // 方法4：尝试使用合约的callStatic方法
        else if (intent.contract.callStatic && typeof intent.contract.callStatic[txType] === 'function') {
          try {
            await intent.contract.callStatic[txType](...args, overrides || {});
            simulationSuccess = true;
            console.log(`使用callStatic模拟交易成功`);
          } catch (callStaticErr) {
            console.warn(`使用callStatic模拟交易失败:`, callStaticErr);
            throw callStaticErr; // 继续向上抛出错误
          }
        }
        
        if (simulationSuccess) {
          console.log(`交易 ${txType} 模拟执行成功`);
        } else {
          console.warn(`无法使用任何方法模拟交易，将继续尝试执行`);
        }
      } catch (simulationErr) {
        // 模拟执行失败，获取详细错误信息
        console.error(`交易 ${txType} 模拟执行失败:`, simulationErr);
        
        // 检查是否是交易revert
        const errorMsg = JSON.stringify(simulationErr).toLowerCase();
        if (errorMsg.includes('revert') || 
            errorMsg.includes('reverted') || 
            errorMsg.includes('execution failed') ||
            errorMsg.includes('execution reverted') ||
            errorMsg.includes('transaction failed') ||
            errorMsg.includes('out of gas') ||
            errorMsg.includes('invalid opcode')) {
          
          // 提取更具体的错误原因
          let revertReason = '未知原因';
          
          // 尝试多种方式解析错误信息
          if (simulationErr.data && typeof simulationErr.data === 'string') {
            // 检查错误数据中的原因
            const dataMatch = simulationErr.data.match(/0x08c379a0\w+([0-9a-fA-F]+)/);
            if (dataMatch && dataMatch[1]) {
              try {
                // 将十六进制数据转换为字符串
                const hexString = dataMatch[1];
                const stringData = Buffer.from(hexString, 'hex').toString('utf8');
                if (stringData) revertReason = stringData.replace(/^\0+/, '');
              } catch (e) {
                console.warn('解析十六进制错误数据失败:', e);
              }
            }
          }
          
          // 检查错误消息中的原因
          if (revertReason === '未知原因' && simulationErr.message) {
            // 匹配各种可能的错误信息格式
            const revertPatterns = [
              /reverted with reason string ['"](.+?)['"]/i,
              /execution reverted: (.+?)(?:\s|$)/i,
              /vm exception [^:]+: revert (.+?)(?:\s|$)/i,
              /reason: (.+?)(?:,|$)/i,
              /revert: (.+?)(?:\s|$)/i,
              /reason=(.+?)(?:,|$)/i
            ];
            
            for (const pattern of revertPatterns) {
              const match = simulationErr.message.match(pattern);
              if (match && match[1]) {
                revertReason = match[1].trim();
                break;
              }
            }
          }
          
          // 检查嵌套错误
          if (revertReason === '未知原因' && simulationErr.error) {
            if (typeof simulationErr.error.message === 'string') {
              // 查找嵌套错误中的原因
              const nestedMatch = simulationErr.error.message.match(/revert(?:ed)? (?:with|:) (.+?)(?:\s|$)/i);
              if (nestedMatch && nestedMatch[1]) {
                revertReason = nestedMatch[1].trim();
              }
            }
            
            // 检查reason属性
            if (simulationErr.error.reason) {
              revertReason = simulationErr.error.reason;
            }
          }
          
          // 从errorMsg中尝试提取
          if (revertReason === '未知原因') {
            const msgMatch = errorMsg.match(/reason: ?['"](.*?)['"],?/i);
            if (msgMatch && msgMatch[1]) {
              revertReason = msgMatch[1];
            } else if (errorMsg.includes('out of gas')) {
              revertReason = 'Gas不足';
            } else if (errorMsg.includes('user rejected')) {
              revertReason = '用户拒绝交易';
            }
          }
          
          // 使用人类可读的错误描述
          let humanReadableError = revertReason;
          for (const pattern in this.errorPatternToMessage) {
            if (revertReason.toLowerCase().includes(pattern)) {
              humanReadableError = this.errorPatternToMessage[pattern];
              break;
            }
          }
          
          // 最终确定错误原因
          const reason = `交易可能会失败: ${humanReadableError}`;
          console.error('预计交易会被拒绝: ' + reason);
          
          // 记录失败预测
          this.recordFailedTransaction(txType, args, null, revertReason);
          
          // 记录被拒绝的交易
          this.rejectedTransactions.unshift({
            type: txType,
            estimatedGas: '交易会被拒绝',
            gasPrice: '未知',
            timestamp: Date.now(),
            reason: `交易会被拒绝: ${humanReadableError}`
          });
          
          // 限制数组大小
          if (this.rejectedTransactions.length > 50) {
            this.rejectedTransactions.pop();
          }
          
          // 更新UI
          this.updateUI();
          
          // 提示用户
          this.showNotification(`交易已取消: ${reason}`, 'error', 10000);
          
          // 返回拒绝结果
          return {
            success: false,
            rejected: true,
            reason: `交易被GasLimitChecker插件拒绝: ${reason}`
          };
        }
      }
      
      // 尝试估算Gas
      let estimatedGas;
      try {
        // 调用合约的estimateGas方法估算gas
        estimatedGas = await intent.contract.estimateGas[intent.methodName](...args, overrides || {});
        estimatedGas = parseInt(estimatedGas.toString(), 10);
        
        // 获取该交易类型的安全系数
        const safetyMultiplier = this.gasEstimateMultipliers[txType] || this.gasEstimateMultipliers.default;
        
        // 添加安全系数，实际执行可能比估算值高
        estimatedGas = Math.ceil(estimatedGas * safetyMultiplier);
        console.log(`Gas估算成功: ${estimatedGas} (已增加${(safetyMultiplier - 1) * 100}%安全边际)`);
        
        // 返回成功的估算结果
        return {
          success: true,
          estimatedGas,
          rejected: false
        };
      } catch (err) {
        console.warn('Gas估算失败:', err);
        
        // 检查错误信息
        const errorStr = JSON.stringify(err).toLowerCase();
        
        // 尝试深入获取错误信息
        let detailedError = '';
        if (err.error) detailedError += JSON.stringify(err.error).toLowerCase();
        if (err.message) detailedError += ' ' + err.message.toLowerCase();
        if (err.data) detailedError += ' ' + JSON.stringify(err.data).toLowerCase();
        if (err.reason) detailedError += ' ' + err.reason.toLowerCase();
        if (err.details) detailedError += ' ' + err.details.toLowerCase();
        
        const combinedErrorStr = (errorStr + ' ' + detailedError).toLowerCase();
        
        // 检查是否因为Gas价格过低导致估算失败
        if (combinedErrorStr.includes('maxfeepergas too low') || 
            combinedErrorStr.includes('gas price too low') || 
            combinedErrorStr.includes('gas fee too low') ||
            combinedErrorStr.includes('max fee per gas too low') ||
            combinedErrorStr.includes('maxfeepergas too low to be include') ||
            combinedErrorStr.includes('underpriced') ||
            combinedErrorStr.includes('fee too low') ||
            combinedErrorStr.includes('gas too low') ||
            combinedErrorStr.includes('基础费用太低') ||
            combinedErrorStr.includes('低于允许的最小值') ||
            combinedErrorStr.includes('below minimum') ||
            combinedErrorStr.includes('insufficient funds') ||
            combinedErrorStr.includes('低于最小gas价格')) {
          
          const reason = 'Gas价格太低，无法被网络接受，请在游戏中提高Gas价格设置';
          console.error('交易被拒绝: ' + reason, err);
          
          // 记录被拒绝的交易
          this.rejectedTransactions.unshift({
            type: txType,
            estimatedGas: '未知',
            gasPrice: '过低',
            timestamp: Date.now(),
            reason: 'Gas价格过低'
          });
          
          // 限制数组大小
          if (this.rejectedTransactions.length > 50) {
            this.rejectedTransactions.pop();
          }
          
          // 更新UI
          this.updateUI();
          
          // 提示用户
          this.showNotification(`交易已取消: ${reason}`, 'error', 10000);
          
          // 返回拒绝结果
          return {
            success: false,
            rejected: true,
            reason: `交易被GasLimitChecker插件拒绝: ${reason}`
          };
        }
        
        // 检查是否因为Gas Limit不足导致估算失败
        if (combinedErrorStr.includes('gas limit') || 
            combinedErrorStr.includes('out of gas') || 
            combinedErrorStr.includes('exceeds gas limit') ||
            combinedErrorStr.includes('exceeds block gas limit') ||
            combinedErrorStr.includes('gas不足') ||
            combinedErrorStr.includes('gas不够') ||
            combinedErrorStr.includes('超出gas限制')) {
          
          const reason = 'Gas限制不足，交易可能会失败，请在游戏中提高Gas限制设置';
          console.error('交易被拒绝: ' + reason, err);
          
          // 记录被拒绝的交易
          this.rejectedTransactions.unshift({
            type: txType,
            estimatedGas: '超出限制',
            gasPrice: '未知',
            timestamp: Date.now(),
            reason: 'Gas限制不足'
          });
          
          // 限制数组大小
          if (this.rejectedTransactions.length > 50) {
            this.rejectedTransactions.pop();
          }
          
          // 更新UI
          this.updateUI();
          
          // 提示用户
          this.showNotification(`交易已取消: ${reason}`, 'error', 10000);
          
          // 返回拒绝结果
          return {
            success: false,
            rejected: true,
            reason: `交易被GasLimitChecker插件拒绝: ${reason}`
          };
        }
        
        // 估算失败但不是因为上述原因，使用一个保守的估算值
        const conservativeEstimate = Math.max(this.defaultMaxGasLimit, 3000000);
        console.warn(`Gas估算失败，使用保守估算值: ${conservativeEstimate}`);
        
        return {
          success: false,
          estimatedGas: conservativeEstimate,
          rejected: false
        };
      }
    } catch (err) {
      console.error('估算交易Gas失败:', err);
      
      // 出错时使用一个保守的估算值
      return {
        success: false,
        estimatedGas: Math.max(this.defaultMaxGasLimit, 3000000),
        rejected: false
      };
    }
  }

  /**
   * 拦截网络请求以检测Gas错误
   */
  interceptNetworkRequests() {
    try {
      // 只在window和XMLHttpRequest可用的环境中执行
      if (typeof window === 'undefined' || !window.XMLHttpRequest) {
        return;
      }
      
      const self = this;
      const originalXHRSend = XMLHttpRequest.prototype.send;
      const originalFetch = window.fetch;
      
      // 拦截XMLHttpRequest发送
      XMLHttpRequest.prototype.send = function(body) {
        const originalOnReadyStateChange = this.onreadystatechange;
        
        this.onreadystatechange = function() {
          if (this.readyState === 4) {
            try {
              // 检查是否包含Gas错误
              if (this.responseText && typeof this.responseText === 'string') {
                const responseStr = this.responseText.toLowerCase();
                console.log('XHR响应检查Gas错误:', responseStr.substring(0, 200) + '...');
                
                if (responseStr.includes('maxfeepergas too low') || 
                    responseStr.includes('gas too low') ||
                    responseStr.includes('underpriced') ||
                    responseStr.includes('fee too low') ||
                    responseStr.includes('gas price too low') ||
                    responseStr.includes('insufficient funds') ||
                    responseStr.includes('low fee') ||
                    responseStr.includes('below minimum') ||
                    responseStr.includes('低于最小gas')) {
                  
                  console.error('网络请求拦截到Gas错误:', this.responseText);
                  self.showNotification('检测到交易失败: Gas价格太低，请在游戏中提高Gas设置', 'error', 10000);
                }
              }
            } catch (e) {
              console.error('检查XHR响应错误:', e);
            }
          }
          
          if (originalOnReadyStateChange) {
            originalOnReadyStateChange.apply(this, arguments);
          }
        };
        
        return originalXHRSend.apply(this, arguments);
      };
      
      // 拦截Fetch请求
      window.fetch = async function(...args) {
        try {
          const response = await originalFetch.apply(this, args);
          
          // 克隆响应以避免消耗流
          const clonedResponse = response.clone();
          
          // 尝试读取响应并检查Gas错误
          clonedResponse.text().then(text => {
            try {
              console.log('Fetch响应检查Gas错误:', text.substring(0, 200) + '...');
              const lowerText = text.toLowerCase();
              
              if (lowerText.includes('maxfeepergas too low') || 
                  lowerText.includes('gas too low') ||
                  lowerText.includes('gas price too low') ||
                  lowerText.includes('underpriced') ||
                  lowerText.includes('fee too low') ||
                  lowerText.includes('insufficient funds') ||
                  lowerText.includes('below minimum') ||
                  lowerText.includes('低于最小gas')) {
                
                console.error('Fetch请求拦截到Gas错误:', text);
                self.showNotification('检测到交易失败: Gas价格太低，请在游戏中提高Gas设置', 'error', 10000);
              }
            } catch (e) {
              console.error('检查Fetch响应错误:', e);
            }
          }).catch(err => {
            console.error('读取Fetch响应失败:', err);
          });
          
          return response;
        } catch (error) {
          console.error('Fetch请求失败:', error);
          throw error;
        }
      };
    } catch (err) {
      console.error('设置网络请求拦截器失败:', err);
    }
  }

  /**
   * 启动自动同步
   */
  startAutoSync() {
    if (this.autoSyncEnabled && !this.autoSyncInterval) {
      // 每5分钟检查一次游戏设置变化
      this.autoSyncInterval = setInterval(() => {
        this.checkForGasSettingsChange();
      }, 5 * 60 * 1000);
      
      console.log('已启动Gas设置自动同步');
    }
  }
  
  /**
   * 停止自动同步
   */
  stopAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
      console.log('已停止Gas设置自动同步');
    }
  }
  
  /**
   * 检查Gas设置是否有变化
   */
  async checkForGasSettingsChange() {
    try {
      if (!window.df) return;
      
      const config = {
        contractAddress: typeof df.contractAddress === 'function' ? df.contractAddress() : df.contractAddress,
        account: typeof df.account === 'function' ? df.account() : df.account
      };
      
      if (!config.contractAddress || !config.account) return;
      
      // 获取当前游戏的Gas设置
      const gasFeeGweiKey = `${config.contractAddress}:${config.account}:GasFeeGwei`;
      const gasFeeLimitKey = `${config.contractAddress}:${config.account}:GasFeeLimit`;
      
      const storedGasFeeGwei = localStorage.getItem(gasFeeGweiKey);
      const storedGasFeeLimit = localStorage.getItem(gasFeeLimitKey);
      
      const currentSettings = {
        gasFeeGwei: storedGasFeeGwei ? parseFloat(storedGasFeeGwei) : null,
        gasFeeLimit: storedGasFeeLimit ? parseInt(storedGasFeeLimit, 10) : null
      };
      
      // 比较当前设置和上次同步的设置
      const hasChanged = 
        this.lastGasSettings.gasFeeGwei !== currentSettings.gasFeeGwei ||
        this.lastGasSettings.gasFeeLimit !== currentSettings.gasFeeLimit;
      
      if (hasChanged) {
        console.log('检测到Gas设置变化，正在同步...');
        this.syncFromGameSettings();
        
        // 更新上次同步的设置
        this.lastGasSettings = { ...currentSettings };
        this.lastSyncTime = Date.now();
      }
    } catch (err) {
      console.error('检查Gas设置变化时出错:', err);
    }
  }

  /**
   * 设置交易结果监控
   * 监控交易完成事件，记录成功和失败的交易模式
   */
  setupTransactionMonitoring() {
    try {
      if (!window.df || !df.contractsAPI || !df.contractsAPI.txExecutor) {
        console.warn('无法设置交易监控，txExecutor不可用');
        return;
      }
      
      // 监听交易完成事件
      const self = this;
      
      // 保存原始的onTransactionResponse方法
      if (df.contractsAPI.txExecutor.onTransactionResponse) {
        const originalOnResponse = df.contractsAPI.txExecutor.onTransactionResponse;
        
        df.contractsAPI.txExecutor.onTransactionResponse = function(txHash, contractAddress, methodName, args) {
          // 先调用原始方法
          const result = originalOnResponse.apply(this, arguments);
          
          // 记录交易开始
          console.log(`交易开始执行: ${methodName}, 哈希: ${txHash}`);
          
          // 持续监控此交易直到确认或失败
          self.monitorTransaction(txHash, methodName, args);
          
          return result;
        };
      }
      
      // 如果df.contractsAPI.txExecutor有onTransactionReceipt方法，覆盖它
      if (df.contractsAPI.txExecutor.onTransactionReceipt) {
        const originalOnReceipt = df.contractsAPI.txExecutor.onTransactionReceipt;
        
        df.contractsAPI.txExecutor.onTransactionReceipt = function(txHash, contractAddress, methodName, args, receipt) {
          // 先调用原始方法
          const result = originalOnReceipt.apply(this, arguments);
          
          // 检查交易是否成功
          if (receipt && receipt.status === 1) {
            console.log(`交易成功: ${methodName}, 哈希: ${txHash}`);
            self.recordSuccessfulTransaction(methodName, args, receipt);
          } else {
            console.error(`交易失败: ${methodName}, 哈希: ${txHash}`, receipt);
            self.recordFailedTransaction(methodName, args, receipt, '交易回执状态为失败');
          }
          
          return result;
        };
      }
      
      console.log('交易监控设置完成');
    } catch (err) {
      console.error('设置交易监控失败:', err);
    }
  }
  
  /**
   * 监控交易直到完成
   * @param {string} txHash 交易哈希
   * @param {string} methodName 方法名
   * @param {Array} args 参数
   */
  async monitorTransaction(txHash, methodName, args) {
    if (!txHash) return;
    
    try {
      // 获取提供者
      let provider = null;
      if (df.ethConnection && df.ethConnection.provider) {
        provider = df.ethConnection.provider;
      }
      
      if (!provider) {
        console.warn('无法监控交易，找不到适合的提供者');
        return;
      }
      
      // 等待交易被挖出
      try {
        console.log(`等待交易确认: ${txHash}`);
        const receipt = await provider.waitForTransaction(txHash, 1); // 等待1个确认
        
        if (receipt.status === 1) {
          console.log(`交易确认成功: ${methodName}, 哈希: ${txHash}`);
          this.recordSuccessfulTransaction(methodName, args, receipt);
        } else {
          console.error(`交易确认失败: ${methodName}, 哈希: ${txHash}`, receipt);
          this.recordFailedTransaction(methodName, args, receipt, '交易状态为失败');
        }
      } catch (error) {
        console.error(`监控交易时出错: ${txHash}`, error);
        this.recordFailedTransaction(methodName, args, null, error.message || '未知错误');
      }
    } catch (err) {
      console.error('监控交易过程中出错:', err);
    }
  }
  
  /**
   * 记录成功的交易
   * @param {string} methodName 方法名
   * @param {Array} args 参数
   * @param {Object} receipt 交易回执
   */
  recordSuccessfulTransaction(methodName, args, receipt) {
    try {
      // 初始化成功记录
      if (!this.transactionHistory.successfulTxs[methodName]) {
        this.transactionHistory.successfulTxs[methodName] = {
          count: 0,
          lastSuccess: 0,
          avgGasUsed: 0
        };
      }
      
      // 更新成功计数和时间
      const record = this.transactionHistory.successfulTxs[methodName];
      record.count++;
      record.lastSuccess = Date.now();
      
      // 如果有Gas使用量，更新平均值
      if (receipt && receipt.gasUsed) {
        const gasUsed = parseInt(receipt.gasUsed.toString(), 10);
        record.avgGasUsed = ((record.avgGasUsed * (record.count - 1)) + gasUsed) / record.count;
        console.log(`更新 ${methodName} 的平均Gas使用量: ${record.avgGasUsed}`);
        
        // 更新自定义的Gas倍率
        const safetyMultiplier = Math.max(1.1, gasUsed / record.avgGasUsed * 1.05); // 5%的额外边际
        this.gasEstimateMultipliers[methodName] = safetyMultiplier;
      }
    } catch (err) {
      console.error('记录成功交易时出错:', err);
    }
  }
  
  /**
   * 记录失败的交易
   * @param {string} methodName 方法名
   * @param {Array} args 参数
   * @param {Object} receipt 交易回执
   * @param {string} errorReason 错误原因
   */
  recordFailedTransaction(methodName, args, receipt, errorReason) {
    try {
      // 初始化失败记录
      if (!this.transactionHistory.failedTxs[methodName]) {
        this.transactionHistory.failedTxs[methodName] = {
          count: 0,
          lastFailure: 0,
          reasons: {}
        };
      }
      
      // 更新失败计数和时间
      const record = this.transactionHistory.failedTxs[methodName];
      record.count++;
      record.lastFailure = Date.now();
      
      // 记录具体错误原因
      const reasonKey = errorReason || '未知原因';
      if (!record.reasons[reasonKey]) {
        record.reasons[reasonKey] = 0;
      }
      record.reasons[reasonKey]++;
      
      // 更新失败模式
      if (!this.transactionHistory.revertPatterns[methodName]) {
        this.transactionHistory.revertPatterns[methodName] = {};
      }
      
      // 尝试找到更易读的错误描述
      let humanReadableError = reasonKey;
      for (const pattern in this.errorPatternToMessage) {
        if (reasonKey.toLowerCase().includes(pattern)) {
          humanReadableError = this.errorPatternToMessage[pattern];
          break;
        }
      }
      
      // 记录这种操作的常见失败原因
      const revertPattern = this.transactionHistory.revertPatterns[methodName];
      if (!revertPattern[humanReadableError]) {
        revertPattern[humanReadableError] = 0;
      }
      revertPattern[humanReadableError]++;
      
      console.log(`记录 ${methodName} 的失败原因: ${humanReadableError}`);
    } catch (err) {
      console.error('记录失败交易时出错:', err);
    }
  }
  
  /**
   * 获取方法的历史失败原因
   * @param {string} methodName 方法名
   * @returns {string} 最常见的失败原因
   */
  getMostCommonFailureReason(methodName) {
    try {
      // 检查是否有这个方法的历史失败记录
      if (!this.transactionHistory.revertPatterns[methodName]) {
        return null;
      }
      
      // 找出最常见的失败原因
      const reasons = this.transactionHistory.revertPatterns[methodName];
      let maxCount = 0;
      let mostCommonReason = null;
      
      for (const reason in reasons) {
        if (reasons[reason] > maxCount) {
          maxCount = reasons[reason];
          mostCommonReason = reason;
        }
      }
      
      return mostCommonReason;
    } catch (err) {
      console.error('获取失败原因时出错:', err);
      return null;
    }
  }

  /**
   * 卸载插件时的清理工作
   */
  cleanup() {
    // 停止自动同步
    this.stopAutoSync();
    
    // 恢复原始的网络请求方法
    try {
      if (typeof window !== 'undefined') {
        if (window.XMLHttpRequest && window.XMLHttpRequest.prototype.send.__originalSend) {
          window.XMLHttpRequest.prototype.send = window.XMLHttpRequest.prototype.send.__originalSend;
        }
        
        if (window.fetch && window.fetch.__originalFetch) {
          window.fetch = window.fetch.__originalFetch;
        }
      }
    } catch (e) {
      console.error('恢复原始网络请求方法失败:', e);
    }
    
    // 恢复原始的queueTransaction方法
    if (df && df.contractsAPI && df.contractsAPI.txExecutor) {
      // 注意：这里我们无法完全恢复原始方法，因为没有保存引用
      // 在实际使用中，可能需要页面刷新才能完全恢复
      console.log('GasLimitChecker插件已卸载，但游戏需要刷新才能完全恢复原始行为');
    }
  }

  /**
   * 显示通知的安全方法，防止df.notifications未定义
   */
  showNotification(message, type = 'info', timeout = 5000) {
    try {
      // 首先尝试使用游戏的通知系统
      if (df && df.notifications && typeof df.notifications.showNotification === 'function') {
        df.notifications.showNotification(message, type, timeout);
        return;
      }
      
      // 如果游戏通知系统不可用，尝试其他可能的方法
      if (df && typeof df.terminal?.current?.println === 'function') {
        // 使用终端输出
        const prefix = type === 'error' ? '[错误]' : '[信息]';
        df.terminal.current.println(`${prefix} ${message}`);
        return;
      }
      
      // 最后的后备方案：使用浏览器alert（仅错误情况下）
      if (type === 'error') {
        alert(`Gas费用检查器: ${message}`);
      }
      
      // 始终在控制台输出
      const logMethod = type === 'error' ? console.error : console.log;
      logMethod(`[Gas费用检查器] ${message}`);
    } catch (e) {
      // 确保通知方法本身不会引发错误
      console.error('显示通知失败:', e);
    }
  }
}

// 注册插件
class GasLimitCheckerPlugin {
  constructor() {
    this.checker = new GasLimitChecker();
  }
  
  render(container) {
    this.checker.render(container);
  }
  
  destroy() {
    this.checker.cleanup();
  }
}

export default GasLimitCheckerPlugin;
