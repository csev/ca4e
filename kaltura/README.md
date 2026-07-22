# CA4E Kaltura / MediaSpace playlist data

Course-specific Kaltura playlist dump for CA4E. Shared tooling lives in
[`media-util`](../../media-util/README.md).

## Files here

- `kaltura-playlist.jsonl` — playlist dump from `dump-kaltura-playlist.py`

## Workflow

```bash
source /Users/csev/htdocs/ca4e/media.env
cd /Users/csev/htdocs/ca4e

dump-kaltura-playlist.py
compare-kaltura-to-media-yaml.py   # after media.yaml exists
```

Uses the public MediaSpace playlist page (no admin secret). Playlist URL /
id come from `media.env` (`KALTURA_PLAYLIST_URL`, `KALTURA_PLAYLIST_ID`).
