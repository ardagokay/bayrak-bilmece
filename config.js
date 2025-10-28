const SUPABASE_URL = 'https://vehwofunouufunjywrpa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlaHdvZnVub3V1ZnVuanl3cnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTM2MjcsImV4cCI6MjA3NzE4OTYyN30.0ybQ0lWgdHoVjtc9xiseftPaD-PY8miiYvEnm5wcjzY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadFlagsFromJSON() {
    try {
        const response = await fetch('flags.json');
        const flags = await response.json();
        return flags.map(f => ({
            country: f.country,
            flag: `https://flagcdn.com/w320/${f.code}.png`,
            region: f.region
        }));
    } catch (error) {
        console.error('Bayraklar yüklenemedi:', error);
        return [];
    }
}

async function saveUserData(username, gameResult) {
    try {
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (existingUser) {
            await supabase
                .from('users')
                .update({
                    total_score: existingUser.total_score + gameResult.score,
                    total_games: existingUser.total_games + 1,
                    total_correct: existingUser.total_correct + gameResult.correct,
                    updated_at: new Date().toISOString()
                })
                .eq('username', username);
        } else {
            await supabase
                .from('users')
                .insert([{
                    username: username,
                    total_score: gameResult.score,
                    total_games: 1,
                    total_correct: gameResult.correct
                }]);
        }

        await supabase
            .from('game_results')
            .insert([{
                username: username,
                mode: gameResult.mode,
                difficulty: gameResult.difficulty,
                score: gameResult.score,
                correct: gameResult.correct,
                incorrect: gameResult.incorrect,
                success_rate: gameResult.successRate,
                time: gameResult.time
            }]);

        return true;
    } catch (error) {
        console.error('Veri kaydedilemedi:', error);
        return false;
    }
}

async function getUserData(username) {
    try {
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        const { data: results } = await supabase
            .from('game_results')
            .select('*')
            .eq('username', username)
            .order('created_at', { ascending: false });

        return { user, results: results || [] };
    } catch (error) {
        return { user: null, results: [] };
    }
}

async function getLeaderboard() {
    try {
        const { data } = await supabase
            .from('users')
            .select('username, total_score, total_games')
            .order('total_score', { ascending: false })
            .limit(50);
        return data || [];
    } catch (error) {
        return [];
    }
}
