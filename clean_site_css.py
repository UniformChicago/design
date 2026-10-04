import re

with open("site/site.css", "r") as f:
    content = f.read()

# Replace .s-top with .u-shell-header for remaining references (like .u-shell-header .u-button)
content = content.replace(".s-top", ".u-shell-header")
content = content.replace(".s-top-actions", ".u-shell-header-actions")
content = content.replace(".s-layout", ".u-shell-layout s-layout")

with open("site/site.css", "w") as f:
    f.write(content)
