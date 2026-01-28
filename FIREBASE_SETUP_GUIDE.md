# Firebase Setup Guide for AL-Huda School System

This guide will walk you through setting up Firebase for your AL-Huda School System to enable cloud-based storage and cross-device access.

---

## Step 1: Create a Firebase Project

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com](https://console.firebase.google.com)
   - Sign in with your Google account (create one if needed)

2. **Create New Project**
   - Click "Add project"
   - Enter project name: `al-huda-school` (or your preferred name)
   - Click "Continue"
   - Disable Google Analytics (optional, not needed for this app)
   - Click "Create project"
   - Wait for project creation, then click "Continue"

---

## Step 2: Enable Authentication

1. **Navigate to Authentication**
   - In the left sidebar, click "Build" → "Authentication"
   - Click "Get started"

2. **Enable Email/Password Sign-in**
   - Click on "Sign-in method" tab
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

---

## Step 3: Create Firestore Database

1. **Navigate to Firestore**
   - In the left sidebar, click "Build" → "Firestore Database"
   - Click "Create database"

2. **Configure Security Rules**
   - Select "Start in production mode"
   - Click "Next"

3. **Choose Location**
   - Select a location closest to you (e.g., `eur3` for Europe, `us-central` for USA)
   - Click "Enable"
   - Wait for database creation

4. **Update Security Rules**
   - Click on "Rules" tab
   - Replace the default rules with the content from `firestore.rules` file:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /schools/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```
   - Click "Publish"

---

## Step 4: Get Firebase Configuration

1. **Add Web App**
   - Go to Project Overview (home icon in sidebar)
   - Click the web icon `</>` to add a web app
   - Enter app nickname: `AL-Huda Web App`
   - **DO NOT** check "Also set up Firebase Hosting"
   - Click "Register app"

2. **Copy Configuration**
   - You'll see a code snippet with your Firebase config
   - Copy the values for:
     - `apiKey`
     - `authDomain`
     - `projectId`
     - `storageBucket`
     - `messagingSenderId`
     - `appId`

3. **Update firebase-config.js**
   - Open `firebase-config.js` in your project
   - Replace the placeholder values with your actual Firebase credentials:
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_ACTUAL_API_KEY_HERE",
       authDomain: "your-project-id.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project-id.appspot.com",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```
   - Save the file

---

## Step 5: Create Your First User Account

1. **Open the Application**
   - Open `index.html` in your browser
   - You should see the login page

2. **Register New Account**
   - Click "Register" link
   - Enter email (use "admin" in email for admin access, e.g., `admin@alhuda.edu`)
   - Enter password (minimum 6 characters)
   - Confirm password
   - Click "Create Account"

3. **Login**
   - After successful registration, login with your credentials
   - You should see the dashboard

---

## Step 6: Migrate Existing Data (If You Have Local Data)

If you have existing data in localStorage that you want to migrate to the cloud:

1. **Open Migration Tool**
   - Open `migrate-to-cloud.html` in your browser

2. **Login and Migrate**
   - Enter your email and password
   - Click "Start Migration"
   - Wait for the process to complete
   - You'll see a success message when done

3. **Verify Migration**
   - Go back to `index.html`
   - Login and verify all your data is present

---

## Step 7: Test Multi-Device Access

1. **Login from Another Device**
   - Open the application on a different device (phone, tablet, another computer)
   - Login with the same credentials

2. **Verify Data Sync**
   - Add a student on Device A
   - Check Device B - the student should appear within 1-2 seconds
   - Try updating attendance on Device B
   - Verify it updates on Device A

3. **Check Sync Status**
   - Look at the top-right corner of the header
   - You should see a green "Synced" indicator
   - If offline, it will show "Offline" in gray

---

## Troubleshooting

### "Firebase not initialized" Error
- Make sure you've updated `firebase-config.js` with your actual credentials
- Check browser console for any errors
- Verify all Firebase SDK scripts are loading correctly

### "Permission denied" Error
- Make sure you've deployed the Firestore security rules correctly
- Verify you're logged in with a valid account

### Data Not Syncing
- Check your internet connection
- Look at the sync status indicator in the header
- Check browser console for sync errors
- Verify Firestore rules are correctly set

### Can't Login
- Make sure Email/Password authentication is enabled in Firebase Console
- Check that you're using the correct email and password
- Try password reset if you forgot your password

---

## Security Best Practices

1. **Keep Credentials Private**
   - Never share your Firebase API keys publicly
   - Don't commit `firebase-config.js` with real credentials to public repositories

2. **Use Strong Passwords**
   - Use passwords with at least 8 characters
   - Include numbers, letters, and special characters

3. **Regular Backups**
   - Firebase automatically backs up your data
   - You can also export data from Firestore Console

4. **Monitor Usage**
   - Check Firebase Console regularly for usage statistics
   - Free tier limits: 10K reads/day, 20K writes/day, 1GB storage

---

## Next Steps

✅ Your system is now cloud-enabled!
✅ You can access your data from any device
✅ Data automatically syncs in real-time
✅ Offline mode works with automatic sync when back online

**Need Help?**
- Firebase Documentation: [https://firebase.google.com/docs](https://firebase.google.com/docs)
- Check browser console for detailed error messages
