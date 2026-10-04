import re

with open("site/site.css", "r") as f:
    content = f.read()

# remove .s-hero-art, .s-art, .s-art--back, .s-art--mid, .s-art--front, .s-art-row, .s-art-actions, .s-art-btn
content = re.sub(r'\.s-hero-art \{.*?\}\n', '', content, flags=re.DOTALL)
content = re.sub(r'\.s-art \{.*?\}\n', '', content, flags=re.DOTALL)
content = re.sub(r'\.s-art--back \{.*?\}\n', '', content, flags=re.DOTALL)
content = re.sub(r'\.s-art--mid \{.*?\}\n', '', content, flags=re.DOTALL)
content = re.sub(r'\.s-art--front \{.*?\}\n', '', content, flags=re.DOTALL)
content = re.sub(r'\.s-art--front \.s-art-row \{.*?\}\n', '', content, flags=re.DOTALL)
content = re.sub(r'\.s-art-row \{.*?\}\n', '', content, flags=re.DOTALL)
content = re.sub(r'\.s-art-actions \{.*?\}\n', '', content, flags=re.DOTALL)
content = re.sub(r'\.s-art-btn \{.*?\}\n', '', content, flags=re.DOTALL)

with open("site/site.css", "w") as f:
    f.write(content)
