import sys

with open("components/components.css", "r") as f:
    content = f.read()

target = """.u-callout {
  padding: 18px 20px;
  border: 1px solid var(--u-line);
  border-left: 2px solid var(--u-ok);
  border-radius: var(--u-radius-md);
  background: var(--u-surface);
  overflow-wrap: anywhere;
}
.u-callout--danger {
  border-left-color: var(--u-warn);
  color: var(--u-warn);
}"""

replacement = """.u-callout {
  position: relative;
  padding: 18px 20px;
  border: 1px solid var(--u-line);
  border-radius: var(--u-radius-md);
  background: var(--u-surface);
  overflow-wrap: anywhere;
  overflow: hidden;
}
.u-callout::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 2px;
  background: var(--u-ok);
}
.u-callout--danger {
  color: var(--u-warn);
}
.u-callout--danger::before {
  background: var(--u-warn);
}"""

new_content = content.replace(target, replacement)
if new_content == content:
    print("No change made!")
    sys.exit(1)

with open("components/components.css", "w") as f:
    f.write(new_content)
print("Updated .u-callout")
