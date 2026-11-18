"""Ensure the release changes only the requested YouTube scope."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).parent
before = root/'site-youtube'
after = root/'site-youtube-hub'
allowed = {
    '.env.example', 'YOUTUBE.md', 'src/components/site/YouTubeSection.tsx',
    'src/styles.css', 'src/lib/youtube-types.ts', 'src/lib/youtube-feed.server.ts',
    'src/lib/youtube.server.ts', 'src/lib/config.server.ts',
    'tests/youtube-feed.test.ts', 'deploy/nginx-vsb-live.conf',
    'deploy/nginx-vsbseguranca.conf',
}

def manifest(folder):
    return {p.relative_to(folder).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in folder.rglob('*') if p.is_file()
            and not any(part in {'.git','.env','.cache','.output','node_modules'} for part in p.relative_to(folder).parts)}

old, new = manifest(before), manifest(after)
changed = sorted(name for name in old.keys() | new.keys() if old.get(name) != new.get(name))
unexpected = sorted(set(changed) - allowed)
assert not unexpected, unexpected
marker = '/* Vídeos do canal oficial: a mesma base visual das seções institucionais. */'
old_css = (before/'src/styles.css').read_text(encoding='utf-8').split(marker)[0].rstrip()
new_css = (after/'src/styles.css').read_text(encoding='utf-8')
assert new_css.startswith(old_css), 'CSS outside YouTube section changed'
report = {'changedFiles':changed, 'unchangedFiles':len(set(old)&set(new))-len(changed),
          'outsideYouTubeCssUnchanged':True, 'homepageStructureUnchanged':old['src/routes/index.tsx']==new['src/routes/index.tsx'],
          'dependenciesUnchanged':old['package.json']==new['package.json'], 'unexpectedChanges':unexpected}
(root/'checks-youtube-hub/scope.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
