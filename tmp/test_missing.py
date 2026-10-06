import re

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

calls = re.findall(r'on[a-z]+\s*=\s*["\']([^"\']+)["\']', html)
fn_names = set()
for c in calls:
    for fn in re.findall(r'\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(', c):
        if fn not in {"if", "for", "while", "switch", "alert", "confirm", "console", "parseInt", "parseFloat", "Number", "String", "Boolean", "encodeURIComponent", "decodeURIComponent"}:
            fn_names.add(fn)

missing = []
for fn in sorted(fn_names):
    pattern = r'(function\s+' + re.escape(fn) + r'\b|\b' + re.escape(fn) + r'\s*=\s*(?:function|\()|\bwindow\.' + re.escape(fn) + r'\s*=)'
    if not re.search(pattern, html):
        missing.append(fn)

print("Found missing functions:", missing)
