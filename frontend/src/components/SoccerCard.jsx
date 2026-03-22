import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  CardActionArea,
  Collapse,
  Divider,
  Box,
  Button,
} from '@mui/material';

const LiveIndicator = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
    }}
  >
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: '#d32f2f',
        animation: 'pulse 2s infinite',
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

const MoneylineBox = ({ label, odds }) => (
  <Box
    sx={{
      backgroundColor: 'rgba(0,0,0,0.05)',
      borderRadius: '4px',
      p: 1,
      textAlign: 'center',
      border: '1px solid rgba(0,0,0,0.1)',
    }}
  >
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 'black' }}>
      {odds}
    </Typography>
  </Box>
);

const OddsButton = ({ label, odds }) => (
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
      '&:hover': { backgroundColor: '#1f2430', borderColor: '#00f6ff' },
    }}
  >
    <Typography variant="caption" sx={{ color: '#ffffff', lineHeight: 1.2 }}>
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
      {odds}
    </Typography>
  </Button>
);

// --- MAIN COMPONENT ---

const GameCard = ({ game }) => {
  const [expanded, setExpanded] = useState(false);

  // 1. Destructure for cleaner variable access (ADDED: playerProps = [])
  const {
    status,
    startTime,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    homeLogo,
    awayLogo,
    mainOdds = '',
    totalLine,
    overOdds,
    underOdds,
    playerProps = [], // Default to empty array to prevent crashes
  } = game;

  // 2. Pre-split the odds so we don't do it inside the JSX
  const [homeOdds = '-', drawOdds = '-', awayOdds = '-'] =
    mainOdds.split(' / ');

  const renderGameStatus = () => {
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
          FINAL
        </Typography>
      );
    }
    if (status === 'in_progress' || status === 'live') {
      return <LiveIndicator />;
    }
    if (!startTime) return null;

    const dateObj = new Date(startTime);
    return (
      <Typography variant="caption" sx={{ color: '#333', fontWeight: 'bold' }}>
        {dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
        <span style={{ margin: '0 4px' }}>•</span>{' '}
        {dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </Typography>
    );
  };

  return (
    <Card sx={{ backgroundColor: '#00f6ff', color: 'black' }}>
      <CardActionArea
        onClick={() => setExpanded(!expanded)}
        sx={{ padding: '8px' }}
      >
        <CardContent>
          {/* Status Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 1.5,
              borderBottom: '1px solid rgba(0,0,0,0.1)',
              pb: 0.5,
            }}
          >
            {renderGameStatus()}
          </Box>

          {/* Teams Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 1,
              minHeight: '2.8em',
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 'bold',
                flex: 1,
                lineHeight: 1.2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {homeTeam}
            </Typography>

            <Typography
              variant="caption"
              sx={{ color: '#333', mx: 1, fontWeight: 'bold', mt: 0.25 }}
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
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {awayTeam}
            </Typography>
          </Box>

          {/* Scores & Logos */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <img
                src={homeLogo || 'https://via.placeholder.com/40'}
                alt={homeTeam}
                style={{ width: 40, height: 40, objectFit: 'contain' }}
              />
              <Typography variant="h5" sx={{ fontWeight: 'black' }}>
                {homeScore ?? '-'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 'black' }}>
                {awayScore ?? '-'}
              </Typography>
              <img
                src={awayLogo || 'https://via.placeholder.com/40'}
                alt={awayTeam}
                style={{ width: 40, height: 40, objectFit: 'contain' }}
              />
            </Box>
          </Box>

          {/* 3-Way Moneyline */}
          <Box sx={{ width: '100%', mt: 1, mb: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: '#333',
                fontWeight: 'bold',
                display: 'block',
                textAlign: 'center',
                mb: 0.5,
              }}
            >
              Match Result (3-Way)
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 1,
              }}
            >
              <MoneylineBox label={homeTeam} odds={homeOdds} />
              <MoneylineBox label="Draw" odds={drawOdds} />
              <MoneylineBox label={awayTeam} odds={awayOdds} />
            </Box>
          </Box>

          <Typography
            variant="body2"
            sx={{ color: '#000000', marginTop: '8px', textAlign: 'center' }}
          >
            {expanded ? 'Click to hide extra bets ▲' : 'Click for more bets ▼'}
          </Typography>
        </CardContent>
      </CardActionArea>

      {/* Expandable Section */}
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

          {/* TOTAL GOALS BOX */}
          <Box
            sx={{
              backgroundColor: '#00f6ff',
              borderRadius: '4px',
              padding: '16px',
              border: '1px solid #3b4d80',
              mb: 2, // Added margin bottom to separate from player props
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
                {totalLine}
              </Typography>
            </Typography>
            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
            >
              <OddsButton label="Over" odds={overOdds} />
              <OddsButton label="Under" odds={underOdds} />
            </Box>
          </Box>

          {/* NEW: ANYTIME GOALSCORER PROPS */}
          {playerProps.length > 0 && (
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
                sx={{
                  color: '#000000',
                  textAlign: 'center',
                  mb: 2,
                  fontWeight: 'bold',
                }}
              >
                Anytime Goalscorer
              </Typography>

              {/* Scrollable Container */}
              <Box
                sx={{
                  maxHeight: '180px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  pr: 1,
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-track': { background: 'transparent' },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#000000',
                    borderRadius: '4px',
                  },
                }}
              >
                {playerProps.map((player, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#000000',
                      padding: '8px 12px',
                      borderRadius: '4px',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: '#ffffff', fontSize: '0.85rem' }}
                    >
                      {player.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#00f6ff',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                      }}
                    >
                      {player.odds}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default GameCard;
