# AGENTS.md

CC AITools 的 AI Agent 开发指南 —— 基于 Tauri 2 + React 的桌面应用，管理 5 个 AI CLI 工具（Claude Code、Codex、Gemini CLI、OpenCode、OpenClaw）。

## 命令

```bash
# 安装和开发（必须使用 pnpm，不能用 npm）
pnpm install
pnpm dev              # 完整 Tauri 开发（Vite :3000 + Rust 后端）
pnpm dev:renderer     # 仅前端（Vite）

# 验证（CI 顺序：format:check → typecheck → test:unit）
pnpm format:check
pnpm typecheck        # tsc --noEmit
pnpm test:unit        # vitest run
pnpm test:unit tests/path/to/file.test.ts  # 单个测试文件

# Rust 后端（在 src-tauri/ 目录下）
cargo fmt --check
cargo clippy          # CI 使用 -D warnings
cargo test            # 所有测试
cargo test test_name  # 单个测试
cargo test --features test-hooks  # 需要 test-hooks 特性的测试
```

## 架构

**技术栈：** React 18 + TypeScript（Vite、TanStack Query v5、shadcn/ui）↔ Tauri IPC ↔ Rust（Axum、SQLite、Tokio）

**数据流：**

```
前端（React）
  └─ hooks/ → lib/api/ → Tauri IPC
后端
  └─ commands/ → services/ → database/dao/ → SQLite（~/.cc-aitools/cc-aitools.db）
```

**双存储模式：**

- SQLite（`~/.cc-aitools/cc-aitools.db`）：可同步数据的唯一数据源（SSOT）
- `settings.json`：设备级配置（不同步）
- 原子写入：全程使用临时文件 + 重命名模式

**关键目录：**
| 路径 | 用途 |
|------|---------|
| `src/components/` | 各功能模块的 UI 面板 |
| `src/hooks/` | 业务逻辑 hooks |
| `src/lib/api/` | 类型安全的 Tauri 命令封装 |
| `src/config/` | 50+ 内置提供商预设 |
| `src-tauri/src/proxy/` | HTTP 代理（最复杂的子系统） |
| `src-tauri/src/services/` | 业务逻辑 |
| `src-tauri/src/database/` | SQLite DAO 层 |

## 测试

**前端：** vitest + jsdom，MSW 模拟 Tauri API（`tests/msw/`）
**后端：** `serial_test` crate 用于共享状态测试；`test-hooks` 特性用于测试专属行为

## CI 要求

必须通过所有检查：`pnpm format:check`、`pnpm typecheck`、`pnpm test:unit`、`cargo fmt --check`、`cargo clippy -D warnings`、`cargo test`

## 注意事项

- **必须使用 pnpm** —— 不能用 npm
- **单个测试文件：** `pnpm test:unit tests/path/to/file.test.ts`
- **Proxy 复杂度：** `src-tauri/src/proxy/` 处理转发、故障转移、熔断、流式传输 —— 修改后请仔细测试
- **Deep Link：** `ccswitch://` URI 协议解析在 `src-tauri/src/deeplink/` 中
- **发布：** 推送 `v*` 标签触发 `release.yml`（Windows MSI、macOS DMG 签名公证、Linux deb/rpm/AppImage）

## 参考

- `CLAUDE.md`：更详细的架构说明
- `README.md`：面向用户的文档和开发设置
