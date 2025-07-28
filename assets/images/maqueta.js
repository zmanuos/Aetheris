import * as React from "react";
import Svg, { Rect, Path, Ellipse } from "react-native-svg";
const SvgMaqueta = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    // Las propiedades width y height aquí son el tamaño "original" de diseño del SVG.
    // Aunque se pueden pasar props para anularlas, es mejor usar viewBox para escalado.
    // width={1080} // Comentado o eliminado, ya que el viewBox manejará el escalado.
    // height={1080} // Comentado o eliminado.
    viewBox="0 0 1080 1080" // ¡Esta línea es clave! Define el sistema de coordenadas de tu SVG.
    preserveAspectRatio="xMidYMid meet" // Esta línea es clave para centrar y mantener el aspecto.
    {...props} // Permite que las props pasadas desde HomeScreen sobrescriban estas si se especifican.
  >
    <Rect width="100%" height="100%" fill="transparent" />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 10,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#36ac36",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(10.21 0 0 11.75 544.95 545.13)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 9,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#858585",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(4.39 0 0 5.72 351.89 345.6)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 9,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#858585",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(5.82 0 0 7.62 689.35 409.58)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 9,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#858585",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(4.38 0 0 6 352.68 735.63)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#582e06",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(.95 0 0 .23 745.47 661.54)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#582e06",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(0 -1 .24 0 497.23 602.19)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#582e06",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(0 -1 .21 0 496.29 233.46)"
      vectorEffect="non-scaling-stroke"
    />
    <Path
      d="M-18.54 32.11-37.08 0l18.54-32.11h37.08L37.08 0 18.54 32.11z"
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#1d6500",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="translate(567.38 800.78)scale(1.18)"
      vectorEffect="non-scaling-stroke"
    />
    <Path
      d="M81.866 18.883c-3.289-3.289-7.326-4.884-12.058-4.834-7.427.1-13.806 4.135-19.034 12.159v-.05l-1.298 2.391s-.546-1.047-1.346-2.491v.199c-1.943-3.986-4.432-6.927-7.423-8.92-2.99-1.943-6.328-2.891-9.915-2.891-4.735.05-8.872 1.595-12.408 4.535-3.54 2.991-5.232 6.827-5.232 11.46.048 1.595.549 3.937 1.494 6.977 1.795 4.534 6.431 10.414 14.052 17.688 7.574 7.275 12.858 12.706 15.797 16.294 2.99 3.538 4.934 8.422 5.83 14.551.749-5.382 3.536-10.813 8.471-16.195 4.934-5.432 10.563-11.41 16.943-17.987 6.327-6.577 9.863-11.61 10.564-15.148.397-1.245.546-2.889.546-4.981-.049-5.183-1.745-9.468-4.983-12.757z"
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#a61d1d",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="translate(300.63 282.88)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#fff",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(-.7 0 0 -.7 248.88 630.58)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#a41212",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(-.7 0 0 -.7 269.55 630.58)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#fff",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(-.7 0 0 -.7 247.04 732.31)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#a41212",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(-.7 0 0 -.7 267.71 732.31)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#fff",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(-.7 0 0 -.7 245.2 834.04)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#a41212",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(-.7 0 0 -.7 265.87 834.04)"
      vectorEffect="non-scaling-stroke"
    />
    <Ellipse
      rx={18.519}
      ry={20.634}
      style={{
        stroke: "none",
        strokeWidth: 1,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#656565",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="translate(540.21 525.11)"
      vectorEffect="non-scaling-stroke"
    />
    <Path
      d="M-17.95-15.45h.67l.41.1.41.16.42.2.36.26.46.36.42.47.46.62.46.67.47.77.41.93.46.93.42 1.03.41 1.14.36 1.13.36 1.13.36 1.24.36 1.19.37 1.18.36 1.24.31 1.19.36 1.18.41 1.14.36 1.14.47 1.08.51 1.14.57 1.02.77 1.09.98 1.08 1.29.98 1.66.67 1.85.26 1.91-.26 1.65-.72 1.34-.98.93-1.08.72-1.09.62-1.08.52-1.14.41-1.08.41-1.18.36-1.14.36-1.18.37-1.19.36-1.24.36-1.24.36-1.18.36-1.19.41-1.19.41-1.13.42-1.09.46-1.03.47-.92.51-.88.47-.78.51-.67.52-.56.46-.47.47-.31.51-.31.47-.2.56-.16.62-.05.93-.05.62.05.52.05.51.05.52.11.46.1.52.1.46.16.42.2.46.16.41.2.41.26.37.21.36.26.36.26.36.3.31.26.31.31.26.31.25.31.26.31.21.31.21.31.2.26.15.31.11.25.1.31.11.21.05.26.05.15.05.21V12.2l-.05.36-.1.36-.11.31-.15.31-.21.31-.2.26-.26.26-.31.25-.31.26-.31.16-.36.15-.36.15-.37.11-.41.05h-50.24l-.36-.05-.42-.11-.36-.15-.36-.15-.31-.16-.31-.26-.26-.25-.25-.26-.21-.26-.2-.31-.16-.31-.1-.31-.11-.36-.05-.36-.05-.47V-8.8l.05-.05V-9l.05-.16.06-.2.1-.21.1-.26.16-.26.2-.31.21-.3.2-.31.26-.31.31-.31.31-.31.31-.31.36-.31.36-.31.42-.31.41-.26.46-.26.47-.25.46-.26.47-.21.51-.2.52-.21.57-.16.51-.15.57-.1.56-.11.63-.05.56-.05z"
      style={{
        stroke: "none",
        strokeWidth: 1,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#656565",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="translate(540 560.01)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#656565",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="translate(540 540)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#693d16",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(1 0 0 .71 992.72 483.07)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#583210",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(.72 0 0 .77 992.5 466.36)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#693d16",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(1 0 0 .71 692.03 250.44)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#583210",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(.72 0 0 .77 691.83 233.73)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#693d16",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(1 0 0 .71 799.68 340.33)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#583210",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(.72 0 0 .77 799.5 323.63)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#693d16",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(1 0 0 .71 800.8 442.06)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#583210",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(.72 0 0 .77 800.63 425.35)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#693d16",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(1 0 0 .71 582.96 330.74)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#583210",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(.72 0 0 .77 582.82 314.04)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#693d16",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(1 0 0 .71 581.12 441.34)"
      vectorEffect="non-scaling-stroke"
    />
    <Rect
      width={66.17}
      height={66.17}
      x={-33.085}
      y={-33.085}
      rx={0}
      ry={0}
      style={{
        stroke: "#000",
        strokeWidth: 0,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#583210",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(.72 0 0 .77 581 424.64)"
      vectorEffect="non-scaling-stroke"
    />
  </Svg>
);
export default SvgMaqueta;