// プレイヤー情報の定義
const players = [];
const maxPlayers = 8;
const positions = [
    { x: 400, y: 30 },   // プレイヤー1（UTG）
    { x: 570, y: 70 },   // プレイヤー2
    { x: 670, y: 180 },  // プレイヤー3
    { x: 570, y: 290 },  // プレイヤー4
    { x: 400, y: 330 },  // プレイヤー5
    { x: 230, y: 290 },  // プレイヤー6
    { x: 130, y: 180 },  // プレイヤー7
    { x: 230, y: 70 }    // プレイヤー8
];

let actionLog = [];
let pot = 0;
let sidePots = [];
let actions = [];
let currentActionIndex = 0;
let currentBet = 0;
let lastRaise = 0;

// 初期化
function initGame() {
    // プレイヤーを生成
    for (let i = 0; i < maxPlayers; i++) {
        players.push({
            id: i + 1,
            chips: getRandomChips(100, 40000),
            bet: 0,
            inPot: false,
            folded: false,
            action: ''
        });
    }

    // アクションを生成
    generateActions();

    // テーブルを描画
    renderTable();

    // アクションを開始
    startActions();
}

// ランダムなチップ額を取得（100単位）
function getRandomChips(min, max) {
    let chips = Math.floor(Math.random() * ((max - min) / 100 + 1)) * 100 + min;
    return chips;
}

// アクションを生成
function generateActions() {
    actions = [];
    currentBet = 0;
    lastRaise = 0;

    // 最低ベット額
    let minBet = 100;

    // 最低1人、最大3人のオールインプレイヤーを作る
    let numAllInPlayers = getRandomInt(1, 3);

    // ランダムにオールインプレイヤーを選ぶ
    let allInIndices = [];
    while (allInIndices.length < numAllInPlayers) {
        let index = getRandomInt(0, players.length - 1);
        if (!allInIndices.includes(index)) {
            allInIndices.push(index);
        }
    }

    // アクションを設定
    for (let i = 0; i < players.length; i++) {
        let player = players[i];
        let action = {};

        if (player.chips <= 0) {
            action.type = 'fold';
            actions.push(action);
            continue;
        }

        if (allInIndices.includes(i)) {
            // オールインプレイヤー
            action.type = 'all-in';
            action.amount = player.chips;
        } else {
            // 他のプレイヤーのアクションを決定
            if (currentBet === 0) {
                // 誰もベットしていない場合
                action.type = 'bet';
                action.amount = minBet;
                currentBet = minBet;
                lastRaise = minBet;
            } else {
                // コール、レイズ、フォールドの中から選ぶ
                let choices = ['call', 'raise', 'fold'];
                let choice = choices[getRandomInt(0, choices.length - 1)];

                if (choice === 'call') {
                    action.type = 'call';
                    action.amount = Math.min(currentBet, player.chips);
                } else if (choice === 'raise') {
                    let minRaise = lastRaise;
                    let raiseAmount = currentBet + minRaise;
                    if (player.chips > raiseAmount) {
                        action.type = 'raise';
                        // ランダムなレイズ額（100単位）
                        let maxRaise = player.chips;
                        let raiseBy = getRandomChips(minRaise, maxRaise - currentBet);
                        action.amount = currentBet + raiseBy;
                        lastRaise = raiseBy;
                        currentBet = action.amount;
                    } else {
                        // レイズできない場合はオールイン
                        action.type = 'all-in';
                        action.amount = player.chips;
                        currentBet = action.amount;
                    }
                } else {
                    action.type = 'fold';
                }
            }
        }
        actions.push(action);
    }

    // 必ず2人以上のアクティブプレイヤーがいるように調整
    let activePlayers = actions.filter(action => action.type !== 'fold');
    if (activePlayers.length < 2) {
        // 最初のプレイヤーを強制的にコールさせる
        actions[0].type = 'call';
        actions[0].amount = Math.min(currentBet, players[0].chips);
    }
}

// テーブルを描画
function renderTable() {
    const tableDiv = document.getElementById('table');
    tableDiv.innerHTML = '';

    players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player';
        playerDiv.style.left = positions[index].x + 'px';
        playerDiv.style.top = positions[index].y + 'px';

        const chipStack = document.createElement('div');
        chipStack.className = 'chip-stack';
        chipStack.id = 'player-chips-' + player.id;
        chipStack.innerHTML = player.chips;

        const playerName = document.createElement('div');
        playerName.className = 'player-name';
        playerName.innerHTML = 'Player ' + player.id;

        const betAmount = document.createElement('div');
        betAmount.className = 'bet-amount';
        betAmount.id = 'player-bet-' + player.id;
        betAmount.innerHTML = '';

        playerDiv.appendChild(chipStack);
        playerDiv.appendChild(playerName);
        playerDiv.appendChild(betAmount);
        tableDiv.appendChild(playerDiv);
    });
}

// アクションを開始
function startActions() {
    if (currentActionIndex >= actions.length) {
        // 全てのアクションが終了
        calculatePots();
        return;
    }

    const action = actions[currentActionIndex];
    const player = players[currentActionIndex];

    setTimeout(() => {
        performAction(player, action);
        currentActionIndex++;
        startActions();
    }, 800);
}

// アクションを実行
function performAction(player, action) {
    let logMessage = `Player ${player.id} `;
    if (action.type === 'all-in') {
        let betAmount = Math.min(action.amount, player.chips);
        player.bet += betAmount;
        player.chips -= betAmount;
        player.inPot = true;
        player.action = `All-in ${betAmount}`;
        logMessage += `goes all-in with ${betAmount}`;
        if (betAmount > currentBet) {
            lastRaise = betAmount - currentBet;
            currentBet = betAmount;
        }
    } else if (action.type === 'bet') {
        let betAmount = action.amount;
        player.bet += betAmount;
        player.chips -= betAmount;
        player.inPot = true;
        player.action = `Bets ${betAmount}`;
        logMessage += `bets ${betAmount}`;
    } else if (action.type === 'call') {
        let betAmount = Math.min(action.amount, player.chips);
        player.bet += betAmount;
        player.chips -= betAmount;
        player.inPot = true;
        player.action = `Calls ${betAmount}`;
        logMessage += `calls ${betAmount}`;
    } else if (action.type === 'raise') {
        let betAmount = action.amount - player.bet;
        player.bet += betAmount;
        player.chips -= betAmount;
        player.inPot = true;
        player.action = `Raises to ${action.amount}`;
        logMessage += `raises to ${action.amount}`;
    } else if (action.type === 'fold') {
        player.folded = true;
        player.action = `Folds`;
        logMessage += `folds`;
    }

    actionLog.push(logMessage);
    updateLog();
    updatePlayerChips(player);
}

// アクションログを更新
function updateLog() {
    const logList = document.getElementById('log-list');
    logList.innerHTML = '';
    actionLog.forEach(log => {
        const li = document.createElement('li');
        li.innerHTML = log;
        logList.appendChild(li);
    });
}

// プレイヤーのチップとアクションを更新
function updatePlayerChips(player) {
    const chipStack = document.getElementById('player-chips-' + player.id);
    chipStack.innerHTML = player.chips;

    const betAmount = document.getElementById('player-bet-' + player.id);
    betAmount.innerHTML = player.action;
}

// ポットを計算
function calculatePots() {
    // 全てのプレイヤーのベット額を取得し、昇順にソート
    let bets = players
        .filter(p => p.inPot)
        .map(p => p.bet)
        .sort((a, b) => a - b);

    let uniqueBets = [...new Set(bets)];

    // サイドポットの数を1から3に制限
    uniqueBets = uniqueBets.slice(0, 3);

    let tempPot = 0;
    sidePots = [];

    for (let i = 0; i < uniqueBets.length; i++) {
        let bet = uniqueBets[i];
        let prevBet = uniqueBets[i - 1] || 0;
        let participants = players.filter(p => p.inPot && p.bet >= bet);
        let potAmount = (bet - prevBet) * participants.length;
        tempPot += potAmount;
        sidePots.push({
            amount: tempPot,
            participants: participants.map(p => p.id)
        });
    }

    // サイドポットの入力フォームを表示
    showPotInputs();
}

// サイドポットの入力フォームを表示
function showPotInputs() {
    document.getElementById('pot-calculation').style.display = 'block';
    const potInputsDiv = document.getElementById('pot-inputs');
    potInputsDiv.innerHTML = '';

    sidePots.forEach((pot, index) => {
        const div = document.createElement('div');
        div.className = 'pot-input';
        const label = document.createElement('label');
        label.innerHTML = `サイドポット ${index + 1}: `;
        const input = document.createElement('input');
        input.type = 'number';
        input.name = `pot${index + 1}`;
        input.required = true;
        input.step = '100';
        div.appendChild(label);
        div.appendChild(input);
        potInputsDiv.appendChild(div);
    });

    // フォームのイベントリスナーを設定
    document.getElementById('pot-form').addEventListener('submit', checkAnswers);
}

// ユーザーの回答をチェック
function checkAnswers(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    let correct = true;
    let userAnswers = [];
    sidePots.forEach((pot, index) => {
        let userInput = parseInt(formData.get(`pot${index + 1}`));
        userAnswers.push(userInput);
        if (userInput !== pot.amount) {
            correct = false;
        }
    });

    // 結果を表示
    showResult(correct, userAnswers);
}

// 結果を表示
function showResult(correct, userAnswers) {
    document.getElementById('pot-calculation').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    const resultMessage = document.getElementById('result-message');

    if (correct) {
        resultMessage.innerHTML = '正解です！';
    } else {
        let correctAnswers = sidePots.map((pot, index) => `サイドポット ${index + 1}: ${pot.amount} チップ`).join('<br>');
        resultMessage.innerHTML = `不正解です。正しい答えは：<br>${correctAnswers}`;
    }

    // 「次のハンドへ」ボタンのイベントリスナーを設定
    document.getElementById('next-hand').addEventListener('click', resetGame);
}

// ゲームをリセット
function resetGame() {
    // 変数のリセット
    actionLog = [];
    pot = 0;
    sidePots = [];
    actions = [];
    currentActionIndex = 0;
    currentBet = 0;
    lastRaise = 0;
    players.forEach(player => {
        player.bet = 0;
        player.inPot = false;
        player.folded = false;
        player.action = '';
        player.chips = getRandomChips(100, 40000);
    });

    // UIのリセット
    document.getElementById('result').style.display = 'none';
    document.getElementById('pot-calculation').style.display = 'none';
    updateLog();
    renderTable();

    // アクションを再開
    generateActions();
    startActions();
}

// ランダムな整数を取得
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ゲームを開始
initGame();
