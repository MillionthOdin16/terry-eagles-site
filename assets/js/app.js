/**
 * Terry's Eagles HQ - Main Application
 * The mind-blowing NFL dashboard for Eagles fans!
 */

class EaglesHQ {
    constructor() {
        this.currentSection = 'dashboard';
        this.refreshInterval = null;
        this.refreshCountdown = 30;
        this.countdownInterval = null;
        this.theme = localStorage.getItem('theme') || 'dark';
        this.eaglesData = null;
        this.scoreboardData = [];
        this.rosterData = [];
        this.newsData = [];
        this.scheduleData = [];
        
        this.init();
    }
    
    async init() {
        this.showLoading(true);
        this.applyTheme();
        this.bindEvents();
        await this.loadAllData();
        this.showLoading(false);
        this.startAutoRefresh();
        this.startCountdown();
    }
    
    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchSection(e.target.dataset.section));
        });
        
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        
        // Refresh scores
        document.getElementById('refresh-scores').addEventListener('click', () => this.refreshScoreboard());
        
        // Roster filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterRoster(e.target.dataset.filter));
        });
        
        // Standings tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchStandingsTab(e.target.dataset.tab));
        });
        
        // Modal close
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('player-modal').addEventListener('click', (e) => {
            if (e.target.id === 'player-modal') this.closeModal();
        });
        
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }
    
    async loadAllData() {
        const promises = [
            this.loadEaglesData(),
            this.loadScoreboard(),
            this.loadRoster(),
            this.loadNews(),
            this.loadSchedule()
        ];
        
        await Promise.all(promises);
        this.updateLastUpdated();
    }
    
    async loadEaglesData() {
        try {
            const team = await NFL_API.getEaglesTeam();
            const stats = await NFL_API.getEaglesStats();
            this.eaglesData = { team, stats };
            
            this.renderEaglesStatus(team, stats);
        } catch (error) {
            console.error('Error loading Eagles data:', error);
            this.showToast('Error loading Eagles data', 'error');
        }
    }
    
    renderEaglesStatus(team, stats) {
        if (!team) return;
        
        // Record
        const record = team.record?.items?.find(r => r.type === 'total');
        const recordText = record?.summary || '--';
        document.getElementById('eagles-record').textContent = recordText;
        
        // Standing
        const standing = team.standingSummary || '--';
        document.getElementById('eagles-standing').textContent = standing;
        
        // PPG
        const ppg = stats?.teamStats?.find(s => s.name === 'pointsPerGame');
        document.getElementById('eagles-ppg').textContent = ppg?.value || '--';
        
        // Next game countdown
        this.updateCountdown();
        
        // Quick stats
        if (stats?.categories) {
            stats.categories.forEach(cat => {
                if (cat.name === 'offense') {
                    const rank = cat.stats?.find(s => s.name === 'rank');
                    document.getElementById('offensive-rank').textContent = `#${rank?.value || '--'}`;
                }
                if (cat.name === 'defense') {
                    const rank = cat.stats?.find(s => s.name === 'rank');
                    document.getElementById('defensive-rank').textContent = `#${rank?.value || '--'}`;
                }
                if (cat.name === 'passing') {
                    const yards = cat.stats?.find(s => s.name === 'netYardsPerGame');
                    document.getElementById('passing-yards').textContent = yards?.value ? `${yards.value} yds` : '--';
                }
                if (cat.name === 'rushing') {
                    const yards = cat.stats?.find(s => s.name === 'yardsPerGame');
                    document.getElementById('rushing-yards').textContent = yards?.value ? `${yards.value} yds` : '--';
                }
            });
        }
    }
    
    async loadScoreboard() {
        try {
            this.scoreboardData = await NFL_API.getScoreboard();
            this.renderScoreboard();
        } catch (error) {
            console.error('Error loading scoreboard:', error);
        }
    }
    
    renderScoreboard() {
        const container = document.getElementById('live-games');
        const upcomingContainer = document.getElementById('upcoming-games');
        
        if (!this.scoreboardData.length) {
            container.innerHTML = '<div class="glass-card" style="padding: 2rem; text-align: center;">No live games at the moment</div>';
            return;
        }
        
        // Render live games
        container.innerHTML = this.scoreboardData.map(event => {
            const competition = event.competitions?.[0];
            if (!competition) return '';
            
            const status = competition.status?.type?.name || '';
            const period = competition.status?.period || '';
            const clock = competition.status?.clock || '';
            
            const competitors = competition.competitors || [];
            const homeTeam = competitors.find(c => c.homeAway === 'home');
            const awayTeam = competitors.find(c => c.homeAway === 'away');
            
            const isLive = ['IN', 'LIVE'].includes(status);
            const statusText = status === 'STATUS_FINAL' ? 'FINAL' : 
                              status === 'IN' ? `Q${period} ${clock}` :
                              status === 'LIVE' ? `Q${period} ${clock}` : status;
            
            return `
                <div class="game-card glass-card">
                    <div class="game-header">
                        <span class="game-status ${isLive ? 'live' : 'final'}">${statusText}</span>
                        <span style="color: var(--text-muted); font-size: 0.8rem;">${event.league?.name || 'NFL'}</span>
                    </div>
                    <div class="game-teams">
                        <div class="team">
                            <img class="team-logo" src="${awayTeam?.team?.logo || ''}" alt="${awayTeam?.team?.shortDisplayName || 'Away'}">
                            <div class="team-name">${awayTeam?.team?.abbreviation || ''}</div>
                            <div class="team-score">${awayTeam?.score?.value || '0'}</div>
                        </div>
                        <div class="game-quarter">${awayTeam?.score?.value !== undefined ? 'vs' : ''}</div>
                        <div class="team">
                            <img class="team-logo" src="${homeTeam?.team?.logo || ''}" alt="${homeTeam?.team?.shortDisplayName || 'Home'}">
                            <div class="team-name">${homeTeam?.team?.abbreviation || ''}</div>
                            <div class="team-score">${homeTeam?.score?.value || '0'}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Render upcoming (placeholder)
        upcomingContainer.innerHTML = `
            <div class="upcoming-game">
                <div class="upcoming-date">
                    <span class="day">18</span>
                    <span class="month">Jan</span>
                </div>
                <div class="upcoming-teams">
                    <img src="https://a.espncdn.com/i/teamlogos/nfl/500/phi.png" alt="PHI">
                    <span>Eagles</span>
                    <span>vs</span>
                    <img src="https://a.espncdn.com/i/teamlogos/nfl/500/lar.png" alt="LAR">
                    <span>Rams</span>
                </div>
                <span class="upcoming-time">8:00 PM ET</span>
            </div>
        `;
    }
    
    async loadRoster() {
        try {
            this.rosterData = await NFL_API.getEaglesRoster();
            this.renderRoster();
            this.renderTopPlayers();
        } catch (error) {
            console.error('Error loading roster:', error);
        }
    }
    
    renderRoster(filter = 'all') {
        const container = document.getElementById('roster-grid');
        
        let roster = this.rosterData;
        if (filter !== 'all') {
            roster = this.rosterData.filter(p => 
                p.position?.toLowerCase() === filter ||
                (filter === 'offense' && ['QB', 'RB', 'WR', 'TE', 'OL'].includes(p.position)) ||
                (filter === 'defense' && ['DL', 'LB', 'CB', 'S'].includes(p.position)) ||
                (filter === 'special' && ['K', 'P', 'LS'].includes(p.position))
            );
        }
        
        container.innerHTML = roster.map(player => `
            <div class="roster-player glass-card" onclick="app.showPlayerModal('${player.id}')">
                <img src="${player.headshot?.href || 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png'}" 
                     alt="${player.fullName || player.displayName}"
                     onerror="this.src='https://a.espncdn.com/i/teamlogos/nfl/500/phi.png'">
                <h4>${player.fullName || player.displayName}</h4>
                <span class="jersey">#${player.jersey || '00'}</span>
                <div class="position">${player.position || ''}</div>
            </div>
        `).join('');
    }
    
    renderTopPlayers() {
        const container = document.getElementById('top-players');
        
        // Get top performers (first 5 from roster)
        const topPlayers = this.rosterData.slice(0, 8);
        
        container.innerHTML = topPlayers.map(player => `
            <div class="player-card" onclick="app.showPlayerModal('${player.id}')">
                <img src="${player.headshot?.href || 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png'}" 
                     alt="${player.fullName || player.displayName}"
                     onerror="this.src='https://a.espncdn.com/i/teamlogos/nfl/500/phi.png'">
                <h4>${player.fullName || player.displayName}</h4>
                <div class="position">${player.position || ''}</div>
                <div class="stat-highlight">${player.position === 'QB' ? '2,450 yds' : 
                    player.position === 'RB' ? '1,200 yds' : 
                    player.position === 'WR' ? '1,100 yds' : 
                    player.position === 'DE' ? '12 sacks' : 
                    player.position === 'CB' ? '5 ints' : 'Stats'}</div>
            </div>
        `).join('');
    }
    
    showPlayerModal(playerId) {
        const player = this.rosterData.find(p => p.id === playerId);
        if (!player) return;
        
        const modal = document.getElementById('player-modal');
        const body = document.getElementById('player-modal-body');
        
        body.innerHTML = `
            <img src="${player.headshot?.href || 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png'}" 
                 alt="${player.fullName || player.displayName}"
                 onerror="this.src='https://a.espncdn.com/i/teamlogos/nfl/500/phi.png'">
            <h2>${player.fullName || player.displayName}</h2>
            <div class="modal-position">${player.position || ''} | #${player.jersey || '00'}</div>
            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                <p>Height: ${player.displayHeight || '--'}</p>
                <p>Weight: ${player.displayWeight || '--'}</p>
                <p>Age: ${player.age || '--'}</p>
                <p>College: ${player.college?.name || '--'}</p>
            </div>
        `;
        
        modal.classList.add('active');
    }
    
    closeModal() {
        document.getElementById('player-modal').classList.remove('active');
    }
    
    filterRoster(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderRoster(filter);
    }
    
    async loadNews() {
        try {
            this.newsData = await NFL_API.getEaglesNews();
            this.renderNews();
            this.renderNewsTicker();
        } catch (error) {
            console.error('Error loading news:', error);
        }
    }
    
    renderNews() {
        const container = document.getElementById('news-grid');
        
        if (!this.newsData.length) {
            container.innerHTML = '<div class="glass-card" style="padding: 2rem; text-align: center; grid-column: 1/-1;">No news available</div>';
            return;
        }
        
        container.innerHTML = this.newsData.slice(0, 9).map(article => `
            <div class="news-card glass-card">
                <img class="news-image" src="${article.images?.[0]?.url || 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png'}" 
                     alt="${article.headline}"
                     onerror="this.style.background='var(--eagles-charcoal)'">
                <div class="news-content">
                    <h3>${article.headline || 'No headline'}</h3>
                    <p>${article.description || 'Click to read more...'}</p>
                    <div class="news-meta">
                        <span class="news-source">${article.source || 'ESPN'}</span>
                        <span>${this.formatDate(article.published)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    renderNewsTicker() {
        const container = document.getElementById('news-ticker');
        
        if (!this.newsData.length) {
            container.innerHTML = '<div class="ticker-item">No recent news</div>';
            return;
        }
        
        container.innerHTML = this.newsData.slice(0, 5).map(article => `
            <div class="ticker-item">
                ${article.headline || 'Eagles news update'}
            </div>
        `).join('');
    }
    
    async loadSchedule() {
        try {
            this.scheduleData = await NFL_API.getSchedule();
            this.renderSchedule();
        } catch (error) {
            console.error('Error loading schedule:', error);
        }
    }
    
    renderSchedule() {
        const container = document.getElementById('schedule-timeline');
        
        if (!this.scheduleData.length) {
            container.innerHTML = '<div class="glass-card" style="padding: 2rem; text-align: center;">Schedule coming soon</div>';
            return;
        }
        
        container.innerHTML = this.scheduleData.map(game => `
            <div class="schedule-game ${game.isPast ? 'past' : ''} ${game.result === 'W' ? 'win' : ''} ${game.result === 'L' ? 'loss' : ''}">
                <div class="schedule-date">${this.formatDate(game.date)}</div>
                <div class="schedule-matchup">
                    ${!game.isHome ? `<img src="${game.opponent.logo}" alt="${game.opponent.abbrev}">` : ''}
                    <span>${game.isHome ? 'vs' : '@'}</span>
                    ${game.isHome ? `<img src="${game.opponent.logo}" alt="${game.opponent.abbrev}">` : ''}
                    <span>${game.opponent.name}</span>
                </div>
                ${game.isPast ? `
                    <div class="schedule-result ${game.result === 'W' ? 'win' : 'loss'}">
                        ${game.result} ${game.score}
                    </div>
                ` : `
                    <div class="schedule-result" style="color: var(--text-muted);">
                        ${game.time || 'TBD'}
                    </div>
                `}
            </div>
        `).join('');
    }
    
    updateCountdown() {
        // Set next game date (placeholder for demo)
        const nextGameDate = new Date();
        nextGameDate.setDate(nextGameDate.getDate() + 5);
        nextGameDate.setHours(20, 0, 0, 0);
        
        const update = () => {
            const now = new Date();
            const diff = nextGameDate - now;
            
            if (diff <= 0) {
                document.getElementById('days').textContent = '0';
                document.getElementById('hours').textContent = '0';
                document.getElementById('minutes').textContent = '0';
                document.getElementById('seconds').textContent = '0';
                document.getElementById('next-game-info').textContent = 'Game Day! 🏈';
                return;
            }
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            document.getElementById('days').textContent = days.toString().padStart(2, '0');
            document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
            document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
            document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
            document.getElementById('next-game-info').textContent = 'vs Rams | Jan 18, 8:00 PM ET';
        };
        
        update();
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        this.countdownInterval = setInterval(update, 1000);
    }
    
    switchSection(section) {
        this.currentSection = section;
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === section);
        });
        
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.toggle('active', sec.id === section);
        });
    }
    
    switchStandingsTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        this.renderStandings(tab);
    }
    
    renderStandings(tab) {
        const container = document.getElementById('standings-container');
        
        // Mock standings data
        const divisions = {
            'nfc-east': [
                { name: 'Eagles', abbrev: 'PHI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png', wins: 11, losses: 5, ties: 0, pct: '.688', seed: 2 },
                { name: 'Cowboys', abbrev: 'DAL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png', wins: 7, losses: 9, ties: 1, pct: '.441', seed: null },
                { name: 'Commanders', abbrev: 'WSH', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png', wins: 8, losses: 8, ties: 0, pct: '.500', seed: null },
                { name: 'Giants', abbrev: 'NYG', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png', wins: 3, losses: 13, ties: 0, pct: '.188', seed: null },
            ],
            'nfc': [
                { name: 'Lions', abbrev: 'DET', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png', wins: 14, losses: 2, ties: 0, pct: '.875', seed: 1 },
                { name: 'Eagles', abbrev: 'PHI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png', wins: 11, losses: 5, ties: 0, pct: '.688', seed: 2 },
                { name: 'Bears', abbrev: 'CHI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png', wins: 11, losses: 5, ties: 0, pct: '.688', seed: 3 },
                { name: 'Rams', abbrev: 'LAR', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png', wins: 10, losses: 6, ties: 0, pct: '.625', seed: 4 },
                { name: 'Packers', abbrev: 'GB', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png', wins: 11, losses: 5, ties: 0, pct: '.688', seed: 5 },
                { name: 'Buccaneers', abbrev: 'TB', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png', wins: 10, losses: 6, ties: 0, pct: '.625', seed: 6 },
            ],
            'afc': [
                { name: 'Chiefs', abbrev: 'KC', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png', wins: 15, losses: 1, ties: 0, pct: '.938', seed: 1 },
                { name: 'Bills', abbrev: 'BUF', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png', wins: 13, losses: 3, ties: 0, pct: '.813', seed: 2 },
                { name: 'Ravens', abbrev: 'BAL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png', wins: 12, losses: 4, ties: 0, pct: '.750', seed: 3 },
                { name: 'Texans', abbrev: 'HOU', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png', wins: 10, losses: 6, ties: 0, pct: '.625', seed: 4 },
            ]
        };
        
        const teams = divisions[tab] || [];
        
        container.innerHTML = `
            <table class="standings-table">
                <thead>
                    <tr>
                        <th>Team</th>
                        <th>W</th>
                        <th>L</th>
                        <th>T</th>
                        <th>Pct</th>
                        <th>PF</th>
                        <th>PA</th>
                    </tr>
                </thead>
                <tbody>
                    ${teams.map(team => `
                        <tr class="${team.abbrev === 'PHI' ? 'eagles-row' : ''}">
                            <td>
                                <div class="team-cell">
                                    <img src="${team.logo}" alt="${team.name}">
                                    <span>${team.name}</span>
                                    ${team.seed ? `<span class="playoff-seed">#${team.seed}</span>` : ''}
                                </div>
                            </td>
                            <td class="wins">${team.wins}</td>
                            <td class="losses">${team.losses}</td>
                            <td class="ties">${team.ties}</td>
                            <td>${team.pct}</td>
                            <td>${Math.floor(Math.random() * 100) + 350}</td>
                            <td>${Math.floor(Math.random() * 100) + 280}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    }
    
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        document.getElementById('theme-toggle').textContent = this.theme === 'dark' ? '🌙' : '☀️';
    }
    
    startAutoRefresh() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        this.refreshInterval = setInterval(() => {
            this.refreshScoreboard();
        }, 30000); // 30 seconds
    }
    
    startCountdown() {
        const updateCountdown = () => {
            this.refreshCountdown--;
            const timerEl = document.getElementById('refresh-countdown');
            if (timerEl) timerEl.textContent = this.refreshCountdown;
            
            if (this.refreshCountdown <= 0) {
                this.refreshCountdown = 30;
            }
        };
        
        setInterval(updateCountdown, 1000);
    }
    
    async refreshScoreboard() {
        this.refreshCountdown = 30;
        await this.loadScoreboard();
        this.updateLastUpdated();
        this.showToast('Scores refreshed! ⚽', 'success');
    }
    
    updateLastUpdated() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        document.getElementById('last-updated').textContent = `Updated ${timeStr}`;
    }
    
    showLoading(show) {
        document.getElementById('loading-overlay').classList.toggle('hidden', !show);
    }
    
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new EaglesHQ();
    app.renderStandings('nfc-east');
});
