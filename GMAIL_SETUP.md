# Gmail App Password Setup Guide

## Step 1: Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification"

## Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select app: "Mail"
3. Select device: "Other (Custom name)" → Type "Contact Form"
4. Click "Generate"
5. Copy the 16-digit password (no spaces)

## Step 3: Update .env file
Replace EMAIL_PASS with the 16-digit app password:

```
EMAIL_PASS=abcd efgh ijkl mnop
```

## Alternative: Use Less Secure Apps (Not Recommended)
If you don't want to use App Password:
1. Go to: https://myaccount.google.com/lesssecureapps
2. Turn ON "Allow less secure apps"
3. Use your regular Gmail password

## Test the setup:
After updating .env, restart the server:
```bash
npm run dev
```