// UI Controller
class ChessUI {
    constructor() {
        this.game = new ChessGame();
        this.stats = new ChessStatistics();
        this.openingRecognizer = new OpeningRecognizer();
        this.auth = new AuthSystem();
        this.roomManager = new RoomManager();
        this.ai = new ChessAI('medium'); // AI engine
        this.boardElement = document.getElementById('chessBoard');
        this.selectedSquare = null;
        this.soundEnabled = true;
        this.highlightEnabled = true;
        this.timerEnabled = false;
        this.flipped = false;
        this.timers = { white: 600, black: 600 }; // 10 minutes in seconds
        this.timerInterval = null;
        this.playerNames = { white: 'اللاعب الأبيض', black: 'اللاعب الأسود' };
        this.gameMode = 'classic';
        this.gameType = 'local'; // local, computer, or online
        this.roomAction = 'create'; // create or join
        this.playerColor = 'white'; // for computer games
        this.aiDifficulty = 'medium';
        this.isAiThinking = false;

        this.pieceSymbols = {
            white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
            black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
        };

        this.initSetup();
    }

    initSetup() {
        // Check if user is logged in
        if (this.auth.isLoggedIn()) {
            this.showGameSetup();
        } else {
            this.showLoginModal();
        }
        this.attachAuthListeners();
        this.attachSetupListeners();
    }

    showLoginModal() {
        document.getElementById('loginModal').classList.add('active');
        document.getElementById('gameSetupModal').classList.remove('active');
        // Hide the header user bar when not logged in
        const headerBar = document.getElementById('headerUserBar');
        if (headerBar) headerBar.style.display = 'none';
    }

    showGameSetup() {
        document.getElementById('loginModal').classList.remove('active');
        document.getElementById('gameSetupModal').classList.add('active');

        const user = this.auth.getCurrentUser();
        if (user) {
            document.getElementById('currentUserDisplay').textContent = user.displayName;
            // Update the header user bar
            const headerBar = document.getElementById('headerUserBar');
            const headerUsername = document.getElementById('headerUsernameDisplay');
            if (headerBar && headerUsername) {
                headerUsername.textContent = '👤 ' + user.displayName;
                headerBar.style.display = 'flex';
            }
        }
    }

    attachAuthListeners() {
        // Auth tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                tab.classList.add('active');

                const tabType = tab.dataset.tab;
                document.getElementById(tabType + 'Form').classList.add('active');
            });
        });

        // Login button
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());

        // Register button
        document.getElementById('registerBtn').addEventListener('click', () => this.handleRegister());

        // Logout button (in game setup modal)
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // Header exit button (always visible in main UI)
        const headerLogoutBtn = document.getElementById('headerLogoutBtn');
        if (headerLogoutBtn) {
            headerLogoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Enter key for forms
        document.getElementById('loginPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        document.getElementById('registerConfirmPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleRegister();
        });
    }

    handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        const result = this.auth.login(username, password);
        const messageEl = document.getElementById('loginMessage');

        messageEl.textContent = result.message;
        messageEl.style.color = result.success ? '#4CAF50' : '#f44336';

        if (result.success) {
            setTimeout(() => {
                this.showGameSetup();
                // Clear form
                document.getElementById('loginUsername').value = '';
                document.getElementById('loginPassword').value = '';
                messageEl.textContent = '';
            }, 1000);
        }
    }

    handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const displayName = document.getElementById('registerDisplayName').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        const result = this.auth.register(username, displayName, password, confirmPassword);
        const messageEl = document.getElementById('registerMessage');

        messageEl.textContent = result.message;
        messageEl.style.color = result.success ? '#4CAF50' : '#f44336';

        if (result.success) {
            setTimeout(() => {
                // Switch to login tab
                document.querySelector('.auth-tab[data-tab="login"]').click();
                // Clear form
                document.getElementById('registerUsername').value = '';
                document.getElementById('registerDisplayName').value = '';
                document.getElementById('registerPassword').value = '';
                document.getElementById('registerConfirmPassword').value = '';
                messageEl.textContent = '';
            }, 1500);
        }
    }

    handleLogout() {
        if (confirm('هل تريد تسجيل الخروج؟')) {
            this.auth.logout();
            this.showLoginModal();
        }
    }

    attachSetupListeners() {
        // Game setup modal
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());

        // Game type selection
        document.querySelectorAll('.game-type-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.game-type-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.gameType = option.dataset.type;

                // Toggle visibility of local/computer/online setup
                document.getElementById('localGameSetup').style.display = 'none';
                document.getElementById('computerGameSetup').style.display = 'none';
                document.getElementById('onlineGameSetup').style.display = 'none';

                if (this.gameType === 'local') {
                    document.getElementById('localGameSetup').style.display = 'block';
                } else if (this.gameType === 'computer') {
                    document.getElementById('computerGameSetup').style.display = 'block';
                } else if (this.gameType === 'online') {
                    document.getElementById('onlineGameSetup').style.display = 'block';
                }
            });
        });

        // Room code tabs
        document.querySelectorAll('.room-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.room-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.roomAction = tab.dataset.action;

                if (this.roomAction === 'create') {
                    document.getElementById('roomCreate').classList.add('active');
                    document.getElementById('roomJoin').classList.remove('active');
                } else {
                    document.getElementById('roomCreate').classList.remove('active');
                    document.getElementById('roomJoin').classList.add('active');
                    // Focus first digit input when switching to join tab
                    const firstInput = document.querySelector('.room-digit-input[data-index="0"]');
                    if (firstInput) setTimeout(() => firstInput.focus(), 100);
                }
            });
        });

        // Room code digit inputs (OTP-style)
        this.initRoomCodeInputs();

        // Mode selection
        document.querySelectorAll('.mode-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.gameMode = option.dataset.mode;
            });
        });
    }

    initRoomCodeInputs() {
        const digitInputs = document.querySelectorAll('.room-digit-input');
        const hiddenInput = document.getElementById('roomCodeInput');
        const digitsOnly = (str) => str.replace(/[^0-9]/g, '');

        digitInputs.forEach((input, index) => {
            // Allow only digits
            input.addEventListener('input', (e) => {
                const value = digitsOnly(e.target.value);
                e.target.value = value;

                if (value.length === 1) {
                    // Move to next input
                    const nextInput = document.querySelector(`.room-digit-input[data-index="${index + 1}"]`);
                    if (nextInput) {
                        nextInput.focus();
                    }
                }

                // Update hidden input with combined value
                this.updateRoomCodeHiddenInput();

                // Auto-validate when all 6 digits entered
                const code = this.getRoomCodeFromInputs();
                if (code.length === 6) {
                    this.validateRoomCode(code);
                } else {
                    // Clear status when incomplete
                    const statusEl = document.getElementById('roomStatus');
                    statusEl.textContent = '';
                }
            });

            // Handle backspace to move to previous input
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value) {
                    const prevInput = document.querySelector(`.room-digit-input[data-index="${index - 1}"]`);
                    if (prevInput) {
                        prevInput.focus();
                        prevInput.value = '';
                    }
                }

                // Handle arrow keys
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    const direction = e.key === 'ArrowLeft' ? -1 : 1;
                    const targetInput = document.querySelector(`.room-digit-input[data-index="${index + direction}"]`);
                    if (targetInput) {
                        e.preventDefault();
                        targetInput.focus();
                    }
                }
            });

            // Handle paste - distribute pasted digits across inputs
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = digitsOnly((e.clipboardData || window.clipboardData).getData('text'));

                if (pastedData.length > 0) {
                    const digits = pastedData.slice(0, 6).split('');
                    digitInputs.forEach((inp, i) => {
                        inp.value = digits[i] || '';
                    });
                    // Focus last filled or next empty
                    const focusIndex = Math.min(digits.length, 5);
                    digitInputs[focusIndex].focus();
                    this.updateRoomCodeHiddenInput();

                    const code = this.getRoomCodeFromInputs();
                    if (code.length === 6) {
                        this.validateRoomCode(code);
                    }
                }
            });

            // Select content on focus
            input.addEventListener('focus', () => {
                input.select();
                input.classList.add('focused');
            });

            input.addEventListener('blur', () => {
                input.classList.remove('focused');
            });
        });
    }

    getRoomCodeFromInputs() {
        const digitInputs = document.querySelectorAll('.room-digit-input');
        let code = '';
        digitInputs.forEach(input => {
            code += input.value;
        });
        return code;
    }

    updateRoomCodeHiddenInput() {
        const hiddenInput = document.getElementById('roomCodeInput');
        hiddenInput.value = this.getRoomCodeFromInputs();
    }

    validateRoomCode(code) {
        const statusEl = document.getElementById('roomStatus');
        const room = this.roomManager.getRoom(code);
        if (room && room.status === 'waiting' && !room.guest) {
            statusEl.textContent = '✓ غرفة متاحة - جاهز للانضمام';
            statusEl.style.color = '#4CAF50';
            statusEl.classList.add('room-status-success');
            statusEl.classList.remove('room-status-error');
        } else if (room && room.status !== 'waiting') {
            statusEl.textContent = '✗ هذه الغرفة مشغولة أو انتهت';
            statusEl.style.color = '#f44336';
            statusEl.classList.add('room-status-error');
            statusEl.classList.remove('room-status-success');
        } else if (room && room.guest) {
            statusEl.textContent = '✗ الغرفة ممتلئة';
            statusEl.style.color = '#f44336';
            statusEl.classList.add('room-status-error');
            statusEl.classList.remove('room-status-success');
        } else {
            statusEl.textContent = '✗ كود الدخول غير صحيح';
            statusEl.style.color = '#f44336';
            statusEl.classList.add('room-status-error');
            statusEl.classList.remove('room-status-success');
        }
    }

    copyRoomCode(code) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(() => {
                this.showCopyFeedback();
            }).catch(() => {
                this.fallbackCopyRoomCode(code);
            });
        } else {
            this.fallbackCopyRoomCode(code);
        }
    }

    fallbackCopyRoomCode(code) {
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            this.showCopyFeedback();
        } catch (err) {
            this.showCopyError();
        }
        document.body.removeChild(textArea);
    }

    showCopyFeedback() {
        const btn = document.querySelector('.copy-code-btn');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = '✓ تم النسخ!';
            btn.setAttribute('aria-label', 'تم نسخ كود الغرفة بنجاح');
            btn.classList.add('copied');
            setTimeout(() => {
                btn.textContent = originalText;
                btn.setAttribute('aria-label', 'نسخ كود الغرفة');
                btn.classList.remove('copied');
            }, 2000);
        }
    }

    showCopyError() {
        const btn = document.querySelector('.copy-code-btn');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = '✗ تعذر النسخ';
            btn.setAttribute('aria-label', 'تعذر نسخ كود الغرفة');
            setTimeout(() => {
                btn.textContent = originalText;
                btn.setAttribute('aria-label', 'نسخ كود الغرفة');
            }, 2000);
        }
    }

    startGame() {
        const user = this.auth.getCurrentUser();

        if (this.gameType === 'local') {
            // Local game setup
            this.playerNames.white = document.getElementById('whitePlayerName').value || 'اللاعب الأبيض';
            this.playerNames.black = document.getElementById('blackPlayerName').value || 'اللاعب الأسود';
        } else if (this.gameType === 'computer') {
            // Computer game setup
            this.playerColor = document.getElementById('playerColorSelect').value;
            this.aiDifficulty = document.getElementById('aiDifficultySelect').value;
            const playerName = document.getElementById('playerNameInput').value || user.displayName || 'أنت';

            // Set AI difficulty
            this.ai.setDifficulty(this.aiDifficulty);

            // Set player names based on color choice
            if (this.playerColor === 'white') {
                this.playerNames.white = playerName;
                this.playerNames.black = `الكمبيوتر (${this.getDifficultyLabel(this.aiDifficulty)})`;
            } else {
                this.playerNames.white = `الكمبيوتر (${this.getDifficultyLabel(this.aiDifficulty)})`;
                this.playerNames.black = playerName;
            }
        } else {
            // Online game setup with room code
            if (this.roomAction === 'create') {
                // Create a new room
                const result = this.roomManager.createRoom(user.username, user.displayName, this.gameMode);
                if (result.success) {
                    const roomCodeDisplay = document.getElementById('roomCodeDisplay');
                    const codeDigits = result.roomCode.split('').map(d => `<span class="code-digit">${d}</span>`).join('');
                    roomCodeDisplay.innerHTML = `
                        <h3>🔑 كود الغرفة:</h3>
                        <div class="room-code-large">${codeDigits}</div>
                        <button class="copy-code-btn" aria-label="نسخ كود الغرفة">📋 نسخ الكود</button>
                        <p class="room-info">شارك هذا الكود مع الشخص الآخر للانضمام</p>
                        <div class="waiting-indicator">
                            <div class="waiting-spinner"></div>
                            <p class="waiting-text">في انتظار اللاعب الآخر...</p>
                        </div>
                    `;

                    // Attach copy event listener programmatically
                    const copyBtn = roomCodeDisplay.querySelector('.copy-code-btn');
                    if (copyBtn) {
                        copyBtn.addEventListener('click', () => this.copyRoomCode(result.roomCode));
                    }

                    // Set player names
                    this.playerNames.white = user.displayName;
                    this.playerNames.black = 'في الانتظار...';

                    // Poll for guest joining
                    this.pollForGuest(result.roomCode);
                    return; // Don't start game yet
                }
            } else {
                // Join existing room
                const roomCode = this.getRoomCodeFromInputs() || document.getElementById('roomCodeInput').value.trim();
                const result = this.roomManager.joinRoom(roomCode, user.username, user.displayName);

                const statusEl = document.getElementById('roomStatus');
                statusEl.textContent = result.message;
                statusEl.style.color = result.success ? '#4CAF50' : '#f44336';

                if (result.success) {
                    // Set player names based on room
                    this.playerNames.white = result.room.host.displayName;
                    this.playerNames.black = user.displayName;

                    // Continue with game setup below
                } else {
                    return; // Don't start game if join failed
                }
            }
        }

        // Set timer based on game mode
        const timers = {
            classic: 600,  // 10 minutes
            rapid: 300,    // 5 minutes
            blitz: 180,    // 3 minutes
            unlimited: 0   // No timer
        };

        this.timers.white = timers[this.gameMode];
        this.timers.black = timers[this.gameMode];
        this.timerEnabled = this.gameMode !== 'unlimited';

        // Update player name displays
        document.getElementById('whitePlayerNameDisplay').textContent = this.playerNames.white;
        document.getElementById('blackPlayerNameDisplay').textContent = this.playerNames.black;

        // Hide modal
        document.getElementById('gameSetupModal').classList.remove('active');

        // Try to load autosaved game only for local games
        if (this.gameType === 'local') {
            const loadAutosave = confirm('هل تريد استعادة اللعبة المحفوظة تلقائياً؟');
            if (loadAutosave && this.game.loadFromLocalStorage('autosave')) {
                this.renderBoard();
                this.updateGameStatus();
                this.updateTimerDisplay();
                if (this.timerEnabled) {
                    this.startTimer();
                }
                return;
            }
        }

        // Initialize new game
        this.init();
    }

    getDifficultyLabel(difficulty) {
        const labels = {
            easy: 'سهل',
            medium: 'متوسط',
            hard: 'صعب'
        };
        return labels[difficulty] || 'متوسط';
    }

    pollForGuest(roomCode) {
        const pollInterval = setInterval(() => {
            const room = this.roomManager.getRoom(roomCode);

            if (room && room.guest) {
                clearInterval(pollInterval);

                // Update player names
                this.playerNames.black = room.guest.displayName;
                document.getElementById('blackPlayerNameDisplay').textContent = this.playerNames.black;

                // Hide modal and start game
                document.getElementById('gameSetupModal').classList.remove('active');
                alert(`انضم ${room.guest.displayName} إلى اللعبة!`);
                this.init();
            }

            // Stop polling after 5 minutes
            if (Date.now() - new Date(room.createdAt).getTime() > 5 * 60 * 1000) {
                clearInterval(pollInterval);
                alert('انتهت مهلة انتظار اللاعب الآخر');
                this.roomManager.deleteRoom(roomCode);
            }
        }, 2000); // Poll every 2 seconds
    }

    init() {
        // Load saved theme
        const savedTheme = localStorage.getItem('chess_theme');
        if (savedTheme) {
            document.getElementById('themeSelector').value = savedTheme;
            this.changeTheme(savedTheme);
        }

        this.renderBoard();
        this.attachEventListeners();
        this.updateGameStatus();
        this.updateTimerDisplay();
        if (this.timerEnabled) {
            this.startTimer();
        }

        // If playing against computer and computer goes first
        if (this.gameType === 'computer' && this.playerColor === 'black') {
            this.makeAIMove();
        }
    }

    renderBoard() {
        // Use requestAnimationFrame for smoother rendering on mobile
        requestAnimationFrame(() => {
            // Create a document fragment for better performance
            const fragment = document.createDocumentFragment();

            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                const displayRow = this.flipped ? 7 - row : row;
                const displayCol = this.flipped ? 7 - col : col;

                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = displayRow;
                square.dataset.col = displayCol;

                // Add coordinate labels
                if (col === 0) {
                    const rankLabel = document.createElement('span');
                    rankLabel.className = 'square-label rank';
                    rankLabel.textContent = 8 - displayRow;
                    square.appendChild(rankLabel);
                }
                if (row === 7) {
                    const fileLabel = document.createElement('span');
                    fileLabel.className = 'square-label file';
                    fileLabel.textContent = String.fromCharCode(97 + displayCol);
                    square.appendChild(fileLabel);
                }

                // Add piece if present
                const piece = this.game.getPiece(displayRow, displayCol);
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = 'piece';
                    pieceElement.textContent = this.pieceSymbols[piece.color][piece.type];
                    pieceElement.draggable = piece.color === this.game.currentPlayer && !this.game.gameOver;
                    square.appendChild(pieceElement);
                }

                // Highlight last move
                if (this.game.lastMove &&
                    ((displayRow === this.game.lastMove.fromRow && displayCol === this.game.lastMove.fromCol) ||
                     (displayRow === this.game.lastMove.toRow && displayCol === this.game.lastMove.toCol))) {
                    square.classList.add('last-move');
                }

                // Highlight king in check
                if (this.game.checkState && piece && piece.type === 'king' && piece.color === this.game.checkState) {
                    square.classList.add('in-check');
                }

                fragment.appendChild(square);
            }
        }

        // Clear and append in one operation for better performance
        this.boardElement.innerHTML = '';
        this.boardElement.appendChild(fragment);

        this.updateCapturedPieces();
        this.updateMoveHistory();
        });
    }

    attachEventListeners() {
        // Board click events - optimize for mobile with passive listeners where appropriate
        this.boardElement.addEventListener('click', (e) => this.handleSquareClick(e));

        // Drag and drop with passive event listeners for better scroll performance
        this.boardElement.addEventListener('dragstart', (e) => this.handleDragStart(e));
        this.boardElement.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.boardElement.addEventListener('drop', (e) => this.handleDrop(e));

        // Add touch event support for better mobile experience
        this.addTouchSupport();

        // Control buttons - use event delegation for better performance
        const buttonsContainer = document.querySelector('.game-controls');
        if (buttonsContainer) {
            buttonsContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;

                const btnId = btn.id;
                const actions = {
                    'newGameBtn': () => this.newGame(),
                    'undoBtn': () => this.undoMove(),
                    'redoBtn': () => this.redoMove(),
                    'resetBtn': () => this.resetGame(),
                    'flipBoardBtn': () => this.flipBoard(),
                    'saveBtn': () => this.saveGame(),
                    'loadBtn': () => this.loadGame(),
                    'exportBtn': () => this.exportPGN(),
                    'statsBtn': () => this.showStats()
                };

                if (actions[btnId]) {
                    e.preventDefault();
                    actions[btnId]();
                }
            });
        }

        // Settings
        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
        });
        document.getElementById('highlightToggle').addEventListener('change', (e) => {
            this.highlightEnabled = e.target.checked;
            if (!this.highlightEnabled) {
                this.clearHighlights();
            }
        });
        document.getElementById('timerToggle').addEventListener('change', (e) => {
            this.timerEnabled = e.target.checked;
            if (this.timerEnabled) {
                this.startTimer();
            } else {
                this.stopTimer();
            }
        });
        document.getElementById('themeSelector').addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });

        // Statistics modal
        document.getElementById('closeStatsBtn').addEventListener('click', () => {
            document.getElementById('statsModal').classList.remove('active');
        });
        document.getElementById('exportStatsBtn').addEventListener('click', () => {
            this.exportStats();
        });
        document.getElementById('resetStatsBtn').addEventListener('click', () => {
            if (confirm('هل تريد حذف جميع الإحصائيات؟')) {
                this.stats.clearStats();
                this.showStats();
            }
        });

        // Add touch support for better mobile experience
        this.addTouchSupport();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'z':
                        e.preventDefault();
                        this.undoMove();
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redoMove();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveGame();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.loadGame();
                        break;
                }
            }
            // Arrow keys for board navigation
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.undoMove();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.redoMove();
            }
        });
    }

    // Add touch support for better mobile experience
    addTouchSupport() {
        let touchStartSquare = null;
        let touchStartTime = 0;

        this.boardElement.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            const square = element?.closest('.square');

            if (square) {
                touchStartSquare = square;
                // Highlight the touched square
                square.classList.add('touch-active');
            }
        }, { passive: true });

        this.boardElement.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - touchStartTime;
            const touch = e.changedTouches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            const square = element?.closest('.square');

            // Remove touch highlight
            document.querySelectorAll('.touch-active').forEach(el => {
                el.classList.remove('touch-active');
            });

            // Only register as click if touch was quick (not a scroll)
            if (square && touchDuration < 500) {
                // Simulate click event for touch
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                square.dispatchEvent(clickEvent);
            }

            touchStartSquare = null;
        }, { passive: true });

        // Prevent default drag behavior on touch devices
        this.boardElement.addEventListener('touchmove', (e) => {
            // Allow scrolling on the board itself
        }, { passive: true });
    }

    changeTheme(theme) {
        document.body.classList.remove('theme-classic', 'theme-blue', 'theme-green', 'theme-purple', 'theme-red', 'theme-cloud', 'theme-claude-orange');
        if (theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }
        localStorage.setItem('chess_theme', theme);
        this.renderBoard(); // Re-render to apply new colors
    }

    handleSquareClick(e) {
        if (this.game.gameOver || this.isAiThinking) return;

        // Don't allow clicks if it's AI's turn in computer mode
        if (this.gameType === 'computer') {
            const aiColor = this.playerColor === 'white' ? 'black' : 'white';
            if (this.game.currentPlayer === aiColor) {
                return;
            }
        }

        const square = e.target.closest('.square');
        if (!square) return;

        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);

        // If a square is already selected
        if (this.selectedSquare) {
            const validMove = this.game.validMoves.find(m => m.row === row && m.col === col);
            if (validMove) {
                this.makeMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
            } else {
                // Check if clicking another piece of the same color
                const piece = this.game.getPiece(row, col);
                if (piece && piece.color === this.game.currentPlayer) {
                    this.selectSquare(row, col);
                } else {
                    this.deselectSquare();
                }
            }
        } else {
            // Select a new square
            const piece = this.game.getPiece(row, col);
            if (piece && piece.color === this.game.currentPlayer) {
                this.selectSquare(row, col);
            }
        }
    }

    selectSquare(row, col) {
        this.deselectSquare();

        this.selectedSquare = { row, col };
        this.game.validMoves = this.game.getValidMoves(row, col);

        const square = this.getSquareElement(row, col);
        if (square) {
            square.classList.add('selected');
        }

        if (this.highlightEnabled) {
            this.highlightValidMoves();
        }
    }

    deselectSquare() {
        this.clearHighlights();
        this.selectedSquare = null;
        this.game.validMoves = [];
    }

    highlightValidMoves() {
        this.game.validMoves.forEach(move => {
            const square = this.getSquareElement(move.row, move.col);
            if (square) {
                if (move.type === 'capture' || move.type === 'enpassant') {
                    square.classList.add('valid-capture');
                } else {
                    square.classList.add('valid-move');
                }
            }
        });
    }

    clearHighlights() {
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected', 'valid-move', 'valid-capture');
        });
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        const result = this.game.makeMove(fromRow, fromCol, toRow, toCol);

        if (result.promotion) {
            this.showPromotionDialog(result.row, result.col);
        } else {
            this.playSound('move');
            this.renderBoard();
            this.updateGameStatus();
            this.deselectSquare();
            // Auto-save after each move
            if (this.gameType === 'local') {
                this.game.saveToLocalStorage('autosave');
            }

            // Trigger AI move if playing against computer
            if (this.gameType === 'computer' && !this.game.gameOver) {
                const aiColor = this.playerColor === 'white' ? 'black' : 'white';
                if (this.game.currentPlayer === aiColor) {
                    this.makeAIMove();
                }
            }
        }
    }

    makeAIMove() {
        if (this.isAiThinking || this.game.gameOver) return;

        this.isAiThinking = true;
        const aiColor = this.playerColor === 'white' ? 'black' : 'white';

        // Show thinking indicator
        document.getElementById('gameMessage').textContent = '🤖 الكمبيوتر يفكر...';

        // Use setTimeout to allow UI to update
        setTimeout(() => {
            const bestMove = this.ai.getBestMove(this.game, aiColor);

            if (bestMove) {
                // Set valid moves for the AI's piece before making the move
                this.game.validMoves = this.game.getValidMoves(bestMove.fromRow, bestMove.fromCol);

                const result = this.game.makeMove(
                    bestMove.fromRow,
                    bestMove.fromCol,
                    bestMove.toRow,
                    bestMove.toCol
                );

                if (result.promotion) {
                    // Auto-promote to queen for AI
                    this.game.promotePawn(result.row, result.col, 'queen');
                    this.game.switchPlayer();
                    this.game.saveState();
                }

                this.playSound('move');
                this.renderBoard();
                this.updateGameStatus();
            }

            this.isAiThinking = false;
        }, 100);
    }

    showPromotionDialog(row, col) {
        const dialog = document.getElementById('promotionDialog');
        const piecesContainer = document.getElementById('promotionPieces');

        piecesContainer.innerHTML = '';
        const piece = this.game.getPiece(row, col);
        const promotionPieces = ['queen', 'rook', 'bishop', 'knight'];

        promotionPieces.forEach(type => {
            const pieceElement = document.createElement('div');
            pieceElement.className = 'promotion-piece';
            pieceElement.textContent = this.pieceSymbols[piece.color][type];
            pieceElement.addEventListener('click', () => {
                this.game.promotePawn(row, col, type);
                dialog.classList.remove('active');
                this.game.switchPlayer();
                this.playSound('move');
                this.renderBoard();
                this.updateGameStatus();
                this.deselectSquare();

                // Trigger AI move if playing against computer
                if (this.gameType === 'computer' && !this.game.gameOver) {
                    const aiColor = this.playerColor === 'white' ? 'black' : 'white';
                    if (this.game.currentPlayer === aiColor) {
                        this.makeAIMove();
                    }
                }
            });
            piecesContainer.appendChild(pieceElement);
        });

        dialog.classList.add('active');
    }

    handleDragStart(e) {
        if (this.isAiThinking) {
            e.preventDefault();
            return;
        }

        // Don't allow drag if it's AI's turn in computer mode
        if (this.gameType === 'computer') {
            const aiColor = this.playerColor === 'white' ? 'black' : 'white';
            if (this.game.currentPlayer === aiColor) {
                e.preventDefault();
                return;
            }
        }

        const square = e.target.closest('.square');
        if (!square) return;

        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        const piece = this.game.getPiece(row, col);

        if (piece && piece.color === this.game.currentPlayer && !this.game.gameOver) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', JSON.stringify({ row, col }));
            this.selectSquare(row, col);

            setTimeout(() => {
                e.target.classList.add('dragging');
            }, 0);
        } else {
            e.preventDefault();
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDrop(e) {
        e.preventDefault();

        const square = e.target.closest('.square');
        if (!square) return;

        const toRow = parseInt(square.dataset.row);
        const toCol = parseInt(square.dataset.col);

        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const validMove = this.game.validMoves.find(m => m.row === toRow && m.col === toCol);

            if (validMove) {
                this.makeMove(data.row, data.col, toRow, toCol);
            }
        } catch (error) {
            console.error('Drop error:', error);
        }

        document.querySelectorAll('.piece').forEach(p => p.classList.remove('dragging'));
        this.deselectSquare();
    }

    updateGameStatus() {
        const currentPlayerElement = document.getElementById('currentPlayer');
        const gameMessageElement = document.getElementById('gameMessage');

        const playerName = this.playerNames[this.game.currentPlayer];
        currentPlayerElement.textContent = playerName;

        const state = this.game.updateGameState();

        if (state === 'checkmate') {
            const winner = this.game.currentPlayer === 'white' ? this.playerNames.black : this.playerNames.white;
            gameMessageElement.textContent = `كش ملك! فاز ${winner}`;
            this.playSound('checkmate');
            this.stopTimer();
            this.showVictory(winner, 'بالكش مات');
        } else if (state === 'check') {
            gameMessageElement.textContent = 'كش!';
            this.playSound('check');
        } else if (state === 'stalemate') {
            gameMessageElement.textContent = 'تعادل - طريق مسدود';
            this.playSound('stalemate');
            this.stopTimer();
            this.showVictory('تعادل', 'طريق مسدود');
        } else {
            gameMessageElement.textContent = '';
        }
    }

    showVictory(winner, reason) {
        setTimeout(() => {
            const victoryOverlay = document.getElementById('victoryOverlay');
            const victoryMessage = document.getElementById('victoryMessage');

            if (winner === 'تعادل') {
                victoryMessage.textContent = `انتهت اللعبة بالتعادل - ${reason}`;
            } else {
                victoryMessage.textContent = `🎉 فاز ${winner} ${reason}! 🎉`;
            }

            victoryOverlay.classList.add('active');
        }, 500);
    }

    updateCapturedPieces() {
        const whiteCaptured = document.getElementById('whiteCaptured');
        const blackCaptured = document.getElementById('blackCaptured');

        whiteCaptured.innerHTML = this.game.capturedPieces.white
            .map(piece => `<span class="captured-piece">${this.pieceSymbols[piece.color][piece.type]}</span>`)
            .join('');

        blackCaptured.innerHTML = this.game.capturedPieces.black
            .map(piece => `<span class="captured-piece">${this.pieceSymbols[piece.color][piece.type]}</span>`)
            .join('');
    }

    updateMoveHistory() {
        const movesList = document.getElementById('movesList');
        movesList.innerHTML = '';

        for (let i = 0; i < this.game.moveHistory.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = this.game.moveHistory[i];
            const blackMove = this.game.moveHistory[i + 1];

            const entry = document.createElement('div');
            entry.className = 'move-entry';

            const moveText = `
                <span class="move-number">${moveNumber}.</span>
                <span>${this.formatMove(whiteMove)}</span>
                ${blackMove ? `<span>${this.formatMove(blackMove)}</span>` : ''}
            `;

            entry.innerHTML = moveText;
            movesList.appendChild(entry);
        }

        movesList.scrollTop = movesList.scrollHeight;
    }

    formatMove(move) {
        const files = 'abcdefgh';
        const from = files[move.from.col] + (8 - move.from.row);
        const to = files[move.to.col] + (8 - move.to.row);

        let notation = '';
        if (move.castling) {
            notation = move.castling === 'king' ? 'O-O' : 'O-O-O';
        } else {
            const pieceSymbol = this.pieceSymbols[move.color][move.piece];
            notation = pieceSymbol;
            if (move.captured) notation += '×';
            notation += to;
            if (move.promotion) {
                notation += '=' + this.pieceSymbols[move.color][move.promotion];
            }
        }

        return notation;
    }

    getSquareElement(row, col) {
        return this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        // Create simple beep sounds using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        let frequency = 440;
        let duration = 0.1;

        switch (type) {
            case 'move':
                frequency = 523;
                duration = 0.1;
                break;
            case 'capture':
                frequency = 659;
                duration = 0.15;
                break;
            case 'check':
                frequency = 784;
                duration = 0.2;
                break;
            case 'checkmate':
                frequency = 880;
                duration = 0.5;
                break;
        }

        oscillator.frequency.value = frequency;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    startTimer() {
        if (this.timerInterval) return;

        this.timerInterval = setInterval(() => {
            if (this.game.gameOver) {
                this.stopTimer();
                return;
            }

            const currentTimer = this.game.currentPlayer;
            this.timers[currentTimer]--;

            if (this.timers[currentTimer] <= 0) {
                this.timers[currentTimer] = 0;
                this.handleTimeout(currentTimer);
                this.stopTimer();
            }

            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const whiteTimer = document.getElementById('whiteTimer');
        const blackTimer = document.getElementById('blackTimer');

        whiteTimer.textContent = this.formatTime(this.timers.white);
        blackTimer.textContent = this.formatTime(this.timers.black);

        // Add warning class when time is low
        whiteTimer.className = 'timer';
        blackTimer.className = 'timer';

        if (this.timers.white < 60) whiteTimer.classList.add('danger');
        else if (this.timers.white < 180) whiteTimer.classList.add('warning');

        if (this.timers.black < 60) blackTimer.classList.add('danger');
        else if (this.timers.black < 180) blackTimer.classList.add('warning');
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    handleTimeout(player) {
        const winner = player === 'white' ? this.playerNames.black : this.playerNames.white;
        document.getElementById('gameMessage').textContent = `انتهى الوقت! فاز ${winner}`;
        this.game.gameOver = true;
        this.showVictory(winner, 'بانتهاء الوقت');
    }

    flipBoard() {
        this.flipped = !this.flipped;
        this.renderBoard();
        if (this.selectedSquare) {
            this.selectSquare(this.selectedSquare.row, this.selectedSquare.col);
        }
    }

    newGame() {
        if (confirm('هل تريد بدء لعبة جديدة؟')) {
            location.reload();
        }
    }

    resetGame() {
        this.game.reset();
        this.selectedSquare = null;
        // Reset timers based on current game mode
        const timers = {
            classic: 600,  // 10 minutes
            rapid: 300,    // 5 minutes
            blitz: 180,    // 3 minutes
            unlimited: 0   // No timer
        };
        this.timers = {
            white: timers[this.gameMode] || 600,
            black: timers[this.gameMode] || 600
        };
        this.stopTimer();
        if (this.timerEnabled && this.gameMode !== 'unlimited') {
            this.startTimer();
        }
        this.renderBoard();
        this.updateGameStatus();
        this.updateTimerDisplay();
    }

    undoMove() {
        if (this.game.undo()) {
            // If timer is running, pause it during undo
            const wasRunning = this.timerInterval !== null;
            if (wasRunning) {
                this.stopTimer();
            }

            this.playSound('move');
            this.renderBoard();
            this.updateGameStatus();
            this.deselectSquare();

            // Resume timer if it was running and game is not over
            if (wasRunning && this.timerEnabled && !this.game.gameOver) {
                this.startTimer();
            }
        }
    }

    redoMove() {
        if (this.game.redo()) {
            // If timer is running, pause it during redo
            const wasRunning = this.timerInterval !== null;
            if (wasRunning) {
                this.stopTimer();
            }

            this.playSound('move');
            this.renderBoard();
            this.updateGameStatus();
            this.deselectSquare();

            // Resume timer if it was running and game is not over
            if (wasRunning && this.timerEnabled && !this.game.gameOver) {
                this.startTimer();
            }
        }
    }

    saveGame() {
        const slot = prompt('اسم حفظ اللعبة:', 'game_' + Date.now());
        if (slot) {
            if (this.game.saveToLocalStorage(slot)) {
                alert('✅ تم حفظ اللعبة بنجاح!');
            } else {
                alert('❌ فشل حفظ اللعبة');
            }
        }
    }

    loadGame() {
        const games = ChessGame.getSavedGames();
        if (games.length === 0) {
            alert('لا توجد ألعاب محفوظة');
            return;
        }

        let message = 'اختر لعبة للتحميل:\n\n';
        games.forEach((game, index) => {
            message += `${index + 1}. ${game.slot} - ${game.moves} حركة\n`;
        });

        const choice = prompt(message + '\nأدخل رقم اللعبة:');
        if (choice) {
            const index = parseInt(choice) - 1;
            if (index >= 0 && index < games.length) {
                if (this.game.loadFromLocalStorage(games[index].slot)) {
                    this.renderBoard();
                    this.updateGameStatus();
                    this.updateTimerDisplay();
                    this.deselectSquare();
                    // Restart timer if enabled and game not over
                    if (this.timerEnabled && !this.game.gameOver) {
                        this.stopTimer();
                        this.startTimer();
                    }
                    alert('✅ تم تحميل اللعبة بنجاح!');
                } else {
                    alert('❌ فشل تحميل اللعبة');
                }
            }
        }
    }

    exportPGN() {
        const pgn = this.game.toPGN(this.playerNames.white, this.playerNames.black);
        const blob = new Blob([pgn], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `amira_chess_${Date.now()}.pgn`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('✅ تم تصدير اللعبة بصيغة PGN!');
    }

    showStats() {
        const stats = this.stats.getStats();
        const statsModal = document.getElementById('statsModal');
        const statsContent = document.getElementById('statsContent');

        statsContent.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>🎮 الألعاب</h3>
                    <div class="stat-value">${stats.gamesPlayed}</div>
                    <div class="stat-label">إجمالي الألعاب</div>
                </div>
                <div class="stat-card">
                    <h3>🏆 الفوز</h3>
                    <div class="stat-value">${stats.wins.white + stats.wins.black}</div>
                    <div class="stat-label">معدل: ${stats.winRate}%</div>
                </div>
                <div class="stat-card">
                    <h3>⚔️ الأبيض</h3>
                    <div class="stat-value">${stats.wins.white}/${stats.losses.white}</div>
                    <div class="stat-label">${stats.whiteWinRate}% فوز</div>
                </div>
                <div class="stat-card">
                    <h3>⚫ الأسود</h3>
                    <div class="stat-value">${stats.wins.black}/${stats.losses.black}</div>
                    <div class="stat-label">${stats.blackWinRate}% فوز</div>
                </div>
                <div class="stat-card">
                    <h3>🤝 التعادل</h3>
                    <div class="stat-value">${stats.draws}</div>
                    <div class="stat-label">${stats.stalemates} جمود</div>
                </div>
                <div class="stat-card">
                    <h3>📊 طول اللعبة</h3>
                    <div class="stat-value">${stats.averageGameLength}</div>
                    <div class="stat-label">متوسط الحركات</div>
                </div>
                <div class="stat-card">
                    <h3>✅ الكش مات</h3>
                    <div class="stat-value">${stats.checkmates}</div>
                    <div class="stat-label">الانتصارات</div>
                </div>
                <div class="stat-card">
                    <h3>⏱️ الوقت</h3>
                    <div class="stat-value">${stats.timeouts}</div>
                    <div class="stat-label">انتهى الوقت</div>
                </div>
            </div>
            <div class="captured-stats">
                <h3>القطع المأسورة</h3>
                <div class="pieces-captured">
                    <span>♟ ${stats.piecesCaptured.pawn}</span>
                    <span>♞ ${stats.piecesCaptured.knight}</span>
                    <span>♝ ${stats.piecesCaptured.bishop}</span>
                    <span>♜ ${stats.piecesCaptured.rook}</span>
                    <span>♛ ${stats.piecesCaptured.queen}</span>
                </div>
            </div>
        `;

        statsModal.classList.add('active');

        // Add event listeners for stats modal buttons
        document.getElementById('closeStatsBtn').onclick = () => {
            statsModal.classList.remove('active');
        };

        document.getElementById('exportStatsBtn').onclick = () => {
            const statsText = this.stats.exportStats();
            const blob = new Blob([statsText], { type: 'text/plain; charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `امير-احصائيات-${Date.now()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('✅ تم تصدير الإحصائيات!');
        };

        document.getElementById('resetStatsBtn').onclick = () => {
            if (confirm('هل أنت متأكد من إعادة تعيين جميع الإحصائيات؟')) {
                this.stats.reset();
                this.showStats(); // Refresh display
                alert('✅ تم إعادة تعيين الإحصائيات');
            }
        };
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const ui = new ChessUI();
    window.chessUI = ui;
});
