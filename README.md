# Summertide Studio — Lyric Contest Judge Scorecards & Automated Rankings

An independent judging portal and live aggregation system built for the **Summertide Studio Producer Panel**. Connects directly with **Google Sheets** to record judges' scores and automatically calculates final contest rankings without any manual spreadsheet formulas.

---

## 🌟 Key Features

- **Automated Ranking Engine**:
  - Eliminates manual spreadsheet calculations and formula errors.
  - Computes weighted criteria averages across all evaluating judges.
  - Automatic tie-breaker rules (Originality & Creativity, Writing Quality, and Evaluator count).
  - Top 3 Podium showcase (Gold 🥇, Silver 🥈, Bronze 🥉) with score ranges and consensus detection.

- **Google Sheets Two-Way Integration**:
  - **1-Click Contest Sheet Creator**: Generates a formatted Google Spreadsheet in your Google Drive with `Raw Scores` and `Final Rankings` tabs.
  - **Connect Any Existing Sheet**: Paste any Google Sheet URL or ID to import previous scorecards.
  - **Live Scorecard Appending**: Submitting a scorecard immediately appends the row to your connected spreadsheet.
  - **Write Final Rankings**: Export the official leaderboard directly back into the sheet's `Final Rankings` tab.

- **Interactive Judge Scorecard**:
  - 4 core contest criteria scored from **1 to 24** (maximum awardable 96/100, 25 is theoretical ceiling):
    1. **Writing Quality** (Vocabulary, phrasing, spacing, clarity, readability)
    2. **Originality & Creativity** (Distinctive ideas, imagery, wordplay, creative rhymes)
    3. **Emotional Impact & Storytelling** (Emotional resonance, narrative clarity, depth)
    4. **Structure & Cohesion** (Section transitions, progression, consistency, unity)
  - Live progress meter, instant tier badges (*Poor*, *Below Standard*, *Competent*, *Strong*, *Exceptional*), and evaluative summaries.
  - Export scorecard as text file (`.txt`) or print/save as PDF.

- **All Judges' Matrix & Divergence Tracker**:
  - Cross-comparison grid showing every judge's rating side-by-side.
  - Automatic divergence indicator flagging songs where judge scores spread by 10+ points.
  - Searchable and filterable score log with judge comments and timestamps.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Build Tool**: Vite
- **Authentication**: Firebase Authentication with Google Sign-In
- **Integration**: Google Sheets REST API v4 (`spreadsheets` scope)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Connect to Google Sheets
1. Sign in with your Google account.
2. Under the **Google Sheet Sync** tab, select **Create Contest Sheet** or paste your existing Google Sheets link.
3. Start entering scores to see automated rankings calculate in real time.
