"""
Application Flask - Gestionnaire de Tournoi de Poker NSPC 2025
Fichier: app.py
"""

from flask import Flask, render_template, request, jsonify, redirect, url_for
import json
import os
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'votre-cle-secrete-ici'

# Fichier de sauvegarde des données
DATA_FILE = 'tournament_data.json'

# Données par défaut
DEFAULT_DATA = {
    'levels': [
        {'level': 1, 'sb': 25, 'bb': 50, 'ante': 0, 'duration': 900, 'is_pause': False},
        {'level': 2, 'sb': 50, 'bb': 100, 'ante': 0, 'duration': 900, 'is_pause': False},
        {'level': 3, 'sb': 75, 'bb': 150, 'ante': 25, 'duration': 900, 'is_pause': False},
        {'level': 4, 'sb': 100, 'bb': 200, 'ante': 25, 'duration': 900, 'is_pause': False},
        {'level': 'Pause 1', 'sb': 0, 'bb': 0, 'ante': 0, 'duration': 300, 'is_pause': True},
        {'level': 5, 'sb': 150, 'bb': 300, 'ante': 50, 'duration': 900, 'is_pause': False},
        {'level': 6, 'sb': 200, 'bb': 400, 'ante': 50, 'duration': 900, 'is_pause': False},
        {'level': 7, 'sb': 300, 'bb': 600, 'ante': 100, 'duration': 900, 'is_pause': False},
        {'level': 8, 'sb': 400, 'bb': 800, 'ante': 100, 'duration': 900, 'is_pause': False},
        {'level': 'Pause 2', 'sb': 0, 'bb': 0, 'ante': 0, 'duration': 300, 'is_pause': True},
    ],
    'players': [],
    'tournament_state': {
        'current_level': 0,
        'time_left': 900,
        'is_running': False,
        'total_time': 0
    }
}

def load_data():
    """Charge les données depuis le fichier JSON"""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return DEFAULT_DATA.copy()

def save_data(data):
    """Sauvegarde les données dans le fichier JSON"""
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

@app.route('/')
def index():
    """Page principale - Affichage du tournoi"""
    data = load_data()
    return render_template('index.html', 
                         levels=data['levels'],
                         players=data['players'],
                         state=data['tournament_state'])

@app.route('/settings')
def settings():
    """Page de configuration des blindes"""
    data = load_data()
    return render_template('settings.html', levels=data['levels'])

@app.route('/api/levels', methods=['GET'])
def get_levels():
    """API - Récupérer les niveaux"""
    data = load_data()
    return jsonify(data['levels'])

@app.route('/api/levels', methods=['POST'])
def update_levels():
    """API - Mettre à jour les niveaux"""
    levels = request.json.get('levels', [])
    data = load_data()
    data['levels'] = levels
    save_data(data)
    return jsonify({'success': True})

@app.route('/api/levels/add', methods=['POST'])
def add_level():
    """API - Ajouter un niveau"""
    new_level = request.json
    data = load_data()
    data['levels'].append(new_level)
    save_data(data)
    return jsonify({'success': True})

@app.route('/api/levels/delete/<int:index>', methods=['DELETE'])
def delete_level(index):
    """API - Supprimer un niveau"""
    data = load_data()
    if 0 <= index < len(data['levels']):
        data['levels'].pop(index)
        save_data(data)
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'Index invalide'}), 400

@app.route('/api/players', methods=['GET'])
def get_players():
    """API - Récupérer les joueurs"""
    data = load_data()
    return jsonify(data['players'])

@app.route('/api/players/add', methods=['POST'])
def add_player():
    """API - Ajouter un joueur"""
    player_data = request.json
    data = load_data()
    player = {
        'id': len(data['players']) + 1,
        'name': player_data.get('name', ''),
        'chips': player_data.get('chips', 10000),
        'status': 'active'
    }
    data['players'].append(player)
    save_data(data)
    return jsonify(player)

@app.route('/api/players/<int:player_id>/eliminate', methods=['PUT'])
def eliminate_player(player_id):
    """API - Éliminer un joueur"""
    data = load_data()
    for player in data['players']:
        if player['id'] == player_id:
            player['status'] = 'eliminated'
            save_data(data)
            return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'Joueur non trouvé'}), 404

@app.route('/api/players/<int:player_id>', methods=['DELETE'])
def delete_player(player_id):
    """API - Supprimer un joueur"""
    data = load_data()
    data['players'] = [p for p in data['players'] if p['id'] != player_id]
    save_data(data)
    return jsonify({'success': True})

@app.route('/api/state', methods=['GET'])
def get_state():
    """API - Récupérer l'état du tournoi"""
    data = load_data()
    return jsonify(data['tournament_state'])

@app.route('/api/state', methods=['POST'])
def update_state():
    """API - Mettre à jour l'état du tournoi"""
    state = request.json
    data = load_data()
    data['tournament_state'] = state
    save_data(data)
    return jsonify({'success': True})

@app.route('/api/reset', methods=['POST'])
def reset_tournament():
    """API - Réinitialiser le tournoi"""
    data = load_data()
    data['tournament_state'] = {
        'current_level': 0,
        'time_left': data['levels'][0]['duration'] if data['levels'] else 900,
        'is_running': False,
        'total_time': 0
    }
    # Réactiver tous les joueurs
    for player in data['players']:
        player['status'] = 'active'
    save_data(data)
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)