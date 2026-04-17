/**
 * Authentication and Room Management System
 * Handles player login, registration, and room code functionality
 */

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.loadCurrentUser();
    }

    // Load current logged-in user from localStorage
    loadCurrentUser() {
        const userData = localStorage.getItem('amira_current_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    // Save current user to localStorage
    saveCurrentUser() {
        if (this.currentUser) {
            localStorage.setItem('amira_current_user', JSON.stringify(this.currentUser));
        } else {
            localStorage.removeItem('amira_current_user');
        }
    }

    // Get all registered users
    getUsers() {
        const usersData = localStorage.getItem('amira_users');
        return usersData ? JSON.parse(usersData) : [];
    }

    // Save all users
    saveUsers(users) {
        localStorage.setItem('amira_users', JSON.stringify(users));
    }

    // Register a new user
    register(username, displayName, password, confirmPassword) {
        // Validation
        if (!username || !displayName || !password || !confirmPassword) {
            return { success: false, message: 'جميع الحقول مطلوبة' };
        }

        if (username.length < 3) {
            return { success: false, message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' };
        }

        if (password.length < 6) {
            return { success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' };
        }

        if (password !== confirmPassword) {
            return { success: false, message: 'كلمتا المرور غير متطابقتين' };
        }

        const users = this.getUsers();

        // Check if username already exists
        if (users.find(u => u.username === username)) {
            return { success: false, message: 'اسم المستخدم موجود بالفعل' };
        }

        // Create new user
        const newUser = {
            username,
            displayName,
            password, // In production, this should be hashed
            createdAt: new Date().toISOString(),
            gamesPlayed: 0,
            gamesWon: 0
        };

        users.push(newUser);
        this.saveUsers(users);

        return { success: true, message: 'تم التسجيل بنجاح!' };
    }

    // Login user
    login(username, password) {
        if (!username || !password) {
            return { success: false, message: 'الرجاء إدخال اسم المستخدم وكلمة المرور' };
        }

        const users = this.getUsers();
        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
            return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
        }

        // Set current user (without password)
        this.currentUser = {
            username: user.username,
            displayName: user.displayName,
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon
        };
        this.saveCurrentUser();

        return { success: true, message: 'تم تسجيل الدخول بنجاح!', user: this.currentUser };
    }

    // Logout user
    logout() {
        this.currentUser = null;
        this.saveCurrentUser();
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
}

class RoomManager {
    constructor() {
        this.currentRoom = null;
    }

    // Generate a random 6-digit room code
    generateRoomCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Get all active rooms
    getRooms() {
        const roomsData = localStorage.getItem('amira_rooms');
        return roomsData ? JSON.parse(roomsData) : {};
    }

    // Save all rooms
    saveRooms(rooms) {
        localStorage.setItem('amira_rooms', JSON.stringify(rooms));
    }

    // Create a new room
    createRoom(hostUsername, hostDisplayName, gameMode) {
        const roomCode = this.generateRoomCode();
        const rooms = this.getRooms();

        const room = {
            code: roomCode,
            host: {
                username: hostUsername,
                displayName: hostDisplayName
            },
            guest: null,
            gameMode: gameMode,
            createdAt: new Date().toISOString(),
            status: 'waiting' // waiting, playing, finished
        };

        rooms[roomCode] = room;
        this.saveRooms(rooms);
        this.currentRoom = room;

        return { success: true, roomCode, room };
    }

    // Join an existing room
    joinRoom(roomCode, guestUsername, guestDisplayName) {
        if (!roomCode || roomCode.length !== 6) {
            return { success: false, message: 'كود الدخول يجب أن يكون 6 أرقام' };
        }

        const rooms = this.getRooms();
        const room = rooms[roomCode];

        if (!room) {
            return { success: false, message: 'كود الدخول غير صحيح' };
        }

        if (room.status !== 'waiting') {
            return { success: false, message: 'هذه الغرفة مشغولة أو انتهت' };
        }

        if (room.guest) {
            return { success: false, message: 'الغرفة ممتلئة' };
        }

        // Add guest to room
        room.guest = {
            username: guestUsername,
            displayName: guestDisplayName
        };
        room.status = 'playing';

        rooms[roomCode] = room;
        this.saveRooms(rooms);
        this.currentRoom = room;

        return { success: true, message: 'تم الانضمام للغرفة بنجاح!', room };
    }

    // Get room by code
    getRoom(roomCode) {
        const rooms = this.getRooms();
        return rooms[roomCode] || null;
    }

    // Update room status
    updateRoomStatus(roomCode, status) {
        const rooms = this.getRooms();
        if (rooms[roomCode]) {
            rooms[roomCode].status = status;
            this.saveRooms(rooms);
        }
    }

    // Delete room
    deleteRoom(roomCode) {
        const rooms = this.getRooms();
        delete rooms[roomCode];
        this.saveRooms(rooms);
        this.currentRoom = null;
    }

    // Clean up old rooms (older than 24 hours)
    cleanupOldRooms() {
        const rooms = this.getRooms();
        const now = new Date().getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;

        Object.keys(rooms).forEach(code => {
            const roomTime = new Date(rooms[code].createdAt).getTime();
            if (now - roomTime > oneDayMs) {
                delete rooms[code];
            }
        });

        this.saveRooms(rooms);
    }

    // Get current room
    getCurrentRoom() {
        return this.currentRoom;
    }
}
