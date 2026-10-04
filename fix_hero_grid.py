import re

with open("site/site.css", "r") as f:
    content = f.read()

content = content.replace("grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);", "grid-template-columns: 1fr;")
content = content.replace(".s-hero-art {\n    display: none; /* decorative; the components are shown in full below */\n  }", "")

with open("site/site.css", "w") as f:
    f.write(content)
