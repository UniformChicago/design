import re

with open("gallery/gallery.css", "r") as f:
    content = f.read()

content = re.sub(r'\.g-main \{\n  max-width: 1440px;\n  margin: 0 auto;\n  padding:.*?\n\}\n', '', content, flags=re.DOTALL)
content = re.sub(r'\.g-main \{\n    padding:.*?\n  \}\n', '', content, flags=re.DOTALL)

with open("gallery/gallery.css", "w") as f:
    f.write(content)

with open("gallery/index.html", "r") as f:
    html = f.read()
html = html.replace('class="g-main u-shell-layout"', 'class="g-main u-shell-layout u-shell-main"')
with open("gallery/index.html", "w") as f:
    f.write(html)
