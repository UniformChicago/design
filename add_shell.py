import sys

with open("components/components.css", "r") as f:
    content = f.read()

shell_css = """/* Shell */
.u-shell-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--u-space-3);
  min-height: 64px;
  padding: var(--u-space-3) var(--u-space-5);
  border-bottom: 1px solid var(--u-line);
  background: color-mix(in srgb, var(--u-bg) 86%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.u-shell-header-actions {
  display: flex;
  align-items: center;
  gap: var(--u-space-3);
}
.u-shell-header-actions .u-button {
  margin: 0;
}
.u-shell-layout {
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
}
@media (max-width: 800px) {
  .u-shell-header {
    padding-inline: var(--u-space-4);
    gap: var(--u-space-2);
  }
  .u-shell-header-actions {
    gap: var(--u-space-1);
  }
}

"""

if "u-shell-header" not in content:
    content += shell_css
    with open("components/components.css", "w") as f:
        f.write(content)
    print("Added u-shell to components.css")
