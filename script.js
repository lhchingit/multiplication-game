document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultScreen = document.getElementById('result-screen');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const gameRestartBtn = document.getElementById('game-restart-btn');
    const gameHomeBtn = document.getElementById('game-home-btn');
    const resultHomeBtn = document.getElementById('result-home-btn');
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const factor1Display = document.getElementById('factor1');
    const factor2Display = document.getElementById('factor2');
    const answerPlaceholder = document.getElementById('answer-placeholder');
    const userInputDisplay = document.getElementById('user-input');
    const numBtns = document.querySelectorAll('.num-btn[data-val]');
    const clearBtn = document.getElementById('clear-btn');
    const submitBtn = document.getElementById('submit-btn');
    const finalScoreDisplay = document.getElementById('final-score');
    const starsContainer = document.getElementById('stars-container');
    const feedbackText = document.getElementById('feedback-text');
    const highScoreDisplay = document.getElementById('high-score');

    // Game State
    let score = 0;
    let timeLeft = 60;
    let timerInterval;
    let currentAnswer = 0;
    let currentInput = "";
    let isGameActive = false;
    let highScore = localStorage.getItem('multiplicationHighScore') || 0;
    let currentDifficulty = 'easy';
    let usedQuestions = new Set();

    // Init High Score
    highScoreDisplay.textContent = highScore;

    // Difficulty Selection
    const diffBtns = document.querySelectorAll('.diff-btn');
    diffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isGameActive) return; // Prevent changing difficulty during game
            diffBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDifficulty = btn.getAttribute('data-level');
        });
    });

    // Event Listeners
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    gameRestartBtn.addEventListener('click', startGame);
    gameHomeBtn.addEventListener('click', goHome);
    resultHomeBtn.addEventListener('click', goHome);

    function goHome() {
        isGameActive = false;
        clearInterval(timerInterval);
        stopBGM();
        showScreen(startScreen);

        // Try to start BGM if returning to home (since it's a menu)
        // But wait a bit to avoid conflict if user just clicked
        setTimeout(() => {
            if (!isBgmPlaying && !startScreen.classList.contains('hidden')) {
                startBGM();
            }
        }, 100);
    }

    numBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!isGameActive) return;
            handleInput(btn.getAttribute('data-val'));
        });
    });

    clearBtn.addEventListener('click', () => {
        if (!isGameActive) return;
        currentInput = "";
        updateInputDisplay();
    });

    submitBtn.addEventListener('click', () => {
        if (!isGameActive) return;
        checkAnswer();
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (!isGameActive) return;
        if (e.key >= '0' && e.key <= '9') {
            handleInput(e.key);
        } else if (e.key === 'Backspace') {
            currentInput = currentInput.slice(0, -1);
            updateInputDisplay();
        } else if (e.key === 'Enter') {
            checkAnswer();
        }
    });

    // Sound Manager using Web Audio API
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Background Music System
    let bgmInterval;
    let isBgmPlaying = false;

    function playBGMNote(freq, duration) {
        if (audioCtx.state === 'suspended') return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.value = 0.03; // Very low volume for background
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    function startBGM() {
        if (isBgmPlaying) return;
        isBgmPlaying = true;

        // Simple cute melody (C Major arpeggios)
        const melody = [
            { f: 261.63, d: 0.3 }, { f: 329.63, d: 0.3 }, { f: 392.00, d: 0.3 }, { f: 523.25, d: 0.3 }, // C E G C
            { f: 329.63, d: 0.3 }, { f: 392.00, d: 0.3 }, { f: 523.25, d: 0.3 }, { f: 659.25, d: 0.3 }, // E G C E
            { f: 293.66, d: 0.3 }, { f: 349.23, d: 0.3 }, { f: 440.00, d: 0.3 }, { f: 587.33, d: 0.3 }, // D F A D
            { f: 246.94, d: 0.3 }, { f: 293.66, d: 0.3 }, { f: 392.00, d: 0.3 }, { f: 493.88, d: 0.3 }  // B D G B
        ];

        let noteIndex = 0;

        function playNextNote() {
            if (!isBgmPlaying) return;
            const note = melody[noteIndex];
            playBGMNote(note.f, note.d);
            noteIndex = (noteIndex + 1) % melody.length;
            bgmInterval = setTimeout(playNextNote, 300); // Tempo
        }
        playNextNote();
    }

    function stopBGM() {
        isBgmPlaying = false;
        clearTimeout(bgmInterval);
    }

    // Try to start BGM on any user interaction
    function initAudio() {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().then(() => {
                const isGameHidden = gameScreen.classList.contains('hidden');
                if (isGameHidden && !isBgmPlaying) {
                    startBGM();
                }
            });
        } else {
            const isGameHidden = gameScreen.classList.contains('hidden');
            if (isGameHidden && !isBgmPlaying) {
                startBGM();
            }
        }
    }

    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    document.addEventListener('touchstart', initAudio);

    function playTone(freq, type, duration) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    function playCorrectSound() {
        playTone(600, 'sine', 0.1);
        setTimeout(() => playTone(800, 'sine', 0.2), 100);
    }

    function playWrongSound() {
        playTone(200, 'sawtooth', 0.3);
        setTimeout(() => playTone(150, 'sawtooth', 0.3), 150);
    }

    function playWinSound() {
        playTone(400, 'sine', 0.1);
        setTimeout(() => playTone(500, 'sine', 0.1), 100);
        setTimeout(() => playTone(600, 'sine', 0.1), 200);
        setTimeout(() => playTone(800, 'sine', 0.4), 300);
    }

    // Simple Confetti
    function fireConfetti() {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'absolute';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = -10 + 'px';
            confetti.style.borderRadius = '50%';
            confetti.style.zIndex = '1000';
            document.body.appendChild(confetti);

            const animation = confetti.animate([
                { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
                { transform: `translate(${Math.random() * 200 - 100}px, ${window.innerHeight}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
            ], {
                duration: Math.random() * 2000 + 1500,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });

            animation.onfinish = () => confetti.remove();
        }
    }

    function updateNumpad() {
        const numpad = document.querySelector('.numpad');
        // Get all number buttons (convert to array)
        const numberButtons = Array.from(document.querySelectorAll('.num-btn[data-val]'));

        const chineseNumbers = {
            '1': '壹', '2': '貳', '3': '參', '4': '肆', '5': '伍',
            '6': '陸', '7': '柒', '8': '捌', '9': '玖', '0': '零'
        };

        // Reset text content to digits first (in case switching back from master)
        numberButtons.forEach(btn => {
            const val = btn.getAttribute('data-val');
            btn.textContent = val;
        });

        if (currentDifficulty === 'master') {
            // Set Chinese numbers
            numberButtons.forEach(btn => {
                const val = btn.getAttribute('data-val');
                if (chineseNumbers[val]) {
                    btn.textContent = chineseNumbers[val];
                }
            });
        }

        if (currentDifficulty === 'hard' || currentDifficulty === 'master') {
            // Shuffle
            for (let i = numberButtons.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [numberButtons[i], numberButtons[j]] = [numberButtons[j], numberButtons[i]];
            }
        } else {
            // Sort: 1-9, then 0
            numberButtons.sort((a, b) => {
                const valA = parseInt(a.getAttribute('data-val'));
                const valB = parseInt(b.getAttribute('data-val'));
                if (valA === 0) return 1;
                if (valB === 0) return -1;
                return valA - valB;
            });
        }

        // Detach all children
        while (numpad.firstChild) {
            numpad.removeChild(numpad.firstChild);
        }

        // Append first 9 numbers
        for (let i = 0; i < 9; i++) {
            if (numberButtons[i]) numpad.appendChild(numberButtons[i]);
        }

        // Append Clear
        numpad.appendChild(clearBtn);

        // Append 10th number (usually 0)
        if (numberButtons[9]) numpad.appendChild(numberButtons[9]);

        // Append Submit
        numpad.appendChild(submitBtn);
    }

    function startGame() {
        // Resume Audio Context on user interaction
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        stopBGM(); // Stop background music

        // Reset State
        score = 0;
        timeLeft = 60;
        currentInput = "";
        isGameActive = true;
        usedQuestions.clear();

        // UI Updates
        scoreDisplay.textContent = score;
        timerDisplay.textContent = timeLeft;
        userInputDisplay.textContent = "";
        timerDisplay.style.color = '#333';

        // Switch Screens
        showScreen(gameScreen);

        // Start Timer
        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000);

        // First Question
        generateQuestion();
    }

    function showScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            s.classList.add('hidden');
        });
        screen.classList.remove('hidden');
        // Small delay to allow display:block to apply before opacity transition
        setTimeout(() => {
            screen.classList.add('active');
        }, 10);
    }

    function updateTimer() {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 10) {
            timerDisplay.style.color = '#ff4d4d';
        } else {
            timerDisplay.style.color = '#333';
        }

        if (timeLeft <= 0) {
            endGame();
        }
    }

    function generateQuestion() {
        let num1, num2, key;

        // Try to find an unused question
        if (usedQuestions.size >= 81) {
            usedQuestions.clear();
        }

        do {
            num1 = Math.floor(Math.random() * 9) + 1; // 1-9
            num2 = Math.floor(Math.random() * 9) + 1; // 1-9
            key = `${num1}x${num2}`;
        } while (usedQuestions.has(key));

        usedQuestions.add(key);
        currentAnswer = num1 * num2;

        factor1Display.textContent = num1;
        factor2Display.textContent = num2;

        // Reset input for new question
        currentInput = "";
        updateInputDisplay();

        // Update Numpad (Randomize if Hard or Master)
        updateNumpad();

        // Animation for new question
        const card = document.querySelector('.question-card');
        card.classList.remove('pop');
        void card.offsetWidth; // Trigger reflow
        card.classList.add('pop');
    }

    function handleInput(val) {
        if (currentInput.length < 3) { // Max 3 digits (though answer is max 81)
            currentInput += val;
            updateInputDisplay();
        }
    }

    function updateInputDisplay() {
        userInputDisplay.textContent = currentInput;
        if (currentInput.length > 0) {
            answerPlaceholder.textContent = currentInput;
            answerPlaceholder.classList.add('filled');
        } else {
            answerPlaceholder.textContent = "?";
            answerPlaceholder.classList.remove('filled');
        }
    }

    function checkAnswer() {
        if (currentInput === "") return;

        const userVal = parseInt(currentInput);

        if (userVal === currentAnswer) {
            // Correct
            score += 10;
            scoreDisplay.textContent = score;
            playCorrectSound();

            // Visual feedback
            userInputDisplay.style.backgroundColor = "#a5d6a7";
            setTimeout(() => {
                userInputDisplay.style.backgroundColor = "rgba(255,255,255,0.5)";
            }, 200);

            generateQuestion();
        } else {
            // Wrong
            playWrongSound();
            const card = document.querySelector('.question-card');
            card.classList.add('shake');
            userInputDisplay.style.backgroundColor = "#ffccbc";

            // Penalty for Medium, Hard, and Master
            if (['medium', 'hard', 'master'].includes(currentDifficulty)) {
                timeLeft -= 5;
                if (timeLeft < 0) timeLeft = 0;
                timerDisplay.textContent = timeLeft;

                // Visual feedback for time penalty
                timerDisplay.style.color = '#ff4d4d';
                timerDisplay.classList.add('shake');
                setTimeout(() => timerDisplay.classList.remove('shake'), 500);
            }

            setTimeout(() => {
                card.classList.remove('shake');
                userInputDisplay.style.backgroundColor = "rgba(255,255,255,0.5)";
                currentInput = "";
                updateInputDisplay();
            }, 500);
        }
    }

    function speakText(text) {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-TW';
            utterance.rate = 1;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        }
    }

    function endGame() {
        isGameActive = false;
        clearInterval(timerInterval);

        finalScoreDisplay.textContent = score;

        // Update High Score
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('multiplicationHighScore', highScore);
            highScoreDisplay.textContent = highScore;
        }

        // Calculate Stars
        let stars = "";
        let feedback = "";

        if (score >= 150) {
            stars = "⭐⭐⭐";
            feedback = "太神了！你是乘法大師！";
            playWinSound();
            fireConfetti();
        } else if (score >= 100) {
            stars = "⭐⭐";
            feedback = "很棒喔！繼續保持！";
            playWinSound();
            fireConfetti();
        } else if (score >= 50) {
            stars = "⭐";
            feedback = "不錯喔，再加油！";
        } else {
            stars = "⭐";
            feedback = "再試一次，你會更好的！";
        }

        starsContainer.textContent = stars;
        feedbackText.textContent = feedback;

        // Speak the feedback
        speakText(feedback);

        // Start BGM again
        startBGM();

        showScreen(resultScreen);
    }
});
