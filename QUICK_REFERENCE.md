# 📋 Quick Reference Card

## Your Credentials
```
Email: admin@alhuda.edu
Password: Admin123!
```

## Files You Need
- ✅ `firebase-config.js` - Update with YOUR Firebase credentials
- ✅ `index.html` - Main app (register here first)
- ✅ `migrate-to-cloud.html` - Use AFTER registration
- ✅ `open-in-chrome.bat` - Double-click to launch

## The Process (In Order)

### 1️⃣ Create Firebase Project
- Go to: https://console.firebase.google.com
- Create project: `al-huda-school`
- Enable Email/Password authentication
- Create Firestore database
- Set security rules

### 2️⃣ Get Firebase Config
- Click web icon `</>`
- Copy the 6 configuration values

### 3️⃣ Update firebase-config.js
- Replace `YOUR_API_KEY_HERE` with your actual values
- Save the file

### 4️⃣ Register Your Account
- Open `index.html`
- Click "Register"
- Email: `admin@alhuda.edu`
- Password: `Admin123!`

### 5️⃣ Migrate Data
- Open `migrate-to-cloud.html`
- Login with same credentials
- Click "Start Migration"
- Wait for completion

### 6️⃣ Done!
- Your data is now in the cloud
- Access from any device
- Real-time sync enabled

## Common Errors

| Error | Solution |
|-------|----------|
| "Invalid email or password" | You need to register first in `index.html` |
| "Firebase not initialized" | Update `firebase-config.js` with real values |
| "No local data found" | You don't have existing data to migrate |

## Important Notes

⚠️ **MUST contain "admin"** in email for admin access
⚠️ **Register BEFORE** using migration tool
⚠️ **Update firebase-config.js** with YOUR values, not placeholders

## Firebase Console Links

- Main Console: https://console.firebase.google.com
- Your Project: https://console.firebase.google.com/project/al-huda-school

## Support

If stuck, check the browser console (F12) for error messages.
