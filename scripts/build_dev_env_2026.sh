#!/bin/bash

# ==============================================================================
# AI DEV BUILD 2026 - GOLDEN MASTER SETUP (V3)
# ==============================================================================
# Designed for: macOS Deployment via Jamf Self Service
# Functionality: Sets up a full "Golden Master" environment for both
#                Python AND Node.js development.
#
# PROVISIONS (SYSTEM):
# - Homebrew, Xcode CLI, Docker, VS Code, GitHub CLI
# - pyenv + Python 3.11.8 (for system-wide Python projects)
# - nvm + Node.js 24.11.1 (for system-wide Node.js projects)
#
# BUILDS (PROJECT):
# - Creates a Node.js-focused project in ai-agents-and-apps-dev
# - Initializes Git & .gitignore
# - Creates package.json and installs core bot libraries
# ==============================================================================

# 1. JAMF CONTEXT SETUP
CURRENT_USER=$(scutil <<< "show State:/Users/ConsoleUser" | awk '/Name :/ && ! /loginwindow/ { print $3 }')
USER_HOME="/Users/$CURRENT_USER"

# Define Versions and Paths
PYTHON_VERSION="3.11.8"
NODE_VERSION="v24.11.1" # Using LTS version as requested
PROJECT_DIR="$USER_HOME/dev/ai-agents-and-apps-dev"

echo "🚀 Starting DEV Build 2026 (V3) for user: $CURRENT_USER"

# Helper function to run commands as the user
run_as_user() {
    su - "$CURRENT_USER" -c "$1"
}

# ==============================================================================
# 2. SYSTEM LEVEL TOOLS (Homebrew, Xcode, GitHub CLI)
# ==============================================================================

# Check for Xcode CLI tools
if ! xcode-select -p &>/dev/null; then
    echo "⚠️ Xcode CLI tools missing. Triggering install..."
    xcode-select --install
else
    echo "✅ Xcode CLI tools are present."
fi

# Install Homebrew if missing
if ! run_as_user "which brew" >/dev/null; then
    echo "🍺 Installing Homebrew..."
    run_as_user '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    # Add Brew to Path for this script execution if on Apple Silicon
    if [[ -f "/opt/homebrew/bin/brew" ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
else
    echo "✅ Homebrew already installed. Updating..."
    run_as_user "brew update"
fi

# Install Core Dependencies (Python + Node managers)
echo "📦 Installing System Dependencies (pyenv, nvm, gh)..."
run_as_user "brew install pyenv openssl xz gh nvm"
run_as_user "brew install --cask visual-studio-code docker"

# ==============================================================================
# 3. SHELL CONFIGURATION (Zsh - Pyenv & NVM)
# ==============================================================================

ZSHRC="$USER_HOME/.zshrc"
echo "⚙️  Configuring Zsh for Pyenv & NVM..."

# -- Pyenv Hook --
if ! grep -q "pyenv init" "$ZSHRC"; then
    echo "" >> "$ZSHRC"
    echo "# Pyenv Configuration (Added by DEV Build 2026)" >> "$ZSHRC"
    echo 'export PYENV_ROOT="$HOME/.pyenv"' >> "$ZSHRC"
    echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"' >> "$ZSHRC"
    echo 'eval "$(pyenv init -)"' >> "$ZSHRC"
    chown "$CURRENT_USER" "$ZSHRC"
    echo "✅ .zshrc updated for Pyenv."
else
    echo "✅ .zshrc already configured for Pyenv."
fi

# -- NVM Hook --
if ! grep -q "NVM_DIR" "$ZSHRC"; then
    echo "" >> "$ZSHRC"
    echo "# NVM Configuration (Added by DEV Build 2026)" >> "$ZSHRC"
    echo 'export NVM_DIR="$HOME/.nvm"' >> "$ZSHRC"
    echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh" # This loads nvm' >> "$ZSHRC"
    echo '[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" # This loads nvm bash_completion' >> "$ZSHRC"
    chown "$CURRENT_USER" "$ZSHRC"
    echo "✅ .zshrc updated for NVM."
else
    echo "✅ .zshrc already configured for NVM."
fi

# ==============================================================================
# 4. PYTHON & NODE.JS SETUP (Golden Versions)
# ==============================================================================

echo "🐍 Installing Python $PYTHON_VERSION..."
run_as_user "pyenv install -s $PYTHON_VERSION"
run_as_user "pyenv global $PYTHON_VERSION"

echo "🟩 Installing Node.js $NODE_VERSION..."
run_as_user "nvm install $NODE_VERSION"
run_as_user "nvm alias default $NODE_VERSION"

# ==============================================================================
# 5. VS CODE EXTENSIONS
# ==============================================================================

echo "🧩 Installing VS Code Extensions..."
EXTENSIONS=(
    "ms-python.python"
    "ms-python.black-formatter"
    "eamodio.gitlens"
    "ms-azuretools.vscode-docker"
    "VisualStudioExptTeam.vscodeintellicode"
    "dbaeumer.vscode-eslint" # Added for Node.js linting
)

for ext in "${EXTENSIONS[@]}"; do
    run_as_user "code --install-extension $ext --force"
done

# ==============================================================================
# 6. GOLDEN MASTER PROJECT STRUCTURE (NODE.JS)
# ==============================================================================

echo "🏗️  Building Golden Master *Node.js* Project at: $PROJECT_DIR"

# Create Directory
run_as_user "mkdir -p $PROJECT_DIR"

# Initialize Git
if [ ! -d "$PROJECT_DIR/.git" ]; then
    run_as_user "cd $PROJECT_DIR && git init"
fi

# Create Security Barrier (.gitignore)
GITIGNORE="$PROJECT_DIR/.gitignore"
cat <<EOF > "$GITIGNORE"
# Golden Master .gitignore

# Node
node_modules/
package-lock.json

# Mac System
.DS_Store

# Environment Variables (SECRETS)
.env

# IDE & Logs
.vscode/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOF
chown "$CURRENT_USER" "$GITIGNORE"

# Create package.json
PACKAGE_JSON="$PROJECT_DIR/package.json"
cat <<EOF > "$PACKAGE_JSON"
{
  "name": "ai-agents-and-apps-dev",
  "version": "1.0.0",
  "description": "Golden Master repo for AI/Bot projects",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "author": "JLAI",
  "license": "ISC",
  "dependencies": {}
}
EOF
chown "$CURRENT_USER" "$PACKAGE_JSON"

# ==============================================================================
# 7. DEPENDENCIES & LIBS (NODE.JS)
# ==============================================================================

echo "📚 Installing Node.js Bot Stack (@slack/bolt, dotenv)..."

# Install core libs
run_as_user "cd $PROJECT_DIR && npm install @slack/bolt dotenv"

echo "✅ DEV BUILD 2026 (V3) COMPLETE."
echo "   Target: $PROJECT_DIR"
echo "   Action: Run 'gh auth login' to connect to GitHub."
echo "   Restart terminal to use NVM and Pyenv."