# @vtbag/element-crossing

## 1.0.3

### Patch Changes

- d4fd998: Extend `anim` expression with support for SVG animations.

  To transfer the SVG animation state to the new document use the `/svg` key for the `anim` expression

  ```html
  <svg data-vtbag-x="id:svg anim:/svg">...</svg>
  ```

## 1.0.2 - 2024-10-17

### Patch Changes

- 2ccb6db: Adds .d.ts declarations
- 417fd4d: Dependency updates

## 1.0.1 - 2024-09-08

### Patch Changes

- 444ab59: Animation playback time now does a fast forward to take swap time into account
- c15cf38: Ensures that state does not cross full page _reloads_.

## 1.0.0 - 2024-09-05

### Major Changes

- 5ec1341: Initial release
