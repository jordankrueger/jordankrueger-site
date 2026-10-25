"""Rebuild src/data/synthwave.json from Jordan's "BEST OF: Synthwave" Apple Music playlist.

Input: personal/music/playlists.csv (the Apple Music library export; rerun
personal/music/export_music.py first if the playlist changed).
Apple Music track + artist links come from the free iTunes Search API. Spotify links
are search links: song.link retired its free API (401, 2026-10-25), and exact
Spotify track links would need a Spotify developer app. Tracks that can't be matched
confidently go under "unmatched" for a human to check; nothing is guessed.

Run: uv run python scripts/build-synthwave.py
"""
import csv, json, re, sys, urllib.parse, urllib.request
from pathlib import Path

PLAYLIST = 'BEST OF: Synthwave'
SRC = Path.home() / 'ClaudeCode/personal/music/playlists.csv'
OUT = Path(__file__).resolve().parent.parent / 'src/data/synthwave.json'

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'jordankrueger.com link builder'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())
clean = lambda u: u.split('&uo=')[0].split('?uo=')[0]

rows = [r for r in csv.DictReader(open(SRC, encoding='utf-8-sig')) if r['playlist'] == PLAYLIST]
tracks, unmatched = [], []
for r in rows:
    name, artist = r['track_name'], r['artist']
    if not artist:
        unmatched.append({'title': name, 'artist': artist, 'why': 'no artist in the library export'})
        continue
    lead = re.split(r' & |, | x |feat\.', artist)[0].strip()
    base = re.sub(r'\s*\((feat|with)\.?[^)]*\)', '', name).strip()
    res = get('https://itunes.apple.com/search?term=' + urllib.parse.quote(f'{base} {lead}') + '&entity=song&limit=10&country=US')['results']
    hit = next((x for x in res if norm(lead) in norm(x['artistName']) and norm(base)[:12] in norm(x['trackName'])), None)
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
