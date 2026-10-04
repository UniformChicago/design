import sys
import json

# package.json
with open("package.json", "r") as f:
    pkg = json.load(f)
if "waves, " in pkg.get("description", ""):
    pkg["description"] = pkg["description"].replace("waves, ", "")
    with open("package.json", "w") as f:
        json.dump(pkg, f, indent=2)
        f.write("\n")

# README.md
with open("README.md", "r") as f:
    content = f.read()

content = content.replace(
    "Uniform Design brings brand tokens, CSS components, self-hosted typography, and the Atmosphere wave motif into one small, versioned package.",
    "Uniform Design brings brand tokens, CSS components, and self-hosted typography into one small, versioned package. It also includes experimental features like the Atmosphere wave motif."
)

content = content.replace(
    "## Atmosphere",
    "## Labs: Atmosphere"
)

with open("README.md", "w") as f:
    f.write(content)

# site/index.html
with open("site/index.html", "r") as f:
    content = f.read()

content = content.replace(
    'content="Uniform Design: brand tokens, CSS components, self-hosted fonts and the Atmosphere wave motif, for websites, applications and documents."',
    'content="Uniform Design: brand tokens, CSS components, and self-hosted fonts for websites, applications and documents."'
)

content = content.replace(
    'Brand tokens, CSS components, self-hosted fonts and the Atmosphere wave motif.',
    'Brand tokens, CSS components, and self-hosted fonts.'
)

content = content.replace(
    '<p class="s-group"><a href="#atmosphere-motif">Brand</a></p>',
    '<p class="s-group"><a href="#atmosphere-motif">Labs</a></p>'
)

content = content.replace(
    '<h2 id="atmosphere-h" class="s-h2">Atmosphere</h2>',
    '<h2 id="atmosphere-h" class="s-h2">Labs: Atmosphere</h2>'
)

with open("site/index.html", "w") as f:
    f.write(content)

print("Updated text references")
