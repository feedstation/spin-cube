# spin-cube

Rubik's cube custom HTML element

![image](https://github.com/feedstation/spin-cube/assets/72626303/18fdf6fc-6599-4f0d-9229-41871b0a8908)

Has hooks to allow rotation with touch, mouse, and keyboard

Live demo of initial version on jsFiddle: https://jsfiddle.net/mikeypie/t8mvh0up/

## Purpose

A 3D model of a Rubik's cube that can be rotated to examine all sides. For example, the tile colors can be set to demonstrate patterns used to practice the 167 advanced F2L solving algorithms discussed in this JPerm video https://www.youtube.com/watch?v=UKRtFQmnKfs

This code uses no 3D engine. Total weight is under 3.3kB uncompressed (JS 2.3kB, CSS 1kB)

Lighthouse:

- Total Blocking Time 0 ms

- Cumulative Layout Shift 0

## Usage

1. Load the JS

   **EXAMPLE**:

   ```
   <script src="live-cube.js"></script>
   ```

2. Insert the HTML element

   **EXAMPLE**:

   ```
   <live-cube></live-cube>
   ```

   **RESULT**: The element receives a serialized id attribute for later reference

   ```
   <live-cube id="live-cube-1">...</live-cube>
   ```

3. Optionally, set attributes:

   | Attribute | Describes  | Values | Example |
   | :---: | --- | --- | :---: |
   | x | Initial X-axis rotation in degrees | Signed Integer | -20 |
   | y | Initial Y-axis rotation in degrees | Signed Integer | 55 |
   | size | Initial size and units | Integer + ['px' \| 'em' \| 'rem' \| 'pt']<br />**NOTE**: '%' is not a valid unit | 200px |

   **EXAMPLE**:

   ```
   <live-cube size="60px" x="23" y="42"></live-cube>
   ```
