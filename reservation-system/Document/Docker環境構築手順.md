# macOS での Docker Desktop を使った予約システム開発環境構築手順

このドキュメントでは、macOS 環境で Docker Desktop と VS Code Dev Containers を使用して予約システムの開発環境を構築する手順を説明します。

## 🛠️ 必要なソフトウェア

### 1. Docker Desktop のインストール

1. [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/) をダウンロード
2. `.dmg` ファイルを開き、Docker.app を Applications フォルダにドラッグ
3. Docker Desktop を起動し、初期設定を完了
4. メニューバーに Docker アイコンが表示されることを確認

### 2. Visual Studio Code のインストール

1. [Visual Studio Code](https://code.visualstudio.com/) をダウンロードしてインストール
2. 以下の拡張機能をインストール：
   - **Dev Containers** (`ms-vscode-remote.remote-containers`)
   - **Docker** (`ms-azuretools.vscode-docker`)

### 3. Git のインストール

```bash
# Xcode Command Line Tools をインストール
xcode-select --install
```

## 📁 プロジェクトのセットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/Reservation-System.git
cd Reservation-System
```

### 2. VS Code でプロジェクトを開く

```bash
code .
```

### 3. Dev Container で開く

1. VS Code でプロジェクトを開いた後、左下の青いボタン「><」をクリック
2. **「Reopen in Container」** を選択
3. または、コマンドパレット（`Cmd+Shift+P`）で：
   - `>Dev Containers: Reopen in Container` を実行

## 🐳 コンテナ構成

プロジェクトは以下の4つのコンテナで構成されています：

### 1. Workspace Container
- **用途**: VS Code の作業環境
- **ベース**: Node.js 20
- **機能**: Git、開発ツール

### 2. Frontend Container
- **用途**: Next.js フロントエンドアプリケーション
- **ポート**: 3000
- **URL**: http://localhost:3000

### 3. Backend Container
- **用途**: Next.js バックエンドAPI
- **ポート**: 3001
- **URL**: http://localhost:3001

### 4. PostgreSQL Container
- **用途**: データベース
- **ポート**: 5432
- **データベース名**: `reservation_system`
- **ユーザー**: `postgres` / **パスワード**: `postgres`

## 🚀 開発サーバーの起動

Dev Container が起動すると、自動的に以下が実行されます：

1. **依存関係のインストール**: フロントエンドとバックエンドの npm パッケージ
2. **データベースの初期化**: PostgreSQL のテーブル作成とサンプルデータ投入
3. **開発サーバーの起動**: フロントエンド（3000番）とバックエンド（3001番）

### 手動での開発サーバー起動

自動起動がうまくいかない場合は、VS Code のターミナルで以下を実行：

```bash
# フロントエンド開発サーバー
cd /workspace/frontend
npm run dev

# バックエンド開発サーバー（新しいターミナルタブで）
cd /workspace/backend
npm run dev
```

## 🌐 アクセス URL

開発環境起動後、以下の URL でアクセスできます：

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:3001/api
- **予約ページ**: http://localhost:3000/reserve
- **管理画面**: http://localhost:3000/admin

## 🗃️ データベース管理

### データベースへの接続

VS Code の PostgreSQL 拡張機能を使用してデータベースに接続：

1. VS Code のサイドバーで PostgreSQL アイコンをクリック
2. 新しい接続を追加：
   - **Host**: localhost
   - **Port**: 5432
   - **Database**: reservation_system
   - **Username**: postgres
   - **Password**: postgres

### データベースのリセット

```bash
cd /workspace/backend
npm run db:reset
```

## 🚨 トラブルシューティング

### 1. コンテナが起動しない

**症状**: Dev Container の起動に失敗する

**解決方法**:
```bash
# Docker Desktop が起動していることを確認
docker --version

# コンテナを再ビルド
# VS Code コマンドパレット（Cmd+Shift+P）: >Dev Containers: Rebuild Container
```

### 2. ポート競合エラー

**症状**: `Port already in use` エラー

**解決方法**:
```bash
# 使用中のポートを確認
lsof -i :3000
lsof -i :3001
lsof -i :5432

# プロセスを終了してからコンテナを再起動
```

### 3. データベース接続エラー

**症状**: `ECONNREFUSED` または database connection エラー

**解決方法**:
```bash
# PostgreSQL コンテナの状態確認
docker ps | grep postgres

# データベースの再初期化
cd /workspace/backend
npm run db:reset
```

### 4. M1/M2 Mac でのパフォーマンス問題

**症状**: コンテナの起動やビルドが遅い

**解決方法**:
1. Docker Desktop の設定で「Use Rosetta for x86/amd64 emulation on Apple Silicon」を有効化
2. Docker Desktop のリソース設定でメモリを 4GB 以上に設定

## 📝 開発ワークフロー

### 1. 日常的な開発手順

1. **Docker Desktop を起動**
   - アプリケーションフォルダから Docker を起動

2. **プロジェクトを開く**
   ```bash
   cd /path/to/Reservation-System
   code .
   ```

3. **Dev Container で再開**
   - VS Code 左下の「><」→「Reopen in Container」

4. **開発サーバーの状態確認**
   - ポートタブで 3000、3001 の状態を確認
   - 必要に応じて手動起動

5. **ブラウザでアクセス**
   - http://localhost:3000 で動作確認

### 2. 環境のリセット

完全に環境をリセットしたい場合：

```bash
# VS Code でコンテナを再ビルド
# コマンドパレット（Cmd+Shift+P）: >Dev Containers: Rebuild Container
```

## 🔧 macOS 固有の設定

### Finder での隠しファイル表示

開発中に `.env` ファイルなどを編集する場合：

```bash
# 隠しファイルを表示
defaults write com.apple.finder AppleShowAllFiles YES
killall Finder

# 隠しファイルを非表示（元に戻す）
defaults write com.apple.finder AppleShowAllFiles NO
killall Finder
```

### ターミナルでのプロジェクト移動

```bash
# プロジェクトディレクトリへの移動を簡単にする
echo 'alias reservation="cd /path/to/Reservation-System && code ."' >> ~/.zshrc
source ~/.zshrc

# 使用方法
reservation
```

## 📚 追加リソース

- [Docker Desktop for Mac](https://docs.docker.com/desktop/mac/)
- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [Next.js Documentation](https://nextjs.org/docs)

## ❓ よくある質問

**Q: M1/M2 Mac で動作しますか？**
A: はい、ARM64 アーキテクチャに対応しています。

**Q: データは永続化されますか？**
A: はい、PostgreSQL のデータは Docker Volume に永続化されます。

**Q: Docker Desktop の代替手段はありますか？**
A: Docker Desktop が推奨ですが、OrbStack や Podman Desktop も利用可能です。