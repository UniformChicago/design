import sys

with open("site/site.css", "r") as f:
    content = f.read()

target = """.s-copy,
.s-theme {"""

replacement = """.s-copy,
.s-theme,
.s-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  padding: 0;
}
.s-copy,
.s-theme {"""

content = content.replace(target, replacement)

with open("site/site.css", "w") as f:
    f.write(content)
print("Updated site/site.css")
