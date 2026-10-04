import sys

with open("components/components.css", "r") as f:
    content = f.read()

shell_css = """
.u-shell-main {
  padding: var(--u-space-7) var(--u-space-6);
}
@media (max-width: 800px) {
  .u-shell-main {
    padding: var(--u-space-6) var(--u-space-4);
  }
}
"""

if "u-shell-main" not in content:
    content += shell_css
    with open("components/components.css", "w") as f:
        f.write(content)
