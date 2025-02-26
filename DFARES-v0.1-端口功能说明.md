# DFARES-v0.1 前端端口功能说明

## 开发环境端口

### 前端开发服务器
- **端口号**: 8081
- **协议**: HTTP
- **配置位置**: `/webpack.config.js`
- **功能描述**: 
  - 用于开发环境中的前端开发服务器
  - 提供热重载功能
  - 支持历史API回退 (historyApiFallback)，用于SPA单页应用路由

## API端点

### TheGraph API
- **URL**: `https://api.thegraph.com/subgraphs/name/darkforest-eth/dark-forest-v06-round-5`
- **配置位置**: `/packages/constants/src/index.ts`
- **功能描述**:
  - 用于查询区块链数据
  - 提供游戏相关的链上数据索引和查询服务
  - 每个游戏回合都会更新

### 后端服务API (UtilityServerAPI)
- **基础URL**: 由环境变量 `DF_WEBSERVER_URL` 定义
- **相关文件**: `/client/src/Backend/Network/UtilityServerAPI.ts`
- **提供的端点**:
  - `/email/interested` - 提交感兴趣的邮箱
  - `/email/unsubscribe` - 取消邮件订阅
  - `/email/player` - 提交玩家邮箱
  - `/whitelist/register` - 注册白名单
  - `/whitelist/status` - 查询白名单状态
  - `/whitelist/key` - 提交白名单密钥
  - `/faucet` - 开发测试网代币水龙头
  - `/twitter/all` - 获取所有Twitter账号映射
  - `/twitter/verify` - 验证Twitter账号
  - `/twitter/disconnect` - 断开Twitter账号连接
- **功能描述**:
  - 处理用户注册和认证
  - 管理电子邮件订阅
  - 提供白名单和开发资源
  - 管理社交媒体连接

### NFT API
- **URL**: `https://nft.dfares.xyz/token-uri/artifact/`
- **配置位置**: `/eth/tasks/deploy.ts`
- **功能描述**:
  - 提供NFT元数据服务
  - 支持游戏中的物品铸造

### 区块链浏览器API
- **URL**: `https://explorer.redstone.xyz`
- **配置位置**: `/packages/constants/src/index.ts` 中的 `BLOCK_EXPLORER_URL`
- **功能描述**:
  - 用于查询交易和合约状态
  - 提供区块链数据浏览

### Gas价格Oracle
- **URL**: `https://blockscout.com/xdai/mainnet/api/v1/gas-price-oracle`
- **配置位置**: `/packages/constants/src/index.ts` 中的 `GAS_PRICE_API`
- **功能描述**:
  - 提供最佳Gas价格建议
  - 优化交易成本

### 本地开发区块链
- **URL**: `http://localhost:8545`
- **功能描述**:
  - 本地开发环境中的以太坊节点
  - 用于测试智能合约和游戏功能

### 图片资源服务
- **URL**: `https://dfares.xyz/public`
- **配置位置**: `/packages/constants/src/index.ts` 中的 `PICTURE_URL`
- **功能描述**:
  - 提供游戏使用的图片资源
  - 支持UI和视觉元素

### 远程挖矿服务
- **URL**: `http://0.0.0.0:8000/mine`
- **参考文件**: `Remote-Explorer.ts`
- **功能描述**:
  - 支持远程挖矿功能
  - 可使用不同的挖矿模式（如"spiral"）

### 玩家指南链接
- **URL**: `https://dfares.notion.site/DFAres-Round-4-Guide-c52181824f21461f9fa50a9f7989555c?pvs=74`
- **配置位置**: `/packages/constants/src/index.ts`
- **功能描述**:
  - 提供游戏指南和规则文档
  - 面向玩家的游戏教程和资源

### 其他资源链接
- **转账指南**: `https://dfares.notion.site/How-to-transfer-ETH-from-L2-to-Redstone-Mainnet-f0be2d7a3d274e8a88f8e83d0ef4e212?pvs=74`
- **弹窗帮助**: `https://dfares.notion.site/How-to-enable-popups-d0f939dd9a114ae38ea5fbc7ed401828?pvs=74`
- **获奖条件**: `https://dfares.notion.site/1-1-Win-Conditions-Prizes-a284690f35b44a29b0d1100bbaa3e8e0?pvs=74`
- **功能描述**:
  - 提供游戏相关的帮助文档
  - 解释游戏特定功能和机制

## Dark Forest 前端API模块

### @darkforest_eth 模块系统
- **引用方式**: `https://cdn.skypack.dev/@darkforest_eth/...`
- **主要模块**:
  - `@darkforest_eth/types` - 游戏类型定义
  - `@darkforest_eth/renderer` - 渲染器相关功能
  - `@darkforest_eth/constants` - 游戏常量
  - `@darkforest_eth/procedural` - 程序化生成
  - `@darkforest_eth/serde` - 序列化/反序列化
- **功能描述**:
  - 提供游戏核心功能的模块化访问
  - 允许插件开发者使用官方功能

#### 模块引入方式
```javascript
// 从CDN引入
import { WorldCoords, PlanetType } from 'https://cdn.skypack.dev/@darkforest_eth/types';
import { GenericRenderer } from 'https://cdn.skypack.dev/@darkforest_eth/renderer';
```

#### 在插件中使用
```javascript
class MyPlugin {
  constructor() {
    this.worldCoords = null;
    this.renderer = null;
  }

  async render(div) {
    // 获取UI管理器
    const ui = df.ui;
    
    // 使用类型和渲染器
    this.worldCoords = ui.getWorldCoords();
    const glManager = ui.getGlManager();
    
    // 创建自定义渲染器
    this.renderer = new GenericRenderer(glManager);
  }
}
```

### 类型系统 (@darkforest_eth/types)
- **主要类型**:
  - `RendererType` - 渲染器类型枚举
  - `AttribType` - 属性类型枚举
  - `UniformType` - Uniform类型枚举
  - `GameViewport` - 游戏视口接口
  - `CanvasCoords` - 画布坐标接口
  - `WorldCoords` - 世界坐标接口
  - `Planet` - 行星数据接口
  - `PlanetType` - 行星类型枚举
  - `PlanetLevel` - 行星等级枚举
  - `SpaceType` - 空间类型枚举
- **功能描述**:
  - 定义游戏中使用的所有类型和接口
  - 支持强类型开发

#### 使用坐标系统示例
```javascript
// 创建世界坐标
const worldPos = { x: 1000, y: 2000 };

// 使用视口转换坐标
const viewport = ui.getViewport();
const canvasPos = viewport.worldToCanvasCoords(worldPos);

// 显示坐标信息
console.log(`世界坐标: (${worldPos.x}, ${worldPos.y})`);
console.log(`画布坐标: (${canvasPos.x}, ${canvasPos.y})`);
```

#### 使用行星类型示例
```javascript
// 检查行星类型
function getPlanetDescription(planet) {
  // 使用PlanetType枚举
  switch (planet.planetType) {
    case PlanetType.PLANET:
      return "普通行星";
    case PlanetType.SILVER_MINE:
      return "银矿";
    case PlanetType.RUINS:
      return "遗迹";
    case PlanetType.TRADING_POST:
      return "交易站";
    default:
      return "未知类型";
  }
}
```

### 渲染器API (@darkforest_eth/renderer)
- **主要类**:
  - `GenericRenderer` - 基础渲染器类
  - `GameGLManager` - WebGL上下文管理
  - `EngineUtils` - 渲染引擎工具
- **主要函数**:
  - `glsl` - 着色器代码辅助函数
  - `makeEmptyDoubleQuad` - 创建空四边形
  - `makeDoubleQuadBuffered` - 创建缓冲四边形
- **功能描述**:
  - 提供WebGL渲染功能
  - 支持自定义着色器和渲染器开发

#### 创建自定义渲染器示例
```javascript
// 创建自定义行星渲染器
function createCustomPlanetRenderer(ui) {
  const glManager = ui.getGlManager();
  
  // 使用GenericRenderer
  const renderer = new GenericRenderer(glManager);
  
  // 使用着色器辅助函数
  const vertexShader = glsl`
    precision highp float;
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;
  
  const fragmentShader = glsl`
    precision highp float;
    void main() {
      gl_FragColor = vec4(1.0, 0.5, 0.0, 1.0); // 橙色
    }
  `;
  
  // 初始化渲染器
  renderer.setUniforms({});
  renderer.compileShaders(vertexShader, fragmentShader);
  
  return renderer;
}
```

### 插件API
- **主要方法**:
  - `ui.getViewport()` - 获取游戏视口
  - `ui.getGlManager()` - 获取WebGL管理器
  - `ui.get2dRenderer()` - 获取2D Canvas上下文
  - `ui.setCustomRenderer(renderer)` - 设置自定义渲染器
  - `ui.disableCustomRenderer(renderer)` - 禁用自定义渲染器
- **功能描述**:
  - 允许插件与游戏UI交互
  - 支持自定义视觉效果和交互

#### 插件开发完整示例
```javascript
// 简单的行星着色插件
class PlanetColorizer {
  constructor() {
    this.container = null;
    this.planetColors = new Map();
  }
  
  async render(container) {
    this.container = container;
    container.style.width = '200px';
    
    // 创建UI
    const colorButton = document.createElement('button');
    colorButton.innerText = '给行星着色';
    colorButton.onclick = () => this.colorizeSelectedPlanet();
    container.appendChild(colorButton);
    
    // 创建颜色选择器
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.value = '#00ff00';
    colorPicker.id = 'planet-color';
    container.appendChild(colorPicker);
    
    // 注册渲染回调
    df.renderer.on('renderPlanet', (planet) => {
      this.onRenderPlanet(planet);
    });
  }
  
  colorizeSelectedPlanet() {
    const planet = ui.getSelectedPlanet();
    if (!planet) {
      alert('请先选择一个行星');
      return;
    }
    
    const color = document.getElementById('planet-color').value;
    this.planetColors.set(planet.locationId, color);
  }
  
  onRenderPlanet(planet) {
    if (this.planetColors.has(planet.locationId)) {
      const color = this.planetColors.get(planet.locationId);
      // 这里实现自定义渲染
      // 实际实现会更复杂，需要使用WebGL
    }
  }
  
  destroy() {
    this.container.innerHTML = '';
  }
}

// 注册插件
class Plugin {
  constructor() {
    this.colorizer = new PlanetColorizer();
  }
  
  async render(container) {
    this.colorizer.render(container);
  }
}

export default Plugin;
```

## 前端视图端口和交互接口

### Viewport模块
- **文件位置**: `/client/src/Frontend/Game/Viewport.ts`
- **主要功能**:
  - 控制游戏视图的显示与交互
  - 处理平移和缩放操作
  - 转换坐标系统（画布坐标与世界坐标之间的转换）
  - 管理视口状态和用户交互

### 关键接口方法
- **坐标转换**:
  - `worldToCanvasCoords(worldCoords: WorldCoords): CanvasCoords` - 将世界坐标转换为画布坐标
  - `canvasToWorldCoords(canvasCoords: CanvasCoords): WorldCoords` - 将画布坐标转换为世界坐标
  - `worldToCanvasDist(d: number): number` - 将世界距离转换为画布距离
  - `canvasToWorldDist(d: number): number` - 将画布距离转换为世界距离

- **视图操作**:
  - `centerPlanet(planet: Planet)` - 将视图中心设置为特定行星
  - `zoomPlanet(planet?: Planet, radii?: number)` - 缩放到特定行星
  - `centerCoords(coords: WorldCoords)` - 将视图中心设置为特定坐标
  - `centerChunk(chunk: Chunk)` - 将视图中心设置为特定区块
  - `zoomIn()` - 放大视图
  - `zoomOut()` - 缩小视图

- **事件处理**:
  - `onMouseDown(canvasCoords: CanvasCoords)` - 处理鼠标按下事件
  - `onMouseMove(canvasCoords: CanvasCoords)` - 处理鼠标移动事件
  - `onMouseUp(canvasCoords: CanvasCoords)` - 处理鼠标释放事件
  - `onScroll(deltaY: number, forceZoom = false)` - 处理滚轮事件
  - `onWindowResize()` - 处理窗口大小改变事件

#### Viewport使用示例
```javascript
// 获取游戏视口
const viewport = df.ui.getViewport();

// 中心定位到特定坐标
viewport.centerCoords({ x: 0, y: 0 });

// 放大视图
viewport.zoomIn();

// 获取鼠标位置对应的世界坐标
function onMouseMove(e) {
  const canvasCoords = { x: e.clientX, y: e.clientY };
  const worldCoords = viewport.canvasToWorldCoords(canvasCoords);
  console.log(`鼠标指向的世界坐标: (${worldCoords.x}, ${worldCoords.y})`);
}

// 缩放到特定行星
function focusOnPlanet(planetId) {
  const planet = df.getPlanetWithId(planetId);
  if (planet) {
    viewport.centerPlanet(planet);
    viewport.zoomPlanet(planet, 2); // 2倍行星半径的视图
  }
}
```

## 前端核心模块

### GameUIManager
- **文件位置**: `/client/src/Backend/GameLogic/GameUIManager.ts`
- **主要功能**:
  - 管理游戏UI状态
  - 处理用户交互
  - 连接游戏逻辑与前端显示

#### GameUIManager使用示例
```javascript
// 获取当前选中的行星
const selectedPlanet = df.ui.getSelectedPlanet();

// 获取当前用户的行星
const myPlanets = df.getMyPlanets();

// 选择一个行星
function selectPlanet(planetId) {
  df.ui.setSelectedPlanet(planetId);
}

// 获取当前游戏状态
function getGameState() {
  return {
    selectedPlanet: df.ui.getSelectedPlanet(),
    hoverPlanet: df.ui.getHoverPlanet(),
    viewportChunk: df.ui.getViewportChunk(),
    gameTime: df.ui.getGameTime()
  };
}
```

### Monomitter系统
- **模块**: `@dfares/events`
- **功能描述**:
  - 事件发布与订阅系统
  - 用于组件间通信
  - 实现类似响应式的数据流

#### Monomitter使用示例
```javascript
// 订阅行星选择事件
df.ui.selectedPlanetId$.subscribe((planetId) => {
  if (planetId) {
    console.log(`选中了行星: ${planetId}`);
    const planet = df.getPlanetWithId(planetId);
    updatePlanetInfo(planet);
  } else {
    console.log('取消选择行星');
    clearPlanetInfo();
  }
});

// 订阅游戏时间变化
df.ui.gameTime$.subscribe((gameTime) => {
  console.log(`游戏时间更新: ${gameTime}`);
  updateGameClock(gameTime);
});

// 自定义事件处理函数
function updatePlanetInfo(planet) {
  // 更新UI显示
}

function clearPlanetInfo() {
  // 清除UI显示
}

function updateGameClock(time) {
  // 更新游戏时钟显示
}
```

### 插件系统
- **模块**: `@dfares/types` 中的 `PluginId` 
- **相关文件**: 
  - `/client/src/Backend/GameLogic/PluginManager.tsx`
  - `/client/src/Backend/Plugins/SerializedPlugin.ts`
  - `/client/src/Backend/Plugins/EmbeddedPluginLoader.ts`
- **功能描述**:
  - 提供插件加载和管理
  - 支持嵌入式插件与外部插件
  - 允许玩家扩展游戏功能

## 游戏数据模型接口

### 世界坐标系统
- **模块**: `@dfares/types` 中的 `WorldCoords`、`CanvasCoords`
- **功能描述**:
  - 定义游戏世界中的位置
  - 提供坐标计算和转换方法

### 区块系统
- **模块**: `@dfares/types` 中的 `Chunk`
- **相关文件**: 
  - `/client/src/Backend/Miner/ChunkUtils.ts`
  - `/client/src/Backend/Storage/PersistentChunkStore.ts`
- **功能描述**:
  - 将游戏世界分割为可管理的区块
  - 支持数据加载和游戏世界生成

#### 区块系统使用示例
```javascript
// 获取当前视图区块
const currentChunk = df.ui.getViewportChunk();

// 加载特定区块数据
function loadChunkData(chunkX, chunkY) {
  const chunkId = df.getChunkKey(chunkX, chunkY);
  
  // 检查区块是否已加载
  const isExplored = df.getChunkStore().hasChunk(chunkId);
  
  if (!isExplored) {
    console.log(`区块(${chunkX},${chunkY})尚未探索`);
  } else {
    const chunk = df.getChunkStore().getChunkById(chunkId);
    console.log(`区块数据:`, chunk);
  }
}

// 计算坐标所在的区块
function getChunkFromCoords(worldX, worldY) {
  const chunkSize = df.getChunkSize();
  const chunkX = Math.floor(worldX / chunkSize);
  const chunkY = Math.floor(worldY / chunkSize);
  return { chunkX, chunkY };
}
```

### 行星系统
- **模块**: `@dfares/types` 中的 `Planet`、`PlanetType`、`PlanetLevel`
- **功能描述**:
  - 定义行星属性和类型
  - 行星交互与管理

#### 行星系统使用示例
```javascript
// 行星数据处理
function analyzePlanet(planetId) {
  const planet = df.getPlanetWithId(planetId);
  if (!planet) return "找不到行星";
  
  return {
    位置: planet.location,
    等级: planet.planetLevel,
    类型: planet.planetType,
    能量: planet.energy,
    银矿: planet.silver,
    拥有者: planet.owner,
    半径: planet.radius
  };
}

// 计算行星能量恢复时间
function calculateEnergyRecoveryTime(planetId, targetEnergyPercent) {
  const planet = df.getPlanetWithId(planetId);
  if (!planet) return "找不到行星";
  
  const currentEnergy = planet.energy;
  const energyCap = planet.energyCap;
  const targetEnergy = energyCap * (targetEnergyPercent / 100);
  const energyToRecover = targetEnergy - currentEnergy;
  
  if (energyToRecover <= 0) return "已达到目标能量";
  
  const energyPerHour = planet.energyGrowth;
  const hoursToRecover = energyToRecover / energyPerHour;
  
  return `恢复到${targetEnergyPercent}%能量需要${hoursToRecover.toFixed(2)}小时`;
}
```

## 渲染系统

### 渲染器类型
- **模块**: `@dfares/types` 中的 `RendererType`
- **主要渲染器**:
  - `PlanetRenderer` - 行星渲染器
  - `MineRenderer` - 小行星带渲染器
  - `SpaceRenderer` - 空间渲染器
  - `UnminedRenderer` - 未开采区域渲染器
  - `BackgroundRenderer` - 背景渲染器
- **功能描述**:
  - 定义不同游戏元素的渲染方式
  - 支持自定义视觉效果

### WebGL渲染接口
- **模块**: `@dfares/renderer` 中的 `GameGLManager`
- **功能描述**:
  - 包装`WebGL2RenderingContext`
  - 提供着色器程序管理
  - 支持高性能3D渲染

## 网络通信

### EthConnection
- **模块**: `@dfares/network` 中的 `EthConnection`
- **相关文件**: `/client/src/Backend/Network/Blockchain.ts`
- **功能描述**:
  - 与以太坊区块链通信
  - 处理智能合约交互
  - 管理交易和区块链事件

### 交易系统
- **模块**: `@dfares/network` 中的 `TxCollection`
- **功能描述**:
  - 管理游戏交易
  - 处理交易确认和事件

#### 网络通信使用示例
```javascript
// 与合约交互
async function sendFleet(fromId, toId, energy) {
  try {
    // 获取行星
    const from = df.getPlanetWithId(fromId);
    const to = df.getPlanetWithId(toId);
    
    // 使用游戏管理器发送交易
    await df.move(fromId, toId, energy, 0);
    
    return "舰队已发送";
  } catch (e) {
    return `发送失败: ${e.message}`;
  }
}

// 查询当前Gas价格
async function getCurrentGasPrice() {
  const provider = df.getEthConnection().getProvider();
  const gasPrice = await provider.getGasPrice();
  return `当前Gas价格: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`;
}

// 监听交易确认
function monitorTransaction(txHash) {
  df.getEthConnection().waitForTransaction(txHash)
    .then(receipt => {
      console.log(`交易已确认，区块号: ${receipt.blockNumber}`);
      if (receipt.status === 1) {
        console.log('交易成功');
      } else {
        console.log('交易失败');
      }
    })
    .catch(error => {
      console.error('交易错误:', error);
    });
}
```

### WebSocket通信
- **功能描述**:
  - 实时游戏事件通信
  - 同步游戏状态

## 哈希和加密系统

### 哈希函数
- **模块**: `@dfares/hashing`
- **主要函数**:
  - `mimcHash` - MiMC哈希算法实现
  - `perlin` - Perlin噪声函数
  - `fakeHash` - 用于测试的哈希函数
- **功能描述**:
  - 提供游戏中使用的加密和哈希功能
  - 支持游戏世界生成和验证

#### 哈希函数使用示例
```javascript
// 使用MiMC哈希
import { mimcHash } from 'https://cdn.skypack.dev/@darkforest_eth/hashing';

function hashCoords(x, y) {
  return mimcHash(x, y);
}

// 生成随机行星位置
function getRandomPlanetLocation(x, y, salt) {
  const hash = mimcHash(x, y, salt);
  // 将哈希值转换为坐标
  const newX = parseInt(hash.slice(0, 10), 16) % 1000;
  const newY = parseInt(hash.slice(10, 20), 16) % 1000;
  return { x: newX, y: newY };
}

// 使用Perlin噪声
import { perlin } from 'https://cdn.skypack.dev/@darkforest_eth/hashing';

function getBiomeAtLocation(x, y) {
  const noise = perlin(x, y);
  // 根据噪声值确定生物群系
  if (noise < -0.5) return "冰原";
  if (noise < 0) return "森林";
  if (noise < 0.5) return "平原";
  return "沙漠";
}
```

### 零知识证明系统
- **模块**: `@dfares/snarks`
- **相关文件**:
  - `@dfares/snarks/whitelist.wasm`
  - `@dfares/snarks/whitelist.zkey`
  - `@dfares/snarks/biomebase.wasm`
  - `@dfares/snarks/biomebase.zkey`
  - 其他SNARK电路文件
- **功能描述**:
  - 提供零知识证明功能
  - 用于游戏中的隐私保护与作弊防护

## 插件相关端口

### 插件CDN
- **URL**: `https://cdn.skypack.dev/@dfares/...` 和 `https://cdn.skypack.dev/@darkforest_eth/...`
- **功能描述**:
  - 用于加载游戏插件
  - 提供@dfares和@darkforest_eth命名空间下的各种模块
  - 包括游戏逻辑、类型定义、常量等
- **常用引用**:
  ```javascript
  import { RendererType } from 'https://cdn.skypack.dev/@darkforest_eth/types';
  import { EngineUtils, GenericRenderer, glsl } from 'https://cdn.skypack.dev/@darkforest_eth/renderer';
  ```

### 插件网站
- **URL**: `https://dfares-plugins.netlify.app/`
- **功能描述**:
  - 托管游戏插件的网站
  - 提供插件下载和信息

## 嵌入式插件
- **目录**: `/client/embedded_plugins/`
- **主要插件**:
  - `DarkSea-Market.js` - 游戏内市场
  - `Scoring-Planets.js` - 行星评分系统
  - `Score-Board.js` - 得分板
  - `Voyage-Time.js` - 航行时间计算
  - `Ares-Epic-Mint.js` - NFT铸造工具
  - `Map-Filter-Export.js` - 地图过滤与导出
  - `Repeat-Attack.js` - 重复攻击工具
  - `Bounty-Hunter.js` - 赏金猎人系统
  - `Towards-Center.js` - 中心导航工具

## 开发注意事项

1. DFARES-v0.1是Dark Forest游戏的改版，专注于竞技和特定回合的游戏体验
2. 该版本可能有不同于原版的API和接口变化
3. 端口配置可能因部署环境而有所不同
4. 前端端口主要用于界面渲染、用户交互和网络通信
5. 使用WebSocket进行实时通信，以太坊连接用于区块链交互
6. 本文档中的URL和端点可能会因部署环境或游戏版本更新而变化
7. DFARES-v0.1使用了大部分原始Dark Forest的API结构，但做了一些修改，如命名空间从`@darkforest_eth/`变更为`@dfares/`
8. 在开发插件时，应始终通过`df`全局对象和`ui`接口访问游戏功能
9. 渲染器API需要一定的WebGL知识，建议先了解基本的着色器编程
10. 自定义渲染器会在每一帧被调用，注意性能优化

## 开发资源

游戏源代码和文档可在以下地址找到:
- GitHub: `https://github.com/dfarchon/DFARES-v0.1/`
- API文档: 
  - `https://github.com/dfarchon/DFARES-v0.1/blob/main/client/docs/classes/Backend_GameLogic_GameManager.default.md`
  - `https://github.com/dfarchon/DFARES-v0.1/blob/main/client/docs/classes/Backend_GameLogic_GameUIManager.default.md`
- 原始Dark Forest资源:
  - `https://github.com/darkforest-eth/client`
  - `https://github.com/darkforest-eth/packages` 