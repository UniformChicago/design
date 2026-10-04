import sys

with open("gallery/presets.js", "r") as f:
    content = f.read()

target1 = """    <button class="u-button" type="button" ${state === "Disabled" ? "disabled" : ""}>Save document</button>
    <button class="u-button u-button--quiet" type="button" ${state === "Disabled" ? "disabled" : ""}>Cancel</button>"""

replacement1 = """    <div class="u-actions">
      <button class="u-button" type="button" ${state === "Disabled" ? "disabled" : ""}>Save document</button>
      <button class="u-button u-button--quiet" type="button" ${state === "Disabled" ? "disabled" : ""}>Cancel</button>
    </div>"""

target2 = """  <button class="u-button" type="button" ${state === "Disabled" ? "disabled" : ""}>Continue</button>
  <button class="u-button u-button--quiet" type="button" ${state === "Disabled" ? "disabled" : ""}>Save for later</button>"""

replacement2 = """  <div class="u-actions">
    <button class="u-button" type="button" ${state === "Disabled" ? "disabled" : ""}>Continue</button>
    <button class="u-button u-button--quiet" type="button" ${state === "Disabled" ? "disabled" : ""}>Save for later</button>
  </div>"""

content = content.replace(target1, replacement1)
content = content.replace(target2, replacement2)

with open("gallery/presets.js", "w") as f:
    f.write(content)
print("Updated gallery/presets.js")
