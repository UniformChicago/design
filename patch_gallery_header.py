import sys

with open("gallery/index.html", "r") as f:
    content = f.read()

target = """      <nav aria-label="Design system">
        <a href="../">Documentation</a><a href="./" aria-current="page">Playground</a
        ><a href="https://github.com/UniformChicago/design">GitHub</a>
      </nav>"""

replacement = """      <span class="g-top-actions" style="display: flex; align-items: center;">
        <a class="u-button u-button--quiet g-icon" href="../" aria-label="Documentation" title="Documentation" style="display: inline-flex; align-items: center; justify-content: center; width: 44px; padding: 0;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg></a>
        <a class="u-button u-button--quiet g-icon" href="./" aria-current="page" aria-label="Playground" title="Playground" style="display: inline-flex; align-items: center; justify-content: center; width: 44px; padding: 0;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></a>
        <a class="u-button u-button--quiet g-icon" href="https://github.com/UniformChicago/design" aria-label="GitHub" title="GitHub" style="display: inline-flex; align-items: center; justify-content: center; width: 44px; padding: 0;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg></a>
      </span>"""

if target in content:
    content = content.replace(target, replacement)
    with open("gallery/index.html", "w") as f:
        f.write(content)
    print("Updated gallery/index.html header")
else:
    print("Target not found in gallery/index.html")

