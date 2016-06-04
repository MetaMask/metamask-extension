Chrome notifications allow you to show an SVG image via a data-uri

Taking advantage of this might allow us to show nicely formatted notifications

build a template using pure svg:

```svg
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
```

generate uri
`'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgSrc)`

or svg-embedded html:

```svg
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
```
