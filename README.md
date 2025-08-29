# Contact Form Backend Setup

## Installation Steps:

1. Backend folder mein jaiye:
```bash
cd backend
```

2. Dependencies install kariye:
```bash
npm install
```

3. .env file mein apne email credentials add kariye:
- Gmail ke liye App Password generate kariye (2-factor authentication enable hona chahiye)
- Outlook ke liye regular password use kar sakte hain

4. Server start kariye:
```bash
npm run dev
```

## Email Configuration:

### Gmail Setup:
1. Gmail account mein 2-factor authentication enable kariye
2. App Password generate kariye: https://myaccount.google.com/apppasswords
3. .env file mein EMAIL_USER aur EMAIL_PASS update kariye

### Outlook Setup:
1. .env file mein OUTLOOK_USER aur OUTLOOK_PASS update kariye
2. Regular password use kar sakte hain

## Important Notes:
- Server port 5000 par chalega
- Frontend se http://localhost:5000/api/contact par request jayegi
- Dono Gmail aur Outlook par email jayega
- Form submit hone par recipient emails par message ayega