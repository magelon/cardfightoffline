class Card {
    constructor(name, image, attack, health, type = 'monster', effect = null) {
        this.name = name;
        this.image = image;
        this.attack = attack;
        this.health = health;
        this.type = type;
        this.effect = effect;
    }

    createCardElement() {
        const card = document.createElement('div');
        card.className = 'card';
        
        if (this.type === 'monster') {
            card.innerHTML = `
                <img src="${this.image}" alt="${this.name}">
                <div class="name">${this.name}</div>
                <div class="stats">
                    <span>ATK: ${this.attack}</span>
                    <span>HP: ${this.health}</span>
                </div>
            `;
        } else if (this.type === 'support') {
            card.classList.add('support-card');
            card.innerHTML = `
                <img src="${this.image}" alt="${this.name}">
                <div class="name">${this.name}</div>
                <div class="effect-text">
                    ${this.getEffectText()}
                </div>
            `;
        }
        
        return card;
    }

    getEffectText() {
        switch (this.effect) {
            case 'heal':
                return 'Heal +2 HP';
            case 'boost':
                return 'Boost +1 ATK';
            case 'draw':
                return 'Draw a card';
            default:
                return '';
        }
    }
}

class Game {
    constructor() {
        this.deck = this.createDeck();
        this.playerHand = [];
        this.computerHand = [];
        this.playerField = [];
        this.computerField = [];
        this.monstersDefeatedByPlayer = 0;
        this.monstersDefeatedByComputer = 0;
        this.isPlayerTurn = true;

        // Add new turn state properties
        this.hasPlayedMonster = false;
        this.hasAttacked = false;
        this.needsNewMonster = false;
        
        this.logContent = document.querySelector('.log-content');
        
        this.initializeGame();
        this.setupEventListeners();
    }

    createDeck() {
        // Create multiple copies of each card to make a larger deck
        const cardTemplates = [
            new Card('Dragon', 'images/dragon.png', 7, 6),
            new Card('Knight', 'images/knight.png', 5, 5),
            new Card('Wizard', 'images/wizard.png', 4, 4),
            new Card('Goblin', 'images/goblin.png', 3, 2),
            new Card('Healer', 'images/healer.png', 2, 3, 'support', 'heal'),
            new Card('Warrior', 'images/warrior.png', 6, 4),
            new Card('Archer', 'images/archer.png', 4, 3),
            new Card('Shield Bearer', 'images/shield.png', 2, 8),
            new Card('Mage', 'images/mage.png', 5, 3, 'support', 'boost'),
            new Card('Scout', 'images/scout.png', 3, 2, 'support', 'draw'),
        ];

        // Create 3 copies of each card
        let deck = [];
        for (let i = 0; i < 3; i++) {
            cardTemplates.forEach(card => {
                deck.push(new Card(card.name, card.image, card.attack, card.health, card.type, card.effect));
            });
        }
        return deck;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    initializeGame() {
        this.shuffle(this.deck);
        console.log('Initial deck size:', this.deck.length);
        
        // Draw initial hands
        for (let i = 0; i < 5; i++) {
            const playerCard = this.deck.pop();
            const computerCard = this.deck.pop();
            this.playerHand.push(playerCard);
            this.computerHand.push(computerCard);
            console.log('Initial draw:', playerCard.name);
        }
        
        this.updateGameState();
        
        // Start first turn directly
        this.startPlayerTurn();
    }

    setupEventListeners() {
        document.querySelector('.player-hand').addEventListener('click', (e) => {
            if (!this.isPlayerTurn) return;
            const cardElement = e.target.closest('.card');
            if (cardElement) {
                const cardIndex = Array.from(cardElement.parentNode.children).indexOf(cardElement);
                this.playCard(cardIndex);
            }
        });

        document.getElementById('end-turn').addEventListener('click', () => {
            if (!this.isPlayerTurn) return;
            
            // Check if player has a monster on field
            if (this.playerField.length === 0) {
                alert('You must summon a monster before ending your turn!');
                return;
            }
            
            this.isPlayerTurn = false;
            this.computerTurn();
        });
    }

    startPlayerTurn() {
        this.hasAttacked = false;
        if (!this.needsNewMonster) {
            this.hasPlayedMonster = false;
        }
        
        // Draw a card
        if (this.deck.length === 0) {
            this.reshuffleDeck();
        }
        if (this.deck.length > 0) {
            const drawnCard = this.deck.pop();
            this.playerHand.push(drawnCard);
            this.addLogEntry(`You drew ${drawnCard.name}!`, 'player');
            this.updateGameState();
        }
    }

    playCard(index) {
        if (this.playerHand[index]) {
            const card = this.playerHand[index];
            if (card.type === 'monster') {
                if ((!this.hasPlayedMonster && this.playerField.length === 0) || this.needsNewMonster) {
                    this.playerField.push(card);
                    this.playerHand.splice(index, 1);
                    this.hasPlayedMonster = true;
                    this.needsNewMonster = false;
                    this.addLogEntry(`You summoned ${card.name}!`, 'player');
                } else if (this.playerField.length > 0) {
                    alert('You can only have one monster on the field!');
                    return;
                } else {
                    alert('You can only play one monster per turn!');
                    return;
                }
            } else if (card.type === 'support') {
                this.addLogEntry(`You played ${card.name}!`, 'player');
                this.applySupportCard(card, 'player');
                this.playerHand.splice(index, 1);
            }
            this.updateGameState();
        }
    }

    applySupportCard(card, player) {
        const field = player === 'player' ? this.playerField : this.computerField;
        const playerText = player === 'player' ? 'Your' : 'Computer\'s';
        
        switch (card.effect) {
            case 'heal':
                field.forEach(c => {
                    const oldHealth = c.health;
                    c.health += 2;
                    this.addLogEntry(`${playerText} ${c.name} healed! (${oldHealth} → ${c.health} HP)`, player);
                });
                break;
            case 'boost':
                field.forEach(c => {
                    const oldAttack = c.attack;
                    c.attack += 1;
                    this.addLogEntry(`${playerText} ${c.name} attack boosted! (${oldAttack} → ${c.attack} ATK)`, player);
                });
                break;
            case 'draw':
                if (this.deck.length === 0) {
                    this.addLogEntry(`${playerText} deck is empty! Reshuffling...`, player);
                    this.reshuffleDeck();
                }
                if (this.deck.length > 0) {
                    const drawnCard = this.deck.pop();
                    if (player === 'player') {
                        this.playerHand.push(drawnCard);
                        this.addLogEntry(`You drew ${drawnCard.name}!`, 'player');
                    } else {
                        this.computerHand.push(drawnCard);
                        this.addLogEntry('Computer drew an extra card', 'computer');
                    }
                }
                break;
        }
    }

    computerTurn() {
        // Check if deck is empty and draw card
        if (this.deck.length === 0) {
            this.addLogEntry('Computer\'s deck is empty! Reshuffling...', 'computer');
            this.reshuffleDeck();
        }

        if (this.deck.length > 0) {
            const drawnCard = this.deck.pop();
            this.computerHand.push(drawnCard);
            this.addLogEntry('Computer drew a card', 'computer');
            this.updateGameState();
        }

        // Play monster if field is empty
        if (this.computerField.length === 0) {
            const monsterCard = this.computerHand.find(card => card.type === 'monster');
            if (monsterCard) {
                const index = this.computerHand.indexOf(monsterCard);
                this.computerField.push(monsterCard);
                this.computerHand.splice(index, 1);
                this.addLogEntry(`Computer summoned ${monsterCard.name}!`, 'computer');
            }
        }

        // Play support cards
        const supportCards = this.computerHand.filter(card => card.type === 'support');
        supportCards.forEach(card => {
            const index = this.computerHand.indexOf(card);
            this.addLogEntry(`Computer played ${card.name}!`, 'computer');
            this.applySupportCard(card, 'computer');
            this.computerHand.splice(index, 1);
        });

        // Attack phase
        this.computerAttack();
        
        this.isPlayerTurn = true;
        this.updateGameState();
        this.startPlayerTurn();
    }

    computerAttack() {
        if (this.computerField.length > 0 && this.playerField.length > 0) {
            const attacker = this.computerField[0];
            const defender = this.playerField[0];
            
            this.addLogEntry(`Computer's ${attacker.name} attacks your ${defender.name}!`, 'computer');
            
            const initialDefenderHealth = defender.health;
            const initialAttackerHealth = attacker.health;
            
            defender.health -= attacker.attack;
            attacker.health -= defender.attack;
            
            this.addLogEntry(`Your ${defender.name} takes ${attacker.attack} damage! (${initialDefenderHealth} → ${defender.health} HP)`, 'battle');
            this.addLogEntry(`Computer's ${attacker.name} takes ${defender.attack} damage! (${initialAttackerHealth} → ${attacker.health} HP)`, 'battle');
            
            if (defender.health <= 0) {
                this.playerField = [];
                this.monstersDefeatedByComputer++;
                this.addLogEntry(`Your ${defender.name} was defeated!`, 'battle');
                this.needsNewMonster = true;
                this.hasPlayedMonster = false;
            }
            if (attacker.health <= 0) {
                this.computerField = [];
                this.monstersDefeatedByPlayer++;
                this.addLogEntry(`Computer's ${attacker.name} was defeated!`, 'battle');
            }
            
            this.checkWinCondition();
        }
    }

    playerAttack(index) {
        if (this.hasAttacked) return;
        
        const attacker = this.playerField[0];
        const defender = this.computerField[0];
        
        if (attacker && defender) {
            this.addLogEntry(`Your ${attacker.name} attacks Computer's ${defender.name}!`, 'player');
            
            const initialDefenderHealth = defender.health;
            const initialAttackerHealth = attacker.health;
            
            defender.health -= attacker.attack;
            attacker.health -= defender.attack;
            
            this.addLogEntry(`Computer's ${defender.name} takes ${attacker.attack} damage! (${initialDefenderHealth} → ${defender.health} HP)`, 'battle');
            this.addLogEntry(`Your ${attacker.name} takes ${defender.attack} damage! (${initialAttackerHealth} → ${attacker.health} HP)`, 'battle');
            
            if (defender.health <= 0) {
                this.computerField = [];
                this.monstersDefeatedByPlayer++;
                this.addLogEntry(`Computer's ${defender.name} was defeated!`, 'battle');
            }
            if (attacker.health <= 0) {
                this.playerField = [];
                this.monstersDefeatedByComputer++;
                this.addLogEntry(`Your ${attacker.name} was defeated!`, 'battle');
                this.needsNewMonster = true;
                this.hasPlayedMonster = false;
            }
            
            this.hasAttacked = true;
            this.updateGameState();
            this.checkWinCondition();
        }
    }

    updateGameState() {
        console.log('Updating game state...'); // Debug log
        console.log('Player hand size:', this.playerHand.length); // Debug log
        console.log('Computer hand size:', this.computerHand.length); // Debug log

        // Clear and update player hand display
        const playerHandElement = document.querySelector('.player-hand');
        playerHandElement.innerHTML = '';
        this.playerHand.forEach((card, index) => {
            const cardElement = card.createCardElement();
            cardElement.setAttribute('data-index', index); // Add index for debugging
            playerHandElement.appendChild(cardElement);
        });

        // Clear and update computer hand display (face down)
        const computerHandElement = document.querySelector('.computer-hand');
        computerHandElement.innerHTML = '';
        this.computerHand.forEach((_, index) => {
            const cardBack = document.createElement('div');
            cardBack.className = 'card card-back';
            cardBack.setAttribute('data-index', index); // Add index for debugging
            computerHandElement.appendChild(cardBack);
        });

        // Update fields
        const playerFieldElement = document.querySelector('.player-field');
        const computerFieldElement = document.querySelector('.computer-field');
        
        // Clear field messages first
        playerFieldElement.innerHTML = '<div class="field-message">' + 
            (this.needsNewMonster ? 'Place a new monster!' : 'Your Monster (Click to Attack)') + 
            '</div>';
        computerFieldElement.innerHTML = '<div class="field-message">Computer\'s Monster</div>';
        
        // Add monster cards if they exist
        if (this.playerField.length > 0) {
            playerFieldElement.appendChild(this.playerField[0].createCardElement());
        }
        
        if (this.computerField.length > 0) {
            computerFieldElement.appendChild(this.computerField[0].createCardElement());
        }

        // Update defeat counters
        document.getElementById('player-defeated').textContent = this.monstersDefeatedByPlayer;
        document.getElementById('computer-defeated').textContent = this.monstersDefeatedByComputer;

        // Update end turn button state
        const endTurnButton = document.getElementById('end-turn');
        if (this.isPlayerTurn && this.playerField.length === 0) {
            endTurnButton.classList.add('disabled');
            endTurnButton.style.opacity = '0.5';
            endTurnButton.style.cursor = 'not-allowed';
        } else {
            endTurnButton.classList.remove('disabled');
            endTurnButton.style.opacity = '1';
            endTurnButton.style.cursor = 'pointer';
        }
    }

    checkWinCondition() {
        if (this.monstersDefeatedByComputer >= 3) {
            alert('Computer wins! They defeated 3 of your monsters!');
            this.resetGame();
        } else if (this.monstersDefeatedByPlayer >= 3) {
            alert('You win! You defeated 3 computer monsters!');
            this.resetGame();
        }
    }

    resetGame() {
        this.deck = this.createDeck();
        this.playerHand = [];
        this.computerHand = [];
        this.playerField = [];
        this.computerField = [];
        this.monstersDefeatedByPlayer = 0;
        this.monstersDefeatedByComputer = 0;
        this.hasPlayedMonster = false;
        this.hasAttacked = false;
        this.isPlayerTurn = true;
        this.needsNewMonster = false;
        this.initializeGame();
    }

    // Add new method to reshuffle the deck
    reshuffleDeck() {
        this.deck = this.createDeck();
        this.shuffle(this.deck);
        console.log('Deck reshuffled. New size:', this.deck.length);
    }

    addLogEntry(message, type = 'normal') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = message;
        this.logContent.appendChild(entry);
        this.logContent.scrollTop = this.logContent.scrollHeight;
    }
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new Game();
}); 