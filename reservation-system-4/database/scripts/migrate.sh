#!/bin/bash

# データベースマイグレーションスクリプト
# Usage: ./migrate.sh [command] [options]

set -e

# 環境変数の設定
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-reservation_system}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

# PostgreSQL接続情報
PGPASSWORD=$DB_PASSWORD
export PGPASSWORD

# 色付き出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ログ出力関数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# データベース接続確認
check_connection() {
    log_info "データベース接続を確認中..."
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        log_info "データベース接続: OK"
        return 0
    else
        log_error "データベース接続: FAILED"
        return 1
    fi
}

# マイグレーションテーブルの作成
create_migration_table() {
    log_info "マイグレーション管理テーブルを作成中..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
EOF
    log_info "マイグレーション管理テーブル: 作成完了"
}

# マイグレーションの実行
run_migrations() {
    log_info "マイグレーションを実行中..."

    local migrations_dir="../migrations"

    for migration_file in $(ls "$migrations_dir"/*.sql | sort); do
        local filename=$(basename "$migration_file")
        local version=$(echo "$filename" | cut -d'_' -f1)

        # 既に適用済みかチェック
        local applied=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT version FROM schema_migrations WHERE version='$version';")

        if [ -z "$(echo $applied | tr -d '[:space:]')" ]; then
            log_info "マイグレーション適用中: $filename"
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO schema_migrations (version) VALUES ('$version');"
            log_info "マイグレーション完了: $filename"
        else
            log_warn "マイグレーション既適用: $filename"
        fi
    done
}

# Seedデータの投入
run_seeds() {
    log_info "Seedデータを投入中..."

    local seeds_dir="../seeds"

    for seed_file in $(ls "$seeds_dir"/*.sql | sort); do
        local filename=$(basename "$seed_file")
        log_info "Seedデータ投入中: $filename"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$seed_file"
        log_info "Seedデータ投入完了: $filename"
    done
}

# データベースのリセット
reset_database() {
    log_warn "データベースをリセット中..."
    read -p "本当にデータベースをリセットしますか？ (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "全テーブルを削除中..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
EOF
        log_info "データベースリセット完了"
        setup_database
    else
        log_info "リセットをキャンセルしました"
    fi
}

# 初期セットアップ
setup_database() {
    check_connection || exit 1
    create_migration_table
    run_migrations
    run_seeds
    log_info "データベースセットアップ完了！"
}

# マイグレーション状態の表示
show_status() {
    log_info "マイグレーション状態:"
    echo
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
SELECT
    version,
    applied_at
FROM schema_migrations
ORDER BY version;
EOF
}

# ヘルプの表示
show_help() {
    echo "データベースマイグレーションツール"
    echo
    echo "使用方法:"
    echo "  ./migrate.sh setup    - 初期セットアップ（マイグレーション + Seeds）"
    echo "  ./migrate.sh migrate  - マイグレーションの実行"
    echo "  ./migrate.sh seed     - Seedデータの投入"
    echo "  ./migrate.sh reset    - データベースのリセット"
    echo "  ./migrate.sh status   - マイグレーション状態の表示"
    echo "  ./migrate.sh help     - このヘルプを表示"
    echo
    echo "環境変数:"
    echo "  DB_HOST     - データベースホスト (default: localhost)"
    echo "  DB_PORT     - データベースポート (default: 5432)"
    echo "  DB_NAME     - データベース名 (default: reservation_system)"
    echo "  DB_USER     - データベースユーザー (default: postgres)"
    echo "  DB_PASSWORD - データベースパスワード (default: postgres)"
}

# メイン処理
case "${1:-help}" in
    "setup")
        setup_database
        ;;
    "migrate")
        check_connection || exit 1
        create_migration_table
        run_migrations
        ;;
    "seed")
        check_connection || exit 1
        run_seeds
        ;;
    "reset")
        reset_database
        ;;
    "status")
        check_connection || exit 1
        show_status
        ;;
    "help"|*)
        show_help
        ;;
esac