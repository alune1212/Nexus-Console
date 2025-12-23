#!/bin/bash

# 环境变量验证脚本
# 用于验证必需的环境变量是否已设置

set -e

echo "🔍 验证环境变量..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 .env 文件是否存在
check_env_file() {
    local env_file=$1
    local app_name=$2
    
    if [ ! -f "$env_file" ]; then
        echo -e "${RED}❌ $app_name: .env 文件不存在${NC}"
        echo -e "${YELLOW}   请运行: cp $env_file.example $env_file${NC}"
        return 1
    fi
    return 0
}

# 检查环境变量
check_env_var() {
    local var_name=$1
    local var_value=$2
    local app_name=$3
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}❌ $app_name: 缺少环境变量 $var_name${NC}"
        return 1
    fi
    
    # 检查是否是示例值
    if [[ "$var_value" == *"example"* ]] || [[ "$var_value" == *"changeme"* ]] || [[ "$var_value" == *"your-"* ]]; then
        echo -e "${YELLOW}⚠️  $app_name: $var_name 使用的是示例值，请修改${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓${NC} $app_name: $var_name"
    return 0
}

# 验证后端环境变量
validate_backend() {
    echo ""
    echo "📦 检查后端环境变量..."
    
    local env_file="apps/api/.env"
    check_env_file "$env_file" "Backend" || return 1
    
    # 加载环境变量
    source "$env_file"
    
    local errors=0
    
    # 必需的环境变量
    check_env_var "SECRET_KEY" "$SECRET_KEY" "Backend" || ((errors++))
    check_env_var "DATABASE_URL" "$DATABASE_URL" "Backend" || ((errors++))
    check_env_var "REDIS_URL" "$REDIS_URL" "Backend" || ((errors++))
    
    # 检查 SECRET_KEY 长度
    if [ -n "$SECRET_KEY" ] && [ ${#SECRET_KEY} -lt 32 ]; then
        echo -e "${YELLOW}⚠️  Backend: SECRET_KEY 长度应至少为 32 字符（当前: ${#SECRET_KEY}）${NC}"
        ((errors++))
    fi
    
    # 检查 DEBUG 模式
    if [ "$DEBUG" = "True" ] || [ "$DEBUG" = "true" ]; then
        echo -e "${YELLOW}⚠️  Backend: DEBUG 模式已启用（生产环境应设置为 False）${NC}"
    fi
    
    return $errors
}

# 验证前端环境变量
validate_frontend() {
    echo ""
    echo "🎨 检查前端环境变量..."
    
    local env_file="apps/web/.env"
    
    if [ ! -f "$env_file" ]; then
        echo -e "${YELLOW}⚠️  Frontend: .env 文件不存在（可选）${NC}"
        return 0
    fi
    
    # 加载环境变量
    source "$env_file"
    
    local errors=0
    
    # 可选的环境变量检查
    if [ -n "$VITE_API_BASE_URL" ]; then
        check_env_var "VITE_API_BASE_URL" "$VITE_API_BASE_URL" "Frontend" || ((errors++))
    fi
    
    return $errors
}

# 主函数
main() {
    local total_errors=0
    
    echo "================================"
    echo "  环境变量验证"
    echo "================================"
    
    validate_backend || ((total_errors+=$?))
    validate_frontend || ((total_errors+=$?))
    
    echo ""
    echo "================================"
    
    if [ $total_errors -eq 0 ]; then
        echo -e "${GREEN}✅ 所有环境变量验证通过！${NC}"
        return 0
    else
        echo -e "${RED}❌ 发现 $total_errors 个问题，请修复后再继续${NC}"
        return 1
    fi
}

# 运行主函数
main
