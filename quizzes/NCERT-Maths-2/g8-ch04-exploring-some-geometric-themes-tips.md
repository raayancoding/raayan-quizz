# Exploring Some Geometric Themes — Tips & Tricks

Quick tricks for NCERT Grade 8 Maths (Ganita Prakash Part 2), Chapter 4.

## 1. Fractal counting: find the "multiply-by" number first

**Why it works:** In every fractal step, *each* surviving piece makes the same number of new pieces. So the count of pieces is just a power: Carpet → ×8 per step (Rₙ = 8ⁿ), Triangle → ×3 (3ⁿ), Koch sides → ×4 (3·4ⁿ). Spot the multiplier once and every step is instant.

**Worked example:** Sierpinski Carpet, Step 3. Multiplier is 8, so R₃ = 8 × 8 × 8 = 512 squares remain.

**Try it yourself:** How many triangles remain at Step 4 of the Sierpinski Triangle?

## 2. Holes = add up all the earlier piece-counts

**Why it works:** Every surviving piece gets one new hole at the next step, and old holes never close. So Hₙ = R₀ + R₁ + … + Rₙ₋₁. For the Carpet that is 1 + 8 + 64 + …, which has the neat closed form (8ⁿ − 1)/7; for the Triangle it is (3ⁿ − 1)/2.

**Worked example:** Carpet, Step 3: H₃ = 1 + 8 + 64 = 73. Check: (8³ − 1)/7 = 511/7 = 73 ✓.

**Try it yourself:** Find the number of holes at Step 4 of the Sierpinski Triangle (both by adding and by the formula).

## 3. Area shrinks by a *fraction of what is left*, not of the original

**Why it works:** Each step keeps the same fraction of every piece — 8/9 for the Carpet, 3/4 for the Triangle. So the area after n steps is (8/9)ⁿ or (3/4)ⁿ. The amount removed each step gets smaller and smaller because it is a fraction of a shrinking amount.

**Worked example:** Carpet, Step 2: (8/9)² = 64/81 remains, so the holes total 1 − 64/81 = 17/81 (one big 1/9 hole plus eight small 1/81 holes).

**Try it yourself:** What fraction of the Sierpinski Triangle's area remains at Step 3?

## 4. Koch perimeter: sides ×4, length ÷3, so perimeter ×4/3

**Why it works:** Each side becomes 4 pieces, each one-third as long. 4 × (1/3) = 4/3, so the perimeter is multiplied by 4/3 every step: 3, 4, 16/3, 64/9, … It never stops growing, even though the snowflake stays inside a fixed circle!

**Worked example:** Start side 1 unit. Step 2 has 3 × 4² = 48 sides of length 1/9 → perimeter 48/9 = 16/3 units.

**Try it yourself:** How many sides and what perimeter does Step 3 have?

## 5. Prism and pyramid counts from the base polygon alone

**Why it works:** For a base with n sides — Prism: faces n + 2, edges 3n, vertices 2n. Pyramid: faces n + 1, edges 2n, vertices n + 1. Remember: a pyramid always has the same number of faces as vertices; a prism's edges are the biggest number (3n).

**Worked example:** 10-sided prism: 12 faces, 30 edges, 20 vertices. 10-sided pyramid: 11 faces, 20 edges, 11 vertices.

**Try it yourself:** Find the faces, edges and vertices of a hexagonal prism and a hexagonal pyramid.

## 6. Net-check: pairs of opposite faces

**Why it works:** In any cuboid net, faces come in three equal pairs (length × breadth, length × height, breadth × height). If you can't pair up the six rectangles, it isn't a cuboid net. The same idea tells you the total area: 2(lb + lh + bh).

**Worked example:** Cuboid 5 cm × 3 cm × 1 cm → faces 15, 5, 3 (two of each), total 2(15 + 5 + 3) = 46 cm².

**Try it yourself:** List the six rectangles in the net of a 6 cm × 3 cm × 2 cm cuboid and find their total area.

## 7. Shortest path on a box: unfold, then rule a straight line

**Why it works:** Unfolding a cuboid into a net doesn't stretch any face, so a path on the box and its picture on the net have the same length. The shortest path on the flat net is a straight line — so the shortest surface path is whichever unfolding gives the shortest straight line that stays *inside* the net.

**Worked example:** 30 × 12 × 12 box: one unfolding makes a right triangle with legs 24 cm and 32 cm, so d² = 576 + 1024 = 1600 and d = 40 cm — shorter than the 42 cm "straight over the top" route.

**Try it yourself:** Why must you try *several* unfoldings before announcing the shortest path?

## 8. Projection length never grows

**Why it works:** A tilted line and its projection form a right triangle in which the line is the hypotenuse. The hypotenuse is the longest side, so the projection p ≤ the line l. Equality only when the line is parallel to the plane; a perpendicular line shrinks to a single point.

**Worked example:** A pencil standing upright on a table: front view = full length, top view = a point.

**Try it yourself:** A pencil lies flat along the length direction. Which of the front, top and side views show its full length?

## 9. Parallel stays parallel — the shadow trick

**Why it works:** Projection keeps parallel lines parallel. That is why a parallelogram cutout's shadow in sunlight is *always* a parallelogram, and why the three families of parallel edges on a solid become the three grid directions (|, /, \) on isometric paper.

**Worked example:** A cube balanced on one corner projects to a regular hexagon with all 12 edges equal — the isometric view; "isometric" means "equal measure".

**Try it yourself:** Can the shadow of a square ever be a trapezium? Explain using parallel lines.

## 10. Three views beat one

**Why it works:** Many different objects share the same single projection (a disc, a cylinder and a cone all look like a circle from above). Taking the front, top and side views together pins the object down — and the "impossible triangle" works exactly because one drawing fits many solids.

**Worked example:** Front view rectangle + top view circle → a cylinder. Side view triangle + top view circle → a cone.

**Try it yourself:** Name a solid whose front view is a triangle and whose top view is a square.
