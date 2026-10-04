import sys

with open("site/site.css", "r") as f:
    content = f.read()

target = """  justify-content: center;
  width: 44px;
  padding: 0;
}"""

replacement = """  justify-content: center;
  width: 44px;
  padding: 0;
  font-size: 0;
}"""

if target in content:
    content = content.replace(target, replacement)
    with open("site/site.css", "w") as f:
        f.write(content)
    print("Updated site.css font-size")
else:
    print("Target not found in site.css")

