import re

with open("site/index.html", "r") as f:
    content = f.read()

# remove everything between <div class="s-hero-art" aria-hidden="true"> and its closing </div>
# The block is from <div class="s-hero-art" aria-hidden="true"> to the matching </div>
start = '<div class="s-hero-art" aria-hidden="true">'
end = '        </section>\n\n        <section id="install" aria-labelledby="install-h">'

# we just need to replace the art with nothing
pattern = re.compile(r'<div class="s-hero-art" aria-hidden="true">.*?</div>\n          </div>\n        </section>', re.DOTALL)
if '<div class="s-hero-art" aria-hidden="true">' in content:
    content = re.sub(r'<div class="s-hero-art" aria-hidden="true">.*?</section>', '</section>', content, flags=re.DOTALL)
    with open("site/index.html", "w") as f:
        f.write(content)
    print("Removed s-hero-art")
else:
    print("s-hero-art not found")
