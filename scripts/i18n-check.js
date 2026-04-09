#!/usr/bin/env node
/**
 * i18n 文案检测和修复脚本
 * 
 * 功能：
 * 1. 扫描 src/ 目录下所有 tsx/ts 文件中的 t("key") 和 t("key", { defaultValue: "..." })
 * 2. 检查这些 key 是否存在于语言文件中 (zh.json, en.json, ja.json)
 * 3. 自动将缺失的 key 添加到所有语言文件中（使用 defaultValue 或 key 作为默认值）
 * 
 * 使用方法：
 *   node scripts/i18n-check.js         # 检测并修复缺失的文案
 *   node scripts/i18n-check.js --check # 仅检测，不修复
 *   node scripts/i18n-check.js --fix   # 检测并修复（默认行为）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const CONFIG = {
  srcDir: path.join(__dirname, '..', 'src'),
  localesDir: path.join(__dirname, '..', 'src', 'i18n', 'locales'),
  languages: ['zh.json', 'en.json', 'ja.json'],
  fileExtensions: ['.ts', '.tsx'],
  excludeDirs: ['node_modules', 'dist', 'build', '.git'],
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 递归获取所有文件
function getAllFiles(dir, extensions, excludeDirs) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!excludeDirs.includes(item)) {
          traverse(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// 有效的翻译 key 应该符合的模式：小写字母、数字、下划线、点号
const VALID_KEY_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

// 排除的 key 模式（import 路径、特殊字符等）
const EXCLUDED_PATTERNS = [
  /^@\//, // @/lib/api 等 import 路径
  /^\//, // / 开头的路径
  /^\n$/, // 换行符
  /^\s+$/, // 纯空格
  /tauri-apps/, // tauri 相关
  /in JSON/, // 错误消息
  /^[A-Z]/, // 大写字母开头（通常是组件名）
  /\//, // 包含斜杠
  /^\.$/, // 单个点号
];

// 已知的应用 ID（单层 key，不是翻译 key）
const KNOWN_APP_IDS = ['claude', 'codex', 'gemini', 'opencode', 'openclaw', 'anthropic', 'openai'];

function isValidKey(key) {
  // 检查是否匹配排除模式
  for (const pattern of EXCLUDED_PATTERNS) {
    if (pattern.test(key)) return false;
  }
  // 排除已知的应用 ID（单层）
  if (KNOWN_APP_IDS.includes(key)) return false;
  // 检查是否符合有效 key 模式（必须至少有一个点号，即命名空间）
  return VALID_KEY_PATTERN.test(key);
}

// 从文件中提取所有的 t() 调用
function extractTranslationKeys(fileContent) {
  const keys = [];
  
  // 匹配 t("key") 或 t('key')
  const simplePattern = /t\(\s*["']([^"']+)["']\s*\)/g;
  
  // 匹配 t("key", { defaultValue: "..." }) 或 t('key', { defaultValue: '...' })
  const withDefaultPattern = /t\(\s*["']([^"']+)["']\s*,\s*\{[^}]*defaultValue\s*:\s*["']([^"']*)["'][^}]*\}\s*\)/g;
  
  // 匹配 t("key", { defaultValue: `...` }) - 模板字符串
  const withTemplateDefaultPattern = /t\(\s*["']([^"']+)["']\s*,\s*\{[^}]*defaultValue\s*:\s*`([^`]*)`[^}]*\}\s*\)/g;
  
  let match;
  
  // 先匹配带 defaultValue 的（模板字符串）
  while ((match = withTemplateDefaultPattern.exec(fileContent)) !== null) {
    const key = match[1];
    if (isValidKey(key)) {
      keys.push({
        key,
        defaultValue: match[2],
        line: fileContent.substring(0, match.index).split('\n').length,
      });
    }
  }
  
  // 再匹配带 defaultValue 的（普通字符串）
  while ((match = withDefaultPattern.exec(fileContent)) !== null) {
    const key = match[1];
    if (isValidKey(key)) {
      keys.push({
        key,
        defaultValue: match[2],
        line: fileContent.substring(0, match.index).split('\n').length,
      });
    }
  }
  
  // 最后匹配简单的 t("key")
  while ((match = simplePattern.exec(fileContent)) !== null) {
    const key = match[1];
    if (!isValidKey(key)) continue;
    
    // 检查是否已经被前面的模式匹配过
    const alreadyExists = keys.some(k => k.key === key && Math.abs(k.line - fileContent.substring(0, match.index).split('\n').length) <= 1);
    if (!alreadyExists) {
      keys.push({
        key,
        defaultValue: null,
        line: fileContent.substring(0, match.index).split('\n').length,
      });
    }
  }
  
  return keys;
}

// 读取语言文件
function loadLocaleFile(filename) {
  const filepath = path.join(CONFIG.localesDir, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(content);
}

// 保存语言文件
function saveLocaleFile(filename, data) {
  const filepath = path.join(CONFIG.localesDir, filename);
  const content = JSON.stringify(data, null, 2);
  fs.writeFileSync(filepath, content + '\n', 'utf-8');
}

// 检查 key 是否存在于语言对象中
function hasKey(localeData, key) {
  const parts = key.split('.');
  let current = localeData;
  
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return false;
    }
    current = current[part];
  }
  
  return current !== undefined;
}

// 设置 key 到语言对象中
function setKey(localeData, key, value) {
  const parts = key.split('.');
  let current = localeData;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
}

// 翻译默认值到不同语言（简单的映射）
function translateDefaultValue(defaultValue, targetLang) {
  if (!defaultValue) return defaultValue;
  
  // 如果是中文，直接返回
  if (targetLang === 'zh') return defaultValue;
  
  // 如果是英文或日文，且默认值看起来是中文，添加标记提示需要翻译
  // 这里我们只是返回原值，但加上注释标记
  return defaultValue;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const isCheckOnly = args.includes('--check');
  const isFix = args.includes('--fix') || !isCheckOnly;
  
  log('🔍 扫描源码文件中的翻译 key...', 'cyan');
  
  // 获取所有源文件
  const files = getAllFiles(CONFIG.srcDir, CONFIG.fileExtensions, CONFIG.excludeDirs);
  log(`   找到 ${files.length} 个源文件`, 'blue');
  
  // 收集所有翻译 key
  const allKeys = new Map(); // key -> { defaultValue, files: [{file, line}] }
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const keys = extractTranslationKeys(content);
    
    for (const { key, defaultValue, line } of keys) {
      if (!allKeys.has(key)) {
        allKeys.set(key, { defaultValue, files: [] });
      }
      allKeys.get(key).files.push({ file: path.relative(CONFIG.srcDir, file), line });
    }
  }
  
  log(`   找到 ${allKeys.size} 个唯一的翻译 key`, 'blue');
  
  // 加载语言文件
  const locales = {};
  for (const lang of CONFIG.languages) {
    locales[lang] = loadLocaleFile(lang);
  }
  
  // 检查每个 key 是否存在于所有语言文件中
  const missingKeys = new Map(); // lang -> [{ key, defaultValue, files }]
  
  for (const [key, data] of allKeys) {
    for (const lang of CONFIG.languages) {
      if (!hasKey(locales[lang], key)) {
        if (!missingKeys.has(lang)) {
          missingKeys.set(lang, []);
        }
        missingKeys.get(lang).push({ key, ...data });
      }
    }
  }
  
  // 报告结果
  if (missingKeys.size === 0) {
    log('\n✅ 所有翻译 key 都已存在于语言文件中！', 'green');
    return;
  }
  
  let totalMissing = 0;
  for (const [lang, keys] of missingKeys) {
    totalMissing += keys.length;
    log(`\n📄 ${lang}:`, 'yellow');
    
    for (const { key, defaultValue, files } of keys) {
      log(`   ❌ ${key}`, 'red');
      if (defaultValue) {
        log(`      默认值: "${defaultValue}"`, 'cyan');
      }
      for (const { file, line } of files.slice(0, 3)) {
        log(`      位置: ${file}:${line}`, 'blue');
      }
      if (files.length > 3) {
        log(`      ... 还有 ${files.length - 3} 处使用`, 'blue');
      }
    }
  }
  
  log(`\n⚠️  共发现 ${totalMissing} 个缺失的翻译 key`, 'yellow');
  
  // 修复模式
  if (isFix) {
    log('\n🔧 开始修复...', 'cyan');
    
    for (const [lang, keys] of missingKeys) {
      const localeData = locales[lang];
      const langCode = lang.replace('.json', '');
      
      for (const { key, defaultValue } of keys) {
        const value = translateDefaultValue(defaultValue || key, langCode);
        setKey(localeData, key, value);
        log(`   ✅ ${lang}: ${key}`, 'green');
      }
      
      saveLocaleFile(lang, localeData);
    }
    
    log('\n✅ 修复完成！所有缺失的 key 已添加到语言文件中。', 'green');
    log('   注意：非中文语言的默认值可能需要手动翻译。', 'yellow');
  } else {
    log('\n💡 使用 --fix 参数自动修复缺失的 key', 'cyan');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
