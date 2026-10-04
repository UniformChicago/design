import sys

with open("components/components.css", "r") as f:
    content = f.read()

target = """/* Buttons */
.u-button {"""

replacement = """/* Buttons */
.u-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--u-space-2) var(--u-space-3);
}
.u-button {"""

new_content = content.replace(target, replacement)
if new_content == content:
    print("No change made!")
    sys.exit(1)

with open("components/components.css", "w") as f:
    f.write(new_content)
print("Updated .u-actions")
