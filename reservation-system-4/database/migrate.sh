#!/bin/bash

# マイグレーション実行スクリプト
# 使い方:
#   ./migrate.sh                    # すべてのマイグレーションを実行
#   ./migrate.sh 002               # 特定のマイグレーションのみ実行

# カラー出力用
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# devcontainer環境の検出
IS_DEVCONTAINER=false
if [ -n "$REMOTE_CONTAINERS" ] || [ -n "$CODESPACES" ] || [ -f /.dockerenv ]; then
    IS_DEVCONTAINER=true
    echo -e "${BLUE}ℹ devcontainer環境を検出しました${NC}"
fi

# .envファイルから環境変数を読み込む
if [ -f ../backend/.env ]; then
    export $(cat ../backend/.env | grep -v '^#' | xargs)
    echo -e "${GREEN}✓ .envファイルを読み込みました${NC}"
else
    echo -e "${YELLOW}⚠ .envファイルが見つかりません: ../backend/.env${NC}"
    echo -e "${YELLOW}  devcontainer環境ではデフォルト設定を使用します${NC}"
fi

# データベース接続情報
if [ "$IS_DEVCONTAINER" = true ]; then
    # devcontainer環境ではdocker-composeのサービス名を使用
    DB_HOST="${DB_HOST:-postgres}"
    DB_PORT="${DB_PORT:-5432}"
    DB_NAME="${DB_NAME:-reservation_system}"
    DB_USER="${DB_USER:-postgres}"
    DB_PASSWORD="${DB_PASSWORD:-postgres}"
    export PGPASSWORD="$DB_PASSWORD"
else
    # ホスト環境ではlocalhostを使用
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
    DB_NAME="${DB_NAME:-reservation_db}"
    DB_USER="${DB_USER:-postgres}"
fi

echo ""
echo -e "${YELLOW}データベース接続情報:${NC}"
echo "  環境: $([ "$IS_DEVCONTAINER" = true ] && echo "devcontainer" || echo "ホスト")"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# PostgreSQLコマンドの接続文字列
PSQL_CMD="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"

# データベース接続テスト
echo -e "${YELLOW}データベース接続をテスト中...${NC}"
if ! $PSQL_CMD -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}✗ データベースに接続できません${NC}"
    if [ "$IS_DEVCONTAINER" = true ]; then
        echo -e "${YELLOW}トラブルシューティング:${NC}"
        echo "  1. PostgreSQLコンテナが起動しているか確認:"
        echo "     docker ps | grep postgres"
        echo ""
        echo "  2. データベースが作成されているか確認:"
        echo "     docker exec -it postgres psql -U postgres -l"
        echo ""
        echo "  3. 接続情報が正しいか確認:"
        echo "     Host: postgres (docker-composeのサービス名)"
        echo "     Database: reservation_system"
        echo "     User: postgres"
    else
        echo "  接続情報を確認してください"
    fi
    exit 1
fi
echo -e "${GREEN}✓ データベース接続成功${NC}"
echo ""

# マイグレーションディレクトリ
MIGRATIONS_DIR="./migrations"

# 引数で特定のマイグレーションが指定されている場合
if [ -n "$1" ]; then
    MIGRATION_FILE="$MIGRATIONS_DIR/${1}_*.sql"
    if ls $MIGRATION_FILE 1> /dev/null 2>&1; then
        echo -e "${YELLOW}マイグレーション ${1} を実行中...${NC}"
        for file in $MIGRATION_FILE; do
            echo "  実行: $(basename $file)"
            if $PSQL_CMD -f "$file"; then
                echo -e "${GREEN}✓ $(basename $file) 完了${NC}"
            else
                echo -e "${RED}✗ $(basename $file) 失敗${NC}"
                exit 1
            fi
        done
    else
        echo -e "${RED}✗ マイグレーションファイルが見つかりません: ${1}${NC}"
        exit 1
    fi
else
    # すべてのマイグレーションを順番に実行
    echo -e "${YELLOW}すべてのマイグレーションを実行中...${NC}"
    for file in $MIGRATIONS_DIR/*.sql; do
        if [ -f "$file" ]; then
            echo ""
            echo -e "${YELLOW}実行: $(basename $file)${NC}"
            if $PSQL_CMD -f "$file"; then
                echo -e "${GREEN}✓ $(basename $file) 完了${NC}"
            else
                echo -e "${RED}✗ $(basename $file) 失敗${NC}"
                exit 1
            fi
        fi
    done
fi

echo ""
echo -e "${GREEN}✓ すべてのマイグレーションが完了しました${NC}"
