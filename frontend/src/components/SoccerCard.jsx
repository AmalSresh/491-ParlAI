import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

const GameCard = ({ game }) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  // --- NEW STATUS HELPER FUNCTION (MUI Style) ---
  const renderGameStatus = (status, startTime) => {
    // 1. Game is over
    if (status === 'completed' || status === 'finished') {
      return (
        <Typography
          variant="caption"
          sx={{
            color: '#555',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Final
        </Typography>
      );
    }

    // 2. Game is currently happening
    if (status === 'in_progress' || status === 'live') {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          {/* Pulsing Red Dot */}
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#d32f2f', // Red
              '@keyframes pulse': {
                '0%': {
                  transform: 'scale(0.95)',
                  boxShadow: '0 0 0 0 rgba(211, 47, 47, 0.7)',
                },
                '70%': {
                  transform: 'scale(1)',
                  boxShadow: '0 0 0 6px rgba(211, 47, 47, 0)',
                },
                '100%': {
                  transform: 'scale(0.95)',
                  boxShadow: '0 0 0 0 rgba(211, 47, 47, 0)',
                },
              },
              animation: 'pulse 2s infinite',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: '#d32f2f',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Live
          </Typography>
        </Box>
      );
    }

    // 3. Game hasn't started yet (Scheduled)
    // Add a check just in case startTime is missing
    if (!startTime) return null;

    const dateObj = new Date(startTime);
    const timeString = dateObj.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
    const dateString = dateObj.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });

    return (
      <Typography variant="caption" sx={{ color: '#333', fontWeight: 'bold' }}>
        {dateString} <span style={{ margin: '0 4px' }}>•</span> {timeString}
      </Typography>
    );
  };

  return (
    <Card sx={{ backgroundColor: '#00f6ff', color: 'black' }}>
      {/* TOP HALF: Always visible */}
      <CardActionArea onClick={handleExpandClick} sx={{ padding: '8px' }}>
        <CardContent>
          {/* ROW 0: Status & Start Time */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 1.5,
              borderBottom: '1px solid rgba(0,0,0,0.1)',
              pb: 0.5,
            }}
          >
            {renderGameStatus(game.status, game.startTime)}
          </Box>

          {/* ROW 1: Team Names */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 'bold', flex: 1, lineHeight: 1.2 }}
            >
              {game.homeTeam}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#333',
                alignSelf: 'center',
                mx: 1,
                fontWeight: 'bold',
              }}
            >
              VS
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 'bold',
                flex: 1,
                textAlign: 'right',
                lineHeight: 1.2,
              }}
            >
              {game.awayTeam}
            </Typography>
          </Box>

          {/* ROW 2: Logos and Scores */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            {/* Home Side: Logo then Score */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <img
                src={game.homeLogo || 'https://via.placeholder.com/40'}
                alt={game.homeTeam}
                style={{ width: 40, height: 40, objectFit: 'contain' }}
              />
              <Typography variant="h5" sx={{ fontWeight: 'black' }}>
                {game.homeScore !== null && game.homeScore !== undefined
                  ? game.homeScore
                  : '-'}
              </Typography>
            </Box>

            {/* Away Side: Score then Logo (mirrored for balance) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 'black' }}>
                {game.awayScore !== null && game.awayScore !== undefined
                  ? game.awayScore
                  : '-'}
              </Typography>
              <img
                src={game.awayLogo || 'https://via.placeholder.com/40'}
                alt={game.awayTeam}
                style={{ width: 40, height: 40, objectFit: 'contain' }}
              />
            </Box>
          </Box>

          <Typography
            variant="body1"
            sx={{ color: '#000000', fontWeight: 'bold', textAlign: 'center' }}
          >
            Moneyline: {game.mainOdds}
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: '#000000', marginTop: '8px', textAlign: 'center' }}
          >
            {expanded ? 'Click to hide extra bets ▲' : 'Click for more bets ▼'}
          </Typography>
        </CardContent>
      </CardActionArea>

      {/* BOTTOM HALF: The hidden section that slides open */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider sx={{ borderColor: '#000000' }} />
        <CardContent sx={{ backgroundColor: '#010d14' }}>
          <Typography
            variant="subtitle2"
            align="center"
            sx={{ color: '#ffffff', mb: 2 }}
          >
            Additional Betting Markets
          </Typography>

          {/* Dynamic Totals Section */}
          <Box
            sx={{
              backgroundColor: '#00f6ff',
              borderRadius: '4px',
              padding: '16px',
              border: '1px solid #3b4d80',
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: '#000000', textAlign: 'center', mb: 2 }}
            >
              Total Goals:{' '}
              <Typography
                component="span"
                sx={{ color: 'black', fontWeight: 'bold' }}
              >
                {game.totalLine}
              </Typography>
            </Typography>

            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
            >
              {/* Over Button */}
              <Button
                variant="outlined"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#000000',
                  borderColor: '#2d3343',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '8px',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#1f2430',
                    borderColor: '#00f6ff',
                  },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: '#ffffff', lineHeight: 1.2 }}
                >
                  Over
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 'bold', lineHeight: 1.2 }}
                >
                  {game.overOdds}
                </Typography>
              </Button>

              {/* Under Button */}
              <Button
                variant="outlined"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#000000',
                  borderColor: '#2d3343',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '8px',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#1f2430',
                    borderColor: '#00f6ff',
                  },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: '#ffffff', lineHeight: 1.2 }}
                >
                  Under
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 'bold', lineHeight: 1.2 }}
                >
                  {game.underOdds}
                </Typography>
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default GameCard;
