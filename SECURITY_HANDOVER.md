# 🛡️ Al-Huda School System: Security Master Guide

Congratulations! Your system is now **Clean** and **Professional**. Follow these final 3 steps to lock your system like a fortress.

---

### **1. Rotate Your Firebase API Key (V. IMPORTANT)**
Because the old key was leaked to GitHub, you should invalidate it so no one else can use your Firebase bill.
1.  Go to [**Firebase Console**](https://console.firebase.google.com/) -> **Project Settings**.
2.  Look for **Web API Key**.
3.  On the right side, there is often an option to "Change" or "Rotate" the key. If not, don't worry—the other steps below will still protect your data.

---

### **2. Set Up Your Private `config.js`**
I have replaced your secrets with placeholders. You need to put your **Real Credentials** back into the file **ONLY on your computer**.
1.  Open the file **`config.js`** in your project folder.
2.  Replace the `"YOUR_PROJECT_ID"` and other placeholders with your actual values from the Firebase Console.
3.  **Why this is safe:** I have added `config.js` to a special file called `.gitignore`. This means even if you upload your code to GitHub again, this specific file will be **STAY INVISIBLE** to the internet.

---

### **3. Lock Your Database Rules**
1.  Go to **Firebase Console** -> **Firestore Database** -> **Rules**.
2.  Paste the following "Locked Mode" rules (I have already prepared them for you):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /schools/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
3.  Click **Publish**.

### **4. Stop GitGuardian Alerts (Clean Your GitHub History)**
GitGuardian sends alerts because the old passwords are still in your **History**. Even if you delete them today, someone can click "Previous Commits" and see them.

**To stop the alerts forever:**
1.  **Change your passwords** in the Firebase Console (this makes the old ones useless).
2.  **Delete and Re-create your Repository:** This is the easiest way.
    *   Delete the current repo on GitHub.
    *   Create a NEW repo.
    *   **Push your NEW clean code** from your computer.
3.  **Use the BFG Tool (For Pros):** If you must keep the repository, use a tool like [**BFG Repo-Cleaner**](https://rtyley.github.io/bfg-repo-cleaner/) to "scrub" the history.

---

### **✅ Final Verification Checklist**
- [ ] Deleted hard-coded passwords from `setup-demo-mode.html`.
- [ ] Registered the 4 Official Emails in Firebase.
- [ ] `config.js` updated with real keys locally (AND PROTECTED BY .gitignore).
- [ ] Dragged the newest `Al-Huda-Cloud-Deployment` folder to Netlify.

**Your system is now a professional, secure, and ready-for-action school management platform!** 🚀🏫💎
