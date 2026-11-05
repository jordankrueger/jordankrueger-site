"""Rebuild src/data/synthwave.json from Jordan's "BEST OF: Synthwave" Apple Music playlist.

Input: personal/music/playlists.csv (the Apple Music library export; rerun
personal/music/export_music.py first if the playlist changed).
Apple Music track + artist links come from the free iTunes Search API. Spotify links
are search links: song.link retired its free API (401, 2026-10-25), and exact
Spotify track links would need a Spotify developer app. Tracks that can't be matched
confidently go under "unmatched" for a human to check; nothing is guessed.

Run: uv run python scripts/build-synthwave.py
"""
import csv, json, re, sys, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path

PLAYLIST = 'BEST OF: Synthwave'
SRC = Path.home() / 'ClaudeCode/personal/music/playlists.csv'
OUT = Path(__file__).resolve().parent.parent / 'src/data/synthwave.json'

def get(url, tries=5):
    # The iTunes Search API rate-limits bursts (HTTP 429); pace calls and back off.
    for attempt in range(tries):
        time.sleep(3)
        req = urllib.request.Request(url, headers={'User-Agent': 'jordankrueger.com link builder'})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == tries - 1:
                raise
            time.sleep(30 * (attempt + 1))

norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())
clean = lambda u: u.split('&uo=')[0].split('?uo=')[0]

# Words that mark a different recording. A candidate must carry exactly the same ones
# as the library title, so an instrumental, live or remix version never stands in.
VERSION_WORDS = ('instrumental', 'live', 'remix', 'acoustic', 'demo', 'edit', 'version', 'remaster', 'slowed', 'sped')

def base_title(title):
    # Drop featured-artist credits; keep everything else.
    return re.sub(r'\s*[\(\[](feat|ft|with)\.?[^)\]]*[\)\]]', '', title).strip()

def versions(title):
    t = title.lower()
    return {w for w in VERSION_WORDS if re.search(rf'\b{w}\b', t)}

def core(title):
    # Title without any bracketed part (versions are compared separately).
    return norm(re.sub(r'\s*[\(\[][^)\]]*[\)\]]', '', base_title(title)))

def artists(credit):
    return {norm(a) for a in re.split(r' & |, | x | and |feat\.|ft\.', credit) if a.strip()}

def is_match(lib_title, lib_artist, cand_title, cand_artist):
    lead = norm(re.split(r' & |, | x |feat\.', lib_artist)[0])
    return (core(lib_title) == core(cand_title)
            and versions(lib_title) == versions(cand_title)
            and lead in artists(cand_artist))

def _selftest():
    assert is_match('Bend & Break', 'FM-84 & Ollie Wride', 'Bend & Break', 'FM-84 & Ollie Wride')
    assert not is_match('Bend & Break', 'FM-84 & Ollie Wride', 'Bend & Break (Instrumental)', 'FM-84')
    assert not is_match('Heart Worth Breaking', 'The Midnight', 'Heart Worth Breaking (Live)', 'The Midnight')
    assert is_match('Shadows (Instrumental)', 'The Midnight', 'Shadows (Instrumental)', 'The Midnight')
    assert not is_match('Shadows (Instrumental)', 'The Midnight', 'Shadows', 'The Midnight')
    assert is_match('Lovers (feat. Seawaves)', 'Timecop1983', 'Lovers (feat. Seawaves)', 'Timecop1983')
    assert not is_match('Sunset', 'The Midnight', 'Sunset Boulevard', 'The Midnight')
    assert not is_match('Memories', 'The Midnight', 'Memories', 'Midnight Oil')
_selftest()

rows = [r for r in csv.DictReader(open(SRC, encoding='utf-8-sig')) if r['playlist'] == PLAYLIST]
tracks, unmatched = [], []
for r in rows:
    name, artist = r['track_name'], r['artist']
    if not artist:
        unmatched.append({'title': name, 'artist': artist, 'why': 'no artist in the library export'})
        continue
    lead = re.split(r' & |, | x |feat\.', artist)[0].strip()
    base = base_title(name)
    res = get('https://itunes.apple.com/search?term=' + urllib.parse.quote(f'{base} {lead}') + '&entity=song&limit=25&country=US')['results']
    hit = next((x for x in res if is_match(name, artist, x['trackName'], x['artistName'])), None)
    if not hit:
        unmatched.append({'title': name, 'artist': artist, 'why': 'no confident Apple Music match'})
        continue
    tracks.append({'title': name, 'artist': artist, 'apple': clean(hit['trackViewUrl']),
                   'appleArtist': clean(hit.get('artistViewUrl', '')) or None, 'spotify': None,
                   'spotifySearch': 'https://open.spotify.com/search/' + urllib.parse.quote(f'{base} {lead}')})

OUT.write_text(json.dumps({'playlist': PLAYLIST, 'tracks': tracks, 'unmatched': unmatched}, indent=2, ensure_ascii=False) + '\n')
print(f'{len(tracks)} matched, {len(unmatched)} unmatched -> {OUT}')
for u in unmatched:
    print('  UNMATCHED', u['title'], '|', u['artist'], '|', u['why'])
