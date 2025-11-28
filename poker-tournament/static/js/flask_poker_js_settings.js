// static/js/settings.js
// Gestion de la page de configuration des blindes

class SettingsManager {
    constructor() {
        this.levels = [];
        this.init();
    }
    
    async init() {
        await this.loadLevels();
        this.renderLevels();
        this.setupEventListeners();
    }
    
    async loadLevels() {
        try {
            this.levels = await apiCall('/api/levels');
        } catch (error) {
            console.error('Erreur de chargement:', error);
            showNotification('Erreur de chargement', 'error');
        }
    }
    
    setupEventListeners() {
        // Ajouter un niveau
        document.getElementById('add-level-btn').addEventListener('click', () => {
            this.addLevel(false);
        });
        
        // Ajouter une pause
        document.getElementById('add-pause-btn').addEventListener('click', () => {
            this.addLevel(true);
        });
        
        // Sauvegarder
        document.getElementById('save-levels-btn').addEventListener('click', () => {
            this.saveLevels();
        });
    }
    
    addLevel(isPause = false) {
        const newLevel = isPause ? {
            level: `Pause ${this.countPauses() + 1}`,
            sb: 0,
            bb: 0,
            ante: 0,
            duration: 300,
            is_pause: true
        } : {
            level: this.countNormalLevels() + 1,
            sb: 25,
            bb: 50,
            ante: 0,
            duration: 900,
            is_pause: false
        };
        
        this.levels.push(newLevel);
        this.renderLevels();
    }
    
    countNormalLevels() {
        return this.levels.filter(l => !l.is_pause).length;
    }
    
    countPauses() {
        return this.levels.filter(l => l.is_pause).length;
    }
    
    deleteLevel(index) {
        if (confirm('Supprimer ce niveau ?')) {
            this.levels.splice(index, 1);
            this.renderLevels();
        }
    }
    
    moveLevel(index, direction) {
        if (direction === 'up' && index > 0) {
            [this.levels[index], this.levels[index - 1]] = [this.levels[index - 1], this.levels[index]];
        } else if (direction === 'down' && index < this.levels.length - 1) {
            [this.levels[index], this.levels[index + 1]] = [this.levels[index + 1], this.levels[index]];
        }
        this.renderLevels();
    }
    
    renderLevels() {
        const container = document.getElementById('levels-editor');
        container.innerHTML = '';
        
        this.levels.forEach((level, index) => {
            const div = document.createElement('div');
            div.className = 'level-editor-item';
            
            if (level.is_pause) {
                div.classList.add('pause');
            }
            
            const levelName = level.is_pause ? level.level : `Niveau ${level.level}`;
            
            div.innerHTML = `
                <div class="level-editor-header">
                    <div class="level-editor-title">${levelName}</div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary btn-small" onclick="settings.moveLevel(${index}, 'up')" ${index === 0 ? 'disabled' : ''}>
                            ↑
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="settings.moveLevel(${index}, 'down')" ${index === this.levels.length - 1 ? 'disabled' : ''}>
                            ↓
                        </button>
                        <button class="btn btn-danger btn-small" onclick="settings.deleteLevel(${index})">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="level-editor-fields">
                    ${!level.is_pause ? `
                        <div class="field-group">
                            <label class="field-label">Numéro</label>
                            <input type="number" class="field-input" value="${level.level}" 
                                   onchange="settings.updateLevel(${index}, 'level', this.value)">
                        </div>
                        <div class="field-group">
                            <label class="field-label">Small Blind</label>
                            <input type="number" class="field-input" value="${level.sb}" 
                                   onchange="settings.updateLevel(${index}, 'sb', this.value)">
                        </div>
                        <div class="field-group">
                            <label class="field-label">Big Blind</label>
                            <input type="number" class="field-input" value="${level.bb}" 
                                   onchange="settings.updateLevel(${index}, 'bb', this.value)">
                        </div>
                        <div class="field-group">
                            <label class="field-label">Ante</label>
                            <input type="number" class="field-input" value="${level.ante}" 
                                   onchange="settings.updateLevel(${index}, 'ante', this.value)">
                        </div>
                    ` : `
                        <div class="field-group">
                            <label class="field-label">Nom de la pause</label>
                            <input type="text" class="field-input" value="${level.level}" 
                                   onchange="settings.updateLevel(${index}, 'level', this.value)">
                        </div>
                    `}
                    <div class="field-group">
                        <label class="field-label">Durée (minutes)</label>
                        <input type="number" class="field-input" value="${secondsToMinutes(level.duration)}" 
                               onchange="settings.updateLevel(${index}, 'duration', minutesToSeconds(this.value))">
                    </div>
                </div>
            `;
            
            container.appendChild(div);
        });
    }
    
    updateLevel(index, field, value) {
        if (field === 'duration') {
            this.levels[index][field] = parseInt(value);
        } else if (field === 'level' && !this.levels[index].is_pause) {
            this.levels[index][field] = parseInt(value);
        } else if (field === 'level') {
            this.levels[index][field] = value;
        } else {
            this.levels[index][field] = parseInt(value);
        }
    }
    
    async saveLevels() {
        try {
            await apiCall('/api/levels', 'POST', { levels: this.levels });
            showNotification('Configuration sauvegardée !', 'success');
        } catch (error) {
            showNotification('Erreur lors de la sauvegarde', 'error');
            console.error('Erreur:', error);
        }
    }
}

// Initialisation
let settings;
document.addEventListener('DOMContentLoaded', () => {
    settings = new SettingsManager();
});