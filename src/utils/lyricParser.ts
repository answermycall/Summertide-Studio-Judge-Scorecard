export interface ParsedLyricSubmission {
  songTitle: string;
  alias: string;
  discordUsername: string;
  storyConcept: string;
  lyrics: string;
  formattedEntrantName: string;
}

export function parseLyricSubmission(rawText: string): ParsedLyricSubmission {
  if (!rawText) {
    return {
      songTitle: '',
      alias: '',
      discordUsername: '',
      storyConcept: '',
      lyrics: '',
      formattedEntrantName: '',
    };
  }

  const lines = rawText.split(/\r?\n/);

  let songTitle = '';
  let alias = '';
  let discordUsername = '';
  let storyConcept = '';
  const lyricsLines: string[] = [];

  let inLyricsSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for metadata headers
    const titleMatch = trimmed.match(/^Song\s*Title\s*:\s*(.+)$/i);
    const aliasMatch = trimmed.match(/^Alias\s*:\s*(.+)$/i);
    const discordMatch = trimmed.match(/^Discord\s*Username\s*:\s*(.+)$/i);
    const storyMatch = trimmed.match(/^Optional\s*Story(?:\/Concept)?\s*:\s*(.+)$/i);

    if (titleMatch && !inLyricsSection) {
      songTitle = titleMatch[1].trim();
      continue;
    }

    if (aliasMatch && !inLyricsSection) {
      alias = aliasMatch[1].trim();
      continue;
    }

    if (discordMatch && !inLyricsSection) {
      discordUsername = discordMatch[1].trim().replace(/^@/, '');
      continue;
    }

    if (storyMatch && !inLyricsSection) {
      storyConcept = storyMatch[1].trim();
      continue;
    }

    // Check if section marker like [Verse 1], [Chorus], etc. begins
    if (/^\[[^\]]+\]/i.test(trimmed)) {
      inLyricsSection = true;
    }

    if (inLyricsSection) {
      lyricsLines.push(line);
    } else if (
      trimmed &&
      !titleMatch &&
      !aliasMatch &&
      !discordMatch &&
      !storyMatch &&
      !/^Optional\s*Story/i.test(trimmed)
    ) {
      // If we haven't seen a section tag yet, but see standard lyric lines after metadata
      // (e.g. if the user omitted section headers)
      if (songTitle || alias || discordUsername) {
        inLyricsSection = true;
        lyricsLines.push(line);
      }
    }
  }

  // Format combined entrant name
  let formattedEntrantName = songTitle || 'Untitled Song';
  if (alias) {
    formattedEntrantName += ` — ${alias}`;
  }
  if (discordUsername) {
    formattedEntrantName += ` (@${discordUsername})`;
  }

  return {
    songTitle,
    alias,
    discordUsername,
    storyConcept,
    lyrics: lyricsLines.join('\n').trim(),
    formattedEntrantName: formattedEntrantName.trim(),
  };
}
