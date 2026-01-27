#!/usr/bin/env node

/**
 * 伴影 (Shadow Mate) 构建脚本
 * 用于验证和打包 Chrome 扩展
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.js',
  'icons/logo.png'
];

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFiles() {
  log('\n🔍 检查必需文件...', 'blue');
  const missing = [];
  
  REQUIRED_FILES.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      log(`  ✅ ${file}`, 'green');
    } else {
      log(`  ❌ ${file} (缺失)`, 'red');
      missing.push(file);
    }
  });
  
  if (missing.length > 0) {
    log(`\n❌ 缺少 ${missing.length} 个必需文件`, 'red');
    return false;
  }
  
  log('\n✅ 所有必需文件检查通过', 'green');
  return true;
}

function validateManifest() {
  log('\n📋 验证 manifest.json...', 'blue');
  
  try {
    const manifestPath = path.join(__dirname, 'manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    // 检查必需字段
    const requiredFields = ['manifest_version', 'name', 'version'];
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length > 0) {
      log(`  ❌ manifest.json 缺少字段: ${missingFields.join(', ')}`, 'red');
      return false;
    }
    
    log(`  ✅ manifest.json 验证通过 (v${manifest.version})`, 'green');
    return true;
  } catch (error) {
    log(`  ❌ manifest.json 解析失败: ${error.message}`, 'red');
    return false;
  }
}

function checkSyntax() {
  log('\n🔧 检查 JavaScript 语法...', 'blue');
  
  const jsFiles = ['background.js', 'content.js', 'popup.js'];
  let hasError = false;
  
  jsFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      log(`  ⚠️  ${file} 不存在，跳过`, 'yellow');
      return;
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // 简单的语法检查：尝试解析
      new Function(content);
      log(`  ✅ ${file}`, 'green');
    } catch (error) {
      log(`  ❌ ${file}: ${error.message}`, 'red');
      hasError = true;
    }
  });
  
  if (hasError) {
    log('\n❌ JavaScript 语法检查失败', 'red');
    return false;
  }
  
  log('\n✅ JavaScript 语法检查通过', 'green');
  return true;
}

function buildSummary() {
  log('\n📊 构建统计...', 'blue');
  
  const stats = {
    js: 0,
    html: 0,
    json: 0,
    totalSize: 0
  };
  
  function countFiles(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
        countFiles(filePath);
      } else if (stat.isFile()) {
        const ext = path.extname(file);
        if (ext === '.js') stats.js++;
        else if (ext === '.html') stats.html++;
        else if (ext === '.json') stats.json++;
        
        stats.totalSize += stat.size;
      }
    });
  }
  
  countFiles(__dirname);
  
  log(`  📄 JavaScript 文件: ${stats.js}`, 'green');
  log(`  📄 HTML 文件: ${stats.html}`, 'green');
  log(`  📄 JSON 文件: ${stats.json}`, 'green');
  log(`  💾 总大小: ${(stats.totalSize / 1024).toFixed(2)} KB`, 'green');
}

function main() {
  log('\n🚀 伴影 (Shadow Mate) 构建开始...', 'blue');
  log('=' .repeat(50), 'blue');
  
  const isValidateOnly = process.argv.includes('--validate');
  
  let allPassed = true;
  
  // 1. 检查文件
  if (!checkFiles()) {
    allPassed = false;
  }
  
  // 2. 验证 manifest
  if (!validateManifest()) {
    allPassed = false;
  }
  
  // 3. 检查语法
  if (!checkSyntax()) {
    allPassed = false;
  }
  
  // 4. 构建统计
  buildSummary();
  
  log('\n' + '='.repeat(50), 'blue');
  
  if (allPassed) {
    log('\n✅ 构建完成！所有检查通过', 'green');
    log('\n📦 扩展已准备好加载到 Chrome', 'green');
    log('   访问 chrome://extensions/ 并开启"开发者模式"', 'blue');
    log('   然后点击"加载已解压的扩展程序"选择此目录', 'blue');
    process.exit(0);
  } else {
    log('\n❌ 构建失败！请修复上述错误后重试', 'red');
    process.exit(1);
  }
}

main();
