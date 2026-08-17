# 雁讯咨询贷款 CRM 与业务工作台

面向助贷与贷款咨询业务的全链路 CRM 与业务工作台，覆盖从线索获客、电销跟进、智能评估、进件报审、财务结算到贷后回访的完整业务闭环。

> **版本**：v1.0.0（正式版）｜ **构建**：`npm run build:prod`

## 功能模块

| 模块 | 说明 |
|---|---|
| **工作台** | 极简作业模式（默认，专注跟进出单）/ 全景分析模式（团队管理看板）双视图；今日待办、高意向跟进、进件实时状态、公海预警、AI 话术助手、侧边式智能话术引导栏（开场/需求/拒绝/促成四阶段） |
| **AI 能力** | 客户 AI 信用与成单转化综合评分（五维实时算法）、AI 异议化解建议浮层（输入拒绝原因自动匹配安抚话术）、AI 电销副驾（破冰/回访/异议/邀约话术） |
| **自动评估** | 客户建档向导（身份证自动推算年龄性别）、征信速评、资质预检、产品智能匹配评分 |
| **客户管理** | 我的客户 / 团队档案 / 公共客户池（认领冷却+每日上限实时拦截）/ 成交客户（贷后回访跟踪） |
| **进件管理** | 七阶段审批流转、超时催办、进件报表与实时状态 |
| **贷后管理** | 在贷账户台账、还款计划、逾期预警、转贷机会识别、贷后巡检 |
| **产品库** | 银行产品准入管理，管理员可删减、全系统联动 |
| **财务结算** | 阶梯提成、服务费结算、渠道返佣、放款统计 |
| **总控后台** | 员工账号、公海规则、阶梯提成、银行准入政策、评估参数、征信红线、部门、黑名单、费用科目、脱敏规则、安全策略（含会话超时自动登出） |

## 技术栈

- React 19 + TypeScript 5.8
- Vite 6（manualChunks 分包优化 + 内容哈希缓存）
- Tailwind CSS 4
- Recharts（图表）、lucide-react（图标）、motion（动效）

## 环境要求

- Node.js ≥ 20
- npm ≥ 10

## 本地开发

```bash
npm install
npm run dev          # 开发服务器 http://localhost:3000（.env.development）
npm run build:prod   # 类型检查 + 生产构建（.env.production → dist/）
npm run preview      # 预览生产构建 http://localhost:4173
```

## 生产部署

本项目为纯前端静态应用（业务数据持久化于浏览器 localStorage），可部署到任意静态托管：

```bash
# 1. 准备环境变量（复制模板并按需修改，无后端时保持默认即可）
cp .env.production.example .env.production

# 2. 生产构建
npm install
npm run build:prod   # 产物输出至 dist/

# 3. 部署 dist/ 目录到 Nginx / CDN / 对象存储
```

### Nginx 参考配置

```nginx
server {
    listen 443 ssl;
    server_name crm.example.com;          # 替换为实际域名
    root /var/www/yanxun-crm/dist;
    index index.html;

    # 单页应用路由回退（当前为单页，保留以防后续多路由）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源长缓存（内容哈希文件名）
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 安全响应头
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

## 默认账号（首次部署种子账号，全部强制首次登录改密）

| 角色 | 账号 | 初始密码 |
|---|---|---|
| 超级管理员 | `himax` | `a1988624` |
| 团队主管（销售总监） | `wangjingli` | `123456` |
| 权证风控主管 | `chenfengkong` | `123456` |
| 财务结算主管 | `zhaocaiwu` | `123456` |
| 业务顾问 | `zhangqiang` | `123456` |

> ⚠️ 安全策略：所有种子账号 `mustChangePassword=true`，首次登录强制修改密码后方可进入系统。正式上线后请在「总控后台 - 员工管理」中重置全部默认账号并停用不必要账号。

### 密码安全存储规范

- **密码绝不明文落库**：所有账号密码采用 **PBKDF2-HMAC-SHA256 + 随机盐值**（21 万次迭代，Web Crypto 原生实现，浏览器/Node 通用）哈希存储，格式 `pbkdf2$sha256$<iterations>$<salt>$<hash>`；注册/改密/重置时明文仅经一次哈希后即丢弃。
- **启动时自动迁移**：旧版明文 `password` 字段在首次加载时统一迁移为 `passwordHash` 并清除明文（`migrateUsersPasswords`），校验采用定长时间比较以防御时序攻击。
- **超级管理员凭据重置**：`computeSuperAdminReset` 仅对 `role === 'super_admin'` 账号生效、且仅允许超管调用，重置后返回结构化成功状态；应用首次启动会按安全规范将超管账号重置为 `himax / a1988624`（哈希存储、可直接登录），并以 localStorage 标记保证仅执行一次、不覆盖后续自主改密。
- 回归测试：`npm run test:security`（13 项断言，覆盖哈希/校验/越权拒绝/明文迁移）。

## 数据说明

- 纯前端应用，业务数据（客户/进件/外呼/用户/配置/贷后）持久化在浏览器 `localStorage`（前缀 `yanxun_crm_v5_`），刷新不丢失。
- **正式版不含任何演示/测试数据**：客户、进件、贷后在贷账户、工作台待办均以空态启动，由业务操作产生真实数据。
- 总控后台支持导出 JSON 备份与恢复；升级前务必先导出备份。
- 数据与账号安全：请通过 HTTPS 部署；员工账号务必启用强密码并定期更换。

## 合规内置

- 外呼时段限制（每日 21:00 - 次日 09:00 静默）
- 单号码每日外呼次数上限
- 违规敏感词检测（承诺批贷 / 绝对化用语拦截）
- 黑名单（手机号 / 身份证）全流程拦截
- 客户隐私字段脱敏（手机号 / 身份证 / 地址 / 银行卡）
- 首次登录强制改密、登录失败锁定、会话超时自动登出
