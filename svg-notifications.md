Chrome notifications allow you to show an SVG image via a data-uri

Taking advantage of this might allow us to show nicely formatted notifications

Heres some utilities for preparing the data uri:
  http://dopiaza.org/tools/datauri/index.php
  provide text
  no base64
  specify mime type: image/svg+xml
  result should look like:
  data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%0D%0A%20%20width%3D%271000px%27%20height%3D%27500px%27%20viewBox%3D%270%200%20200%20100%27%3E%0D%0A%20%20%3Crect%20x%3D%270%27%20y%3D%270%27%20width%3D%27100%25%27%20height%3D%27100%25%27%20fill%3D%27white%27%20%2F%3E%0D%0A%20%20%3Ctext%20x%3D%270%27%20y%3D%2720%27%20font-family%3D%27monospace%27%20font-size%3D%276%27%20fill%3D%27black%27%3E%0D%0A%20%20%20%20%3Ctspan%20x%3D%270%27%20dy%3D%271.2em%27%3EDomain%3A%20https%3A%2F%2Fboardroom.to%3C%2Ftspan%3E%0D%0A%20%20%20%20%3Ctspan%20x%3D%270%27%20dy%3D%271.2em%27%3EFrom%3A%20%200xabcdef%3C%2Ftspan%3E%0D%0A%20%20%20%20%3Ctspan%20x%3D%270%27%20dy%3D%271.2em%27%3ETo%3A%20%20%20%200xfedcba%3C%2Ftspan%3E%0D%0A%20%20%20%20%3Ctspan%20x%3D%270%27%20dy%3D%271.2em%27%3EValue%3A%201.025%20Ether%3C%2Ftspan%3E%0D%0A%20%20%20%20%3Ctspan%20x%3D%270%27%20dy%3D%271.2em%27%3EGas%3A%200.025%20Ether%3C%2Ftspan%3E%0D%0A%20%20%3C%2Ftext%3E%0D%0A%3C%2Fsvg%3E

build a template using pure svg:

<svg xmlns='http://www.w3.org/2000/svg'
  width='1000px' height='500px' viewBox='0 0 200 100'>
  <rect x='0' y='0' width='100%' height='100%' fill='white' />
  <text x='0' y='20' font-family='monospace' font-size='6' fill='black'>
    <tspan x='0' dy='1.2em'>Domain: https://boardroom.to</tspan>
    <tspan x='0' dy='1.2em'>From:  0xabcdef</tspan>
    <tspan x='0' dy='1.2em'>To:    0xfedcba</tspan>
    <tspan x='0' dy='1.2em'>Value: 1.025 Ether</tspan>
    <tspan x='0' dy='1.2em'>Gas: 0.025 Ether</tspan>
  </text>
</svg>

or svg-embedded html:

<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
  <rect x='0' y='0' width='100%' height='100%' fill='white' />
  <foreignObject class="node" x="46" y="22" width="200" height="300">
    <body xmlns="http://www.w3.org/1999/xhtml">
      <div style="font-size: 120px">
        The quick brown fox jumps over the lazy dog.
        Pack my box with five dozen liquor jugs
      </div>
    </body>
  </foreignObject>
</svg>