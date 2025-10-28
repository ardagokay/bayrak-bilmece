const achievements = [
    { id: 'first_game', name: 'İlk Adım', desc: 'İlk oyununu tamamla', icon: '🎮', condition: s => s.totalGames >= 1 },
    { id: 'perfect_score', name: 'Mükemmel!', desc: '10/10 yap', icon: '🏆', condition: s => s.perfectGames >= 1 },
    { id: 'speed_demon', name: 'Hız Şeytanı', desc: 'Süre yarışında 80+ puan', icon: '⚡', condition: s => s.timedHighScore >= 80 },
    { id: 'marathon', name: 'Maraton', desc: '10 oyun oyna', icon: '🏃', condition: s => s.totalGames >= 10 },
    { id: 'collector', name: 'Koleksiyoncu', desc: '50 doğru cevap', icon: '⭐', condition: s => s.totalCorrect >= 50 },
    { id: 'expert', name: 'Uzman', desc: '%80 başarı oranı', icon: '🎓', condition: s => s.successRate >= 80 },
    { id: 'endless_master', name: 'Sonsuz Usta', desc: 'Sonsuz modda 20+ skor', icon: '♾️', condition: s => s.endlessHighScore >= 20 },
    { id: 'champion', name: 'Şampiyon', desc: '500+ toplam puan', icon: '👑', condition: s => s.totalPoints >= 500 }
];

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'correct') {
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(783.99, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } else if (type === 'incorrect') {
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } else if (type === 'click') {
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
    }
}

let flagsData = [];
let easyFlags = [];
let mediumFlags = [];
let hardFlags = [];
let currentUser = null;
let currentMode = 'classic';
let currentDifficulty = 'easy';
let currentQuestion = 0;
let score = 0;
let correctCount = 0;
let incorrectCount = 0;
let optionsCount = 4;
let totalQuestions = 10;
let usedFlags = [];
let correctAnswer = "";
let canAnswer = true;
let gameTimer = null;
let timeRemaining = 10;
let gameStartTime = 0;
let isPaused = false;
let currentRegion = null;

const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
const particleCount = 50;

function initParticles() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = [];
    
    const isDark = !document.body.hasAttribute('data-theme') || document.body.getAttribute('data-theme') === 'dark';
    
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2 + 1,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.5 + 0.3
        });
    }
    
    animateParticles(isDark);
}

function animateParticles(isDark) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const color = isDark ? '255, 255, 255' : '0, 0, 0';
    
    particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
        ctx.fill();
        
        particles.forEach((p2, j) => {
            if (i !== j) {
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(${color}, ${0.1 * (1 - dist / 100)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        });
    });
    
    requestAnimationFrame(() => animateParticles(isDark));
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

initParticles();

const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

function setTheme(theme) {
    body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    initParticles();
}

themeToggle.addEventListener('click', () => {
    playSound('click');
    const currentTheme = body.getAttribute('data-theme') || 'dark';
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);

const navBtns = document.querySelectorAll('.nav-btn');
const contentSections = document.querySelectorAll('.content-section');

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        playSound('click');
        const sectionName = btn.dataset.section;
        
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        contentSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === `section-${sectionName}`) {
                section.classList.add('active');
            }
        });
        
        if (sectionName === 'leaderboard') {
            updateLeaderboard();
        } else if (sectionName === 'stats') {
            updateStats();
        }
    });
});

const usernameInput = document.getElementById('username-input');
const startBtn = document.getElementById('start-btn');
const loginView = document.getElementById('login-view');
const modesView = document.getElementById('modes-view');
const logoutBtnLeft = document.getElementById('logout-btn-left');

startBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    if (username) {
        playSound('click');
        currentUser = username;
        localStorage.setItem('currentUser', username);
        
        document.getElementById('user-name-left').textContent = username;
        logoutBtnLeft.style.display = 'flex';
        
        const userData = await getUserData(username);
        if (userData.user) {
            document.getElementById('user-score-left').textContent = `${userData.user.total_score} Puan`;
        }
        
        loginView.classList.remove('active');
        modesView.classList.add('active');
    }
});

usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        startBtn.click();
    }
});

const savedUser = localStorage.getItem('currentUser');
if (savedUser) {
    currentUser = savedUser;
    usernameInput.value = savedUser;
    document.getElementById('user-name-left').textContent = savedUser;
    logoutBtnLeft.style.display = 'flex';
    
    getUserData(savedUser).then(userData => {
        if (userData.user) {
            document.getElementById('user-score-left').textContent = `${userData.user.total_score} Puan`;
        }
    });
}

const logoutModal = document.getElementById('logout-modal');
const confirmLogout = document.getElementById('confirm-logout');
const cancelLogout = document.getElementById('cancel-logout');

logoutBtnLeft.addEventListener('click', () => {
    playSound('click');
    logoutModal.classList.add('active');
});

confirmLogout.addEventListener('click', () => {
    playSound('click');
    localStorage.removeItem('currentUser');
    currentUser = null;
    usernameInput.value = '';
    document.getElementById('user-name-left').textContent = 'Misafir';
    document.getElementById('user-score-left').textContent = '0 Puan';
    logoutBtnLeft.style.display = 'none';
    logoutModal.classList.remove('active');
    
    modesView.classList.remove('active');
    loginView.classList.add('active');
    
    navBtns.forEach(b => b.classList.remove('active'));
    navBtns[0].classList.add('active');
    contentSections.forEach(s => s.classList.remove('active'));
    contentSections[0].classList.add('active');
});

cancelLogout.addEventListener('click', () => {
    playSound('click');
    logoutModal.classList.remove('active');
});

logoutModal.addEventListener('click', (e) => {
    if (e.target === logoutModal) {
        cancelLogout.click();
    }
});

const modeCards = document.querySelectorAll('.mode-card-new');
const difficultyView = document.getElementById('difficulty-view');
const regionsView = document.getElementById('regions-view');

modeCards.forEach(card => {
    card.addEventListener('click', () => {
        playSound('click');
        currentMode = card.dataset.mode;
        
        if (currentMode === 'regions') {
            modesView.classList.remove('active');
            regionsView.classList.add('active');
        } else {
            modesView.classList.remove('active');
            difficultyView.classList.add('active');
        }
    });
});

const backToModesBtn = document.getElementById('back-to-modes-btn');
const backToModesFromRegions = document.getElementById('back-to-modes-from-regions');

backToModesBtn.addEventListener('click', () => {
    playSound('click');
    difficultyView.classList.remove('active');
    modesView.classList.add('active');
});

backToModesFromRegions.addEventListener('click', () => {
    playSound('click');
    regionsView.classList.remove('active');
    modesView.classList.add('active');
});

const regionCards = document.querySelectorAll('.region-card');
const readyView = document.getElementById('ready-view');

regionCards.forEach(card => {
    card.addEventListener('click', () => {
        playSound('click');
        currentRegion = card.dataset.region;
        currentDifficulty = 'medium';
        
        const regionNames = {
            'all': 'Tüm Kıtalar',
            'avrupa': 'Avrupa',
            'asya': 'Asya',
            'afrika': 'Afrika',
            'kuzey-amerika': 'Kuzey Amerika',
            'guney-amerika': 'Güney Amerika',
            'okyanusya': 'Okyanusya',
            'antarktika': 'Antarktika'
        };
        
        document.getElementById('ready-mode-text').textContent = `Bölge Modu - ${regionNames[currentRegion]}`;
        
        regionsView.classList.remove('active');
        readyView.classList.add('active');
    });
});

const difficultyCards = document.querySelectorAll('.difficulty-card');

difficultyCards.forEach(card => {
    card.addEventListener('click', () => {
        playSound('click');
        currentDifficulty = card.dataset.diff;
        
        const modeNames = {
            'classic': 'Klasik Mod',
            'timed': 'Süre Yarışı',
            'endless': 'Sonsuz Mod'
        };
        
        const diffNames = {
            'easy': 'Kolay',
            'medium': 'Orta',
            'hard': 'Zor'
        };
        
        document.getElementById('ready-mode-text').textContent = `${modeNames[currentMode]} - ${diffNames[currentDifficulty]}`;
        
        difficultyView.classList.remove('active');
        readyView.classList.add('active');
    });
});

const readyYesBtn = document.getElementById('ready-yes-btn');
const readyNoBtn = document.getElementById('ready-no-btn');
const gameView = document.getElementById('game-view');

readyYesBtn.addEventListener('click', () => {
    playSound('click');
    readyView.classList.remove('active');
    gameView.classList.add('active');
    startGame();
});

readyNoBtn.addEventListener('click', () => {
    playSound('click');
    readyView.classList.remove('active');
    if (currentMode === 'regions') {
        regionsView.classList.add('active');
    } else {
        difficultyView.classList.add('active');
    }
});

async function loadAndCategorizeFlags() {
    flagsData = await loadFlagsFromJSON();
    
    const easyCountries = ['Türkiye', 'Almanya', 'Fransa', 'İtalya', 'İspanya', 'İngiltere', 'Rusya', 'Amerika', 'Kanada', 'Brezilya', 'Arjantin', 'Japonya', 'Çin', 'Hindistan', 'Avustralya', 'Meksika', 'Hollanda', 'Belçika', 'İsveç', 'Norveç', 'Yunanistan', 'Portekiz', 'İsviçre', 'Avusturya', 'Polonya'];
    
    const hardCountries = ['Lesotho', 'Bhutan', 'Samoa', 'Tonga', 'Vanuatu', 'Kiribati', 'Tuvalu', 'Nauru', 'Palau', 'San Marino', 'Liechtenstein', 'Andorra', 'Monako', 'Vatikan', 'Comoros', 'Sao Tome ve Principe', 'Seyşeller', 'Malavi', 'Burundi', 'Gine-Bissau', 'Ekvator Ginesi', 'Eritre', 'Cibuti', 'Esvatini', 'Saint Kitts ve Nevis', 'Saint Lucia', 'Saint Vincent ve Grenadinler', 'Antigua ve Barbuda', 'Dominika', 'Grenada', 'Marshall Adaları', 'Mikronezya', 'Solomon Adaları'];
    
    easyFlags = flagsData.filter(f => easyCountries.includes(f.country));
    hardFlags = flagsData.filter(f => hardCountries.includes(f.country));
    mediumFlags = flagsData.filter(f => !easyCountries.includes(f.country) && !hardCountries.includes(f.country));
}

async function startGame() {
    if (flagsData.length === 0) {
        await loadAndCategorizeFlags();
    }
    
    currentQuestion = 0;
    score = 0;
    correctCount = 0;
    incorrectCount = 0;
    usedFlags = [];
    gameStartTime = Date.now();
    canAnswer = true;
    isPaused = false;
    
    if (currentMode === 'classic') {
        totalQuestions = 10;
        optionsCount = 4;
        document.getElementById('timer-display').style.display = 'none';
    } else if (currentMode === 'timed') {
        totalQuestions = 10;
        optionsCount = 6;
        document.getElementById('timer-display').style.display = 'flex';
    } else if (currentMode === 'endless') {
        totalQuestions = Infinity;
        optionsCount = 6;
        document.getElementById('timer-display').style.display = 'none';
    } else if (currentMode === 'regions') {
        totalQuestions = 10;
        optionsCount = 4;
        document.getElementById('timer-display').style.display = 'none';
    }
    
    updateGameUI();
    loadQuestion();
}

function loadQuestion() {
    if (currentMode === 'endless') {
        currentQuestion++;
        document.getElementById('question-counter').textContent = `Soru ${currentQuestion}`;
    } else {
        currentQuestion++;
        document.getElementById('question-counter').textContent = `Soru ${currentQuestion}/${totalQuestions}`;
    }
    
    canAnswer = true;
    
    let availableFlags;
    
    if (currentMode === 'regions') {
        if (currentRegion === 'all') {
            availableFlags = flagsData.filter(f => !usedFlags.includes(f.country));
        } else {
            const regionMap = {
                'avrupa': 'Avrupa',
                'asya': 'Asya',
                'afrika': 'Afrika',
                'kuzey-amerika': 'Kuzey Amerika',
                'guney-amerika': 'Güney Amerika',
                'okyanusya': 'Okyanusya',
                'antarktika': 'Okyanusya'
            };
            const selectedRegion = regionMap[currentRegion];
            availableFlags = flagsData.filter(f => f.region === selectedRegion && !usedFlags.includes(f.country));
        }
    } else {
        if (currentDifficulty === 'easy') {
            availableFlags = easyFlags.filter(f => !usedFlags.includes(f.country));
        } else if (currentDifficulty === 'hard') {
            availableFlags = hardFlags.filter(f => !usedFlags.includes(f.country));
        } else {
            availableFlags = mediumFlags.filter(f => !usedFlags.includes(f.country));
        }
    }
    
    if (availableFlags.length < optionsCount + 1) {
        usedFlags = [];
        if (currentMode === 'regions') {
            if (currentRegion === 'all') {
                availableFlags = flagsData;
            } else {
                const regionMap = {
                    'avrupa': 'Avrupa',
                    'asya': 'Asya',
                    'afrika': 'Afrika',
                    'kuzey-amerika': 'Kuzey Amerika',
                    'guney-amerika': 'Güney Amerika',
                    'okyanusya': 'Okyanusya',
                    'antarktika': 'Okyanusya'
                };
                const selectedRegion = regionMap[currentRegion];
                availableFlags = flagsData.filter(f => f.region === selectedRegion);
            }
        } else {
            if (currentDifficulty === 'easy') {
                availableFlags = easyFlags;
            } else if (currentDifficulty === 'hard') {
                availableFlags = hardFlags;
            } else {
                availableFlags = mediumFlags;
            }
        }
    }
    
    const correctFlag = availableFlags[Math.floor(Math.random() * availableFlags.length)];
    correctAnswer = correctFlag.country;
    usedFlags.push(correctAnswer);
    
    const flagImg = document.getElementById('game-flag');
    flagImg.src = correctFlag.flag;
    
    const wrongFlags = availableFlags
        .filter(f => f.country !== correctAnswer)
        .sort(() => Math.random() - 0.5)
        .slice(0, optionsCount - 1);
    
    const allOptions = [correctFlag, ...wrongFlags].sort(() => Math.random() - 0.5);
    
    const optionsGrid = document.getElementById('options-grid');
    optionsGrid.innerHTML = '';
    
    if (optionsCount === 6) {
        optionsGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    } else {
        optionsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    }
    
    allOptions.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option.country;
        btn.addEventListener('click', () => checkAnswer(option.country, btn));
        optionsGrid.appendChild(btn);
    });
    
    document.getElementById('feedback-box').classList.remove('show', 'correct', 'incorrect');
    
    if (currentMode !== 'endless') {
        const progress = (currentQuestion / totalQuestions) * 100;
        document.getElementById('game-progress').style.width = `${progress}%`;
    } else {
        document.getElementById('game-progress').style.width = '100%';
    }
    
    if (currentMode === 'timed') {
        startTimer();
    }
}

function startTimer() {
    timeRemaining = 10;
    updateTimerDisplay();
    
    if (gameTimer) clearInterval(gameTimer);
    
    gameTimer = setInterval(() => {
        if (!isPaused) {
            timeRemaining--;
            updateTimerDisplay();
            
            if (timeRemaining <= 0) {
                clearInterval(gameTimer);
                canAnswer = false;
                
                const correctBtn = Array.from(document.querySelectorAll('.option-btn'))
                    .find(btn => btn.textContent === correctAnswer);
                if (correctBtn) {
                    correctBtn.classList.add('correct');
                }
                
                incorrectCount++;
                showFeedback(false, `Süre doldu! Doğru cevap: ${correctAnswer}`);
                
                setTimeout(() => {
                    if (currentMode === 'endless') {
                        endGame();
                    } else if (currentQuestion >= totalQuestions) {
                        endGame();
                    } else {
                        loadQuestion();
                    }
                }, 2000);
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerText = document.getElementById('timer-text');
    timerText.textContent = timeRemaining;
    
    const circle = document.querySelector('.timer-circle');
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (timeRemaining / 10) * circumference;
    circle.style.strokeDashoffset = offset;
    
    if (timeRemaining <= 3) {
        timerText.style.color = '#FF6B6B';
        circle.style.stroke = '#FF6B6B';
    } else {
        timerText.style.color = '#FFB84D';
        circle.style.stroke = '#FFB84D';
    }
}

function checkAnswer(answer, btn) {
    if (!canAnswer) return;
    
    canAnswer = false;
    
    if (currentMode === 'timed' && gameTimer) {
        clearInterval(gameTimer);
    }
    
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.disabled = true);
    
    if (answer === correctAnswer) {
        playSound('correct');
        btn.classList.add('correct');
        correctCount++;
        
        const points = currentMode === 'timed' 
            ? Math.max(10, 10 + timeRemaining * 2)
            : currentMode === 'endless'
            ? 5
            : currentDifficulty === 'easy' ? 5 : currentDifficulty === 'medium' ? 7 : 10;
        
        score += points;
        updateGameUI();
        showFeedback(true, `Doğru! +${points} puan`);
        
        setTimeout(() => {
            if (currentMode === 'endless') {
                loadQuestion();
            } else if (currentQuestion >= totalQuestions) {
                endGame();
            } else {
                loadQuestion();
            }
        }, 1500);
    } else {
        playSound('incorrect');
        btn.classList.add('incorrect');
        incorrectCount++;
        
        const correctBtn = Array.from(allBtns).find(b => b.textContent === correctAnswer);
        if (correctBtn) {
            correctBtn.classList.add('correct');
        }
        
        showFeedback(false, `Yanlış! Doğru cevap: ${correctAnswer}`);
        
        setTimeout(() => {
            if (currentMode === 'endless') {
                endGame();
            } else if (currentQuestion >= totalQuestions) {
                endGame();
            } else {
                loadQuestion();
            }
        }, 2000);
    }
}

function showFeedback(isCorrect, message) {
    const feedbackBox = document.getElementById('feedback-box');
    feedbackBox.textContent = message;
    feedbackBox.classList.remove('correct', 'incorrect');
    feedbackBox.classList.add(isCorrect ? 'correct' : 'incorrect', 'show');
}

function updateGameUI() {
    if (currentMode !== 'endless') {
        document.getElementById('question-counter').textContent = `Soru ${currentQuestion}/${totalQuestions}`;
    } else {
        document.getElementById('question-counter').textContent = `Soru ${currentQuestion}`;
    }
    document.getElementById('score-display').textContent = `Skor: ${score}`;
    document.getElementById('user-score-left').textContent = `${score} Puan`;
}

async function endGame() {
    if (gameTimer) clearInterval(gameTimer);
    
    const totalAnswered = correctCount + incorrectCount;
    const successRate = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    const gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
    
    gameView.classList.remove('active');
    document.getElementById('result-view').classList.add('active');
    
    document.getElementById('result-score').textContent = score;
    document.getElementById('result-correct').textContent = correctCount;
    document.getElementById('result-incorrect').textContent = incorrectCount;
    document.getElementById('result-percent').textContent = `${successRate}%`;
    
    const circle = document.getElementById('result-circle-prog');
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (successRate / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    
    let message = '';
    if (successRate === 100) message = '🎉 Mükemmel! Tüm soruları doğru bildin!';
    else if (successRate >= 80) message = '🌟 Harika! Çok başarılısın!';
    else if (successRate >= 60) message = '👍 İyi iş çıkardın!';
    else if (successRate >= 40) message = '💪 Fena değil, pratik yapmalısın!';
    else message = '📚 Daha çok çalışmalısın!';
    
    document.getElementById('result-message').textContent = message;
    
    await saveUserData(currentUser, {
        mode: currentMode,
        difficulty: currentDifficulty,
        score: score,
        correct: correctCount,
        incorrect: incorrectCount,
        successRate: successRate,
        time: gameTime
    });
    
    updateLeaderboard();
}

async function updateLeaderboard() {
    const leaderboard = await getLeaderboard();
    const container = document.getElementById('leaderboard-container');
    container.innerHTML = '';
    
    if (leaderboard.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Henüz sonuç yok</p>';
        return;
    }
    
    leaderboard.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        
        let rankEmoji = '';
        if (index === 0) rankEmoji = '🥇';
        else if (index === 1) rankEmoji = '🥈';
        else if (index === 2) rankEmoji = '🥉';
        else rankEmoji = `#${index + 1}`;
        
        item.innerHTML = `
            <span style="font-size: 1.5rem; font-weight: 700; min-width: 50px; text-align: center;">${rankEmoji}</span>
            <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 1.1rem;">${entry.username}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">${entry.total_games} oyun</div>
            </div>
            <span style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${entry.total_score}</span>
        `;
        
        if (entry.username === currentUser) {
            item.style.borderColor = 'var(--primary)';
            item.style.background = 'rgba(108, 99, 255, 0.1)';
        }
        
        container.appendChild(item);
    });
}

async function updateStats() {
    const userData = await getUserData(currentUser);
    const results = userData.results;
    
    if (results.length === 0 || !userData.user) {
        document.getElementById('stat-total-games').textContent = '0';
        document.getElementById('stat-total-points').textContent = '0';
        document.getElementById('stat-correct').textContent = '0';
        document.getElementById('stat-success-rate').textContent = '0%';
        return;
    }
    
    document.getElementById('stat-total-games').textContent = userData.user.total_games;
    document.getElementById('stat-total-points').textContent = userData.user.total_score;
    document.getElementById('stat-correct').textContent = userData.user.total_correct;
    
    const totalAnswered = results.reduce((sum, r) => sum + r.correct + r.incorrect, 0);
    const successRate = totalAnswered > 0 ? Math.round((userData.user.total_correct / totalAnswered) * 100) : 0;
    document.getElementById('stat-success-rate').textContent = `${successRate}%`;
    
    updateAchievements();
}

async function updateAchievements() {
    const userData = await getUserData(currentUser);
    const results = userData.results;
    const container = document.getElementById('achievements-container');
    container.innerHTML = '';
    
    const stats = {
        totalGames: results.length,
        totalPoints: results.reduce((sum, r) => sum + r.score, 0),
        totalCorrect: results.reduce((sum, r) => sum + r.correct, 0),
        totalAnswered: results.reduce((sum, r) => sum + r.correct + r.incorrect, 0),
        perfectGames: results.filter(r => r.incorrect === 0 && r.correct >= 10).length,
        timedHighScore: Math.max(0, ...results.filter(r => r.mode === 'timed').map(r => r.score)),
        endlessHighScore: Math.max(0, ...results.filter(r => r.mode === 'endless').map(r => r.score)),
        successRate: 0
    };
    
    if (stats.totalAnswered > 0) {
        stats.successRate = Math.round((stats.totalCorrect / stats.totalAnswered) * 100);
    }
    
    achievements.forEach(achievement => {
        const unlocked = achievement.condition(stats);
        
        const card = document.createElement('div');
        card.className = `achievement-card ${unlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
            <span style="font-size: 2.5rem; display: block; margin-bottom: 8px;">${achievement.icon}</span>
            <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 4px;">${achievement.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${achievement.desc}</div>
        `;
        
        container.appendChild(card);
    });
}

const playAgainBtn = document.getElementById('play-again');
const backToMenuBtn = document.getElementById('back-to-menu');
const shareResultBtn = document.getElementById('share-result');

playAgainBtn.addEventListener('click', () => {
    playSound('click');
    document.getElementById('result-view').classList.remove('active');
    gameView.classList.add('active');
    startGame();
});

backToMenuBtn.addEventListener('click', () => {
    playSound('click');
    document.getElementById('result-view').classList.remove('active');
    modesView.classList.add('active');
});

shareResultBtn.addEventListener('click', () => {
    playSound('click');
    const successRate = Math.round((correctCount / (correctCount + incorrectCount)) * 100);
    const resultId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    localStorage.setItem(`result_${resultId}`, JSON.stringify({
        username: currentUser,
        score: score,
        correct: correctCount,
        incorrect: incorrectCount,
        total: correctCount + incorrectCount,
        successRate: successRate,
        mode: currentMode,
        difficulty: currentDifficulty,
        date: new Date().toISOString()
    }));
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?result=${resultId}`;
    const text = `🌍 Bayrak Bilmece'de ${correctCount}/${correctCount + incorrectCount} doğru yaptım! (%${successRate})\nSen de oyna: ${shareUrl}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Bayrak Bilmece Sonucum',
            text: text
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert('Paylaşım linki panoya kopyalandı!');
        });
    }
});

const backGameBtn = document.getElementById('back-game-btn');
const backGameModal = document.getElementById('back-game-modal');
const continueGameBtn = document.getElementById('continue-game');
const quitGameBtn = document.getElementById('quit-game');

backGameBtn.addEventListener('click', () => {
    playSound('click');
    isPaused = true;
    backGameModal.classList.add('active');
});

continueGameBtn.addEventListener('click', () => {
    playSound('click');
    isPaused = false;
    backGameModal.classList.remove('active');
});

quitGameBtn.addEventListener('click', () => {
    playSound('click');
    if (gameTimer) clearInterval(gameTimer);
    isPaused = false;
    backGameModal.classList.remove('active');
    gameView.classList.remove('active');
    modesView.classList.add('active');
});

backGameModal.addEventListener('click', (e) => {
    if (e.target === backGameModal) {
        continueGameBtn.click();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (gameView.classList.contains('active') && !backGameModal.classList.contains('active')) {
            backGameBtn.click();
        }
    }
});

window.addEventListener('load', async () => {
    await loadAndCategorizeFlags();
    
    const urlParams = new URLSearchParams(window.location.search);
    const resultId = urlParams.get('result');
    
    if (resultId) {
        const resultData = localStorage.getItem(`result_${resultId}`);
        if (resultData) {
            const data = JSON.parse(resultData);
            alert(`${data.username} ${data.correct}/${data.total} doğru yaptı! (%${data.successRate})`);
        }
    }
    
    if (currentUser) {
        loginView.classList.remove('active');
        modesView.classList.add('active');
        updateLeaderboard();
        updateStats();
    }
});

console.log('%c🌍 Bayrak Bilmece', 'color: #6C63FF; font-size: 24px; font-weight: bold;');
console.log('%cBu oyun Arda Gökay tarafından yapılmıştır.', 'color: #FFB84D; font-size: 14px;');
