#!/usr/bin/env bash

# ============================================================================
# B_Kart Development Tools Setup Script
# ============================================================================
# This script installs and configures essential development tools:
# - nvm (Node Version Manager)
# - Supabase CLI
# - Stripe CLI
# - Verifies installations and provides next steps
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
  echo -e "\n${BLUE}============================================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}============================================================================${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}ℹ️  $1${NC}"
}

check_command() {
  if command -v "$1" &> /dev/null; then
    print_success "$1 is already installed"
    return 0
  else
    return 1
  fi
}

# ============================================================================
# 1. Install Homebrew (if not installed)
# ============================================================================
print_header "Checking Homebrew Installation"

if ! check_command brew; then
  print_info "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  
  # Add Homebrew to PATH for Apple Silicon Macs
  if [[ $(uname -m) == "arm64" ]]; then
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
  print_success "Homebrew installed successfully"
else
  print_info "Updating Homebrew..."
  brew update
fi

# ============================================================================
# 2. Install nvm (Node Version Manager)
# ============================================================================
print_header "Installing nvm (Node Version Manager)"

if [ -d "$HOME/.nvm" ]; then
  print_success "nvm directory already exists"
else
  print_info "Installing nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  
  # Load nvm immediately
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  
  print_success "nvm installed successfully"
fi

# Load nvm if not already loaded
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# ============================================================================
# 3. Install Node.js 18.20.4 via nvm
# ============================================================================
print_header "Installing Node.js 18.20.4"

if nvm list | grep -q "v18.20.4"; then
  print_success "Node.js 18.20.4 is already installed"
else
  print_info "Installing Node.js 18.20.4..."
  nvm install 18.20.4
  print_success "Node.js 18.20.4 installed successfully"
fi

# Set as default
nvm alias default 18.20.4
nvm use 18.20.4

print_info "Node version: $(node -v)"
print_info "npm version: $(npm -v)"

# ============================================================================
# 4. Install Supabase CLI
# ============================================================================
print_header "Installing Supabase CLI"

if check_command supabase; then
  print_info "Updating Supabase CLI..."
  brew upgrade supabase || print_info "Already at latest version"
else
  print_info "Installing Supabase CLI..."
  brew install supabase/tap/supabase
  print_success "Supabase CLI installed successfully"
fi

print_info "Supabase version: $(supabase --version)"

# ============================================================================
# 5. Install Stripe CLI
# ============================================================================
print_header "Installing Stripe CLI"

if check_command stripe; then
  print_info "Updating Stripe CLI..."
  brew upgrade stripe || print_info "Already at latest version"
else
  print_info "Installing Stripe CLI..."
  brew install stripe/stripe-cli/stripe
  print_success "Stripe CLI installed successfully"
fi

print_info "Stripe CLI version: $(stripe --version)"

# ============================================================================
# 6. Install project dependencies
# ============================================================================
print_header "Installing B_Kart Project Dependencies"

cd "$(dirname "$0")/.." || exit 1

if [ -f "package.json" ]; then
  print_info "Installing npm packages..."
  npm install
  print_success "npm packages installed successfully"
else
  print_error "package.json not found in project root"
fi

# ============================================================================
# 7. Verify pyenv setup
# ============================================================================
print_header "Verifying Python Environment"

if check_command pyenv; then
  if [ -f ".python-version" ]; then
    PYTHON_VERSION=$(cat .python-version)
    print_info "Required Python version: $PYTHON_VERSION"
    
    if pyenv versions | grep -q "$PYTHON_VERSION"; then
      print_success "Python $PYTHON_VERSION is installed"
    else
      print_info "Installing Python $PYTHON_VERSION..."
      pyenv install "$PYTHON_VERSION"
      print_success "Python $PYTHON_VERSION installed"
    fi
  fi
else
  print_error "pyenv is not installed. Install it with: brew install pyenv"
fi

# ============================================================================
# 8. Create .env.local template if it doesn't exist
# ============================================================================
print_header "Checking Environment Configuration"

if [ ! -f ".env.local" ]; then
  if [ -f ".env.example" ]; then
    print_info "Creating .env.local from .env.example..."
    cp .env.example .env.local
    print_success ".env.local created - IMPORTANT: Fill in your actual values!"
  else
    print_info "Creating .env.local template..."
    cat > .env.local << 'ENV_EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
ENV_EOF
    print_success ".env.local template created - Fill in your actual values!"
  fi
else
  print_success ".env.local already exists"
fi

# ============================================================================
# 9. Summary & Next Steps
# ============================================================================
print_header "Installation Complete! 🎉"

echo -e "${GREEN}Installed Tools:${NC}"
echo "  • nvm $(nvm --version 2>/dev/null || echo 'installed')"
echo "  • Node.js $(node -v)"
echo "  • npm $(npm -v)"
echo "  • Supabase CLI $(supabase --version)"
echo "  • Stripe CLI $(stripe --version)"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "  1. Restart your terminal or run: source ~/.zshrc"
echo "  2. Navigate to project: cd ~/Desktop/Projects/B_Kart"
echo "  3. Configure .env.local with your actual credentials"
echo "  4. Login to Supabase: supabase login"
echo "  5. Login to Stripe: stripe login"
echo "  6. Start development server: npm run dev"

echo -e "\n${BLUE}Useful Aliases (already configured in ~/.zshrc):${NC}"
echo "  • bk        → cd to B_Kart project"
echo "  • bkdev     → Start dev server"
echo "  • bkbuild   → Build for production"
echo "  • bklint    → Run ESLint"
echo "  • bktype    → Run TypeScript check"
echo "  • bkdb      → Start local Supabase"
echo "  • bkstop    → Stop local Supabase"

echo -e "\n${GREEN}Setup complete! Happy coding! 🚀${NC}\n"
