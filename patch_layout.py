import sys

with open("site/site.css", "r") as f:
    content = f.read()

target = """.s-art--back {
  top: 0;
  right: 10%;
  width: 76%;
}
.s-art--mid {
  top: 54%;
  left: 0;
  width: 58%;
  background: var(--u-surface);
}
.s-art--front {
  top: 74%;
  right: 0;
  width: 50%;
}"""

replacement = """.s-art--back {
  top: 0;
  right: 0;
  width: 76%;
}
.s-art--mid {
  top: 48%;
  left: 10%;
  width: 60%;
  background: var(--u-surface);
}
.s-art--front {
  top: 70%;
  right: 10%;
  width: 56%;
}"""

if target in content:
    content = content.replace(target, replacement)
    with open("site/site.css", "w") as f:
        f.write(content)
    print("Updated site.css collage layout")
else:
    print("Could not find target block in site.css")

