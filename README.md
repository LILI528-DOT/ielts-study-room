# 知序 · 雅思答疑

四科 AI 学习网站，支持阅读、听力、口语、写作答疑，截图提问、流式输出、本机对话记录，以及 16 条原创常见问题的搜索、编辑和复制。

## 技术栈

React 19、TypeScript、Vinext / Vite、Cloudflare Workers、OpenAI Responses API。

## 本地运行

需要 Node.js 22.13+ 和 pnpm。

```bash
pnpm install --frozen-lockfile
```

在项目根目录创建 `.dev.vars`（不要提交到 Git），填写 `OPENAI_API_KEY`。可选 `OPENAI_MODEL`，默认 `gpt-4.1-mini`。密钥只由服务器读取。

```bash
pnpm dev
```

默认开发地址为 http://localhost:5173。

## 检查和构建

```bash
pnpm exec tsc --noEmit
pnpm build
pnpm start
```

项目保留了 Sites / Cloudflare 的部署集成；`.openai/hosting.json` 是原站点的部署关联信息。将代码部署为另一个独立站点时，请配置自己的站点身份和服务器端机密。上传源码不会自动将 GitHub 仓库连接到现有站点的持续部署。

## 主要文件

- `app/page.tsx`：首页、四科聊天和问题库交互。
- `app/globals.css`：响应式样式。
- `app/api/chat/route.ts`：服务器端图文请求、输入校验和流式转发。
- `lib/faq.ts`：原创示例问答。
- `worker/index.ts`：Cloudflare Worker 入口。

## 数据和 API

聊天记录在本机浏览器保存 7 天，最多保留 20 个会话。发送提问时，最近的对话与所选截图会提交到服务器并转发给 OpenAI。API 调用需有可用余额；ChatGPT 订阅与 API 账单独立。

本仓库不包含真实密钥、个人对话、依赖目录或构建产物。AI 评分和建议仅用于学习参考。
