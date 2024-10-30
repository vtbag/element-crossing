---
'@vtbag/element-crossing': patch
---

Extend `anim` expression with support for SVG animations.

To transfer the SVG animation state to the new document use the `/svg` key for the `anim` expression

```html
<svg data-vtbag-x="id:svg anim:/svg">...</svg>
```
