// static/js/tournament.js
// Gestion du tournoi en temps réel

class TournamentManager {
    constructor() {
        this.levels = [];
        this.players = [];
        this.state = {
            current_level: 0,
            time_left: 900,
            is_running: false,
            total_time: 0
        };
        this.timerInterval = null;
        
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.updateUI();
    }
    
    async loadData() {
        try {
            // Charger les niveaux
            this.levels = await apiCall('/api/levels');
            
            // Charger les joueurs
            this.players = await apiCall('/api/players');
            
            // Charger l'état
            this.state = await apiCall('/api/state');
            
            // Si pas de temps restant, initialiser avec la durée du premier niveau
            if (!this.state.time_left && this.levels.length > 0) {
                this.state.time_left = this.levels[0].duration;
            }
        } catch (error) {
            console.error('Erreur de chargement:', error);
        }
    }
    
    setupEventListeners() {
        // Bouton Start/Pause
        document.getElementById('start-btn').addEventListener('click', () => {
            this.toggleTimer();
        });
        
        // Bouton Next
        document.getElementById('next-btn').addEventListener('click', () => {
            this.nextLevel();
        });
        
        // Bouton Reset
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetTournament();
        });
        
        // Ajout de joueur
        document.getElementById('add-player-btn').addEventListener('click', () => {
            this.addPlayer();
        });
        
        // Entrée pour ajouter un joueur
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addPlayer();
            }
        });
    }
    
    toggleTimer() {
        this.state.is_running = !this.state.is_running;
        
        if (this.state.is_running) {
            this.startTimer();
            document.getElementById('start-btn').innerHTML = '<span>⏸</span> Pause';
        } else {
            this.stopTimer();
            document.getElementById('start-btn').innerHTML = '<span>▶</span> Démarrer';
        }
        
        this.saveState();
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.state.time_left > 0) {
                this.state.time_left--;
                this.state.total_time++;
                this.updateTimerDisplay();
                this.saveState();
            } else {
                this.nextLevel();
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    nextLevel() {
        if (this.state.current_level < this.levels.length - 1) {
            this.state.current_level++;
            this.state.time_left = this.levels[this.state.current_level].duration;
            this.updateUI();
            this.saveState();
        } else {
            this.stopTimer();
            this.state.is_running = false;
            showNotification('Tournoi terminé !', 'success');
        }
    }
    
    async resetTournament() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser le tournoi ?')) {
            this.stopTimer();
            
            try {
                await apiCall('/api/reset', 'POST');
                await this.loadData();
                this.updateUI();
                showNotification('Tournoi réinitialisé', 'success');
            } catch (error) {
                showNotification('Erreur lors de la réinitialisation', 'error');
            }
        }
    }
    
    updateUI() {
        this.updateTimerDisplay();
        this.updateBlindsDisplay();
        this.updateLevelsList();
        this.updatePlayersList();
    }
    
    updateTimerDisplay() {
        const currentLevel = this.levels[this.state.current_level];
        if (!currentLevel) return;
        
        // Label du niveau
        const label = currentLevel.is_pause ? 'PAUSE' : `NIVEAU ${currentLevel.level}`;
        document.getElementById('level-label').textContent = label;
        
        // Timer
        const timerDisplay = document.getElementById('timer-display');
        timerDisplay.textContent = formatTime(this.state.time_left);
        
        // Couleur selon le temps restant
        const percent = (this.state.time_left / currentLevel.duration) * 100;
        timerDisplay.classList.remove('warning', 'danger');
        if (percent <= 20) {
            timerDisplay.classList.add('danger');
        } else if (percent <= 50) {
            timerDisplay.classList.add('warning');
        }
        
        // Temps total
        document.getElementById('total-time').textContent = formatTotalTime(this.state.total_time);
    }
    
    updateBlindsDisplay() {
        const currentLevel = this.levels[this.state.current_level];
        if (!currentLevel) return;
        
        const blindsDisplay = document.getElementById('blinds-display');
        
        if (currentLevel.is_pause) {
            blindsDisplay.style.display = 'none';
        } else {
            blindsDisplay.style.display = 'grid';
            document.getElementById('sb-value').textContent = currentLevel.sb;
            document.getElementById('bb-value').textContent = currentLevel.bb;
            document.getElementById('ante-value').textContent = currentLevel.ante;
        }
    }
    
    updateLevelsList() {
        const container = document.getElementById('levels-list');
        container.innerHTML = '';
        
        this.levels.forEach((level, index) => {
            const div = document.createElement('div');
            div.className = 'level-item';
            
            if (index === this.state.current_level) {
                div.classList.add('active');
            } else if (index < this.state.current_level) {
                div.classList.add('passed');
            }
            
            if (level.is_pause) {
                div.classList.add('pause');
            }
            
            const levelName = level.is_pause ? '☕ ' + level.level : 'Niveau ' + level.level;
            const blinds = level.is_pause ? '' : `${level.sb}/${level.bb}${level.ante > 0 ? ' (' + level.ante + ')' : ''}`;
            const duration = secondsToMinutes(level.duration) + ' min';
            
            div.innerHTML = `
                <div class="level-name">${levelName}</div>
                <div class="level-blinds">${blinds}</div>
                <div class="level-duration">${duration}</div>
            `;
            
            container.appendChild(div);
        });
    }
    
    updatePlayersList() {
        const container = document.getElementById('players-list');
        container.innerHTML = '';
        
        const active = this.players.filter(p => p.status === 'active').length;
        const eliminated = this.players.filter(p => p.status === 'eliminated').length;
        
        document.getElementById('active-count').textContent = active;
        document.getElementById('eliminated-count').textContent = eliminated;
        
        this.players.forEach(player => {
            const div = document.createElement('div');
            div.className = 'player-item';
            
            if (player.status === 'eliminated') {
                div.classList.add('eliminated');
            }
            
            div.innerHTML = `
                <div class="player-info">
                    <div class="player-name ${player.status === 'eliminated' ? 'eliminated' : ''}">
                        ${player.name}
                    </div>
                    <div class="player-chips">${player.chips.toLocaleString()} jetons</div>
                </div>
                <div class="player-actions">
                    ${player.status === 'active' ? `
                        <button class="btn btn-danger btn-small" onclick="tournament.eliminatePlayer(${player.id})">
                            Éliminer
                        </button>
                    ` : ''}
                    <button class="btn btn-danger btn-small" onclick="tournament.deletePlayer(${player.id})">
                        🗑️
                    </button>
                </div>
            `;
            
            container.appendChild(div);
        });
    }
    
    async addPlayer() {
        const input = document.getElementById('player-name');
        const name = input.value.trim();
        
        if (!name) return;
        
        try {
            const player = await apiCall('/api/players/add', 'POST', { name });
            this.players.push(player);
            this.updatePlayersList();
            input.value = '';
            showNotification('Joueur ajouté', 'success');
        } catch (error) {
            showNotification('Erreur lors de l\'ajout', 'error');
        }
    }
    
    async eliminatePlayer(playerId) {
        try {
            await apiCall(`/api/players/${playerId}/eliminate`, 'PUT');
            const player = this.players.find(p => p.id === playerId);
            if (player) {
                player.status = 'eliminated';
            }
            this.updatePlayersList();
            showNotification('Joueur éliminé', 'success');
        } catch (error) {
            showNotification('Erreur', 'error');
        }
    }
    
    async deletePlayer(playerId) {
        if (confirm('Supprimer ce joueur ?')) {
            try {
                await apiCall(`/api/players/${playerId}`, 'DELETE');
                this.players = this.players.filter(p => p.id !== playerId);
                this.updatePlayersList();
                showNotification('Joueur supprimé', 'success');
            } catch (error) {
                showNotification('Erreur', 'error');
            }
        }
    }
    
    async saveState() {
        try {
            await apiCall('/api/state', 'POST', this.state);
        } catch (error) {
            console.error('Erreur de sauvegarde:', error);
        }
    }
}

// Initialisation
let tournament;
document.addEventListener('DOMContentLoaded', () => {
    tournament = new TournamentManager();
});