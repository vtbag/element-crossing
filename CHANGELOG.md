# @vtbag/element-crossing

## 1.1.0 2025-01-01

### Minor Changes

- 065f143: Adds support for Safari.

  Starting with version 18.2, Safari introduced support for cross-document view transitions but still lacks support for the Navigation API.

  As of version 1.1.0, Element-Crossing now handles Safari as well, again enabling the transfer of selected element states across cross-document view transitions in all browsers that support this feature.

## 1.0.4 - 2024-11-15

### Patch Changes

- a7cbdee: Fixes access to `data-*` properties, which were previously ignored.

## 1.0.3 - 2024-10-30

### Patch Changes

- d4fd998: Extend `anim` expression with support for SVG animations.\
  **Many thanks to [Lukas](https://github.com/trombach)** for this contirbution!

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
