import { app } from '@azure/functions';
import sql from 'mssql';

const ESPN_MLB_SCOREBOARD =
  'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard';

const MLB_LEAGUE_ID = 703;

// Seeded odds generator — same logic as frontend so odds are consistent
function generateOdds(espnId, homeAway) {
  const seed = [...espnId].reduce((a, c) => a + c.charCodeAt(0), 0) / 10000;
  const base = homeAway === 'home' ? 1.4 + seed * 0.8 : 1.4 + (1 - seed) * 0.8;
  return Math.max(1.25, Math.min(2.8, base));
}

const sqlConfig = {
  server: process.env.DB_SERVER,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { encrypt: true, trustServerCertificate: false },
};

app.timer('mlb-ingest', {
  // Runs every 10 minutes
  schedule: '0 */10 * * * *',
  handler: async (myTimer, context) => {
    context.log('MLB ingest timer fired at:', new Date().toISOString());

    try {
      // Fetch live MLB scoreboard from ESPN
      const res = await fetch(ESPN_MLB_SCOREBOARD);
      if (!res.ok) throw new Error(`ESPN API error: ${res.status}`);
      const data = await res.json();

      const events = data.events ?? [];
      context.log(`Fetched ${events.length} MLB events from ESPN`);

      const pool = await sql.connect(sqlConfig);

      for (const event of events) {
        const comp = event.competitions?.[0];
        const home = comp?.competitors?.find((c) => c.homeAway === 'home');
        const away = comp?.competitors?.find((c) => c.homeAway === 'away');

        if (!home || !away) continue;

        const espnId = event.id;
        const homeTeam = home.team.displayName;
        const awayTeam = away.team.displayName;
        const homeAbbr = home.team.abbreviation;
        const awayAbbr = away.team.abbreviation;
        const homeLogo = home.team.logo || null;
        const awayLogo = away.team.logo || null;
        const homeColor = home.team.color ? `#${home.team.color}` : null;
        const awayColor = away.team.color ? `#${away.team.color}` : null;
        const homeScore =
          home.score !== undefined ? parseInt(home.score) : null;
        const awayScore =
          away.score !== undefined ? parseInt(away.score) : null;
        const status = event.status?.type?.state ?? 'pre';
        const startTime = new Date(event.date);
        const inning = event.status?.period ?? null;

        // Generate odds seeded from espnId
        const homeOdds = generateOdds(espnId, 'home');
        const awayOdds = generateOdds(espnId, 'away');
        const overOdds = 1.9;
        const underOdds = 1.9;
        const totalLine = 8.5;

        // Upsert into mlb_events
        await pool
          .request()
          .input('espnId', sql.NVarChar, espnId)
          .input('leagueId', sql.Int, MLB_LEAGUE_ID)
          .input('homeTeam', sql.NVarChar, homeTeam)
          .input('awayTeam', sql.NVarChar, awayTeam)
          .input('homeAbbr', sql.NVarChar, homeAbbr)
          .input('awayAbbr', sql.NVarChar, awayAbbr)
          .input('homeLogo', sql.NVarChar, homeLogo)
          .input('awayLogo', sql.NVarChar, awayLogo)
          .input('homeColor', sql.NVarChar, homeColor)
          .input('awayColor', sql.NVarChar, awayColor)
          .input('homeScore', sql.Int, homeScore)
          .input('awayScore', sql.Int, awayScore)
          .input('status', sql.NVarChar, status)
          .input('startTime', sql.DateTime2, startTime)
          .input('inning', sql.Int, inning)
          .input('homeOdds', sql.Decimal(10, 4), homeOdds)
          .input('awayOdds', sql.Decimal(10, 4), awayOdds)
          .input('overOdds', sql.Decimal(10, 4), overOdds)
          .input('underOdds', sql.Decimal(10, 4), underOdds)
          .input('totalLine', sql.Decimal(10, 2), totalLine).query(`
            MERGE mlb_events AS target
            USING (SELECT @espnId AS espn_id) AS source
            ON target.espn_id = source.espn_id
            WHEN MATCHED THEN
              UPDATE SET
                home_score   = @homeScore,
                away_score   = @awayScore,
                status       = @status,
                inning       = @inning,
                home_ml_odds = @homeOdds,
                away_ml_odds = @awayOdds,
                over_odds    = @overOdds,
                under_odds   = @underOdds,
                total_line   = @totalLine,
                home_color   = @homeColor,
                away_color   = @awayColor,
                updated_at   = SYSDATETIME()
            WHEN NOT MATCHED THEN
              INSERT (
                espn_id, league_id, home_team, away_team,
                home_abbr, away_abbr, home_logo, away_logo,
                home_color, away_color, home_score, away_score,
                status, start_time, inning,
                home_ml_odds, away_ml_odds, over_odds, under_odds, total_line,
                updated_at
              )
              VALUES (
                @espnId, @leagueId, @homeTeam, @awayTeam,
                @homeAbbr, @awayAbbr, @homeLogo, @awayLogo,
                @homeColor, @awayColor, @homeScore, @awayScore,
                @status, @startTime, @inning,
                @homeOdds, @awayOdds, @overOdds, @underOdds, @totalLine,
                SYSDATETIME()
              );
          `);
      }

      context.log(`Successfully upserted ${events.length} MLB events into DB`);
    } catch (error) {
      context.error('MLB ingest error:', error);
    }
  },
});
