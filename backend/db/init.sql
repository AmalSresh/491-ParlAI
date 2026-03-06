
CREATE TABLE users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    azure_user_id NVARCHAR(255) NOT NULL UNIQUE,
    email NVARCHAR(255) NOT NULL,
    name NVARCHAR(255),

    onboarding_stage INT NOT NULL DEFAULT 0,

    -- fake balance cache (optional, derived from ledger ideally)
    balance DECIMAL(18,2) NOT NULL DEFAULT 1000.00, -- give starting fake money

    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE wallet_ledger (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    bet_id UNIQUEIDENTIFIER NULL, -- null unless related to bet

    amount DECIMAL(18,2) NOT NULL,
    type NVARCHAR(50) NOT NULL, -- deposit, bet, payout, refund

    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_wallet_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE leagues (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    country NVARCHAR(100)
);

CREATE TABLE teams (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    league_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(255) NOT NULL,

    CONSTRAINT FK_team_league
        FOREIGN KEY (league_id)
        REFERENCES leagues(id)
        ON DELETE CASCADE
);

CREATE TABLE events (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    league_id UNIQUEIDENTIFIER NOT NULL,

    home_team_id UNIQUEIDENTIFIER NOT NULL,
    away_team_id UNIQUEIDENTIFIER NOT NULL,

    start_time DATETIME2 NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'scheduled', 
    -- scheduled, live, finished, cancelled

    home_score INT NULL,
    away_score INT NULL,

    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_event_league
        FOREIGN KEY (league_id)
        REFERENCES leagues(id),

    CONSTRAINT FK_event_home_team
        FOREIGN KEY (home_team_id)
        REFERENCES teams(id),

    CONSTRAINT FK_event_away_team
        FOREIGN KEY (away_team_id)
        REFERENCES teams(id)
);

CREATE TABLE markets (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    event_id UNIQUEIDENTIFIER NOT NULL,

    type NVARCHAR(50) NOT NULL, 
    -- moneyline, total_goals

    status NVARCHAR(50) NOT NULL DEFAULT 'open', 
    -- open, closed, settled

    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_market_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE
);

CREATE TABLE selections (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    market_id UNIQUEIDENTIFIER NOT NULL,

    label NVARCHAR(255) NOT NULL,
    odds DECIMAL(10,4) NOT NULL,
    line_value DECIMAL(10,2) NULL, -- for totals

    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_selection_market
        FOREIGN KEY (market_id)
        REFERENCES markets(id)
        ON DELETE CASCADE
);

CREATE TABLE bets (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

    user_id UNIQUEIDENTIFIER NOT NULL,
    selection_id UNIQUEIDENTIFIER NOT NULL,

    stake DECIMAL(18,2) NOT NULL,
    odds_at_placement DECIMAL(10,4) NOT NULL,

    potential_payout DECIMAL(18,2) NOT NULL,

    status NVARCHAR(50) NOT NULL DEFAULT 'open',
    -- open, won, lost, void

    placed_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    settled_at DATETIME2 NULL,

    CONSTRAINT FK_bet_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT FK_bet_selection
        FOREIGN KEY (selection_id)
        REFERENCES selections(id)
);