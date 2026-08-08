#!/usr/bin/env python3
"""
build.py — Option B "no build step" assembly script.

Concatenates the frozen legacy base (src/legacy-base.html, everything
built before the Option B module structure was adopted) with the new
modular pieces — storage.js, core/events.js, inlined data/*.json, and
every file under src/features/ — into a single self-contained
lifeplay_phase15.html. Module boundaries below are a source-organization
and code-review convention, not something a bundler enforces: this
script does plain text concatenation, in a fixed order, and nothing else.

Run this before every commit that touches src/ or data/, then run the
existing phase15 -> phase16 marker-splice rebuild as usual.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
DATA = ROOT / "data"

def read(path):
    return path.read_text(encoding="utf-8")

def build_data_block():
    """Each data/foo.json becomes `const FOO_DATA = {...};` — inlined at
    build time so the shipped HTML stays self-contained with no runtime
    fetch() calls (file:// pages can't fetch external files anyway)."""
    if not DATA.exists():
        return ""
    parts = []
    for jf in sorted(DATA.glob("*.json")):
        name = re.sub(r'[^A-Za-z0-9]', '_', jf.stem).upper() + "_DATA"
        payload = json.loads(read(jf))
        parts.append(f"/* from data/{jf.name} */\nconst {name} = {json.dumps(payload)};")
    return "\n".join(parts)

def build_features_block():
    order_file = SRC / "features" / "ORDER.txt"
    if order_file.exists():
        names = [l.strip() for l in read(order_file).splitlines() if l.strip() and not l.startswith("#")]
        files = [SRC / "features" / n for n in names]
    else:
        files = sorted((SRC / "features").glob("*.js"))
    return "\n\n".join(read(f) for f in files if f.exists())

def main():
    legacy = read(SRC / "legacy-base.html")
    storage_js = read(SRC / "storage.js")
    events_js = read(SRC / "core" / "events.js")
    data_block = build_data_block()
    features_block = build_features_block()

    new_module_block = "\n\n".join(filter(None, [storage_js, events_js, data_block, features_block]))

    insertion_point = legacy.rindex("</script>")
    assembled = legacy[:insertion_point] + "\n" + new_module_block + "\n</script>\n</body>\n</html>\n"

    out_path = ROOT / "lifeplay_phase15.html"
    out_path.write_text(assembled, encoding="utf-8")
    print(f"Wrote {out_path} ({len(assembled)} bytes)")

if __name__ == "__main__":
    main()
