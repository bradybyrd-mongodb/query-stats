# Security Configuration

This document outlines the security practices implemented in the MongoDB QueryStats Web Application.

## Environment Variable Security

### MongoDB Password Protection

The application uses environment variables to protect sensitive information like database passwords:

**✅ Secure Approach (Current Implementation):**
```json
// settings.json
{
  "mongodb": {
    "uri": "mongodb+srv://main_admin:<secret>@cluster.mongodb.net"
  }
}
```

```bash
# .env (not committed to git)
MONGODB_PWD=your-actual-password
```

**❌ Insecure Approach (Avoided):**
```json
// settings.json - DON'T DO THIS
{
  "mongodb": {
    "uri": "mongodb+srv://main_admin:plaintext-password@cluster.mongodb.net"
  }
}
```

### How It Works

1. **Placeholder Substitution**: The `<secret>` placeholder in `settings.json` gets replaced with the `MONGODB_PWD` environment variable at runtime.

2. **Environment Variable Priority**: 
   - `MONGODB_URI` (if set) overrides everything
   - `MONGODB_PWD` replaces `<secret>` in settings.json URI
   - `MONGODB_DATABASE` overrides database name from settings.json

3. **Logging Protection**: Connection URIs are masked in logs to prevent password exposure.

## Configuration Options

### Option 1: Password Substitution (Recommended)
```bash
# .env
MONGODB_PWD=your-password
MONGODB_DATABASE=admin
```

### Option 2: Complete URI Override
```bash
# .env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
```

## Testing Configuration

Use the built-in test script to verify your configuration:

```bash
npm run test:connection
```

This will show:
- Current settings from settings.json
- Environment variables (masked)
- Final connection configuration
- Configuration validation status

## Production Deployment

### Environment Variables Setup

For production deployments, set these environment variables:

```bash
NODE_ENV=production
MONGODB_PWD=your-production-password
MONGODB_DATABASE=your-production-database
PORT=3001
```

### Security Headers

The application includes security middleware:
- **Helmet.js**: Sets various HTTP headers for security
- **CORS**: Configured for specific origins
- **Request Logging**: Morgan for HTTP request logging

### File Security

- **`.env` files**: Automatically ignored by git
- **Password masking**: Connection strings are masked in logs
- **No hardcoded secrets**: All sensitive data uses environment variables

## Best Practices

1. **Never commit `.env` files** - They're in `.gitignore` for a reason
2. **Use different passwords** for development and production
3. **Rotate passwords regularly** in production environments
4. **Monitor logs** for any accidental password exposure
5. **Use MongoDB Atlas IP whitelisting** for additional security
6. **Enable MongoDB authentication** and use strong passwords

## Troubleshooting

### Common Issues

1. **"Password not substituted" error**:
   - Check that `.env` file exists
   - Verify `MONGODB_PWD` is set in `.env`
   - Ensure `settings.json` uses `<secret>` placeholder

2. **Connection fails**:
   - Run `npm run test:connection` to verify configuration
   - Check MongoDB cluster is accessible
   - Verify network connectivity and firewall settings

3. **Environment variables not loaded**:
   - Ensure `dotenv` package is installed
   - Check that `require('dotenv').config()` is called early in server.js
   - Verify `.env` file is in the correct directory

### Debug Commands

```bash
# Test configuration
npm run test:connection

# Check environment variables
node -e "require('dotenv').config(); console.log('MONGODB_PWD:', process.env.MONGODB_PWD ? '***' : 'NOT SET')"

# Verify settings.json
cat settings.json | grep -o '<secret>'
```

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] No hardcoded passwords in source code
- [ ] `settings.json` uses `<secret>` placeholder
- [ ] `MONGODB_PWD` environment variable is set
- [ ] Connection test passes (`npm run test:connection`)
- [ ] Logs show masked URIs (no password exposure)
- [ ] Production uses different credentials than development
- [ ] MongoDB cluster has proper access controls
