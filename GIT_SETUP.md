# Git Setup Guide - IIMB Samarpan

This guide provides step-by-step instructions for uploading your IIMB Samarpan codebase to GitHub and managing repository access.

## 🎯 Overview

This guide covers:
1. Creating a GitHub repository
2. Uploading your codebase from Replit
3. Setting up collaboration access
4. Managing repository settings

## 📁 Method 1: Direct Upload from Replit (Recommended)

### Step 1: Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in repository details:
   ```
   Repository name: iimb-samarpan
   Description: Enterprise-grade social volunteering platform for IIM Bangalore students
   Visibility: Private (recommended for institutional projects)
   Initialize: Do NOT check any initialization options
   ```
5. Click "Create repository"

### Step 2: Upload from Replit
1. In your Replit workspace, click the "Version control" tab (Git icon) in the left sidebar
2. If not already initialized, click "Initialize Git repository"
3. Add all files to version control:
   ```
   Add all files → Commit with message "Initial commit: IIMB Samarpan platform"
   ```
4. Click "Connect to GitHub"
5. Select your newly created repository
6. Click "Push to GitHub"

### Step 3: Set Repository Access
1. On GitHub, go to your repository
2. Click "Settings" tab
3. Click "Collaborators" in the left sidebar
4. Click "Add people"
5. Enter the GitHub usernames/emails of people you want to give access to
6. Choose permission level:
   - **Admin**: Full access including repository settings
   - **Maintain**: Manage repository without sensitive settings
   - **Write**: Push code and manage issues/PRs
   - **Triage**: Manage issues and PRs without write access
   - **Read**: View and clone repository only

## 🔧 Method 2: Command Line Upload

### Step 1: Prepare Repository
Create an empty repository on GitHub (same as Method 1, Step 1)

### Step 2: Initialize Git in Replit
Open the Replit Shell and run these commands:

```bash
# Initialize git repository
git init

# Add all files to git
git add .

# Create initial commit
git commit -m "Initial commit: IIMB Samarpan enterprise platform

Features:
- Hourly-based coin reward system
- Enterprise-grade IIMB branding
- Student and admin role management  
- Opportunity management system
- Gamification with badges and leaderboard
- PostgreSQL database with Drizzle ORM
- Replit OpenID Connect authentication"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/iimb-samarpan.git

# Push to GitHub
git push -u origin main
```

### Step 3: Set Up Branch Protection (Optional but Recommended)
```bash
# Create development branch
git checkout -b development
git push -u origin development

# Switch back to main
git checkout main
```

## 📋 Repository Configuration

### Step 1: Repository Settings
On GitHub, configure these repository settings:

**General Settings:**
- Description: "Enterprise-grade social volunteering platform for IIM Bangalore students"
- Website: Your deployed application URL
- Topics: `social-impact`, `volunteering`, `iim-bangalore`, `react`, `typescript`, `enterprise`

**Branch Protection Rules** (Settings → Branches):
```
Branch name pattern: main
✅ Require a pull request before merging
✅ Require status checks to pass before merging
✅ Require branches to be up to date before merging
✅ Include administrators
```

### Step 2: Create .gitignore File
Create a `.gitignore` file to exclude sensitive and unnecessary files:

```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# IDE and editor files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
tmp/
temp/

# Database files
*.sqlite
*.sqlite3

# Replit specific
.replit
replit.nix
.config/

# Session and cookie files (testing artifacts)
*_session.txt
*_cookies.txt
admin_session.txt
student_session.txt
student_cookies.txt
cookies.txt

# Lock files (keep package-lock.json but exclude others)
yarn.lock
pnpm-lock.yaml
```

### Step 3: Add Repository Topics
In GitHub repository settings, add these topics for better discoverability:
- `social-impact`
- `volunteering`
- `iim-bangalore`
- `react`
- `typescript`
- `enterprise`
- `education`
- `nodejs`
- `postgresql`

## 👥 Team Collaboration Setup

### Step 1: Team Organization
Create teams for different access levels:

**Admin Team:**
- Repository administrators
- Full access to all branches and settings
- Can manage collaborators and repository settings

**Developer Team:**
- Core development team
- Write access to development branch
- Can create pull requests to main branch

**Reviewer Team:**
- Code review and quality assurance
- Can review and approve pull requests
- Read access to all branches

### Step 2: Workflow Setup
```bash
# Clone repository for team members
git clone https://github.com/YOUR_USERNAME/iimb-samarpan.git
cd iimb-samarpan

# Install dependencies
npm install

# Create feature branch
git checkout -b feature/new-feature-name

# Make changes and commit
git add .
git commit -m "Add new feature: description"

# Push feature branch
git push origin feature/new-feature-name

# Create pull request on GitHub
```

## 🔄 Continuous Integration Setup

### GitHub Actions Workflow
Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, development ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Type check
      run: npm run check
    
    - name: Build application
      run: npm run build
      
    - name: Test build
      run: |
        npm start &
        sleep 10
        curl -f http://localhost:5000 || exit 1
```

## 📦 Release Management

### Creating Releases
```bash
# Tag a release
git tag -a v1.0.0 -m "Release v1.0.0: Initial production release"
git push origin v1.0.0

# Create release on GitHub
# Go to Releases → Create new release → Select tag → Add release notes
```

### Release Notes Template
```markdown
## 🚀 IIMB Samarpan v1.0.0

### ✨ New Features
- Hourly-based coin reward system with maximum limits
- Enterprise-grade IIMB branding and design
- Student-focused leaderboard (admins excluded)
- Enhanced opportunity management workflow
- Professional animations and micro-interactions

### 🛠 Technical Improvements
- PostgreSQL database with Drizzle ORM
- Type-safe full-stack TypeScript implementation
- Enhanced error handling and validation
- Optimized loading states and UX


### 🔧 Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### 📋 Migration Notes
This is the initial production release. No migration required.
```

## 🔐 Security & Access Management

### Repository Security Settings
1. **Dependency Security**: Enable Dependabot alerts
2. **Code Scanning**: Enable GitHub code scanning
3. **Secret Scanning**: Enable secret scanning
4. **Private Vulnerability Reporting**: Enable for security issues

### Collaborator Guidelines
```markdown
# Collaborator Onboarding Checklist

## Required Access
- [ ] GitHub repository access (appropriate permission level)
- [ ] Development environment setup
- [ ] Database access (development/staging)
- [ ] Documentation review

## Development Setup
- [ ] Clone repository
- [ ] Install dependencies (`npm install`)
- [ ] Set up environment variables
- [ ] Test local development server
- [ ] Verify database connection

## Workflow Guidelines
- [ ] Create feature branches for all changes
- [ ] Write descriptive commit messages
- [ ] Test changes before pushing
- [ ] Create pull requests for code review
- [ ] Update documentation when needed
```

## 📚 Quick Command Reference

### Daily Development Commands
```bash
# Get latest changes
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Commit changes
git add .
git commit -m "Description of changes"

# Push changes
git push origin feature/your-feature-name

# Switch branches
git checkout main
git checkout development

# Sync with remote
git fetch origin
git pull origin main
```

### Repository Management
```bash
# Add collaborator (repository owner only)
# Done through GitHub web interface

# Clone repository
git clone https://github.com/YOUR_USERNAME/iimb-samarpan.git

# View repository information
git remote -v
git branch -a
git log --oneline -10
```

### Troubleshooting Git Issues
```bash
# Reset local changes
git reset --hard HEAD

# Force pull (careful!)
git fetch origin
git reset --hard origin/main

# Check repository status
git status
git log --oneline -5

# Fix merge conflicts
git merge --abort  # Cancel merge
git rebase --abort  # Cancel rebase
```

---

**🎉 Congratulations!** Your IIMB Samarpan platform is now ready for GitHub collaboration and production deployment.

For questions or issues, refer to the troubleshooting sections in this guide or the main [README.md](./README.md) file.