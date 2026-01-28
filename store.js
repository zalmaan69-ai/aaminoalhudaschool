const Store = {
    state: {
        students: [],
        teachers: [],
        fees: [],
        attendance: [],
        auditLogs: [],
        settings: {
            principalName: 'abdulahi abdi',
            headTeachers: {
                "Form 1": "Mr. Ahmed Nur",
                "Form 2": "Ms. Fatima Farah",
                "Form 3": "Mr. Ali Gedi",
                "Form 4": "Ms. Aisha Dualeh"
            },
            messaging: {
                senderNumber: '0612373534',
                templates: {
                    reminder: '(waalidiinta qaaliga ah ee ardeyda dugsiga AL-HUDA , waxaaan idin xasuusineynaa in uu soo dhawaadey waqtigii lacag bixinta bisha , fadlan nagu soo hagaaji waqtigeeeda , mahadsanidiin)',
                    deadline: 'waalidiinta qaaliga ah ee ardeyda dugsiga AL-HUDA , waxaaan idin ogeysiineynaa in lajoogo waqtigii lacag bixinta bisha , fadlan nagu soo hagaaji marka aad awoodan , mahadsanidiin.'
                }
            }
        },
        currentUser: null,
        // USER LIST REMOVED FOR SECURITY. 
        // Use Firebase Authentication for logins.
        // Role-based access now uses Firestore document lookups.
        // USER ROLE MAPPING (Passwords removed for security)
        users: [
            { email: 'director@alhudaschool.edu', role: 'owner', name: 'Director', permissions: { admin: true } },
            { email: 'principal@alhudaschool.edu', role: 'principal', name: 'Principal', permissions: { admin: true } },
            { email: 'teacher@alhudaschool.edu', role: 'teacher', name: 'Teacher', permissions: { attendance: true } },
            { email: 'accounts@alhudaschool.edu', role: 'fees', name: 'Accounts Officer', permissions: { fees: true } }
        ],
        examMarks: [],
        academicYears: ["2024-2025"],
        currentYear: "2024-2025",
        dataVersion: 23,
        lastUpdated: Date.now()
    },

    async init() {
        this.loadFromStorage();
        this.runMigrations(); // Fix existing data for old users

        // Proactive Firebase Auth Listener
        // This ensures sync starts IMMEDIATELY when the user is confirmed,
        // solving cross-device and timing issues.
        if (window.firebaseAuth) {
            window.firebaseAuth.onAuthStateChanged((user) => {
                if (user) {
                    console.log('👤 User authenticated:', user.email);
                    this.initCloudSync();
                } else {
                    console.log('👤 No user authenticated');
                    if (this.unsubscribe) this.unsubscribe();
                    this.updateSyncStatus('offline');
                }
            });
        }

        if (this.state.students.length !== 120 || this.state.dataVersion < 23) {
            console.log('🔄 Refreshing system to match user dashboard requirements (V23)...');
            this.seedData();
            this.state.dataVersion = 23;
            this.saveToStorage();
        }
    },

    async loadRecoveredData() {
        try {
            const response = await fetch('Al-huda school data.json');
            if (response.ok) {
                const data = await response.json();
                if (data && data.students && data.students.length > 0) {
                    // Success! Overwrite current state with recovered data
                    // Use a very old timestamp so Cloud Sync can overwrite it if newer data exists
                    this.state = { ...this.state, ...data, lastUpdated: 1 };
                    this.saveToStorage(false); // Don't trigger cloud sync yet, wait for Auth
                    this.logAction('System', 'Data restored from local JSON file');
                    console.log('✅ Recovered data loaded successfully');
                    return true;
                }
            }
        } catch (e) {
            console.log('ℹ️ No recovery JSON file found or error parsing it.');
        }
        return false;
    },

    loadFromStorage() {
        const stored = localStorage.getItem('dugsiga_data');
        if (stored) {
            const parsed = JSON.parse(stored);
            // Overwrite stored users with current hard-coded list (Source of Truth for Roles)
            parsed.users = this.state.users;
            this.state = parsed;
            this.runMigrations(); // Fix existing data
        }
    },

    runMigrations() {
        if (!this.state.settings) this.state.settings = {};

        // 1. Fix Fee Amounts ($50 -> $20) for ALL existing records
        let updatedFees = 0;
        if (this.state.fees) {
            this.state.fees.forEach(f => {
                if (f.amount === 50) {
                    f.amount = 20;
                    if (f.status === 'PAID') f.amountPaid = 20;
                    updatedFees++;
                }
            });
        }

        // 2. Clear Demo Mode if detected
        if (this.state.settings.principalName === 'maxamed maxamed abdi' || this.state.settings.principalName === 'Sheikh Hassan Ali') {
            this.state.settings.principalName = 'abdulahi abdi';
            console.log('✅ Updated Principal Name to abdulahi abdi');
        }

        // 3. Ensure Exams exist and are formatted correctly
        if (!this.state.exams || this.state.exams.length === 0) {
            this.state.exams = [
                { id: 'EXAM-001', name: 'Test Exam 2025-09-12', type: 'Teacher-based', term: 'Term 1', weight: 33.33, subjects: 3, students: 4, status: 'Open', date: '2025-09-12' },
                { id: 'EXAM-002', name: 'imtixaan', type: 'School Import', term: 'Final', weight: 100.00, subjects: 3, students: 3, status: 'Open', date: '2025-09-10' },
                { id: 'EXAM-003', name: 'Final Exam', type: 'Final', term: 'Final', weight: 100.00, subjects: 3, students: 0, status: 'Open', date: '2025-10-01' }
            ];
        }

        if (updatedFees > 0) {
            console.log(`✅ Migrated ${updatedFees} fee records to $20`);
            this.saveToStorage(false); // Silent save, no need to push to cloud now
        }
    },

    // Cloud Sync Methods
    initCloudSync() {
        if (!window.firebaseDB || !window.firebaseAuth || !window.firebaseAuth.currentUser) {
            console.log('Firebase not ready for sync');
            return;
        }

        const userId = window.firebaseAuth.currentUser.uid;
        const docRef = window.firebaseDB.collection('schools').doc(userId);

        // Prevent multiple listeners
        if (this.unsubscribe) this.unsubscribe();

        console.log('📡 Starting Real-time Cloud Sync...');
        this.updateSyncStatus('syncing');

        // Set up real-time listener
        this.unsubscribe = docRef.onSnapshot((doc) => {
            if (doc.exists) {
                const cloudData = doc.data();
                const cloudTime = cloudData.lastUpdated || 0;
                const localTime = this.state.lastUpdated || 0;

                // Sync Logic: Newer Timestamp ALWAYS Wins
                if (cloudTime > localTime) {
                    console.log('✅ Newer data found in Cloud (at ' + new Date(cloudTime).toLocaleTimeString() + '). Syncing down...');
                    this.state = { ...this.state, ...cloudData };
                    localStorage.setItem('dugsiga_data', JSON.stringify(this.state));
                    window.dispatchEvent(new CustomEvent('state-updated'));
                } else if (cloudTime < localTime && localTime > 1) {
                    console.log('⬆️ Local data is newer (' + new Date(localTime).toLocaleTimeString() + '). Pushing to Cloud...');
                    this.syncToCloud();
                }
                this.updateSyncStatus('synced');
            } else {
                // First time setup for this specific user account
                console.log('☁️ Creating initial Cloud Master record for this account...');
                this.syncToCloud();
            }
        }, (error) => {
            console.error('❌ Sync error:', error);
            if (error.code === 'permission-denied') {
                console.error('⚠️ SECURITY ERROR: Please ensure your user account is authorized.');
            }
            this.updateSyncStatus('error');
        });
    },

    syncToCloud() {
        if (!window.firebaseDB || !window.firebaseAuth || !window.firebaseAuth.currentUser) {
            console.log('Cannot sync - not authenticated');
            return Promise.resolve();
        }

        const userId = window.firebaseAuth.currentUser.uid;
        const docRef = window.firebaseDB.collection('schools').doc(userId);

        this.updateSyncStatus('syncing');

        return docRef.set(this.state, { merge: true })
            .then(() => {
                console.log('Data synced to cloud');
                this.updateSyncStatus('synced');
            })
            .catch((error) => {
                console.error('Sync to cloud failed:', error);
                this.updateSyncStatus('error');
            });
    },

    updateSyncStatus(status) {
        const indicator = document.getElementById('sync-indicator');
        const text = document.getElementById('sync-text');
        const container = document.getElementById('sync-status');

        if (!indicator || !text || !container) return;

        switch (status) {
            case 'syncing':
                indicator.style.background = '#f59e0b';
                text.textContent = 'Syncing...';
                text.style.color = '#d97706';
                container.style.background = '#fffbeb';
                container.classList.add('sync-active');
                break;
            case 'synced':
                indicator.style.background = '#10b981';
                text.textContent = 'Synced';
                text.style.color = '#059669';
                container.style.background = '#f0fdf4';
                container.classList.remove('sync-active');
                break;
            case 'offline':
                indicator.style.background = '#6b7280';
                text.textContent = 'Offline';
                text.style.color = '#4b5563';
                container.style.background = '#f9fafb';
                break;
            case 'error':
                indicator.style.background = '#ef4444';
                text.textContent = 'Error';
                text.style.color = '#dc2626';
                container.style.background = '#fef2f2';
                break;
        }
    },

    saveToStorage(shouldSync = true) {
        // Update timestamp before saving
        this.state.lastUpdated = Date.now();

        localStorage.setItem('dugsiga_data', JSON.stringify(this.state));
        console.log('💾 Data saved to localStorage (v' + this.state.dataVersion + ')');

        // Also sync to cloud if authenticated
        if (shouldSync && window.firebaseAuth && window.firebaseAuth.currentUser) {
            this.syncToCloud();
        }

        // Trigger global refresh for UI
        window.dispatchEvent(new CustomEvent('state-updated'));
    },

    // --- Audit Logs ---
    logAction(action, details, user = 'System') {
        const entry = {
            id: 'LOG-' + Date.now(),
            timestamp: new Date().toISOString(),
            user,
            action,
            details
        };
        this.state.auditLogs.unshift(entry);
        if (this.state.auditLogs.length > 100) this.state.auditLogs.pop(); // Keep last 100
        this.saveToStorage();
    },

    getAuditLogs() {
        return this.state.auditLogs;
    },

    // --- Users (Owner Only) ---
    getUsers() {
        return this.state.users;
    },

    updateUser(index, updatedUser) {
        if (this.state.users[index]) {
            this.state.users[index] = { ...this.state.users[index], ...updatedUser };
            this.logAction('User Update', `Updated user ${updatedUser.email}`, 'System');
            this.saveToStorage();
            return true;
        }
        return false;
    },

    // --- Academic Years (Owner Only) ---
    addYear(year) {
        if (!this.state.academicYears.includes(year)) {
            this.state.academicYears.push(year);
            this.logAction('Add Year', `Added academic year ${year}`, 'Owner');
            this.saveToStorage();
            return true;
        }
        return false;
    },

    deleteYear(year) {
        this.state.academicYears = this.state.academicYears.filter(y => y !== year);
        // Clean up data for this year would go here in a full implementation
        this.logAction('Delete Year', `Deleted academic year ${year}`, 'Owner');
        this.saveToStorage();
    },

    // --- Students ---
    getStudents() {
        return this.state.students;
    },

    getStudent(id) {
        return this.state.students.find(s => s.id === id);
    },

    addStudent(student) {
        const newStudent = {
            id: "STU-" + Date.now().toString().slice(-6),
            isActive: true,
            enrollmentDate: new Date().toISOString().split('T')[0],
            academicYear: this.state.currentYear, // Link student to year
            section: student.section || 'A',
            dorm: student.dorm || 'Dorm 1',
            isFree: student.isFree || false,
            gender: student.gender || 'Male',
            status: 'Active',
            performanceRemarks: '',
            ...student
        };
        this.state.students.push(newStudent);

        // Initialize Fee Record for the current month if not exempt
        if (!newStudent.isFree) {
            this.ensureFeeRecord(newStudent.id, "January"); // Direct requirement for Jan 2026
        }

        this.logAction('Add Student', `Added student ${newStudent.fullName}`, sessionStorage.getItem('dugsiga_user') ? JSON.parse(sessionStorage.getItem('dugsiga_user')).username : 'System');
        this.saveToStorage();
        return newStudent;
    },

    ensureFeeRecord(studentId, month) {
        const student = this.getStudent(studentId);
        if (!student || student.isFree) return null;

        const year = this.state.currentYear;
        const existing = this.state.fees.find(f => f.studentId === studentId && f.month === month && f.year === year);
        if (existing) return existing;

        const newFee = {
            id: "FEE-" + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 4),
            studentId,
            month,
            year,
            amount: 20, // Standard fee amount: $20
            amountPaid: 0,
            status: 'UNPAID',
            datePaid: null
        };
        this.state.fees.push(newFee);
        this.saveToStorage();
        return newFee;
    },

    updateStudent(updatedData) {
        const index = this.state.students.findIndex(s => s.id === updatedData.id);
        if (index !== -1) {
            this.state.students[index] = { ...this.state.students[index], ...updatedData };
            this.logAction('Update Student', `Updated student ${updatedData.fullName}`, sessionStorage.getItem('dugsiga_user') ? JSON.parse(sessionStorage.getItem('dugsiga_user')).username : 'System');
            this.saveToStorage();
            return true;
        }
        return false;
    },

    deleteStudent(id) {
        const index = this.state.students.findIndex(s => s.id === id);
        if (index !== -1) {
            const name = this.state.students[index].fullName;
            this.state.students.splice(index, 1);
            this.logAction('Delete Student', `Deleted student ${name}`, sessionStorage.getItem('dugsiga_user') ? JSON.parse(sessionStorage.getItem('dugsiga_user')).username : 'System');
            this.saveToStorage();
            return true;
        }
        return false;
    },

    // --- Teachers ---
    getTeachers() {
        return this.state.teachers || [];
    },

    addTeacher(teacher) {
        const newTeacher = {
            id: "TCH-" + Date.now().toString().slice(-6),
            ...teacher,
            status: 'Active',
            joinDate: new Date().toISOString().split('T')[0]
        };
        if (!this.state.teachers) this.state.teachers = [];
        this.state.teachers.push(newTeacher);
        this.logAction('Add Teacher', `Added teacher ${newTeacher.name}`, 'System');
        this.saveToStorage();
        return newTeacher;
    },

    updateTeacher(updatedData) {
        if (!this.state.teachers) return false;
        const index = this.state.teachers.findIndex(t => t.id === updatedData.id);
        if (index !== -1) {
            this.state.teachers[index] = { ...this.state.teachers[index], ...updatedData };
            this.logAction('Update Teacher', `Updated teacher ${updatedData.name}`, 'System');
            this.saveToStorage();
            return true;
        }
        return false;
    },

    deleteTeacher(id) {
        if (!this.state.teachers) return false;
        const index = this.state.teachers.findIndex(t => t.id === id);
        if (index !== -1) {
            this.state.teachers.splice(index, 1);
            this.logAction('Delete Teacher', `Deleted teacher ${id}`, 'System');
            this.saveToStorage();
            return true;
        }
        return false;
    },

    // --- Fees ---
    getFees() {
        const year = this.state.currentYear;
        return this.state.fees.filter(f => f.year === year);
    },

    getAllFees() { // Helper for cross-year reporting if needed
        return this.state.fees;
    },

    toggleFeeStatus(feeId) {
        const fee = this.state.fees.find(f => f.id === feeId);
        if (fee) {
            const oldStatus = fee.status;
            // Simple toggle between PAID and UNPAID as per user request
            fee.status = (fee.status === 'PAID') ? 'UNPAID' : 'PAID';
            fee.amountPaid = fee.status === 'PAID' ? fee.amount : 0;
            fee.datePaid = fee.status === 'PAID' ? new Date().toISOString() : null;

            this.logAction('Update Fee', `Changed fee ${feeId} status from ${oldStatus} to ${fee.status}`, sessionStorage.getItem('dugsiga_user') ? JSON.parse(sessionStorage.getItem('dugsiga_user')).username : 'System');
            this.saveToStorage(); // This triggers the state-updated event -> Dashboard refresh
        }
    },

    // --- Settings ---
    getSettings() {
        if (!this.state.settings) {
            this.state.settings = {
                principalName: 'Sheikh Hassan Ali',
                headTeachers: { "Form 1": "Mr. Ahmed Nur", "Form 2": "Ms. Fatima Farah", "Form 3": "Mr. Ali Gedi", "Form 4": "Ms. Aisha Dualeh" }
            };
        }
        return this.state.settings;
    },

    updateSettings(newSettings) {
        this.state.settings = { ...this.state.settings, ...newSettings };
        this.logAction('Settings Update', 'Updated school leadership settings', sessionStorage.getItem('dugsiga_user') ? JSON.parse(sessionStorage.getItem('dugsiga_user')).username : 'System');
        this.saveToStorage();
    },

    // --- Messaging ---
    sendMessage(phone, message, sender) {
        // Simulation: Just log to audit
        this.logAction('SMS Simulation', `Sent to ${phone} from ${sender}: ${message.substring(0, 30)}...`, sessionStorage.getItem('dugsiga_user') ? JSON.parse(sessionStorage.getItem('dugsiga_user')).username : 'System');
        return true;
    },

    // --- Attendance ---
    getAttendance() {
        const year = this.state.currentYear;
        // Attendance records now stored with date string YYYY-MM-DD
        // Filter by the year part of the date
        return this.state.attendance.filter(a => a.date.startsWith(year.split('-')[0]) || a.date.startsWith(year.split('-')[1]));
    },

    recordAttendance(studentId, status, date) {
        const existingIndex = this.state.attendance.findIndex(
            a => a.studentId === studentId && a.date === date
        );

        if (existingIndex >= 0) {
            this.state.attendance[existingIndex].status = status;
        } else {
            this.state.attendance.push({ studentId, date, status, year: this.state.currentYear });
        }
        this.logAction('Attendance', `Marked ${studentId} as ${status} for ${date} (Year: ${this.state.currentYear})`, sessionStorage.getItem('dugsiga_user') ? JSON.parse(sessionStorage.getItem('dugsiga_user')).username : 'System');
        this.saveToStorage();
    },

    // --- Exam Definitions (New) ---
    getExams() {
        return this.state.exams || [];
    },

    addExam(exam) {
        if (!this.state.exams) this.state.exams = [];
        this.state.exams.push(exam);
        this.logAction('Create Exam', `Created exam: ${exam.name}`, sessionStorage.getItem('dugsiga_user') ? JSON.parse(sessionStorage.getItem('dugsiga_user')).username : 'System');
        this.saveToStorage();
    },

    updateExam(id, updates) {
        const exam = this.state.exams.find(e => e.id === id);
        if (exam) {
            Object.assign(exam, updates);
            this.logAction('Update Exam', `Updated exam: ${exam.name}`, sessionStorage.getItem('dugsiga_user') ? JSON.parse(sessionStorage.getItem('dugsiga_user')).username : 'System');
            this.saveToStorage();
        }
    },

    deleteExam(id) {
        this.state.exams = this.state.exams.filter(e => e.id !== id);
        this.logAction('Delete Exam', `Deleted exam ID: ${id}`, sessionStorage.getItem('dugsiga_user') ? JSON.parse(sessionStorage.getItem('dugsiga_user')).username : 'System');
        this.saveToStorage();
    },

    // Legacy Exam Records (if needed, or can be adapted)
    getExamRecords(grade, section, subject, term) {
        // ... legacy logic, or just return empty
        return [];
    },


    saveExamScores(scores) {
        scores.forEach(newRecord => {
            const index = this.state.exams.findIndex(e =>
                e.studentId === newRecord.studentId &&
                e.subject === newRecord.subject &&
                e.term === newRecord.term
            );

            if (index !== -1) {
                this.state.exams[index] = { ...this.state.exams[index], ...newRecord };
            } else {
                this.state.exams.push(newRecord);
            }
        });
        this.logAction('Exams', `Saved scores for ${scores[0].subject} (${scores[0].term})`, sessionStorage.getItem('dugsiga_user') ? JSON.parse(sessionStorage.getItem('dugsiga_user')).username : 'System');
        this.saveToStorage();
    },

    getStudentAttendanceStats(studentId) {
        const records = this.state.attendance.filter(a => a.studentId === studentId);
        const present = records.filter(a => a.status === 'Present').length;
        const total = records.length;
        return total === 0 ? 0 : Math.round((present / total) * 100);
    },

    // --- Seeding ---
    seedData() {
        console.log('🌱 Seeding fresh AL-Huda data (v20 - 120 Students)...');
        this.state.students = [];
        this.state.teachers = [];
        this.state.fees = [];
        this.state.attendance = [];
        this.state.exams = [];
        this.state.examMarks = [];

        const GRADES = ["Form 1", "Form 2", "Form 3", "Form 4"];
        const SECTIONS = ["A", "B"];
        const firstNames = ["Ahmed", "Mohamed", "Ali", "Yussuf", "Hassan", "Ibrahim", "Abdirahman", "Omar", "Khadija", "Fartun", "Leyla", "Hibo", "Zahra", "Sahra", "Naima", "Fowzia"];
        const lastNames = ["Farah", "Gedi", "Dualeh", "Nur", "Ali", "Hassan", "Mohamed", "Abdi", "Warsame", "Omar"];

        let idCounter = 1000;
        let freeCount = 0;

        // Seed Exactly 120 Students with specific Free distribution
        const freeTarget = { "Form 1": 4, "Form 2": 3, "Form 3": 5, "Form 4": 4 };
        const currentFreeCount = { "Form 1": 0, "Form 2": 0, "Form 3": 0, "Form 4": 0 };

        GRADES.forEach(grade => {
            SECTIONS.forEach(section => {
                for (let i = 0; i < 15; i++) {
                    const fname = firstNames[Math.floor(Math.random() * firstNames.length)];
                    const lname = lastNames[Math.floor(Math.random() * lastNames.length)];
                    let gender = (this.state.students.length % 2 === 0) ? 'Male' : 'Female';

                    let isFree = false;
                    if (currentFreeCount[grade] < freeTarget[grade]) {
                        isFree = true;
                        currentFreeCount[grade]++;
                    }

                    const student = {
                        id: `STU-${idCounter++}`,
                        listNumber: i + 1,
                        fullName: `${fname} ${lname} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
                        grade: grade,
                        section: section,
                        isFree: isFree,
                        parentName: `${lname} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
                        parentPhone: `615-${100000 + Math.floor(Math.random() * 900000)}`,
                        enrollmentDate: "2024-09-01",
                        isActive: true,
                        gender: gender,
                        status: 'Active'
                    };
                    this.state.students.push(student);
                }
            });
        });

        // Seed Exactly 4 Teachers ($250 each = $1000 total)
        const teacherData = [
            { id: "TCH-001", name: "Mr. Abdi Mohamed", gender: "Male" },
            { id: "TCH-002", name: "Ms. Aisha Farah", gender: "Female" },
            { id: "TCH-003", name: "Mr. Omar Ali", gender: "Male" },
            { id: "TCH-004", name: "Ms. Khadija Gedi", gender: "Female" }
        ];

        teacherData.forEach(t => {
            this.state.teachers.push({
                ...t,
                phone: `615-20000${t.id.slice(-1)}`,
                salary: 250.00,
                subject: 'General'
            });
        });

        // Seed Attendance (96 Present, 15 Absent, 9 Late)
        const todayStr = new Date().toISOString().split('T')[0];
        let attIdx = 0;
        this.state.students.forEach((s) => {
            let status = 'Present';
            if (attIdx < 96) status = 'Present';
            else if (attIdx < 111) status = 'Absent';
            else status = 'Late';
            attIdx++;

            this.state.attendance.push({ studentId: s.id, date: todayStr, status: status, year: this.state.currentYear });
        });

        // Seed Fees ($2,080 Expected, $1,480 Collected)
        // 120 total - 16 free = 104 paying students
        // 104 * $20 = $2,080 Expected
        // $1,480 / $20 = 74 Collected
        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        let paidCount = 0;
        this.state.students.forEach((s, idx) => {
            if (s.isFree) return;
            const isPaid = paidCount < 74;
            if (isPaid) paidCount++;

            this.state.fees.push({
                id: `FEE-${idx}`,
                studentId: s.id,
                month: currentMonth,
                year: this.state.currentYear,
                amount: 20,
                amountPaid: isPaid ? 20 : 0,
                status: isPaid ? 'PAID' : 'UNPAID',
                datePaid: isPaid ? todayStr : null
            });
        });

        this.saveToStorage();
    },

    getStudents() { return this.state.students; },
    getTeachers() { return this.state.teachers; },
    getAttendance() { return this.state.attendance; },
    getFees() { return this.state.fees; },
    getExams() { return this.state.exams; },

    getStudent(id) {
        return this.state.students.find(s => s.id === id);
    },

    addStudent(student) {
        const newStudent = {
            id: "STU-" + Date.now().toString().slice(-6),
            isActive: true,
            enrollmentDate: new Date().toISOString().split('T')[0],
            academicYear: this.state.currentYear,
            status: 'Active',
            ...student
        };
        this.state.students.push(newStudent);
        this.saveToStorage();
        return newStudent;
    },

    updateStudent(data) {
        const idx = this.state.students.findIndex(s => s.id === data.id);
        if (idx !== -1) {
            this.state.students[idx] = { ...this.state.students[idx], ...data };
            this.saveToStorage();
            return true;
        }
        return false;
    },

    deleteStudent(id) {
        this.state.students = this.state.students.filter(s => s.id !== id);
        this.saveToStorage();
        return true;
    },

    updateTeacher(data) {
        const idx = this.state.teachers.findIndex(t => t.id === data.id);
        if (idx !== -1) {
            this.state.teachers[idx] = { ...this.state.teachers[idx], ...data };
            this.saveToStorage();
            return true;
        }
        return false;
    },

    deleteTeacher(id) {
        this.state.teachers = this.state.teachers.filter(t => t.id !== id);
        this.saveToStorage();
        return true;
    },

    getExamMarks(studentId, year = this.state.currentYear) {
        return this.state.examMarks.find(m => m.studentId === studentId && m.year === year) || { marks: {} };
    },

    saveExamMarks(studentId, marks, year = this.state.currentYear) {
        let entry = this.state.examMarks.find(m => m.studentId === studentId && m.year === year);
        if (!entry) {
            entry = { studentId, year, marks: {} };
            this.state.examMarks.push(entry);
        }
        entry.marks = { ...entry.marks, ...marks };
        this.saveToStorage();
    },

    loadFromStorage() {
        const stored = localStorage.getItem('dugsiga_data');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.dataVersion < 23) {
                this.seedData();
            } else {
                this.state = parsed;
            }
        }
    },

    saveToStorage(sync = true) {
        this.state.lastUpdated = Date.now();
        localStorage.setItem('dugsiga_data', JSON.stringify(this.state));
        if (sync && window.syncToCloud) window.syncToCloud(this.state);
        window.dispatchEvent(new CustomEvent('state-updated'));
    },

    runMigrations() {
        if (this.state.dataVersion < 23) {
            this.seedData();
            this.state.dataVersion = 23;
            this.saveToStorage();
        }
    },

    exportData() {
        return JSON.stringify(this.state);
    },

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.state = data;
            this.saveToStorage();
            return true;
        } catch (e) {
            console.error('Invalid import data', e);
            return false;
        }
    },
};

window.Store = Store;
