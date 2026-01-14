/**
 * NFL API Service
 * Handles all API calls to ESPN and other sources
 */

const NFL_API = {
    // ESPN API endpoints
    ESPN_BASE: 'https://site.api.espn.com/apis/site/v2',
    
    // Team IDs
    EAGLES_ID: '21',
    
    /**
     * Fetch Eagles team data
     */
    async getEaglesTeam() {
        try {
            const response = await fetch(`${this.ESPN_BASE}/sports/football/nfl/teams/${this.EAGLES_ID}`);
            const data = await response.json();
            return data.team;
        } catch (error) {
            console.error('Error fetching Eagles team:', error);
            return null;
        }
    },
    
    /**
     * Fetch Eagles roster
     */
    async getEaglesRoster() {
        try {
            const response = await fetch(`${this.ESPN_BASE}/sports/football/nfl/teams/${this.EAGLES_ID}/roster`);
            const data = await response.json();
            return data.athletes || [];
        } catch (error) {
            console.error('Error fetching roster:', error);
            return [];
        }
    },
    
    /**
     * Fetch Eagles news
     */
    async getEaglesNews() {
        try {
            const response = await fetch(`${this.ESPN_BASE}/sports/football/nfl/teams/${this.EAGLES_ID}/news`);
            const data = await response.json();
            return data.articles || [];
        } catch (error) {
            console.error('Error fetching news:', error);
            return [];
        }
    },
    
    /**
     * Fetch Eagles stats
     */
    async getEaglesStats() {
        try {
            const response = await fetch(`${this.ESPN_BASE}/sports/football/nfl/teams/${this.EAGLES_ID}/stats`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching stats:', error);
            return null;
        }
    },
    
    /**
     * Fetch NFL scoreboard
     */
    async getScoreboard() {
        try {
            const response = await fetch(`${this.ESPN_BASE}/sports/football/nfl/scoreboard`);
            const data = await response.json();
            return data.events || [];
        } catch (error) {
            console.error('Error fetching scoreboard:', error);
            return [];
        }
    },
    
    /**
     * Fetch NFL standings
     */
    async getStandings() {
        try {
            const response = await fetch(`${this.ESPN_BASE}/sports/football/nfl/standings`);
            const data = await response.json();
            return data.standings || [];
        } catch (error) {
            console.error('Error fetching standings:', error);
            return [];
        }
    },
    
    /**
     * Fetch all NFL teams
     */
    async getAllTeams() {
        try {
            const response = await fetch(`${this.ESPN_BASE}/sports/football/nfl/teams`);
            const data = await response.json();
            return data.teams || [];
        } catch (error) {
            console.error('Error fetching teams:', error);
            return [];
        }
    },
    
    /**
     * Get schedule with dates
     */
    async getSchedule() {
        try {
            // Generate mock schedule based on NFL structure
            // In production, use the ESPN schedule endpoint
            const currentYear = new Date().getFullYear();
            return this.generateMockSchedule(currentYear);
        } catch (error) {
            console.error('Error fetching schedule:', error);
            return [];
        }
    },
    
    /**
     * Generate mock schedule for demo
     */
    generateMockSchedule(year) {
        const opponents = [
            { name: 'Cowboys', abbrev: 'DAL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png' },
            { name: 'Giants', abbrev: 'NYG', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png' },
            { name: 'Commanders', abbrev: 'WSH', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png' },
            { name: 'Cowboys', abbrev: 'DAL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png' },
            { name: 'Bills', abbrev: 'BUF', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png' },
            { name: 'Chiefs', abbrev: 'KC', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png' },
            { name: 'Packers', abbrev: 'GB', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png' },
            { name: 'Saints', abbrev: 'NO', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png' },
        ];
        
        const schedule = [];
        const now = new Date();
        
        // Generate some past games
        for (let i = 0; i < 8; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - (30 - i * 5));
            const opponent = opponents[i];
            const isWin = Math.random() > 0.4;
            
            schedule.push({
                date: date,
                opponent: opponent,
                isHome: i % 2 === 0,
                result: isWin ? 'W' : 'L',
                score: isWin 
                    ? `${24 + Math.floor(Math.random() * 14)}-${17 + Math.floor(Math.random() * 14)}`
                    : `${17 + Math.floor(Math.random() * 14)}-${24 + Math.floor(Math.random() * 14)}`,
                isPast: true
            });
        }
        
        // Future games
        for (let i = 8; i < opponents.length; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() + (i - 8) * 7 + 3);
            schedule.push({
                date: date,
                opponent: opponents[i],
                isHome: i % 2 === 0,
                time: '1:00 PM ET',
                isPast: false
            });
        }
        
        return schedule.sort((a, b) => a.date - b.date);
    }
};

// Export for use in app.js
window.NFL_API = NFL_API;
