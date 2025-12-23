#!/bin/bash

# 依赖检查脚本
# 检查依赖是否安装在正确的位置

set -e

echo "🔍 检查依赖安装位置..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

errors=0

# 检查根目录不应该有的依赖
echo ""
echo "📦 检查根目录依赖..."

# 不应该在根目录的依赖
forbidden_deps=("react" "react-dom" "fastapi" "orval" "vite" "eslint")

for dep in "${forbidden_deps[@]}"; do
    if grep -q "\"$dep\"" package.json 2>/dev/null; then
        echo -e "${RED}❌ 错误: $dep 不应该在根目录 package.json 中${NC}"
        ((errors++))
    fi
done

# 应该在根目录的依赖
required_deps=("turbo" "husky" "lint-staged" "@commitlint/cli")

for dep in "${required_deps[@]}"; do
    if ! grep -q "\"$dep\"" package.json 2>/dev/null; then
        echo -e "${YELLOW}⚠️  警告: $dep 应该在根目录 package.json 中${NC}"
    else
        echo -e "${GREEN}✓${NC} $dep 在根目录"
    fi
done

# 检查前端依赖
echo ""
echo "🎨 检查前端依赖..."

frontend_deps=("react" "react-dom" "@tanstack/react-query" "vite")

for dep in "${frontend_deps[@]}"; do
    if ! grep -q "\"$dep\"" apps/web/package.json 2>/dev/null; then
        echo -e "${YELLOW}⚠️  警告: $dep 应该在 apps/web/package.json 中${NC}"
    else
        echo -e "${GREEN}✓${NC} $dep 在 apps/web"
    fi
done

# 检查后端依赖
echo ""
echo "🐍 检查后端依赖..."

backend_deps=("fastapi" "sqlalchemy" "pydantic")

for dep in "${backend_deps[@]}"; do
    if ! grep -q "\"$dep" apps/api/pyproject.toml 2>/dev/null; then
        echo -e "${YELLOW}⚠️  警告: $dep 应该在 apps/api/pyproject.toml 中${NC}"
    else
        echo -e "${GREEN}✓${NC} $dep 在 apps/api"
    fi
done

echo ""
echo "================================"

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ 依赖位置检查通过！${NC}"
    exit 0
else
    echo -e "${RED}❌ 发现 $errors 个错误${NC}"
    exit 1
fi
