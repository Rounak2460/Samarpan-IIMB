# IIMB Samarpan - Deployment Guide

This guide provides comprehensive instructions for deploying the IIMB Samarpan platform to production environments.

## 🎯 Deployment Overview

The IIMB Samarpan platform is designed for enterprise deployment with the following requirements:
- PostgreSQL database for data persistence with auto-closing functionality
- Replit OpenID Connect authentication
- Session storage with database backing
- Iterative hour submission workflow support
- Real-time progress tracking capabilities
- Static asset serving
- HTTPS/SSL support for production

## 🏗 Architecture Summary

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React/Vite)  │◄──►│   (Express.js)  │◄──►│   (PostgreSQL)  │
│   Port: 5000    │    │   Port: 5000    │    │   (External)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Replit Auth   │
                    │   (OIDC)        │
                    └─────────────────┘
```

## 🔧 Pre-Deployment Checklist

### 1. Database Setup
- [ ] PostgreSQL database provisioned and accessible
- [ ] Database connection string available
- [ ] Proper database user permissions configured
- [ ] SSL/TLS connection enabled for production

### 2. Authentication Configuration
- [ ] Replit application registered for your domain
- [ ] OIDC endpoints configured
- [ ] Domain restrictions set to `@iimb.ac.in`
- [ ] Session secret generated

### 3. Environment Variables
- [ ] All required environment variables documented
- [ ] Secure secret management in place
- [ ] Production configuration validated

## 🌐 Deployment Options

## Option 1: Replit Deployments (Recommended)

Replit Deployments provides the simplest path to production with automatic scaling, SSL, and domain management.

### Step 1: Prepare for Deployment
```bash
# Ensure all dependencies are installed
npm install

# Build the application
npm run build

# Test the production build locally
npm start
```

### Step 2: Environment Configuration
Set the following environment variables in Replit Deployments:

**Required Variables:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
SESSION_SECRET=your-secure-session-secret-min-32-chars
REPLIT_DOMAINS=your-custom-domain.com,your-app.replit.app
REPL_ID=your-repl-id
ISSUER_URL=https://replit.com/oidc
```

### Step 3: Database Schema Deployment
```bash
# Push the database schema to production
npm run db:push
```

### Step 4: Deploy to Replit
1. Click "Deploy" in your Replit workspace
2. Configure your custom domain (optional)
3. Set environment variables
4. Deploy the application

## Option 2: Self-Hosted Deployment

### Prerequisites
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+ installed
- PostgreSQL 13+ installed and configured
- Nginx for reverse proxy
- SSL certificate (Let's Encrypt recommended)

### Step 1: Server Setup
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Nginx
sudo apt install nginx

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx
```

### Step 2: Database Configuration
```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE iimb_samarpan;
CREATE USER iimb_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE iimb_samarpan TO iimb_user;
\q
```

### Step 3: Application Deployment
```bash
# Clone repository
git clone <your-github-repo-url>
cd iimb-samarpan

# Install dependencies
npm install

# Set environment variables
sudo nano /etc/environment
# Add your environment variables

# Build application
npm run build

# Push database schema
npm run db:push
```

### Step 4: Process Management (PM2)
```bash
# Install PM2
npm install -g pm2

# Start application with PM2
pm2 start npm --name "iimb-samarpan" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

### Step 5: Nginx Configuration
```nginx
# /etc/nginx/sites-available/iimb-samarpan
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 6: SSL Setup
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/iimb-samarpan /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 🔐 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:port/db` |
| `SESSION_SECRET` | Session encryption key | `your-secure-32-char-secret` |
| `REPLIT_DOMAINS` | Comma-separated allowed domains | `app.replit.app,custom.com` |
| `REPL_ID` | Replit application ID | `your-repl-id` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ISSUER_URL` | OIDC issuer URL | `https://replit.com/oidc` |
| `PGHOST` | Database host | From `DATABASE_URL` |
| `PGPORT` | Database port | `5432` |
| `PGUSER` | Database user | From `DATABASE_URL` |
| `PGPASSWORD` | Database password | From `DATABASE_URL` |
| `PGDATABASE` | Database name | From `DATABASE_URL` |

## 📊 Monitoring & Maintenance

### Application Monitoring
```bash
# Check application status (PM2)
pm2 status
pm2 logs iimb-samarpan

# Monitor system resources
htop
df -h
```

### Database Maintenance
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('iimb_samarpan'));

-- Monitor active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'iimb_samarpan';

-- Check auto-closing opportunity performance
SELECT o.title, o.total_required_hours, 
       COALESCE(SUM(a.hours_completed), 0) as total_completed,
       o.status
FROM opportunities o
LEFT JOIN applications a ON o.id = a.opportunity_id 
WHERE a.status IN ('completed', 'hours_approved')
GROUP BY o.id, o.title, o.total_required_hours, o.status;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Log Management
```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs (PM2)
pm2 logs iimb-samarpan --lines 100
```

## 🔄 Updates & Maintenance

### Deploying Updates
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Build application
npm run build

# Update database schema (if needed)
npm run db:push

# Restart application
pm2 restart iimb-samarpan
```

### Database Migrations
```bash
# For schema changes
npm run db:push

# For major changes (use with caution in production)
npm run db:push --force
```

### Backup Strategy
```bash
# Database backup
pg_dump iimb_samarpan > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql iimb_samarpan < backup_20250831_120000.sql
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Test database connection
psql "$DATABASE_URL"

# Check if database is accepting connections
pg_isready -h hostname -p port
```

#### 2. Authentication Problems
- Verify `REPLIT_DOMAINS` includes your production domain
- Check `REPL_ID` matches your Replit application
- Ensure SSL is properly configured for OIDC callbacks

#### 3. Session Issues
- Verify `SESSION_SECRET` is set and secure
- Check PostgreSQL `sessions` table exists
- Monitor session storage usage

#### 4. Build Failures
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript compilation
npm run check
```

### Performance Optimization

#### Database Optimization
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_opportunities_type ON opportunities(type);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_opportunity_id ON applications(opportunity_id);
```

#### Application Optimization
- Enable gzip compression in Nginx
- Configure caching headers for static assets
- Monitor memory usage and optimize queries
- Use connection pooling for database connections

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancer with session affinity
- Implement Redis for session storage
- Consider CDN for static assets
- Database read replicas for heavy read workloads

### Vertical Scaling
- Monitor CPU and memory usage
- Optimize database queries
- Implement caching strategies
- Upgrade server resources as needed

## 🔒 Security Considerations

### Production Security Checklist
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Database connections encrypted (SSL/TLS)
- [ ] Environment variables secured
- [ ] Session secrets are cryptographically secure
- [ ] Regular security updates applied
- [ ] Database access properly restricted
- [ ] Application logs monitored for security events

### Security Headers
Add these security headers in your Nginx configuration:
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self';" always;
```

## 📱 Mobile Considerations

The platform is fully responsive and optimized for mobile devices. No additional configuration is required for mobile deployment.

## 💡 Best Practices

1. **Regular Backups**: Automate daily database backups
2. **Monitoring**: Set up application and database monitoring
3. **Updates**: Keep dependencies updated for security
4. **Testing**: Test all deployments in staging environment first
5. **Documentation**: Keep deployment documentation updated

## 📞 Emergency Procedures

### Application Down
1. Check PM2 status: `pm2 status`
2. Check application logs: `pm2 logs iimb-samarpan`
3. Restart application: `pm2 restart iimb-samarpan`
4. Check Nginx status: `sudo systemctl status nginx`

### Database Issues
1. Check PostgreSQL status: `sudo systemctl status postgresql`
2. Test database connection: `psql "$DATABASE_URL"`
3. Check disk space: `df -h`
4. Review PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-13-main.log`

### High Traffic
1. Monitor server resources: `htop`
2. Check database connections: Monitor active connections
3. Scale vertically: Upgrade server resources
4. Scale horizontally: Add load balancer and additional servers

---

*For additional support, contact the development team or refer to the troubleshooting section.*